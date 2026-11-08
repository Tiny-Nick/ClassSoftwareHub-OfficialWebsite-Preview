<script setup lang="ts">
import { copy } from '../content/copy'
import { publicUrl } from '../utils/assets'

/* 仓库图标统一资源：三个系统仓库复用下载页的平台标志，文档仓库使用提供的文档图标，
   其余为同规格线框图标。全部置于同一尺寸的容器内，避免出现大小与风格不一的图标。 */
const ICONS: Record<string, string> = {
  web: '/brand/repo-web.svg',
  desktop: '/brand/platform-windows.svg',
  win7: '/brand/platform-win7.png',
  android: '/brand/platform-android.png',
  docs: '/brand/repo-docs.png',
  api: '/brand/repo-api.svg',
  site: '/brand/repo-site.svg',
  github: '/brand/repo-github.svg',
  download: '/brand/repo-download.svg',
}

function iconUrl(key: string): string {
  return publicUrl(ICONS[key] ?? ICONS.github)
}
</script>

<template>
  <section class="page">
    <header class="page-head" v-reveal>
      <h1 class="page-title">{{ copy.github.title }}</h1>
      <p class="page-lede">{{ copy.github.lede }}</p>
    </header>

    <!-- 列表形式：每行一个仓库，图标按仓库类型对应 -->
    <ul class="repo-list" :aria-label="copy.github.reposTitle" v-reveal>
      <li v-for="repo in copy.github.repos" :key="repo.url" class="repo-row">
        <a class="repo-link" :href="repo.url" rel="noopener">
          <span class="repo-mark" aria-hidden="true">
            <img class="repo-mark-img" :src="iconUrl(repo.icon)" alt="" width="32" height="32" />
          </span>

          <span class="repo-text">
            <span class="repo-name">{{ repo.name }}</span>
            <span class="repo-desc">{{ repo.desc }}</span>
          </span>
          <span class="repo-owner">{{ repo.owner }}</span>
          <span class="repo-go" aria-hidden="true">↗</span>
        </a>
      </li>
    </ul>

    <h2 class="sec-sub">{{ copy.github.jumpsTitle }}</h2>
    <ul class="jump-row">
      <li v-for="jump in copy.github.jumps" :key="jump.label">
        <a class="jump-chip" :href="jump.url" rel="noopener">
          <img class="jump-ico" :src="iconUrl(jump.icon)" alt="" width="16" height="16" aria-hidden="true" />
          {{ jump.label }}<span class="arr" aria-hidden="true">↗</span>
        </a>
      </li>
    </ul>

    <h2 class="sec-sub">{{ copy.github.contributeTitle }}</h2>
    <ul class="c-grid">
      <li v-for="item in copy.github.contribute" :key="item.title" class="c-card">
        <h3 class="c-name">{{ item.title }}</h3>
        <p class="c-text">{{ item.text }}</p>
      </li>
    </ul>
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

/* ---- 仓库列表：单列，每行一个仓库 ---- */

.repo-list {
  display: grid;
  gap: 8px;
  margin-top: 36px;
}

.repo-row {
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--surface);
  transition:
    border-color var(--dur) linear,
    background-color var(--dur) linear;
}

.repo-row:hover {
  border-color: var(--line-strong);
  background: var(--surface-2);
}

.repo-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
}

/* 统一徽章容器：白底 1px 边线，所有图标按同一尺寸居中 */
.repo-mark {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
  background: var(--surface);
}

.repo-mark-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.repo-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.repo-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-desc {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ink-2);
}

.repo-owner {
  flex: 0 0 auto;
  font-size: 11.5px;
  color: var(--ink-3);
  padding: 3px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  white-space: nowrap;
}

.repo-go {
  flex: 0 0 auto;
  color: var(--ink-3);
  transition:
    color var(--dur) linear,
    transform var(--dur) linear;
}

.repo-row:hover .repo-go {
  color: var(--accent-text);
  transform: translate(2px, -2px);
}

.jump-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.jump-chip {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  padding: 9px 18px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface);
  transition:
    border-color var(--dur) linear,
    background-color var(--dur) linear;
}

.jump-chip:hover {
  border-color: var(--accent-text);
  background: var(--surface-2);
}

.jump-ico {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  object-fit: contain;
}

.jump-chip .arr {
  color: var(--ink-3);
  font-weight: 400;
  transition: transform var(--dur) linear;
}

.jump-chip:hover .arr {
  transform: translate(2px, -2px);
}

.sec-sub {
  font-size: var(--fs-h2);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-top: 64px;
  margin-bottom: 22px;
}

.c-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.c-card {
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: var(--radius-m);
  background: var(--surface);
}

.c-name {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
}

.c-text {
  font-size: 13px;
  line-height: 1.75;
  color: var(--ink-2);
}

@media (max-width: 860px) {
  .page {
    padding-top: 44px;
  }

  .repo-link {
    flex-wrap: wrap;
    gap: 10px 14px;
  }

  .repo-text {
    flex-basis: calc(100% - 50px);
  }

  .repo-owner {
    margin-left: 50px;
  }

  .c-grid {
    grid-template-columns: 1fr;
  }
}
</style>
