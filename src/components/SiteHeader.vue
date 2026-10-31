<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { copy } from '../content/copy'
import { docsTheme, themeToggleLabel, toggleDocsTheme } from '../composables/useDocsTheme'
import { publicUrl } from '../utils/assets'

/* 滚动反馈：离开页面顶部时为页头加一层轻阴影，与内容区分层 */
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 8
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

/* 文档阅读页：页头右侧提供「返回文档首页」与主题切换，不在正文上方另起工具行 */
const route = useRoute()
const isDocsReader = computed(() => route.path.startsWith('/docs') && !!route.params.doc)
</script>

<template>
  <header class="site-head" :class="{ scrolled }">
    <div class="wrap head-row">
      <RouterLink :to="{ name: 'home' }" class="mark">
        <img
          class="mark-ico"
          :src="publicUrl('/brand/app-icon.png')"
          alt=""
          width="26"
          height="26"
        />
        <span class="mark-name">{{ copy.app.name }}</span>
        <span class="mark-sub">{{ copy.app.subtitle }}</span>
      </RouterLink>

      <nav class="nav" aria-label="主导航">
        <RouterLink :to="{ name: 'home' }" class="lnk">{{ copy.nav.home }}</RouterLink>
        <RouterLink :to="{ name: 'download' }" class="lnk">{{ copy.nav.download }}</RouterLink>
        <RouterLink :to="{ name: 'github' }" class="lnk">{{ copy.nav.github }}</RouterLink>
        <RouterLink :to="{ name: 'docs' }" class="lnk">{{ copy.nav.docs }}</RouterLink>
        <RouterLink :to="{ name: 'changelog' }" class="lnk">{{ copy.nav.changelog }}</RouterLink>
        <template v-if="isDocsReader">
          <span class="nav-sep" aria-hidden="true"></span>
          <RouterLink :to="{ name: 'docs' }" class="head-back">
            <span class="back-arr" aria-hidden="true">←</span>{{ copy.docs.backToDocsHome }}
          </RouterLink>
          <button class="head-theme" type="button" @click="toggleDocsTheme()">
            {{ themeToggleLabel(docsTheme) }}
          </button>
        </template>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-head {
  border-bottom: 1px solid var(--line);
  background: var(--paper);
  position: sticky;
  top: 0;
  z-index: 20;
  transition: box-shadow var(--dur-fast) var(--ease-out);
}

.site-head.scrolled {
  box-shadow: var(--shadow-1);
}

.head-row {
  display: flex;
  align-items: center;
  gap: 28px;
  padding-top: 12px;
  padding-bottom: 12px;
}

.mark {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mark-ico {
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border-radius: 6px;
  display: block;
}

.mark-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.mark-sub {
  font-size: 12px;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.lnk {
  font-size: 13.5px;
  color: var(--ink-2);
  padding: 6px 12px;
  border-radius: var(--radius-s);
  white-space: nowrap;
  transition:
    color var(--dur) linear,
    background-color var(--dur) linear;
}

.lnk:hover {
  color: var(--ink);
  background: var(--surface-2);
}

.lnk.on {
  color: var(--ink);
  font-weight: 600;
  background: var(--surface-2);
}

/* 文档阅读页专属控件（返回 + 主题切换） */

.nav-sep {
  width: 1px;
  height: 18px;
  background: var(--line);
  margin: 0 6px;
  flex: 0 0 1px;
}

.head-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-text);
  padding: 6px 10px;
  border-radius: var(--radius-s);
  white-space: nowrap;
  transition:
    color var(--dur) linear,
    background-color var(--dur) linear;
}

.head-back:hover {
  color: var(--accent-strong);
  background: var(--surface-2);
}

.back-arr {
  transition: transform var(--dur) linear;
}

.head-back:hover .back-arr {
  transform: translateX(-3px);
}

.head-theme {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
  padding: 5px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface);
  white-space: nowrap;
  transition:
    border-color var(--dur) linear,
    color var(--dur) linear,
    background-color var(--dur) linear;
}

.head-theme:hover {
  border-color: var(--accent-text);
  color: var(--ink);
  background: var(--surface-2);
}

@media (max-width: 720px) {
  .head-row {
    flex-wrap: wrap;
    gap: 8px 18px;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .mark-sub {
    display: none;
  }

  .nav {
    order: 3;
    width: 100%;
    margin-left: -10px;
    gap: 0;
  }

  .lnk {
    padding: 6px 10px;
    font-size: 13px;
  }
}
</style>
