<script setup lang="ts">
import { copy } from '../content/copy'
import { publicUrl } from '../utils/assets'
</script>

<template>
  <section class="page">
    <header class="page-head" v-reveal>
      <h1 class="page-title">{{ copy.github.title }}</h1>
      <p class="page-lede">{{ copy.github.lede }}</p>
    </header>

    <!-- 列表形式：每行一个仓库，产品仓库沿用各自标志，其余用 GitHub 标志 -->
    <ul class="repo-list" :aria-label="copy.github.reposTitle" v-reveal>
      <li v-for="repo in copy.github.repos" :key="repo.url" class="repo-row">
        <a class="repo-link" :href="repo.url" rel="noopener">
          <span class="repo-mark" aria-hidden="true">
            <img
              v-if="repo.icon === 'desktop'"
              class="repo-mark-img"
              :src="publicUrl('/brand/app-icon.png')"
              alt=""
              width="36"
              height="36"
            />
            <svg v-else-if="repo.icon === 'win7'" viewBox="0 0 48 48">
              <path fill="#4CB5E8" d="M9 5h13a4 4 0 0 1 4 4v11H5V9a4 4 0 0 1 4-4z" />
              <path fill="#1E6FBF" d="M26 5h13a4 4 0 0 1 4 4v11H26V5z" />
              <path fill="#1E6FBF" d="M9 27h17v16H9a4 4 0 0 1-4-4V27z" />
              <path fill="#4CB5E8" d="M26 27h17v16h-13a4 4 0 0 1-4-4V27z" />
              <path
                d="M3.5 24.5q5.5-4 11 0t11 0t11 0t11 0M24.5 3.5q-4 5.5 0 11t0 11t0 11t0 11"
                stroke="#ffffff"
                stroke-width="3.5"
                fill="none"
              />
            </svg>
            <svg v-else-if="repo.icon === 'android'" viewBox="0 0 24 24">
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
            <span v-else-if="repo.icon === 'web'" class="wicon repo-mark-glyph">&#xE774;</span>
            <svg v-else viewBox="0 0 16 16">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
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
          <span v-if="jump.icon === 'download'" class="wicon jump-ico" aria-hidden="true">&#xE896;</span>
          <svg
            v-else-if="jump.icon === 'win7'"
            class="jump-ico jump-ico-win7"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <!-- Win7 风格四格窗标：蓝色系四块 + 白色波浪分隔 -->
            <path fill="#4CB5E8" d="M9 5h13a4 4 0 0 1 4 4v11H5V9a4 4 0 0 1 4-4z" />
            <path fill="#1E6FBF" d="M26 5h13a4 4 0 0 1 4 4v11H26V5z" />
            <path fill="#1E6FBF" d="M9 27h17v16H9a4 4 0 0 1-4-4V27z" />
            <path fill="#4CB5E8" d="M26 27h17v16h-13a4 4 0 0 1-4-4V27z" />
            <path
              d="M3.5 24.5q5.5-4 11 0t11 0t11 0t11 0M24.5 3.5q-4 5.5 0 11t0 11t0 11t0 11"
              stroke="#ffffff"
              stroke-width="3.5"
              fill="none"
            />
          </svg>
          <span v-else-if="jump.icon === 'web'" class="wicon jump-ico" aria-hidden="true">&#xE774;</span>
          <svg v-else-if="jump.icon === 'github'" class="jump-ico" viewBox="0 0 16 16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
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

.repo-mark {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-s);
  background: var(--glow);
  color: var(--accent-text);
}

.repo-mark > svg {
  width: 20px;
  height: 20px;
}

.repo-mark-img {
  border-radius: var(--radius-s);
  border: 1px solid var(--line);
  background: var(--surface-2);
}

.repo-mark-glyph {
  font-size: 19px;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--ink-2);
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
