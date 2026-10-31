<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { copy } from '../content/copy'
import { publicUrl } from '../utils/assets'
import { loadReleases, summaryOf, type ReleaseProduct } from '../utils/releases'

/* WinUI Iconography（Segoe Fluent Icons / Segoe MDL2 Assets 字形码点） */
const glyphs: Record<string, string> = {
  apps: '\uE71D',
  ai: '\uE99A',
  download: '\uE896',
  clean: '\uE90F',
  class: '\uE787',
  shield: '\uE72E',
}

interface RecentEntry {
  id: number
  date: string
  version: string
  preview: boolean
  text: string
}

const recent = ref<RecentEntry[]>([])
const recentState = ref<'loading' | 'ready' | 'error'>('loading')

const productName = (product: ReleaseProduct) =>
  product === 'desktop'
    ? copy.changelog.productDesktop
    : product === 'win7'
      ? copy.changelog.productWin7
      : copy.changelog.productSite

onMounted(async () => {
  try {
    recent.value = (await loadReleases()).slice(0, 3).map((rel) => {
      const summary = summaryOf(rel.body)
      return {
        id: rel.id,
        date: rel.published_at.slice(0, 10),
        version: rel.tag_name,
        preview: rel.prerelease,
        text: summary ? `${productName(rel.product)} · ${summary}` : productName(rel.product),
      }
    })
    recentState.value = 'ready'
  } catch {
    recentState.value = 'error'
  }
})
</script>

