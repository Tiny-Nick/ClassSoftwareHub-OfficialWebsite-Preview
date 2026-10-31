import { ref } from 'vue'

export type DocsTheme = 'light' | 'dark'

const STORAGE_KEY = 'csh-docs-theme'

/* 默认跟随系统；用户手动切换后记忆选择。模块级单例，入口页与阅读页共享。 */
function initial(): DocsTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {
    // 隐私模式或存储被禁用时回退浅色
  }
  return 'light'
}

export const docsTheme = ref<DocsTheme>(initial())

export function toggleDocsTheme(): void {
  docsTheme.value = docsTheme.value === 'light' ? 'dark' : 'light'
  try {
    localStorage.setItem(STORAGE_KEY, docsTheme.value)
  } catch {
    // 存储不可用时仅本次会话生效
  }
}

export function themeToggleLabel(theme: DocsTheme): string {
  return theme === 'light' ? '深色模式' : '浅色模式'
}
