<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { copy } from '../content/copy'
import { loadReleases, type GhRelease, type ReleaseProduct } from '../utils/releases'

const RELEASES_PAGE = 'https://github.com/c1201y/ClassSoftwareHub-Desktop/releases'
const PAGE_SIZE = 10

const releases = ref<GhRelease[]>([])
const loading = ref(true)
const error = ref('')
const selectedId = ref<number | null>(null)
const visible = ref(PAGE_SIZE)
const filter = ref<'all' | 'desktop' | 'win7' | 'site'>('all')

const tabs = [
  { value: 'all' as const, label: '全部' },
  { value: 'desktop' as const, label: copy.changelog.productDesktop },
  { value: 'win7' as const, label: copy.changelog.productWin7 },
  { value: 'site' as const, label: copy.changelog.productSite },
]

const filtered = computed(() =>
  filter.value === 'all'
    ? releases.value
    : releases.value.filter((r) => r.product === filter.value),
)
const counts = computed(() => ({
  all: releases.value.length,
  desktop: releases.value.filter((r) => r.product === 'desktop').length,
  win7: releases.value.filter((r) => r.product === 'win7').length,
  site: releases.value.filter((r) => r.product === 'site').length,
}))
const selected = computed(() => filtered.value.find((r) => r.id === selectedId.value) ?? null)
const visibleList = computed(() => filtered.value.slice(0, visible.value))

/* 只列出可安装的文件：桌面端取安装包 exe，Win7 兼容版另含便携版 zip；
   校验文件（.exe.md5 / .exe.sha256）、截图等附件不展示。
   网页版发布没有可下载的安装内容，不显示附件区。 */
const selectedAssets = computed(() => {
  const rel = selected.value
  if (!rel) return []
  if (rel.product === 'desktop') return rel.assets.filter((asset) => /\.exe$/i.test(asset.name))
  if (rel.product === 'win7') {
    /* 安装版在前，便携版在后 */
    return rel.assets
      .filter((asset) => /\.(exe|zip)$/i.test(asset.name))
      .sort((a, b) => Number(/\.zip$/i.test(a.name)) - Number(/\.zip$/i.test(b.name)))
  }
  return []
})

watch(filter, () => {
  visible.value = PAGE_SIZE
  selectedId.value = filtered.value[0]?.id ?? null
})

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtShort(iso: string): string {
  return iso.slice(0, 10)
}

function productName(product: ReleaseProduct): string {
  if (product === 'desktop') return copy.changelog.productDesktop
  if (product === 'win7') return copy.changelog.productWin7
  return copy.changelog.productSite
}

function avatar(login: string): string {
  return `https://github.com/${login}.png?size=40`
}

