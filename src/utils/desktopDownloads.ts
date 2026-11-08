/* 桌面端安装包：版本查询与加速下载。
   版本经代理接口获取；下载优先取自建节点签名链接，
   签名不可用时直接用 GitHub 原始链接下载。 */

const DESKTOP_REPO = 'c1201y/ClassSoftwareHub-Desktop'
const WIN7_REPO = 'c1201y/ClassSoftwareHub-windows7'
const ANDROID_REPO = 'c1201y/ClassSoftwareHub-Android'

export type DesktopChannel = 'stable' | 'preview' | 'win7' | 'win7Preview' | 'android'
export type PackageKind = 'exe' | 'apk'

export interface PortableBuild {
  name: string
  url: string
  size: number
}

export interface DesktopBuild {
  tag: string
  name: string
  url: string
  size: number
  publishedAt: string
  releaseUrl: string
  portable?: PortableBuild
}

export interface DesktopBuilds {
  stable: DesktopBuild | null
  preview: DesktopBuild | null
  win7: DesktopBuild | null
  win7Preview: DesktopBuild | null
  android: DesktopBuild | null
}

interface RawAsset {
  name: string
  size: number
  browser_download_url: string
}

interface RawRelease {
  tag_name: string
  prerelease: boolean
  draft: boolean
  published_at: string
  html_url: string
  assets?: RawAsset[]
}

/* GitHub 接口未登录限流 60 次/小时/IP，三个仓库一次刷新消耗 3 次；
   版本发布频率低，缓存 30 分钟，刷新页面不必重新请求。 */
const CACHE_KEY = 'csh-site-desktop-builds-v2'
const CACHE_TTL = 30 * 60 * 1000
const API_TIMEOUT = 10_000

/* 先走国内可达的代理，再退回 GitHub 原型。 */
function apiBases(repo: string): string[] {
  return [
    `https://service.132614.xyz/api/gh/repos/${repo}/releases?per_page=10`,
    `https://gh-proxy.com/https://api.github.com/repos/${repo}/releases?per_page=10`,
    `https://api.github.com/repos/${repo}/releases?per_page=10`,
  ]
}

async function fetchReleases(repo: string): Promise<RawRelease[] | null> {
  for (const base of apiBases(repo)) {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT)
    try {
      /* 不带自定义头，保持简单请求，不触发 CORS 预检 */
      const response = await fetch(base, { cache: 'no-store', signal: controller.signal })
      if (!response.ok) continue
      const data: unknown = await response.json()
      if (Array.isArray(data)) return data as RawRelease[]
    } catch {
      /* 这个入口不通，试下一个 */
    } finally {
      window.clearTimeout(timer)
    }
  }
  return null
}

function pickAsset(release: RawRelease, pattern: RegExp): RawAsset | undefined {
  return (release.assets ?? []).find((asset) => pattern.test(asset.name))
}

function buildOf(release: RawRelease, kind: PackageKind): DesktopBuild | null {
  const installer =
    kind === 'apk'
      ? pickAsset(release, /\.apk$/i)
      : (pickAsset(release, /Setup.*\.exe$/i) ?? pickAsset(release, /\.exe$/i))
  if (!installer?.browser_download_url || !release.tag_name) return null
  const portable = kind === 'exe' ? pickAsset(release, /Portable.*\.zip$/i) : undefined
  return {
    tag: release.tag_name,
    name: installer.name,
    url: installer.browser_download_url,
    size: installer.size,
    publishedAt: release.published_at,
    releaseUrl: release.html_url,
    portable: portable
      ? { name: portable.name, url: portable.browser_download_url, size: portable.size }
      : undefined,
  }
}

function pickBuild(releases: RawRelease[], channel: DesktopChannel): DesktopBuild | null {
  const wantPrerelease = channel === 'preview' || channel === 'win7Preview'
  const kind: PackageKind = channel === 'android' ? 'apk' : 'exe'
  for (const release of releases) {
    if (release.draft || release.prerelease !== wantPrerelease) continue
    const build = buildOf(release, kind)
    if (build) return build
  }
  return null
}

function readCache(): DesktopBuilds | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { at?: number; builds?: DesktopBuilds }
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > CACHE_TTL) return null
    const builds = parsed.builds
    if (
      !builds ||
      (!builds.stable && !builds.preview && !builds.win7 && !builds.win7Preview && !builds.android)
    )
      return null
    return {
      stable: builds.stable ?? null,
      preview: builds.preview ?? null,
      win7: builds.win7 ?? null,
      win7Preview: builds.win7Preview ?? null,
      android: builds.android ?? null,
    }
  } catch {
    return null
  }
}

function writeCache(builds: DesktopBuilds): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), builds }))
  } catch {
    /* 隐私模式写不进存储，忽略 */
  }
}

export async function resolveDesktopBuilds(): Promise<DesktopBuilds> {
  const cached = readCache()
  if (cached) return cached
  /* 三个仓库并行取；任一失败不影响其余 */
  const [desktop, win7, android] = await Promise.all([
    fetchReleases(DESKTOP_REPO),
    fetchReleases(WIN7_REPO),
    fetchReleases(ANDROID_REPO),
  ])
  const builds: DesktopBuilds = {
    stable: desktop ? pickBuild(desktop, 'stable') : null,
    preview: desktop ? pickBuild(desktop, 'preview') : null,
    win7: win7 ? pickBuild(win7, 'win7') : null,
    win7Preview: win7 ? pickBuild(win7, 'win7Preview') : null,
    android: android ? pickBuild(android, 'android') : null,
  }
  if (desktop || win7 || android) writeCache(builds)
  return builds
}

/* ---- 加速下载 ---- */

/* 自建节点启用签名与 Referer 白名单，不能前缀直拼；由后端代签 15 分钟临时链接。 */
const SIGN_ENDPOINT = 'https://api.classsoftwarehub.cn/api/mirror-sign'
const SIGN_TIMEOUT = 8000

async function fetchSelfSignedUrl(target: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), SIGN_TIMEOUT)
  try {
    const response = await fetch(
      `${SIGN_ENDPOINT}?url=${encodeURIComponent(target)}`,
      { cache: 'no-store', signal: controller.signal },
    )
    if (!response.ok) return null
    const data: unknown = await response.json()
    const url = (data as { url?: unknown })?.url
    return typeof url === 'string' && url ? url : null
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

function triggerDownload(url: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export type DownloadResult = 'mirror' | 'direct'

/* 点击下载：优先取自建节点签名链接；签名不可用就直接用 GitHub 原始链接下载。 */
export async function downloadInstaller(target: string): Promise<DownloadResult> {
  const signed = await fetchSelfSignedUrl(target)
  triggerDownload(signed ?? target)
  return signed ? 'mirror' : 'direct'
}
