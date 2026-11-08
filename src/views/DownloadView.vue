<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { copy } from '../content/copy'
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
const WEB_URL = 'https://classsoftwarehub.us.ci'
const REPO_URL = 'https://github.com/c1201y/ClassSoftwareHub'

const builds = ref<DesktopBuilds>({
  stable: null,
  preview: null,
  win7: null,
  win7Preview: null,
  android: null,
})
const loading = ref(true)
const busy = ref<Record<string, boolean>>({})
const hint = ref<Record<string, string>>({})
const hintTimers: Record<string, number> = {}

const stable = computed(() => builds.value.stable)
const preview = computed(() => builds.value.preview)
const win7 = computed(() => builds.value.win7)
const win7Portable = computed(() => builds.value.win7?.portable ?? null)
const win7Preview = computed(() => builds.value.win7Preview)
const win7PreviewPortable = computed(() => builds.value.win7Preview?.portable ?? null)
const android = computed(() => builds.value.android)

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

onMounted(async () => {
  builds.value = await resolveDesktopBuilds()
  loading.value = false
})

onUnmounted(() => {
  Object.values(hintTimers).forEach((timer) => window.clearTimeout(timer))
})

/* WinUI Iconography 字形 */
const glyphs = {
  desktop: '\uE896',
  web: '\uE774',
  code: '\uE943',
}
</script>

