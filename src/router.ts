import { createRouter, createWebHashHistory } from 'vue-router'

import ChangelogView from './views/ChangelogView.vue'
import DocsView from './views/DocsView.vue'
import DownloadView from './views/DownloadView.vue'
import GithubView from './views/GithubView.vue'
import HomeView from './views/HomeView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/download', name: 'download', component: DownloadView },
    { path: '/github', name: 'github', component: GithubView },
    /* 文档：单条路由，无参数时 DocsView 内渲染入口页（:doc* 会吞掉 /docs 静态路径） */
    { path: '/docs/:doc*', name: 'docs', component: DocsView },
    { path: '/changelog', name: 'changelog', component: ChangelogView },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
