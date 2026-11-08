<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { copy } from '../content/copy'
import { publicUrl } from '../utils/assets'
import {
  downloadInstaller,
  resolveDesktopBuilds,
  type DesktopBuild,
  type DesktopBuilds,
  type DesktopChannel,
} from '../utils/desktopDownloads'

const DESKTOP_RELEASES = 'https://github.com/c1201y/ClassSoftwareHub-Desktop/releases'
const WIN7_RELEASES = 'https://github.com/c1201y/ClassSoftwareHub-windows7/releases'
const ANDROID_RELEASES = 'https://github.com/c1201y/ClassSoftwareHub-Android/releases'
const XP_REPO_URL = 'https://github.com/HelloCHLdev/ClassSoftwareHubCrossPlatformEdition'
const XP_RELEASES = 'https://github.com/Tiny-Nick/ClassSoftwareHub-OfficialWebsite-Preview/releases'
const REPO_URL = 'https://github.com/c1201y/ClassSoftwareHub'

const builds = ref<DesktopBuilds>({
  stable: null,
  preview: null,
  win7: null,
  win7Preview: null,
  android: null,
  crossplatform: null,
})
const loading = ref(true)
const busy = ref<Record<string, boolean>>({})
const hint = ref<Record<string, string>>({})
const hintTimers: Record<string, number> = {}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return Math.max(1, Math.round(bytes / 1024)) + ' KB'
}

function metaOf(build: DesktopBuild): string {
  return `${fmtDate(build.publishedAt)} 发布 · ${fmtSize(build.size)}`
}

function setHint(key: string, text: string): void {
  hint.value = { ...hint.value, [key]: text }
  window.clearTimeout(hintTimers[key])
  if (text) hintTimers[key] = window.setTimeout(() => setHint(key, ''), 6000)
}

async function startDownload(key: string, target: { url: string }): Promise<void> {
  if (busy.value[key]) return
  busy.value = { ...busy.value, [key]: true }
  setHint(key, '')
  try {
    const result = await downloadInstaller(target.url)
    setHint(key, result === 'mirror' ? copy.download.downloadStarted : copy.download.downloadFallback)
  } finally {
    busy.value = { ...busy.value, [key]: false }
  }
}

function downloadBuild(key: DesktopChannel, build: DesktopBuild | null): void {
  if (!build) return
  void startDownload(key, build)
}

function downloadPortable(key: string, build: DesktopBuild | null): void {
  if (!build?.portable) return
  void startDownload(key, build.portable)
}

/* 下载项统一描述，模板按同一结构渲染，避免各版本块排版分叉 */
interface VersionItem {
  key: DesktopChannel
  name: string
  build: DesktopBuild | null
  action: string
  solid: boolean
  fallback: string
  emptyNote: string
  flag?: string
  portableKey?: string
  hintKeys: string[]
}

interface PlatformCard {
  id: string
  icon: string
  title: string
  requirement: string
  desc: string
  foot: string
  noteTitle?: string
  noteText?: string
  items: VersionItem[]
}

const platforms = computed<PlatformCard[]>(() => {
  const d = copy.download
  const b = builds.value
  return [
    {
      id: 'win10',
      icon: '/brand/platform-windows.svg',
      title: d.win10Title,
      requirement: d.win10Requirement,
      desc: d.win10Desc,
      foot: d.win10Foot,
      items: [
        {
          key: 'stable',
          name: d.stableName,
          build: b.stable,
          action: d.stableAction,
          solid: true,
          fallback: DESKTOP_RELEASES,
          emptyNote: d.stableNote,
          hintKeys: ['stable'],
        },
        {
          key: 'preview',
          name: d.previewName,
          build: b.preview,
          action: d.previewAction,
          solid: false,
          fallback: DESKTOP_RELEASES,
          emptyNote: d.previewNote,
          flag: d.previewNote,
          hintKeys: ['preview'],
        },
      ],
    },
    {
      id: 'win7',
      icon: '/brand/platform-win7.png',
      title: d.win7Title,
      requirement: d.win7Requirement,
      desc: d.win7Desc,
      foot: d.win7Foot,
      items: [
        {
          key: 'win7',
          name: d.win7Name,
          build: b.win7,
          action: d.win7Action,
          solid: true,
          fallback: WIN7_RELEASES,
          emptyNote: d.win7Note,
          portableKey: 'win7Portable',
          hintKeys: ['win7', 'win7Portable'],
        },
        {
          key: 'win7Preview',
          name: d.win7PreviewName,
          build: b.win7Preview,
          action: d.win7PreviewAction,
          solid: false,
          fallback: WIN7_RELEASES,
          emptyNote: d.previewNote,
          flag: d.previewNote,
          portableKey: 'win7PreviewPortable',
          hintKeys: ['win7Preview', 'win7PreviewPortable'],
        },
      ],
    },
    {
      id: 'android',
      icon: '/brand/platform-android.png',
      title: d.androidTitle,
      requirement: d.androidRequirement,
      desc: d.androidDesc,
      foot: d.androidFoot,
      noteTitle: d.androidNoteTitle,
      noteText: d.androidNoteText,
      items: [
        {
          key: 'android',
          name: d.androidPkgName,
          build: b.android,
          action: d.androidAction,
          solid: true,
          fallback: ANDROID_RELEASES,
          emptyNote: d.androidNote,
          hintKeys: ['android'],
        },
      ],
    },
  ]
})

