/* GitHub Releases 数据源：首页摘要与更新日志页共用同一次请求。 */

export type ReleaseProduct = 'desktop' | 'win7' | 'site'

export interface GhAsset {
  name: string
  size: number
  browser_download_url: string
}

export interface GhRelease {
  id: number
  tag_name: string
  name: string | null
  body: string
  published_at: string
  prerelease: boolean
  html_url: string
  author: { login: string }
  assets: GhAsset[]
  product: ReleaseProduct
}

const SOURCES: { url: string; product: ReleaseProduct }[] = [
  { url: 'https://api.github.com/repos/c1201y/ClassSoftwareHub-Desktop/releases', product: 'desktop' },
  { url: 'https://api.github.com/repos/c1201y/ClassSoftwareHub-windows7/releases', product: 'win7' },
  { url: 'https://api.github.com/repos/c1201y/ClassSoftwareHub/releases', product: 'site' },
]

let pending: Promise<GhRelease[]> | null = null

/* 匿名调用 GitHub API 每小时只有 60 次，三个仓库一次加载要花 3 次；
   缓存半小时，首页与更新日志共用。 */
const CACHE_KEY = 'csh-site-releases'
const CACHE_TTL = 30 * 60 * 1000

function readCache(): GhRelease[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as { at: number; list: GhRelease[] }
    return Date.now() - cached.at < CACHE_TTL ? cached.list : null
  } catch {
    return null
  }
}

function writeCache(list: GhRelease[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), list }))
  } catch {
    /* 存不下就算了，下次照常请求 */
  }
}

export function loadReleases(): Promise<GhRelease[]> {
  if (!pending) {
    const cached = readCache()
    pending = cached ? Promise.resolve(cached) : fetchAll().then((list) => {
      writeCache(list)
      return list
    })
    pending.catch(() => {
      pending = null
    })
  }
  return pending
}

async function fetchAll(): Promise<GhRelease[]> {
  const responses = await Promise.all(
    SOURCES.map((source) => fetch(source.url, { headers: { Accept: 'application/vnd.github+json' } })),
  )
  if (responses.some((r) => !r.ok)) throw new Error('GitHub API 返回异常')
  const lists = await Promise.all(responses.map((r) => r.json() as Promise<Omit<GhRelease, 'product'>[]>))
  return lists
    .flatMap((list, idx) =>
      list.map((rel) => ({ ...rel, product: SOURCES[idx].product }) as GhRelease),
    )
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
}

/* 首页摘要：取正文第一条正文段落，跳过标题、独立图片与小标题，去掉 Markdown 标记后截断 */
export function summaryOf(body: string): string {
  for (const raw of body.split(/\r?\n/)) {
    if (/^\s{0,3}#{1,6}\s/.test(raw)) continue
    const line = raw
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^[\s>*+-]+/, '')
      .replace(/[*`_]/g, '')
      .trim()
    if (!line || line.startsWith('<')) continue
    if (line.length < 9 && !/[，。：；、！？]/.test(line)) continue
    return line.length > 48 ? `${line.slice(0, 48)}…` : line
  }
  return ''
}
