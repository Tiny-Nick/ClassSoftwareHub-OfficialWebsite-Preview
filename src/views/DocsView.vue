<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { copy } from '../content/copy'
import { renderDoc } from '../utils/renderDoc'
import DocsHomeView from './DocsHomeView.vue'

const DOCS_REPO_FILE = 'https://github.com/c1201y/classsoftwarehub-docs/blob/main/docs'

/* 正文取仓库实时版本。raw.githubusercontent.com 在部分网络下不可达，
   故走 gh-proxy 转发的同一份 raw 内容；取不到时用构建期内联快照。 */
const DOCS_LIVE_BASE =
  'https://gh-proxy.com/https://raw.githubusercontent.com/c1201y/classsoftwarehub-docs/main/docs'
const DOC_CACHE_KEY = 'csh-site-doc'
const DOC_CACHE_TTL = 10 * 60 * 1000

/* URL 短名 → 仓库内 md 路径（与 sync-docs 脚本同步的文件对应） */
const DOC_PATHS: Record<string, string> = {
  overview: 'doc/overview',
  web: 'doc/guide/web',
  desktop: 'doc/guide/desktop',
  win7: 'doc/guide/win7',
  win10: 'doc/guide/win10',
  faq: 'doc/guide/faq',
  'basic-settings': 'faq/basic-settings',
  'ipc-url': 'faq/ipc-url-faq',
  'startup-issues': 'faq/startup-issues',
  admin: 'doc/guide/admin',
  troubleshooting: 'doc/guide/troubleshooting',
  download: 'download',
  'appendix-api': 'doc/appendix/api',
  'appendix-config': 'doc/appendix/config',
  'appendix-glossary': 'doc/appendix/glossary',
  'appendix-models': 'doc/appendix/models',
  'appendix-scripts': 'doc/appendix/scripts',
  'dev-index': 'dev/index',
  'dev-architecture': 'dev/architecture',
  'dev-api': 'dev/api',
  'dev-build': 'dev/build',
  'dev-cicd': 'dev/cicd',
  'dev-config': 'dev/config',
  'dev-contribute': 'dev/contribute',
  'dev-desktop': 'dev/desktop',
  'dev-requirements': 'dev/requirements',
  'dev-security': 'dev/security',
  'dev-stack': 'dev/stack',
  'dev-web': 'dev/web',
  'dev-win7': 'dev/win7',
  team: 'team',
  friends: 'friends',
}