/* 跨平台实验包独立取用，不与平台卡共享版本块结构 */
const xp = computed(() => builds.value.crossplatform)

function metaText(item: VersionItem): string {
  if (item.build) return metaOf(item.build)
  return loading.value ? copy.download.loadingNote : item.emptyNote
}

function hintText(item: VersionItem): string {
  for (const key of item.hintKeys) {
    if (hint.value[key]) return hint.value[key]
  }
  return ''
}

function portableOf(item: VersionItem) {
  return item.portableKey ? (item.build?.portable ?? null) : null
}

onMounted(async () => {
  builds.value = await resolveDesktopBuilds()
  loading.value = false
})

onUnmounted(() => {
  Object.values(hintTimers).forEach((timer) => window.clearTimeout(timer))
})
</script>

<template>
  <section class="page">
    <header class="page-head" v-reveal>
      <h1 class="page-title">{{ copy.download.title }}</h1>
      <p class="page-lede">{{ copy.download.lede }}</p>
    </header>

    <!-- 按平台分区：三张等宽卡，卡内版本块结构完全一致 -->
    <div class="platforms" v-reveal>
      <article v-for="card in platforms" :key="card.id" class="platform">
        <header class="pf-head">
          <img class="pf-ico" :src="publicUrl(card.icon)" alt="" width="48" height="48" />
          <div class="pf-id">
            <h2 class="pf-name">{{ card.title }}</h2>
            <p class="pf-req">{{ card.requirement }}</p>
          </div>
        </header>
        <p class="pf-desc">{{ card.desc }}</p>

        <div class="pf-vers">
          <div v-for="item in card.items" :key="item.key" class="ver">
            <div class="ver-top">
              <div class="ver-title">
                <b class="ver-name">{{ item.name }}</b>
                <span v-if="item.build" class="ver-tag">{{ item.build.tag }}</span>
              </div>
              <div class="ver-act">
                <button
                  v-if="item.build"
                  type="button"
                  :class="item.solid ? 'btn-solid' : 'btn-ghost'"
                  :disabled="busy[item.key]"
                  @click="downloadBuild(item.key, item.build)"
                >
                  {{ busy[item.key] ? copy.download.downloadBusy : item.action
                  }}<span v-if="!busy[item.key]" class="arr" aria-hidden="true">↓</span>
                </button>
                <a
                  v-else
                  :class="item.solid ? 'btn-solid' : 'btn-ghost'"
                  :href="item.fallback"
                  rel="noopener"
                >
                  {{ item.action }}<span class="arr" aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <!-- 元信息独占一行，不与按钮争宽度 -->
            <p class="ver-meta">{{ metaText(item) }}</p>

            <div class="ver-links">
              <span v-if="item.flag" class="ver-flag">{{ item.flag }}</span>
              <button
                v-if="portableOf(item)"
                type="button"
                class="vlink"
                :disabled="busy[item.portableKey!]"
                @click="downloadPortable(item.portableKey!, item.build)"
              >
                {{ busy[item.portableKey!] ? copy.download.downloadBusy : copy.download.portableAction
                }}<span class="vlink-size">{{ fmtSize(portableOf(item)!.size) }}</span>
              </button>
              <a class="vlink" :href="item.build?.releaseUrl ?? item.fallback" rel="noopener">
                {{ copy.download.releaseLink }}<span aria-hidden="true">↗</span>
              </a>
            </div>

            <p v-if="hintText(item)" class="ver-hint" role="status">{{ hintText(item) }}</p>
          </div>

          <!-- 内容较少的平台补一块说明，使三张卡视觉密度一致 -->
          <div v-if="card.noteTitle" class="ver ver-note">
            <b class="ver-name">{{ card.noteTitle }}</b>
            <p class="note-text">{{ card.noteText }}</p>
          </div>
        </div>

        <p class="pf-foot">{{ card.foot }}</p>
      </article>
    </div>

    <!-- 跨平台实验版：前瞻实验性质，独立成区，不与三张正式平台卡并列 -->
    <section class="xp" v-reveal aria-labelledby="xp-title">
      <div class="xp-id">
        <img class="xp-ico" :src="publicUrl('/brand/repo-linux.png')" alt="" width="48" height="48" />
        <div class="xp-head">
          <div class="xp-title">
            <h2 id="xp-title" class="xp-name">{{ copy.download.xpTitle }}</h2>
            <span class="xp-badge">{{ copy.download.xpBadge }}</span>
          </div>
          <p class="xp-desc">{{ copy.download.xpDesc }}</p>
        </div>
      </div>

      <div class="xp-act">
        <div class="xp-meta">
          <b class="xp-pkg">{{ copy.download.xpPkgName }}</b>
          <span class="xp-size">{{
            xp ? metaOf(xp) : loading ? copy.download.loadingNote : copy.download.xpNote
          }}</span>
        </div>
        <div class="xp-btns">
          <button
            v-if="xp"
            type="button"
            class="btn-solid"
            :disabled="busy.crossplatform"
            @click="downloadBuild('crossplatform', xp)"
          >
            {{ busy.crossplatform ? copy.download.downloadBusy : copy.download.xpAction
            }}<span v-if="!busy.crossplatform" class="arr" aria-hidden="true">↓</span>
          </button>
          <a v-else class="btn-solid" :href="XP_RELEASES" rel="noopener">
            {{ copy.download.xpAction }}<span class="arr" aria-hidden="true">↗</span>
          </a>
          <a class="vlink" :href="XP_REPO_URL" rel="noopener">
            {{ copy.download.xpRepoLink }}<span aria-hidden="true">↗</span>
          </a>
          <a class="vlink" :href="xp?.releaseUrl ?? XP_RELEASES" rel="noopener">
            {{ copy.download.releaseLink }}<span aria-hidden="true">↗</span>
          </a>
        </div>
        <p v-if="hint.crossplatform" class="ver-hint" role="status">{{ hint.crossplatform }}</p>
      </div>

      <p class="xp-foot">{{ copy.download.xpFoot }}</p>
    </section>

    <!-- 非安装包入口：收成一行，不再与平台卡并列 -->
    <div class="others" v-reveal>
      <h2 class="others-title">{{ copy.download.otherTitle }}</h2>
      <div class="others-links">
        <a
          v-for="line in copy.web.lines"
          :key="line.url"
          class="other"
          :href="line.url"
          rel="noopener"
        >
          <span class="other-name">{{ copy.download.webTitle }} · {{ line.label }}</span>
          <span class="other-meta">{{ line.host }}</span>
          <span class="other-arr" aria-hidden="true">↗</span>
        </a>
        <a class="other" :href="REPO_URL" rel="noopener">
          <span class="other-name">{{ copy.download.srcTitle }}</span>
          <span class="other-meta">GPL-3.0-only</span>
          <span class="other-arr" aria-hidden="true">↗</span>
        </a>
        <RouterLink :to="{ name: 'changelog' }" class="other">
          <span class="other-name">{{ copy.download.changelogShort }}</span>
          <span class="other-meta">Changelog</span>
          <span class="other-arr" aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>

    <p class="page-note">{{ copy.download.releasesNote }}</p>
  </section>