<template>
  <!-- Hero：左文案 + 右应用图标 -->
  <section class="hero">
    <div class="hero-copy">
      <h1 class="hero-title reveal-d1" v-reveal>
        {{ copy.hero.titlePre }}<span class="hl">{{ copy.hero.titleHl }}</span>
      </h1>
      <p class="hero-lede reveal-d2" v-reveal>{{ copy.hero.lede }}</p>
      <div class="hero-cta reveal-d3" v-reveal>
        <RouterLink :to="{ name: 'download' }" class="btn-solid">
          {{ copy.hero.primaryAction }}<span class="arr" aria-hidden="true">→</span>
        </RouterLink>
        <a class="btn-ghost" :href="copy.hero.webUrl" rel="noopener">
          {{ copy.hero.webAction }}<span class="arr" aria-hidden="true">↗</span>
        </a>
        <a class="btn-ghost" :href="copy.hero.repoUrl" rel="noopener">
          {{ copy.hero.githubAction }}<span class="arr" aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
    <div class="hero-brand reveal-d3" v-reveal>
      <img
        :src="publicUrl('/brand/app-icon.png')"
        alt="ClassSoftwareHub 应用图标"
        width="216"
        height="216"
      />
    </div>
  </section>

  <!-- 实机主界面 -->
  <figure class="shot" v-reveal>
    <div class="shot-frame">
      <img
        class="shot-img"
        :src="publicUrl('/shots/shot-software.png')"
        :alt="copy.hero.shotCaption"
        width="1920"
        height="1020"
        loading="eager"
      />
    </div>
    <figcaption class="shot-cap micro">{{ copy.hero.shotCaption }}</figcaption>
  </figure>

  <!-- 内置工具（LED 屏式自动滚动） -->
  <section class="tools" v-reveal>
    <div class="sec-head">
      <h2 class="sec-title">{{ copy.tools.title }}</h2>
      <p class="sec-note">{{ copy.tools.note }}</p>
    </div>
    <div class="tool-rail-wrap">
      <ul class="tool-rail">
        <li v-for="tool in copy.tools.items" :key="tool.name" class="tool-card">
          <p class="micro tool-cat">{{ tool.cat }}</p>
          <p class="tool-name">{{ tool.name }}</p>
          <p class="tool-desc">{{ tool.desc }}</p>
        </li>
        <!-- 第二份用于无缝循环，对读屏隐藏 -->
        <li
          v-for="tool in copy.tools.items"
          :key="'dup-' + tool.name"
          class="tool-card"
          aria-hidden="true"
        >
          <p class="micro tool-cat">{{ tool.cat }}</p>
          <p class="tool-name">{{ tool.name }}</p>
          <p class="tool-desc">{{ tool.desc }}</p>
        </li>
      </ul>
    </div>
  </section>

  <!-- 功能一览（快速扫描） -->
  <section class="features" aria-label="功能一览" v-reveal>
    <div class="sec-head">
      <h2 class="sec-title">{{ copy.features.title }}</h2>
    </div>
    <ul class="feat-grid">
      <li v-for="item in copy.features.items" :key="item.title" class="feat-card">
        <span class="wicon feat-ico" aria-hidden="true">{{ glyphs[item.icon] }}</span>
        <h3 class="feat-name">{{ item.title }}</h3>
        <p class="feat-text">{{ item.text }}</p>
      </li>
    </ul>
  </section>

  <!-- 功能详述（图文左右交替，真实截图） -->
  <section class="deep" aria-label="功能详述" v-reveal>
    <div class="sec-head">
      <h2 class="sec-title">{{ copy.featureDetail.title }}</h2>
    </div>
    <div class="deep-list">
      <article
        v-for="(item, i) in copy.featureDetail.items"
        :key="item.title"
        class="deep-row"
        :class="{ flip: item.flip }"
      >
        <figure class="deep-shot">
          <div class="shot-frame">
            <img :src="publicUrl(item.image)" :alt="item.alt" loading="lazy" />
          </div>
          <figcaption class="shot-cap micro">{{ item.alt }}</figcaption>
        </figure>
        <div class="deep-copy">
          <p class="micro kicker">{{ item.kicker }}</p>
          <h3 class="deep-title">{{ item.title }}</h3>
          <p class="deep-text">{{ item.text }}</p>
        </div>
      </article>
    </div>
  </section>

  <!-- 快速开始（图文左右） -->
  <section class="detail" v-reveal>
    <figure class="detail-shot">
      <div class="shot-frame">
        <img
          :src="publicUrl('/shots/shot-app-home.png')"
          :alt="copy.detail.shotCaption"
          width="1920"
          height="1020"
          loading="lazy"
        />
      </div>
      <figcaption class="shot-cap micro">{{ copy.detail.shotCaption }}</figcaption>
    </figure>
    <div class="detail-copy">
      <p class="micro kicker">{{ copy.detail.kicker }}</p>
      <h2 class="sec-title">{{ copy.detail.title }}</h2>
      <p class="detail-text">{{ copy.detail.text }}</p>
      <ul class="detail-points">
        <li v-for="point in copy.detail.points" :key="point">{{ point }}</li>
      </ul>
    </div>
  </section>

  <!-- 版本记录摘要 -->
  <section class="recent" v-reveal>
    <div class="sec-head">
      <h2 class="sec-title">{{ copy.changelogBrief.title }}</h2>
      <RouterLink :to="{ name: 'changelog' }" class="sec-more">
        {{ copy.changelogBrief.viewAll }}<span class="arr" aria-hidden="true">→</span>
      </RouterLink>
    </div>

    <ul v-if="recent.length" class="rel-list">
      <li v-for="entry in recent" :key="entry.id" class="rel-item">
        <span class="d">{{ entry.date }}</span>
        <span class="v">{{ entry.version }}</span>
        <span class="c">
          <span class="chan" :class="entry.preview ? 'preview' : 'stable'">
            {{ entry.preview ? copy.changelog.channelPreview : copy.changelog.channelStable }}
          </span>
        </span>
        <span class="s">{{ entry.text }}</span>
      </li>
    </ul>
    <p v-else-if="recentState === 'loading'" class="rel-state">{{ copy.changelogBrief.loading }}</p>
    <p v-else class="rel-state">{{ copy.changelogBrief.error }}</p>
  </section>

  <!-- 底部行动区 -->
  <section class="cta" v-reveal>
    <h2 class="cta-title">{{ copy.cta.title }}</h2>
    <div class="cta-btns">
      <RouterLink :to="{ name: 'download' }" class="btn-solid">
        {{ copy.cta.download }}<span class="arr" aria-hidden="true">→</span>
      </RouterLink>
      <a class="btn-ghost" :href="copy.hero.webUrl" rel="noopener">
        {{ copy.cta.web }}<span class="arr" aria-hidden="true">↗</span>
      </a>
      <a class="btn-ghost" :href="copy.hero.repoUrl" rel="noopener">
        {{ copy.cta.github }}<span class="arr" aria-hidden="true">↗</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
