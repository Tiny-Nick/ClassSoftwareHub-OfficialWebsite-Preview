import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import './styles/tokens.css'

/* v-reveal：元素进入视口时加 .in，触发一次编排好的入场。
   初始隐藏态由 CSS .reveal 提供，这里只负责观察与摘取；
   reduced-motion 或无 IntersectionObserver 时直接显示，不做降级等待。 */
function createRevealObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null
  return new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          observer.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  )
}

const app = createApp(App)
app.use(router)

app.directive('reveal', {
  mounted(el: HTMLElement) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = reduce ? null : createRevealObserver()
    if (!io) {
      el.classList.add('in')
      return
    }
    el.classList.add('reveal')
    io.observe(el)
    ;(el as unknown as { _revealIo?: IntersectionObserver })._revealIo = io
  },
  unmounted(el: HTMLElement) {
    ;(el as unknown as { _revealIo?: IntersectionObserver })._revealIo?.disconnect()
  },
})

app.mount('#app')