</template>

<style scoped>
.page {
  padding: 56px 0 0;
}

.page-title {
  font-size: var(--fs-h1);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 14px;
}

.page-lede {
  font-size: var(--fs-lead);
  line-height: 1.8;
  color: var(--ink-2);
  max-width: 62ch;
}

/* ---- 三张平台卡：等宽、等高、卡内结构一致 ---- */

.platforms {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 36px;
}

.platform {
  display: flex;
  flex-direction: column;
  padding: 22px 20px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
}

.pf-head {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 48px;
}

.pf-ico {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  object-fit: contain;
}

.pf-id {
  min-width: 0;
}

.pf-name {
  font-size: var(--fs-h3);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.pf-req {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
  margin-top: 2px;
}

.pf-desc {
  font-size: 13px;
  line-height: 1.8;
  color: var(--ink-2);
  margin-top: 18px;
  min-height: 70px;
}

.pf-vers {
  display: grid;
  gap: 10px;
  align-content: start;
  flex: 1 1 auto;
}

/* ---- 版本块：标题+按钮 / 元信息 / 次要链接，三行固定 ---- */

.ver {
  padding: 14px 14px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--surface-2);
}

.ver-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ver-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.ver-name {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.ver-tag {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--accent-text);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
  padding: 1px 6px;
  overflow-wrap: anywhere;
}