<template>
  <section class="page">
    <header class="page-head" v-reveal>
      <h1 class="page-title">{{ copy.download.title }}</h1>
      <p class="page-lede">{{ copy.download.lede }}</p>
    </header>

    <div class="dl-grid" v-reveal>
      <!-- 桌面版（主卡） -->
      <article class="dl-card wide">
        <div class="dl-head">
          <span class="wicon dl-ico" aria-hidden="true">{{ glyphs.desktop }}</span>
          <h2 class="dl-name">{{ copy.download.desktopTitle }}</h2>
        </div>
        <p class="dl-desc">{{ copy.download.desktopDesc }}</p>

        <div class="dl-rows">
          <div class="dl-item">
            <div class="dl-row">
              <div class="dl-row-info">
                <b class="dl-row-name">
                  {{ copy.download.stableName }}<template v-if="stable"> {{ stable.tag }}</template>
                </b>
                <span class="dl-row-note">
                  {{
                    stable
                      ? metaOf(stable)
                      : loading
                        ? copy.download.loadingNote
                        : copy.download.stableNote
                  }}
                </span>
              </div>
              <div class="dl-row-act">
                <button
                  v-if="stable"
                  type="button"
                  class="btn-solid"
                  :disabled="busy.stable"
                  @click="downloadBuild('stable', stable)"
                >
                  {{ busy.stable ? copy.download.downloadBusy : copy.download.stableAction
                  }}<span v-if="!busy.stable" class="arr" aria-hidden="true">↓</span>
                </button>
                <a v-else class="btn-solid" :href="DESKTOP_RELEASES" rel="noopener">
                  {{ copy.download.stableAction }}<span class="arr" aria-hidden="true">↗</span>
                </a>
                <a class="dl-sublink" :href="stable?.releaseUrl ?? DESKTOP_RELEASES" rel="noopener">
                  {{ copy.download.releaseLink }}<span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <p v-if="hint.stable" class="dl-hint" role="status">{{ hint.stable }}</p>
          </div>

          <div class="dl-item">
            <div class="dl-row">
              <div class="dl-row-info">
                <b class="dl-row-name">
                  {{ copy.download.win7Name }}<template v-if="win7"> {{ win7.tag }}</template>
                </b>
                <span class="dl-row-note">
                  {{ win7 ? metaOf(win7) : loading ? copy.download.loadingNote : copy.download.win7Note }}
                </span>
                <span v-if="win7" class="dl-row-sub">{{ copy.download.win7Note }}</span>
              </div>
              <div class="dl-row-act">
                <button
                  v-if="win7"
                  type="button"
                  class="btn-solid"
                  :disabled="busy.win7"
                  @click="downloadBuild('win7', win7)"
                >
                  {{ busy.win7 ? copy.download.downloadBusy : copy.download.win7Action
                  }}<span v-if="!busy.win7" class="arr" aria-hidden="true">↓</span>
                </button>
                <a v-else class="btn-solid" :href="WIN7_RELEASES" rel="noopener">
                  {{ copy.download.win7Action }}<span class="arr" aria-hidden="true">↗</span>
                </a>
                <button
                  v-if="win7Portable"
                  type="button"
                  class="dl-sublink"
                  :disabled="busy.win7Portable"
                  @click="downloadPortable('win7Portable', win7)"
                >
                  {{ busy.win7Portable ? copy.download.downloadBusy : copy.download.portableAction
                  }}<span class="dl-sublink-size">{{ fmtSize(win7Portable.size) }}</span>
                </button>
                <a class="dl-sublink" :href="win7?.releaseUrl ?? WIN7_RELEASES" rel="noopener">
                  {{ copy.download.releaseLink }}<span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <p v-if="hint.win7 || hint.win7Portable" class="dl-hint" role="status">
              {{ hint.win7 || hint.win7Portable }}
            </p>
          </div>

          <div class="dl-item">
            <div class="dl-row">
              <div class="dl-row-info">
                <b class="dl-row-name">
                  {{ copy.download.win7PreviewName
                  }}<template v-if="win7Preview"> {{ win7Preview.tag }}</template>
                </b>
                <span class="dl-row-note">
                  {{
                    win7Preview
                      ? metaOf(win7Preview) + ' · ' + copy.download.previewNote
                      : loading
                        ? copy.download.loadingNote
                        : copy.download.previewNote
                  }}
                </span>
              </div>
              <div class="dl-row-act">
                <button
                  v-if="win7Preview"
                  type="button"
                  class="btn-ghost"
                  :disabled="busy.win7Preview"
                  @click="downloadBuild('win7Preview', win7Preview)"
                >
                  {{ busy.win7Preview ? copy.download.downloadBusy : copy.download.win7PreviewAction
                  }}<span v-if="!busy.win7Preview" class="arr" aria-hidden="true">↓</span>
                </button>
                <a v-else class="btn-ghost" :href="WIN7_RELEASES" rel="noopener">
                  {{ copy.download.win7PreviewAction }}<span class="arr" aria-hidden="true">↗</span>
                </a>
                <button
                  v-if="win7PreviewPortable"
                  type="button"
                  class="dl-sublink"
                  :disabled="busy.win7PreviewPortable"
                  @click="downloadPortable('win7PreviewPortable', win7Preview)"
                >
                  {{ busy.win7PreviewPortable
                    ? copy.download.downloadBusy
                    : copy.download.portableAction
                  }}<span class="dl-sublink-size">{{ fmtSize(win7PreviewPortable.size) }}</span>
                </button>
                <a
                  class="dl-sublink"
                  :href="win7Preview?.releaseUrl ?? WIN7_RELEASES"
                  rel="noopener"
                >
                  {{ copy.download.releaseLink }}<span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <p v-if="hint.win7Preview || hint.win7PreviewPortable" class="dl-hint" role="status">
              {{ hint.win7Preview || hint.win7PreviewPortable }}
            </p>
          </div>

          <div class="dl-item">
            <div class="dl-row">
              <div class="dl-row-info">
                <b class="dl-row-name">
                  {{ copy.download.previewName }}<template v-if="preview"> {{ preview.tag }}</template>
                </b>
                <span class="dl-row-note">
                  {{
                    preview
                      ? metaOf(preview) + ' · ' + copy.download.previewNote
                      : loading
                        ? copy.download.loadingNote
                        : copy.download.previewNote
                  }}
                </span>
              </div>
              <div class="dl-row-act">
                <button
                  v-if="preview"
                  type="button"
                  class="btn-ghost"
                  :disabled="busy.preview"
                  @click="downloadBuild('preview', preview)"
                >
                  {{ busy.preview ? copy.download.downloadBusy : copy.download.previewAction
                  }}<span v-if="!busy.preview" class="arr" aria-hidden="true">↓</span>
                </button>
                <a v-else class="btn-ghost" :href="DESKTOP_RELEASES" rel="noopener">
                  {{ copy.download.previewAction }}<span class="arr" aria-hidden="true">↗</span>
                </a>
                <a class="dl-sublink" :href="preview?.releaseUrl ?? DESKTOP_RELEASES" rel="noopener">
                  {{ copy.download.releaseLink }}<span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <p v-if="hint.preview" class="dl-hint" role="status">{{ hint.preview }}</p>
          </div>
        </div>

        <p class="dl-note">{{ copy.download.releasesNote }}</p>
      </article>

      <!-- 网页版 -->
      <article class="dl-card">
        <div class="dl-head">
          <span class="wicon dl-ico" aria-hidden="true">{{ glyphs.web }}</span>
          <h2 class="dl-name">{{ copy.download.webTitle }}</h2>
        </div>
        <p class="dl-desc">{{ copy.download.webDesc }}</p>
        <p class="dl-meta">{{ copy.download.webMeta }}</p>
        <a class="btn-ghost" :href="WEB_URL" rel="noopener">
          {{ copy.download.webAction }}<span class="arr" aria-hidden="true">↗</span>
        </a>
      </article>

      <!-- 安卓版 -->
      <article class="dl-card">
        <div class="dl-head">
          <span class="dl-ico dl-ico-svg" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect
                x="6"
                y="2"
                width="12"
                height="20"
                rx="2.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <line
                x1="10.5"
                y1="4.8"
                x2="13.5"
                y2="4.8"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
              <circle cx="12" cy="18.5" r="1" fill="currentColor" />
            </svg>
          </span>
          <h2 class="dl-name">{{ copy.download.androidTitle }}</h2>
        </div>
        <p class="dl-desc">{{ copy.download.androidDesc }}</p>

        <div class="dl-item android-item">
          <div class="dl-row">
            <div class="dl-row-info">
              <b class="dl-row-name">
                {{ copy.download.androidPkgName
                }}<template v-if="android"> {{ android.tag }}</template>
              </b>
              <span class="dl-row-note">
                {{
                  android
                    ? metaOf(android)
                    : loading
                      ? copy.download.loadingNote
                      : copy.download.androidNote
                }}
              </span>
            </div>
            <div class="dl-row-act">
              <button
                v-if="android"
                type="button"
                class="btn-solid"
                :disabled="busy.android"
                @click="downloadBuild('android', android)"
              >
                {{ busy.android ? copy.download.downloadBusy : copy.download.androidAction
                }}<span v-if="!busy.android" class="arr" aria-hidden="true">↓</span>
              </button>
              <a v-else class="btn-solid" :href="ANDROID_RELEASES" rel="noopener">
                {{ copy.download.androidAction }}<span class="arr" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <p v-if="hint.android" class="dl-hint" role="status">{{ hint.android }}</p>
        </div>

        <div class="android-foot">
          <a class="dl-sublink" :href="android?.releaseUrl ?? ANDROID_RELEASES" rel="noopener">
            {{ copy.download.releaseLink }}<span aria-hidden="true">↗</span>
          </a>
          <p class="dl-note">{{ copy.download.androidInstallNote }}</p>
        </div>
      </article>

      <!-- 源码 -->
      <article class="dl-card">
        <div class="dl-head">
          <span class="wicon dl-ico" aria-hidden="true">{{ glyphs.code }}</span>
          <h2 class="dl-name">{{ copy.download.srcTitle }}</h2>
        </div>
        <p class="dl-desc">{{ copy.download.srcDesc }}</p>
        <a class="btn-ghost" :href="REPO_URL" rel="noopener">
          {{ copy.download.srcAction }}<span class="arr" aria-hidden="true">↗</span>
        </a>
      </article>
    </div>

    <p class="page-foot-link">
      <RouterLink :to="{ name: 'changelog' }" class="plink">
        {{ copy.download.changelogLink }}<span class="arr" aria-hidden="true">→</span>
      </RouterLink>
    </p>
  </section>