/* ---- 轻量 Markdown 渲染（GitHub Release 正文）----
   先整体转义 HTML，再按行解析标题/列表/分隔线/独立图片，
   行内解析图片、链接、粗体、行内代码。输出只含这里生成的标签。 */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function mdInline(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function renderMd(src: string): string {
  const out: string[] = []
  let inList = false
  for (const raw of esc(src).split(/\r?\n/)) {
    const line = raw.trim()
    const li = line.match(/^[-*]\s+(.*)$/)
    if (li) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${mdInline(li[1])}</li>`)
      continue
    }
    if (inList) {
      out.push('</ul>')
      inList = false
    }
    if (!line) continue
    if (/^-{3,}$/.test(line)) {
      out.push('<hr>')
      continue
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const lvl = Math.min(h[1].length + 2, 6)
      out.push(`<h${lvl}>${mdInline(h[2])}</h${lvl}>`)
      continue
    }
    out.push(`<p>${mdInline(line)}</p>`)
  }
  if (inList) out.push('</ul>')
  return out.join('\n')
}

onMounted(async () => {
  try {
    releases.value = await loadReleases()
    selectedId.value = releases.value[0]?.id ?? null
  } catch {
    error.value = '无法加载 GitHub Releases，请直接在 GitHub 查看。'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="page">
    <header class="page-head" v-reveal>
      <div>
        <h1 class="page-title">{{ copy.changelog.title }}</h1>
        <p class="page-lede">{{ copy.changelog.lede }}</p>
      </div>
      <a class="head-more" :href="RELEASES_PAGE" rel="noopener">
        {{ copy.changelog.releasesLink }}<span class="arr" aria-hidden="true">↗</span>
      </a>
    </header>

    <p v-if="loading" class="state">正在从 GitHub 拉取发布记录……</p>
    <p v-else-if="error" class="state state-err">
      {{ error }}
      <a class="state-link" :href="RELEASES_PAGE" rel="noopener">前往 GitHub ↗</a>
    </p>

    <template v-else-if="releases.length">
      <div class="cl-tabs" role="tablist" aria-label="产品筛选" v-reveal>
        <button
          v-for="t in tabs"
          :key="t.value"
          class="cl-tab"
          type="button"
          role="tab"
          :class="{ active: filter === t.value }"
          @click="filter = t.value"
        >
          {{ t.label }}
          <span class="cl-tab-count">{{ counts[t.value] }}</span>
        </button>
      </div>

      <div class="cl-layout" v-reveal>
      <!-- 版本列表 -->
      <aside class="cl-list" aria-label="版本列表">
        <button
          v-for="(rel, i) in visibleList"
          :key="rel.id"
          class="cl-item"
          type="button"
          :class="{ active: rel.id === selectedId }"
          @click="selectedId = rel.id"
        >
          <span class="cl-item-date">{{ fmtShort(rel.published_at) }}</span>
          <span class="cl-item-tag">{{ rel.tag_name }}</span>
          <span v-if="i === 0" class="tag tag-latest">Latest</span>
          <span v-if="rel.prerelease" class="tag tag-pre">预览</span>
          <span class="tag tag-prod">{{ productName(rel.product) }}</span>
        </button>
        <button
          v-if="visible < releases.length"
          class="cl-more"
          type="button"
          @click="visible += PAGE_SIZE"
        >
          显示更多（剩余 {{ releases.length - visible }} 条）
        </button>
      </aside>

      <!-- 版本详情 -->
      <article v-if="selected" class="cl-detail">
        <header class="rel-head">
          <img
            class="rel-avatar"
            :src="avatar(selected.author.login)"
            :alt="selected.author.login"
            width="36"
            height="36"
            loading="lazy"
          />
          <div class="rel-head-main">
            <div class="rel-head-line">
              <span class="rel-tag">{{ selected.tag_name }}</span>
              <span v-if="selected.prerelease" class="tag tag-pre">预览</span>
              <span class="tag tag-prod">{{ productName(selected.product) }}</span>
            </div>
            <p class="rel-meta">
              <b>{{ selected.author.login }}</b> 发布于 {{ fmtDate(selected.published_at) }}
            </p>
          </div>
        </header>

        <h2 v-if="selected.name" class="rel-name">{{ selected.name }}</h2>

        <div v-if="selected.body" class="rel-body rel-md" v-html="renderMd(selected.body)"></div>

        <ul v-if="selectedAssets.length" class="rel-assets">
          <li v-for="asset in selectedAssets" :key="asset.name" class="asset">
            <span class="asset-name">{{ asset.name }}</span>
            <span class="asset-size">{{ fmtSize(asset.size) }}</span>
            <a class="asset-dl" :href="asset.browser_download_url" rel="noopener">下载 ↗</a>
          </li>
        </ul>

        <a class="rel-link" :href="selected.html_url" rel="noopener">在 GitHub 查看此发布 ↗</a>
      </article>
      </div>
    </template>
    <p v-else class="state">{{ copy.changelog.empty }}</p>

    <div class="page-foot">
      <RouterLink :to="{ name: 'home' }" class="plink">
        {{ copy.changelog.backHome }}<span class="arr" aria-hidden="true">←</span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding: 64px 0 0;
}

.page-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 36px;
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

.head-more {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--accent-text);
  white-space: nowrap;
  transition: color var(--dur) linear;
}

.head-more:hover {
  color: var(--accent-strong);
}

.head-more .arr {
  transition: transform var(--dur) linear;
}

.head-more:hover .arr {
  transform: translate(2px, -2px);
}

.state {
  margin-top: 12px;
  padding: 24px 26px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
  font-size: 13.5px;
  color: var(--ink-2);
}

.state-err {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.state-link {
  color: var(--accent-text);
}

/* ---- 产品筛选 ---- */

.cl-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.cl-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-2);
  transition:
    border-color var(--dur) linear,
    background-color var(--dur) linear,
    color var(--dur) linear;
}

.cl-tab:hover {
  border-color: var(--accent-text);
  color: var(--ink);
}

.cl-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.cl-tab-count {
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}

/* ---- 主从布局 ---- */

.cl-layout {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
  gap: 20px;
  align-items: start;
}

/* ---- 版本列表 ---- */

.cl-list {
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
  overflow: hidden;
  position: sticky;
  top: 84px;
}

.cl-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 13px 18px;
  text-align: left;
  border-left: 3px solid transparent;
  transition:
    background-color var(--dur) linear,
    border-color var(--dur) linear;
}

.cl-item + .cl-item {
  border-top: 1px solid var(--line);
}

.cl-item:hover {
  background: var(--surface-2);
}

.cl-item.active {
  border-left-color: var(--accent-text);
  background: var(--surface-2);
}

.cl-item-date {
  font-size: 12px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
  flex: 0 0 auto;
}

.cl-item-tag {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
}

.tag {
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 1px 9px;
  white-space: nowrap;
  flex: 0 0 auto;
}

.tag-latest {
  color: #1a7f37;
  border: 1px solid #b8e0c4;
  background: #eaf7ee;
}

.tag-pre {
  color: var(--accent-text);
  border: 1px solid var(--line-strong);
}

.tag-prod {
  color: var(--ink-2);
  border: 1px solid var(--line);
  background: var(--surface-2);
  font-weight: 600;
}

.cl-more {
  width: 100%;
  padding: 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-2);
  border-top: 1px solid var(--line);
  transition: background-color var(--dur) linear;
}

.cl-more:hover {
  background: var(--surface-2);
  color: var(--ink);
}

/* ---- 版本详情 ---- */

.cl-detail {
  padding: 24px 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
  position: sticky;
  top: 84px;
}

.rel-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rel-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--line);
  display: block;
  flex: 0 0 36px;
}

.rel-head-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rel-tag {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.rel-meta {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--ink-2);
}

.rel-name {
  font-size: 16px;
  font-weight: 700;
  margin-top: 14px;
}

.rel-body {
  margin: 12px 0 0;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--ink-2);
  word-break: break-word;
}

.rel-md :deep(h3),
.rel-md :deep(h4),
.rel-md :deep(h5),
.rel-md :deep(h6) {
  margin: 18px 0 6px;
  color: var(--ink);
  font-weight: 700;
}

.rel-md :deep(h3) {
  font-size: 16px;
}

.rel-md :deep(h4) {
  font-size: 14.5px;
}

.rel-md :deep(h5),
.rel-md :deep(h6) {
  font-size: 13.5px;
}

.rel-md :deep(p) {
  margin: 8px 0 0;
}

.rel-md :deep(ul) {
  margin: 8px 0 0;
  padding-left: 20px;
  list-style: disc;
  display: grid;
  gap: 4px;
}

.rel-md :deep(img) {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  margin: 12px 0 2px;
  display: block;
}

.rel-md :deep(a) {
  color: var(--accent-text);
}

.rel-md :deep(a:hover) {
  color: var(--accent-strong);
}

.rel-md :deep(code) {
  font-family: Consolas, "Cascadia Mono", monospace;
  font-size: 12.5px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 6px;
}

.rel-md :deep(hr) {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 14px 0;
}

.rel-assets {
  margin-top: 16px;
  display: grid;
  gap: 8px;
}

.asset {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--surface-2);
}

.asset-name {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
}

.asset-size {
  font-size: 12px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

.asset-dl {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--accent-text);
  transition: color var(--dur) linear;
}

.asset-dl:hover {
  color: var(--accent-strong);
}

.rel-link {
  display: inline-block;
  margin-top: 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-text);
  transition: color var(--dur) linear;
}

.rel-link:hover {
  color: var(--accent-strong);
}

.page-foot {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
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

.plink .arr {
  transition: transform var(--dur) linear;
}

.plink:hover .arr {
  transform: translateX(-3px);
}

@media (max-width: 860px) {
  .page {
    padding-top: 44px;
  }

  .cl-layout {
    grid-template-columns: 1fr;
  }

  .cl-list,
  .cl-detail {
    position: static;
  }

  .cl-detail {
    padding: 20px 20px;
  }

  .rel-body {
    font-size: 13px;
  }
}
</style>