.ver-act {
  flex: 0 0 auto;
}

.ver-meta {
  margin-top: 7px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.ver-links {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 11px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  min-height: 20px;
}

.ver-flag {
  font-size: 11.5px;
  color: var(--ink-3);
}

.vlink {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: 12px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--dur) linear;
}

.vlink:hover {
  color: var(--accent-text);
}

.vlink:disabled {
  opacity: 0.6;
  cursor: progress;
}

.vlink-size {
  font-size: 11px;
  color: var(--ink-3);
}

.ver-hint {
  margin-top: 8px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--accent-text);
}

.ver-note {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-height: 96px;
}

.note-text {
  font-size: 12px;
  line-height: 1.75;
  color: var(--ink-2);
}

.pf-foot {
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-3);
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

/* ---- 跨平台实验版：独立横条，与三张正式平台卡区分层级 ---- */

.xp {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px 28px;
  margin-top: 20px;
  padding: 20px 22px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
}

.xp-id {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.xp-ico {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  object-fit: contain;
}

.xp-head {
  min-width: 0;
}

.xp-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.xp-name {
  font-size: var(--fs-h3);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.xp-badge {
  font-size: 11px;
  color: var(--accent-text);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 9px;
  background: var(--surface-2);
  white-space: nowrap;
}

.xp-desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--ink-2);
}

.xp-act {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.xp-meta {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.xp-pkg {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.xp-size {
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.xp-btns {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.xp-foot {
  grid-column: 1 / -1;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--ink-3);
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

/* ---- 底部次要入口 ---- */

.others {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 20px;
  padding: 16px 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
}

.others-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink-3);
  white-space: nowrap;
  flex: 0 0 auto;
}

.others-links {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  flex: 1 1 auto;
}

.other {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  padding: 9px 26px 9px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
  transition:
    border-color var(--dur) linear,
    background-color var(--dur) linear;
}

.other:hover {
  border-color: var(--accent-text);
  background: var(--surface-2);
}

.other-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  flex: 0 0 auto;
}

.other-meta {
  font-size: 11px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  max-width: 100%;
}

.other-arr {
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
  font-size: 12px;
}

.page-note {
  margin-top: 16px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ink-3);
}

/* ---- 按钮（与首页同款，窄卡内略收） ---- */

.btn-solid,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  padding: 9px 15px;
  border-radius: 999px;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--dur) linear,
    border-color var(--dur) linear;
}

.btn-solid {
  background: var(--accent);
  color: var(--accent-ink);
  border: 0;
}

.btn-solid:hover {
  background: var(--accent-strong);
}

.btn-ghost {
  background: none;
  color: var(--ink);
  border: 1px solid var(--line-strong);
}

.btn-ghost:hover {
  border-color: var(--accent-text);
  background: var(--surface-2);
}

.btn-solid:disabled,
.btn-ghost:disabled {
  opacity: 0.6;
  cursor: progress;
}

.btn-solid .arr,
.btn-ghost .arr {
  transition: transform var(--dur) linear;
}

.btn-solid:hover .arr,
.btn-ghost:hover .arr {
  transform: translateX(2px);
}

/* ---- 窄屏 ---- */

@media (max-width: 1000px) {
  .platforms {
    grid-template-columns: 1fr;
  }

  .pf-desc {
    min-height: 0;
  }

  .xp {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .xp-act {
    align-items: flex-start;
  }

  .xp-meta,
  .xp-btns {
    justify-content: flex-start;
  }

  .others {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .others-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page {
    padding-top: 40px;
  }

  .platforms {
    margin-top: 28px;
  }

  .others-links {
    grid-template-columns: 1fr;
  }

  .ver-top {
    flex-wrap: wrap;
  }

  .ver-act {
    width: 100%;
  }

  .ver-act .btn-solid,
  .ver-act .btn-ghost {
    width: 100%;
    justify-content: center;
  }
}
</style>