/* 构建期内联 md 快照（sync-docs 脚本同步），实时拉取失败时兜底 */
const modules = import.meta.glob('../content/docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const docs: Record<string, string> = {}
for (const [path, raw] of Object.entries(modules)) {
  docs[path.replace(/^\.*\/?content\/docs\//, '').replace(/\.md$/, '')] = raw
}

type DocCache = Record<string, { at: number; raw: string }>

function readDocCache(): DocCache {
  try {
    return JSON.parse(localStorage.getItem(DOC_CACHE_KEY) ?? '{}') as DocCache
  } catch {
    return {}
  }
}

function writeDocCache(path: string, raw: string): void {
  try {
    localStorage.setItem(
      DOC_CACHE_KEY,
      JSON.stringify({ ...readDocCache(), [path]: { at: Date.now(), raw } }),
    )
  } catch {
    /* 存不下就只影响下次是否重新请求 */
  }
}

async function fetchDoc(path: string): Promise<string> {
  const cached = readDocCache()[path]
  if (cached && Date.now() - cached.at < DOC_CACHE_TTL) return cached.raw
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${DOCS_LIVE_BASE}/${path}.md`, { signal: controller.signal })
    if (!res.ok) return ''
    const raw = await res.text()
    writeDocCache(path, raw)
    return raw
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}

const route = useRoute()

const flat = computed(() =>
  copy.docs.groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label }))),
)

const currentKey = computed(() => {
  const p = route.params.doc
  /* :doc* 为 repeatable 参数，数组或字符串两种形态都要兼容 */
  const key = Array.isArray(p) ? p.join('/') : typeof p === 'string' ? p : ''
  return key ? key.replace(/\.md$/, '') : 'overview'
})

/* 无文档参数（/docs）时渲染入口页；路由只有一条 /docs/:doc*，在此分流 */
const isHome = computed(() => {
  const p = route.params.doc
  const key = Array.isArray(p) ? p.join('/') : typeof p === 'string' ? p : ''
  return !key
})

const current = computed(() => flat.value.find((item) => item.key === currentKey.value) ?? null)
const currentGroup = computed(() => current.value?.group ?? '')

/* 当前页的实时正文；空串表示未取到，回落到快照 */
const liveRaw = ref('')

watch(
  currentKey,
  async (key) => {
    liveRaw.value = ''
    const path = DOC_PATHS[key]
    if (!path) return
    const raw = await fetchDoc(path)
    if (raw && DOC_PATHS[currentKey.value] === path) liveRaw.value = raw
  },
  { immediate: true },
)

const html = computed(() => {
  const path = DOC_PATHS[currentKey.value]
  const raw = path ? liveRaw.value || docs[path] || '' : ''
  return raw ? renderDoc(raw) : ''
})

const idx = computed(() => flat.value.findIndex((item) => item.key === currentKey.value))
const prev = computed(() => (idx.value > 0 ? flat.value[idx.value - 1] : null))
const next = computed(() =>
  idx.value >= 0 && idx.value < flat.value.length - 1 ? flat.value[idx.value + 1] : null,
)

const githubUrl = computed(() => {
  const path = DOC_PATHS[currentKey.value]
  return path ? `${DOCS_REPO_FILE}/${path}.md` : DOCS_REPO_FILE
})

/* 文档元信息：从 frontmatter 取更新日期 */
const rawDoc = computed(() => {
  const path = DOC_PATHS[currentKey.value]
  return path ? liveRaw.value || docs[path] || '' : ''
})

const docDate = computed(() => {
  const m = rawDoc.value.match(/createTime:\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/)
  if (!m) return ''
  return `${m[1]}/${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}`
})

/* 右侧「本页内容」：渲染后从正文标题提取锚点 */
interface TocItem {
  id: string
  text: string
  lvl: number
}
const bodyRef = ref<HTMLElement | null>(null)
const toc = ref<TocItem[]>([])

async function buildToc() {
  await nextTick()
  const nodes = Array.from(bodyRef.value?.querySelectorAll('h2, h3, h4') ?? [])
  toc.value = nodes.map((el) => ({
    id: el.id,
    text: el.textContent ?? '',
    lvl: Number(el.tagName.slice(1)),
  }))
}

watch([currentKey, html], buildToc, { immediate: true })

/* 锚点点击：滚动到对应标题（hash 路由下不可用原生 #id 跳转，会破坏路由） */
function scrollToSec(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
</script>

<template>
  <!-- /docs 无参数：文档入口页 -->
  <DocsHomeView v-if="isHome" />

  <section v-else class="page">
    <!-- 面包屑（返回与主题切换在全站页头，不再另起工具行） -->
    <nav class="crumb" aria-label="面包屑">
      <RouterLink :to="{ name: 'docs' }" class="crumb-link">{{ copy.docs.title }}</RouterLink>
      <span class="crumb-sep">/</span>
      <span class="crumb-cur">{{ currentGroup }}</span>
      <span class="crumb-sep">/</span>
      <span class="crumb-cur">{{ current?.label ?? '' }}</span>
    </nav>

    <div class="docs-layout">
      <!-- 左侧目录 -->
      <aside class="docs-nav" aria-label="文档目录">
        <div v-for="group in copy.docs.groups" :key="group.label" class="nav-group">
          <p class="micro nav-label">{{ group.label }}</p>
          <RouterLink
            v-for="item in group.items"
            :key="item.key"
            class="nav-item"
            :to="{ name: 'docs', params: { doc: item.key } }"
            :class="{ on: item.key === currentKey }"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </aside>

      <!-- 正文 -->
      <div class="docs-main">
        <template v-if="current">
          <h1 class="doc-title">{{ current.label }}</h1>
          <p class="doc-meta">
            <span class="meta-tag">{{ currentGroup }}</span>
            <span v-if="docDate">{{ copy.docs.updatedOn }} {{ docDate }}</span>
            <a class="doc-meta-link" :href="githubUrl" rel="noopener">
              {{ copy.docs.viewOnGithub }}<span class="arr" aria-hidden="true">↗</span>
            </a>
          </p>
          <article ref="bodyRef" class="doc-body" v-html="html"></article>
          <footer class="doc-foot">
            <div class="doc-pager">
              <RouterLink v-if="prev" class="pager-link" :to="{ name: 'docs', params: { doc: prev.key } }">
                <span class="pager-dir">{{ copy.docs.prev }}</span>
                <span class="pager-name">{{ prev.label }}</span>
              </RouterLink>
              <RouterLink
                v-if="next"
                class="pager-link pager-next"
                :to="{ name: 'docs', params: { doc: next.key } }"
              >
                <span class="pager-dir">{{ copy.docs.next }}</span>
                <span class="pager-name">{{ next.label }}</span>
              </RouterLink>
            </div>
          </footer>
        </template>
        <div v-else class="docs-empty">
          <p class="empty-text">{{ copy.docs.notFound }}</p>
          <RouterLink class="plink" :to="{ name: 'docs' }">
            {{ copy.docs.backHome }}<span class="arr" aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </div>

      <!-- 右侧本页目录 -->
      <aside v-if="toc.length" class="docs-toc" aria-label="本页内容">
        <p class="micro toc-label">{{ copy.docs.onThisPage }}</p>
        <a
          v-for="item in toc"
          :key="item.id"
          class="toc-item"
          :class="'toc-l' + item.lvl"
          :href="'#' + item.id"
          @click.prevent="scrollToSec(item.id)"
        >
          {{ item.text }}
        </a>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding: 40px 0 0;
}

/* ---- 面包屑 ---- */

.crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: var(--ink-3);
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.crumb-link {
  color: var(--ink-3);
  transition: color var(--dur) linear;
}

.crumb-link:hover {
  color: var(--accent-text);
}

.crumb-sep {
  color: var(--line-strong);
}

.crumb-cur {
  color: var(--ink-2);
}

/* ---- 三栏布局（全宽） ---- */

.docs-layout {
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr) 200px;
  gap: 48px;
  align-items: start;
}

/* ---- 左侧目录 ---- */

.docs-nav {
  position: sticky;
  top: 84px;
  max-height: calc(100vh - 116px);
  overflow-y: auto;
  display: grid;
  gap: 20px;
  align-content: start;
  scrollbar-width: thin;
  scrollbar-color: var(--line-strong) transparent;
}

.docs-nav::-webkit-scrollbar {
  width: 4px;
}

.docs-nav::-webkit-scrollbar-thumb {
  background: var(--line-strong);
  border-radius: 2px;
}

.nav-label {
  color: var(--ink-3);
  font-weight: 400;
  margin-bottom: 6px;
}

.nav-item {
  display: block;
  font-size: 14.5px;
  color: var(--ink-2);
  padding: 6px 14px;
  border-left: 2px solid var(--line);
  transition:
    color var(--dur) linear,
    border-color var(--dur) linear,
    background-color var(--dur) linear;
}

.nav-item:hover {
  color: var(--ink);
  background: var(--surface-2);
}

.nav-item.on {
  color: var(--accent-text);
  font-weight: 600;
  border-left-color: var(--accent-text);
  background: var(--surface-2);
}

/* ---- 正文 ---- */

.docs-main {
  min-width: 0;
}

.doc-title {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 12px;
}

.doc-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 12.5px;
  color: var(--ink-3);
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 26px;
}

.meta-tag {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--accent-text);
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 2px 10px;
  background: var(--surface);
}

.doc-meta-link {
  color: var(--accent-text);
  font-weight: 600;
  transition: color var(--dur) linear;
}

.doc-meta-link:hover {
  color: var(--accent-strong);
}

.doc-meta-link .arr {
  transition: transform var(--dur) linear;
}

.doc-meta-link:hover .arr {
  transform: translate(2px, -2px);
}

/* ---- 文档排版 ---- */

.doc-body {
  font-size: 15.5px;
  line-height: 1.9;
  color: var(--ink-2);
}

.doc-body :deep(h2),
.doc-body :deep(h3),
.doc-body :deep(h4),
.doc-body :deep(h5) {
  color: var(--ink);
  font-weight: 700;
  line-height: 1.4;
  margin: 32px 0 12px;
  scroll-margin-top: 84px;
}

.doc-body :deep(h2) {
  font-size: 21px;
}

.doc-body :deep(h3) {
  font-size: 18px;
}

.doc-body :deep(h4),
.doc-body :deep(h5) {
  font-size: 16px;
}

.doc-body :deep(p) {
  margin: 12px 0;
}

.doc-body :deep(a) {
  color: var(--accent-text);
}

.doc-body :deep(a:hover) {
  color: var(--accent-strong);
}

.doc-body :deep(ul),
.doc-body :deep(ol) {
  margin: 10px 0;
  padding-left: 22px;
  display: grid;
  gap: 5px;
}

.doc-body :deep(ul) {
  list-style: disc;
}

.doc-body :deep(ol) {
  list-style: decimal;
}

.doc-body :deep(img) {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  margin: 12px 0;
  display: block;
}

.doc-body :deep(code) {
  font-family: Consolas, 'Cascadia Mono', monospace;
  font-size: 12.5px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 6px;
}

.doc-body :deep(pre) {
  margin: 14px 0;
  padding: 14px 16px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  overflow-x: auto;
}

.doc-body :deep(pre code) {
  background: none;
  border: 0;
  padding: 0;
  font-size: 12.5px;
  line-height: 1.7;
}

.doc-body :deep(hr) {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 20px 0;
}

/* 表格 */

.doc-body :deep(.table-wrap) {
  margin: 14px 0;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
}

.doc-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14.5px;
}

.doc-body :deep(th),
.doc-body :deep(td) {
  padding: 11px 16px;
  text-align: left;
  border-bottom: 1px solid var(--line);
  white-space: normal;
  word-break: break-word;
}

.doc-body :deep(th) {
  background: var(--surface-2);
  color: var(--ink);
  font-weight: 600;
  white-space: nowrap;
}

.doc-body :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

/* ::: 提示容器 */

.doc-body :deep(.callout) {
  margin: 16px 0;
  padding: 15px 18px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent-text);
  border-radius: var(--radius-s);
  background: var(--surface-2);
  font-size: 14.5px;
}

.doc-body :deep(.callout-title) {
  color: var(--ink);
  font-weight: 600;
  margin-bottom: 4px;
}

.doc-body :deep(.callout p) {
  margin: 4px 0;
}

.doc-body :deep(.callout-warning) {
  border-left-color: #ba7517;
}

.doc-body :deep(.callout-danger) {
  border-left-color: #a32d2d;
}

/* ---- 上/下一篇 ---- */

.doc-foot {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.doc-pager {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.pager-link {
  display: grid;
  gap: 2px;
  padding: 10px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--surface);
  transition:
    border-color var(--dur) linear,
    background-color var(--dur) linear;
}

.pager-link:hover {
  border-color: var(--accent-text);
  background: var(--surface-2);
}

.pager-dir {
  font-size: 11.5px;
  color: var(--ink-3);
}

.pager-name {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink);
}

/* ---- 右侧本页目录 ---- */

.docs-toc {
  position: sticky;
  top: 84px;
  display: grid;
  gap: 8px;
  align-content: start;
  max-height: calc(100vh - 116px);
  overflow-y: auto;
  scrollbar-width: none;
}

.docs-toc::-webkit-scrollbar {
  display: none;
}

.toc-label {
  color: var(--ink-3);
  font-weight: 400;
  margin-bottom: 4px;
}

.toc-item {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.55;
  border-left: 2px solid var(--line);
  padding: 3px 10px;
  transition:
    color var(--dur) linear,
    border-color var(--dur) linear;
}

.toc-item:hover {
  color: var(--accent-text);
  border-left-color: var(--accent-text);
}

.toc-l3 {
  padding-left: 22px;
}

.toc-l4 {
  padding-left: 34px;
}

/* ---- 空态 ---- */

.docs-empty {
  padding: 36px 32px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-l);
  background: var(--surface);
  display: grid;
  gap: 14px;
  justify-items: start;
}

.empty-text {
  font-size: 14px;
  color: var(--ink-2);
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
  transform: translateX(3px);
}

/* ---- 响应式 ---- */

@media (max-width: 1280px) {
  .docs-layout {
    grid-template-columns: 224px minmax(0, 1fr);
  }

  .docs-toc {
    display: none;
  }
}

@media (max-width: 860px) {
  .page {
    padding-top: 24px;
  }

  .docs-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .docs-nav {
    position: static;
    max-height: none;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: none;
  }

  .docs-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-group {
    display: flex;
    gap: 6px;
    align-items: center;
    flex: 0 0 auto;
  }

  .nav-label {
    margin-bottom: 0;
    margin-right: 2px;
    white-space: nowrap;
  }

  .nav-item {
    border-left: 0;
    border: 1px solid var(--line);
    border-radius: 999px;
    white-space: nowrap;
  }

  .nav-item.on {
    border-color: var(--accent-text);
  }

  .doc-body {
    font-size: 15px;
    max-width: none;
  }
}
</style>