/* ---- Hero ---- */

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) auto;
  gap: 40px;
  align-items: center;
  padding-top: 64px;
}

.hero-title {
  font-size: clamp(44px, 6vw, 68px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}

.hl {
  color: var(--ink);
  background: var(--glow);
  border-radius: 12px;
  padding: 0 14px;
  white-space: nowrap;
}

.hero-lede {
  font-size: var(--fs-lead);
  line-height: 1.85;
  color: var(--ink-2);
  max-width: 34em;
  margin-bottom: 30px;
}

.hero-cta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-brand img {
  display: block;
  width: 216px;
  height: 216px;
  border-radius: 52px;
  transition: transform 400ms var(--ease-out);
}

.hero-brand:hover img {
  transform: rotate(-2deg) scale(1.03);
}

/* ---- 按钮 ---- */

.btn-solid {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 14.5px;
  font-weight: 600;
  padding: 11px 24px;
  border-radius: 999px;
  transition:
    background-color var(--dur) linear,
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out);
}

.btn-solid:hover {
  background: var(--accent-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-1);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14.5px;
  font-weight: 600;
  padding: 11px 22px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  color: var(--ink);
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
.sec-more .arr {
  transition: transform var(--dur) linear;
}

.btn-solid:hover .arr,
.btn-ghost:hover .arr,
.sec-more:hover .arr {
  transform: translateX(3px);
}

/* ---- 实机截图 ---- */

.shot {
  margin: 44px 0 0;
}

.shot-frame {
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  overflow: hidden;
  background: var(--surface-2);
  transition:
    transform 400ms var(--ease-out),
    box-shadow 400ms var(--ease-out);
}

.shot-frame:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-2);
}

.shot-img,
.shot-frame img {
  display: block;
  width: 100%;
  height: auto;
}

.shot-cap {
  margin-top: 12px;
  text-align: center;
  color: var(--ink-3);
  font-weight: 400;
}

/* ---- 区块头 ---- */

.sec-head {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 22px;
  padding-left: 16px;
}

/* 蓝色竖条装饰：全站区块的统一签名 */
.sec-head::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.18em;
  width: 5px;
  height: 1.15em;
  border-radius: 2px;
  background: var(--accent);
}

.sec-title {
  font-size: var(--fs-h2);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.sec-note {
  font-size: 13px;
  color: var(--ink-2);
}

.sec-more {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--accent-text);
  transition: color var(--dur) linear;
}

.sec-more:hover {
  color: var(--accent-strong);
}

/* ---- 功能一览（快速扫描） ---- */

.features {
  margin-top: 72px;
}

.feat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.feat-card {
  padding: 22px 24px 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--surface);
  transition:
    border-color var(--dur) linear,
    transform 300ms var(--ease-out),
    box-shadow 300ms var(--ease-out);
}

.feat-card:hover {
  border-color: var(--line-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-1);
}

.feat-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-s);
  background: var(--glow);
  color: var(--accent-text);
  font-size: 17px;
  margin-bottom: 14px;
}

.feat-name {
  font-size: 15.5px;
  font-weight: 700;
  margin-bottom: 6px;
}

.feat-text {
  font-size: 13px;
  line-height: 1.75;
  color: var(--ink-2);
}

/* ---- 功能详述（图文交替） ---- */

.deep {
  margin-top: 72px;
}

.deep-list {
  display: grid;
  gap: 20px;
}

.deep-row {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: 36px;
  align-items: center;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
}

.deep-row.flip .deep-shot {
  order: 2;
}

.deep-shot .shot-frame img {
  width: 100%;
  max-width: 460px;
  transition: transform 600ms var(--ease-out);
}

.deep-shot .shot-frame:hover img {
  transform: scale(1.015);
}

.deep-copy .kicker {
  color: var(--accent-text);
  margin-bottom: 12px;
}

.deep-title {
  font-size: var(--fs-h3);
  font-weight: 700;
  margin-bottom: 12px;
}

.deep-text {
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--ink-2);
  max-width: 42em;
}

/* ---- 快速开始（图文左右） ---- */

.detail {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: 44px;
  align-items: center;
  margin-top: 72px;
}

.detail-shot .shot-frame img {
  width: 100%;
  max-width: 420px;
}

