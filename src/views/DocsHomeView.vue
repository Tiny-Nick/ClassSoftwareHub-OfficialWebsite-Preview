<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { copy } from '../content/copy'

/* 组卡点击进入该组第一篇 */
function firstKey(items: { key: string }[]): string {
  return items[0]?.key ?? 'overview'
}
</script>

<template>
  <section class="docs-home">
    <!-- Hero -->
    <div class="hero" v-reveal>
      <div class="hero-copy">
        <h1 class="hero-title">
          {{ copy.docs.hero.titlePre }}<span class="hl">{{ copy.docs.hero.titleHl }}</span>
        </h1>
        <p class="hero-lede">{{ copy.docs.hero.lede }}</p>
        <div class="hero-cta">
          <RouterLink :to="{ name: 'docs', params: { doc: 'overview' } }" class="btn-solid">
            {{ copy.docs.hero.startAction }}<span class="arr" aria-hidden="true">→</span>
          </RouterLink>
          <a class="btn-ghost" :href="copy.hero.webUrl" rel="noopener">
            {{ copy.docs.hero.webAction }}<span class="arr" aria-hidden="true">↗</span>
          </a>
          <a class="btn-ghost" :href="copy.hero.repoUrl" rel="noopener">
            {{ copy.docs.hero.githubAction }}<span class="arr" aria-hidden="true">↗</span>
          </a>
        </div>
        <p class="hero-meta">32 篇文档 · 内容同步自文档仓库 · GPL-3.0-only</p>
      </div>
      <div class="hero-brand">
        <img src="/brand/app-icon.png" alt="ClassSoftwareHub 应用图标" width="216" height="216" />
      </div>
    </div>

    <!-- 欢迎语 -->
    <p class="welcome" v-reveal>{{ copy.docs.welcome }}</p>

    <!-- 开始使用 -->
    <section class="block" v-reveal>
      <h2 class="block-title">{{ copy.docs.quickStart.title }}</h2>
      <ul class="quick-grid">
        <li v-for="item in copy.docs.quickStart.items" :key="item.key">
          <RouterLink class="quick-card" :to="{ name: 'docs', params: { doc: item.key } }">
            <h3 class="quick-name">{{ item.label }}</h3>
            <p class="quick-desc">{{ item.desc }}</p>
          </RouterLink>
        </li>
      </ul>
    </section>

    <!-- 目录：分组卡片 -->
    <section class="block" v-reveal>
      <h2 class="block-title">{{ copy.docs.catalogTitle }}</h2>
      <p class="block-note">{{ copy.docs.catalogNote }}</p>
      <ul class="catalog-grid">
        <li v-for="group in copy.docs.groups" :key="group.label">
          <RouterLink
            class="catalog-card"
            :to="{ name: 'docs', params: { doc: firstKey(group.items) } }"
          >
            <header class="catalog-head">
              <h3 class="catalog-name">{{ group.label }}</h3>
              <span class="catalog-count">{{ group.items.length }} 篇</span>
            </header>
            <p class="catalog-desc">{{ group.desc }}</p>
          </RouterLink>
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.docs-home {
  padding: 72px 0 0;
}

/* ---- Hero ---- */

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) auto;
  gap: 40px;
  align-items: center;
}

.hero-title {
  font-size: clamp(44px, 6vw, 64px);
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

.hero-meta {
  margin-top: 20px;
  font-size: 12.5px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
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

.welcome {
  margin-top: 56px;
  font-size: 15px;
  line-height: 1.85;
  color: var(--ink-2);
  max-width: 46em;
}

/* ---- 区块 ---- */

.block {
  margin-top: 56px;
}

.block-title {
  position: relative;
  font-size: var(--fs-h2);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 8px;
  padding-left: 16px;
}

/* 蓝色竖条签名（与全站区块头一致） */
.block-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.18em;
  width: 5px;
  height: 1.15em;
  border-radius: 2px;
  background: var(--accent);
}

.block-note {
  font-size: 13px;
  color: var(--ink-3);
  margin-bottom: 18px;
  padding-left: 16px;
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
.btn-ghost .arr {
  transition: transform var(--dur) linear;
}

.btn-solid:hover .arr,
.btn-ghost:hover .arr {
  transform: translateX(3px);
}

/* ---- 卡片 ---- */

.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.quick-card {
  display: block;
  padding: 22px 24px 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
  transition:
    border-color var(--dur) linear,
    transform 300ms var(--ease-out),
    box-shadow 300ms var(--ease-out);
}

.quick-card:hover {
  border-color: var(--line-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-1);
}

.quick-name {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 6px;
}

.quick-desc {
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--ink-2);
}

.catalog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.catalog-card {
  display: block;
  height: 100%;
  padding: 20px 24px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  background: var(--surface);
  transition:
    border-color var(--dur) linear,
    transform 300ms var(--ease-out),
    box-shadow 300ms var(--ease-out);
}

.catalog-card:hover {
  border-color: var(--line-strong);
  transform: translateY(-2px);
  box-shadow: var(--shadow-1);
}

.catalog-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}

.catalog-name {
  font-size: 16px;
  font-weight: 700;
}

.catalog-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

.catalog-desc {
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--ink-2);
}

@media (max-width: 960px) {
  .docs-home {
    padding-top: 44px;
  }

  .hero {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .hero-brand img {
    width: 148px;
    height: 148px;
    border-radius: 36px;
  }

  .quick-grid,
  .catalog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