</template>

<style scoped>
.page {
  padding: 64px 0 0;
}

.page-title {
  font-size: var(--fs-h1);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 16px;
}

.page-lede {
  font-size: var(--fs-lead);
  line-height: 1.85;
  color: var(--ink-2);
  max-width: 56ch;
}

.dl-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 16px;
  margin-top: 40px;
}

.dl-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 26px 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
}

.dl-card.wide {
  grid-row: span 3;
}

.dl-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dl-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-s);
  background: var(--glow);
  color: var(--accent-text);
  font-size: 18px;
}

.dl-ico-svg svg {
  width: 20px;
  height: 20px;
}

.dl-name {
  font-size: var(--fs-h3);
  font-weight: 700;
}

.dl-desc {
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--ink-2);
}

.dl-meta {
  font-size: 12.5px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
  margin-bottom: 2px;
}

.dl-rows {
  width: 100%;
  display: grid;
  gap: 10px;
  margin-top: 8px;
}

.dl-item {
  display: grid;
  gap: 6px;
}

.dl-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: nowrap;
  padding: 14px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--surface-2);
}

.dl-row-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 0;
  min-width: 0;
}

.dl-row-name {
  font-size: 14.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.dl-row-note {
  font-size: 12px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.dl-row-sub {
  font-size: 11.5px;
  color: var(--ink-3);
}

.dl-row-act {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}

.dl-sublink {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--dur) linear;
}

.dl-sublink:hover {
  color: var(--accent-text);
}

.dl-sublink:disabled {
  opacity: 0.6;
  cursor: progress;
}

.dl-sublink-size {
  color: var(--ink-3);
  font-size: 11.5px;
}

.dl-hint {
  padding: 0 4px;
  font-size: 12px;
  color: var(--accent-text);
}

.dl-note {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 4px;
}

/* ---- 安卓版卡：窄栏内保持一行，补充说明另起一行 ---- */

.android-item {
  width: 100%;
  margin-top: 2px;
}

.android-item .dl-row {
  padding: 12px 14px;
}

.android-foot {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.android-foot .dl-note {
  margin-top: 0;
}

/* ---- 按钮（与首页同款） ---- */

.btn-solid {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--accent);
  color: var(--accent-ink);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 22px;
  border: 0;
  border-radius: 999px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--dur) linear;
}

.btn-solid:disabled,
.btn-ghost:disabled {
  opacity: 0.6;
  cursor: progress;
}

.btn-solid:hover {
  background: var(--accent-strong);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--ink);
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color var(--dur) linear,
    background-color var(--dur) linear;
}

.btn-ghost:hover {
  border-color: var(--accent-text);
  background: var(--surface-2);
}

.btn-solid .arr,
.btn-ghost .arr,
.plink .arr {
  transition: transform var(--dur) linear;
}

.btn-solid:hover .arr,
.btn-ghost:hover .arr,
.plink:hover .arr {
  transform: translateX(3px);
}

.page-foot-link {
  margin-top: 32px;
}

.plink {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--accent-text);
  transition: color var(--dur) linear;
}

.plink:hover {
  color: var(--accent-strong);
}

@media (max-width: 860px) {
  .page {
    padding-top: 44px;
  }

  .dl-grid {
    grid-template-columns: 1fr;
  }

  .dl-card.wide {
    grid-row: auto;
  }

  .dl-row {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .dl-row-info {
    flex-basis: 100%;
  }

  .dl-row-act {
    flex-wrap: wrap;
  }
}
</style>
