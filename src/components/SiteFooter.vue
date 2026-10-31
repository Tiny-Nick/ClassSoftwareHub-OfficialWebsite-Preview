<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { copy } from '../content/copy'
import { publicUrl } from '../utils/assets'

const WEB_URL = 'https://classsoftwarehub.us.ci'
const DESKTOP_URL = 'https://github.com/c1201y/ClassSoftwareHub-Desktop/releases'
const REPO_URL = 'https://github.com/c1201y/ClassSoftwareHub'
</script>

<template>
  <footer class="site-foot">
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand">
          <img
            class="foot-ico"
            :src="publicUrl('/brand/app-icon.png')"
            alt=""
            width="20"
            height="20"
          />
          <p class="foot-name">{{ copy.app.name }}</p>
          <p class="foot-sub">{{ copy.app.subtitle }}</p>
        </div>

        <nav class="foot-col" aria-label="页内导航">
          <p class="micro col-head">站内</p>
          <RouterLink :to="{ name: 'home' }" class="flnk">首页</RouterLink>
          <RouterLink :to="{ name: 'download' }" class="flnk">下载</RouterLink>
          <RouterLink :to="{ name: 'docs' }" class="flnk">文档</RouterLink>
          <RouterLink :to="{ name: 'changelog' }" class="flnk">更新日志</RouterLink>
        </nav>

        <nav class="foot-col" aria-label="出口链接">
          <p class="micro col-head">出口</p>
          <a class="flnk" :href="WEB_URL" rel="noopener">网页版 ↗</a>
          <a class="flnk" :href="DESKTOP_URL" rel="noopener">桌面版安装包 ↗</a>
          <a class="flnk" :href="REPO_URL" rel="noopener">源码仓库 ↗</a>
        </nav>

        <div class="foot-col foot-license">
          <p class="micro col-head">许可</p>
          <p class="ftext">{{ copy.footer.license }}</p>
          <p class="ftext">{{ copy.footer.notice }}</p>
        </div>
      </div>

      <p class="foot-sign micro">© 2026 c1201y · {{ copy.app.name }} · {{ copy.app.meta }}</p>
    </div>
  </footer>
</template>

<style scoped>
.site-foot {
  background: var(--paper);
  border-top: 1px solid var(--line);
  margin-top: 88px;
  padding: 44px 0 32px;
}

.foot-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.6fr;
  gap: 32px;
}

.foot-ico {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: block;
  margin-bottom: 14px;
}

.foot-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.foot-sub {
  font-size: 12px;
  color: var(--ink-2);
  margin-top: 4px;
}

.col-head {
  color: var(--ink);
  margin-bottom: 10px;
}

.flnk {
  display: block;
  font-size: 13px;
  color: var(--ink-2);
  padding: 4px 0;
  transition: color var(--dur) linear;
}

.flnk:hover {
  color: var(--accent-text);
}

.ftext {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--ink-2);
}

.ftext + .ftext {
  margin-top: 8px;
}

.foot-sign {
  margin-top: 36px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  color: var(--ink-3);
  font-weight: 400;
}

@media (max-width: 860px) {
  .foot-grid {
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }
}

@media (max-width: 480px) {
  .foot-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
