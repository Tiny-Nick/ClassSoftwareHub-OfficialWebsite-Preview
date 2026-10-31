<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import { docsTheme } from './composables/useDocsTheme'

const route = useRoute()

/* 阅读页（带文档参数）用全宽三栏，不用全站 1120 页宽；入口页仍用 wrap */
const isReader = computed(() => route.path.startsWith('/docs') && !!route.params.doc)

/* 文档域主题：仅阅读页挂载 html[data-docs-theme]，令牌覆盖见 tokens.css；
   入口页与全站其余页面不挂载，保持白色。 */
function applyDocsScope() {
  const root = document.documentElement
  if (isReader.value) {
    root.dataset.docsTheme = docsTheme.value
  } else {
    delete root.dataset.docsTheme
  }
}

watch([() => route.path, docsTheme], applyDocsScope, { immediate: true })
</script>

<template>
  <SiteHeader />
  <main class="stage" :class="isReader ? 'full' : 'wrap'">
    <RouterView />
  </main>
  <SiteFooter />
</template>

<style scoped>
.stage.full {
  max-width: none;
  padding: 0 var(--gutter);
}
</style>