.detail-copy .kicker {
  color: var(--accent-text);
  margin-bottom: 12px;
}

.detail-text {
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--ink-2);
  max-width: 46em;
  margin-top: 14px;
}

.detail-points {
  margin-top: 18px;
  display: grid;
  gap: 9px;
}

.detail-points li {
  position: relative;
  padding-left: 18px;
  font-size: 13.5px;
  color: var(--ink-2);
}

.detail-points li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.62em;
  width: 7px;
  height: 7px;
  border-radius: 2px;
  background: var(--accent-text);
}

/* ---- 内置工具（LED 屏式自动横向滚动） ---- */

.tools {
  margin-top: 72px;
}

.tool-rail-wrap {
  overflow: hidden;
  /* 两端渐隐，强调"屏幕"感 */
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 24px,
    #000 calc(100% - 24px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 24px,
    #000 calc(100% - 24px),
    transparent 100%
  );
}

.tool-rail {
  display: flex;
  gap: 12px;
  width: max-content;
  padding-bottom: 2px;
  /* 双份内容 + 位移半宽实现无缝循环；-6px 补两份衔接处的 gap 差 */
  animation: tool-marquee 48s linear infinite;
}

/* 悬停暂停，便于看清内容 */
.tool-rail-wrap:hover .tool-rail {
  animation-play-state: paused;
}

@keyframes tool-marquee {
  to {
    transform: translateX(calc(-50% - 6px));
  }
}

/* 降级：关闭自动滚动，退回可手动横向滑动 */
@media (prefers-reduced-motion: reduce) {
  .tool-rail {
    animation: none;
  }

  .tool-rail-wrap {
    overflow-x: auto;
  }
}

.tool-card {
  flex: 0 0 auto;
  width: 200px;
  padding: 16px 18px 15px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--surface);
  transition:
    border-color var(--dur) linear,
    transform 300ms var(--ease-out),
    box-shadow 300ms var(--ease-out);
}

.tool-card:hover {
  border-color: var(--line-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-1);
}

.tool-cat {
  color: var(--ink-3);
  font-weight: 400;
  margin-bottom: 8px;
}

.tool-name {
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.tool-desc {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.65;
  color: var(--ink-2);
}

/* ---- 版本记录摘要 ---- */

.recent {
  margin-top: 72px;
}

.rel-list {
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
  overflow: hidden;
}

.rel-item {
  display: grid;
  grid-template-columns: 96px 190px 104px minmax(0, 1fr);
  gap: 18px;
  padding: 16px 24px;
  align-items: baseline;
}

.rel-item + .rel-item {
  border-top: 1px solid var(--line);
}

.rel-item:hover {
  background: var(--surface-2);
}

.rel-item .d {
  font-size: 12.5px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.rel-item .v {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.rel-item .s {
  font-size: 13px;
  color: var(--ink-2);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rel-state {
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
  padding: 20px 24px;
  font-size: 13px;
  color: var(--ink-2);
}

.chan {
  display: inline-block;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 1px 10px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--ink-2);
}

.chan.preview {
  color: var(--accent-text);
  border-color: var(--accent-text);
}

/* ---- 底部行动区 ---- */

.cta {
  margin-top: 80px;
  padding: 44px 32px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
  text-align: center;
}

.cta-title {
  font-size: var(--fs-h2);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 24px;
}

.cta-btns {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ---- 响应式 ---- */

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-top: 48px;
  }

  .hero-brand img {
    width: 148px;
    height: 148px;
    border-radius: 36px;
  }

  .feat-grid {
    grid-template-columns: 1fr 1fr;
  }

  .deep-row,
  .detail {
    grid-template-columns: 1fr;
    gap: 22px;
  }

  .deep-row.flip .deep-shot {
    order: 0;
  }

  .deep-shot .shot-frame img,
  .detail-shot .shot-frame img {
    max-width: 100%;
  }

  .rel-item {
    grid-template-columns: 1fr;
    gap: 5px;
    padding: 14px 18px;
  }

  .rel-item .s {
    white-space: normal;
  }
}

@media (max-width: 620px) {
  .feat-grid {
    grid-template-columns: 1fr;
  }

  .hl {
    padding: 0 10px;
    border-radius: 8px;
  }

  .cta {
    padding: 32px 20px;
  }
}
</style>
