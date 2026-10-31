# ClassSoftwareHub 官网 — 项目长期记忆

## 项目形态
- Vue 3.5 + Vite 8 + vue-router（hash 模式）+ TS，GPL-3.0-only，产物在 `dist/`。
- 五条路由：`/` 首页、`/#/download` 下载、`/#/github` GitHub、`/#/docs` 文档（骨架）、`/#/changelog` 更新日志；其余回退首页。
- 全站文案集中在 `src/content/copy.ts`（改文字只改这里，不动 key）；版本记录由 GitHub API 在 `ChangelogView.vue` 实时拉取。`products.ts` 与 `useTheme.ts` 已删除。
- 三个真实出口：网页版 `classsoftwarehub.us.ci`（注意：文档站称主站为 `classsoftwarehub.cn`，备用 `classsoftwarehub.132614.xyz` / `xfane.com`，两者关系待用户确认）、桌面版 GitHub Releases、源码仓库 `github.com/c1201y/ClassSoftwareHub`。
- **文档站**（`c1201y/classsoftwarehub-docs`，VuePress + plume 主题，线上 `https://docs.classsoftwarehub.cn/`）：概览/使用文档/开发文档/FAQ/下载/团队，中英双语。官网 `/#/docs` 目前是空骨架，待决策接入方式（整页跳转/站内目录深链/iframe）。
- **产品四形态**（文档站权威表述）：网页端 `ClassSoftwareHub`（Vue3+Vite）/ 桌面端 `ClassSoftwareHub-Desktop`（WinUI3+.NET10，底线 Win10 1809）/ Win7 兼容版 `ClassSoftwareHub-windows7`（Avalonia 11.2.8+.NET6，底线 Win7 SP1，安装版+便携版，独立发布线）/ 后端 `csh-api`（EdgeOne Pages+阿里云 OSS）。
- QQ 群 487903798（文档站与桌面 Assets 均有，官网尚未露出）。

## 设计系统（2026-10-25 定为白色产品风；主题切换整体废除，勿再加回）
- **只有白色**：底 `#ffffff` / 卡面 `#ffffff`·`#f3f5f8` / 边线 `#e6eaf0`·强 `#cbd3dd` / 文字 `#1b2430`·次 `#5c6675`·三 `#8b95a4`。
- 强调色 `#AFC4D9`（用户指定，浅蓝品牌色）：只用于填充 / 边框 / 高亮背景；**白底上作文字时改用派生深蓝 `--accent-text #3f637f`** 保证对比度。无 `light/dark` 分支。
- 层级靠 1px 边线；圆角 6/10/14px；**禁用渐变、发光、玻璃拟态、渐变文字、大面积软阴影**。
- 站点定位是**产品落地页**（对齐 ClassIsland/ICC-CE/Class Widgets/Light:C）：Hero 关键词高亮 + 胶囊 CTA + 右侧 AppIcon；"软件清单"概念词**已废除**（用户："用户知道什么是软件清单吗"）。
- 图标：`.wicon` 用 Segoe Fluent Icons / Segoe MDL2 Assets 字形（apps E71D、ai E99A、download E896、clean E90F、class E787 日历、shield E72E）；GitHub 标志内联 SVG（fill=currentColor）；品牌图 `public/brand/app-icon.png`（来自桌面仓库 AppIcon-512.png）。

## 内容硬规则（用户 2026-10-25 明确）
- **文案一律不写死会变动的数量**：软件库款数、分类数、工具数等随版本增长，绝不写"127 款""七个分类"之类；用"按分类整理""课堂常用软件"等定性表述。要展示实时数量应从数据源动态取，不在静态文案硬编码。
- **版本号同样不写死**：桌面端版本（dv1.x 体系，与站点无关）从 GitHub Releases API 动态取——DownloadView 拉 desktop repo releases，正式版=最新非 prerelease、预览版=最新 prerelease，按钮直链对应 release；ChangelogView 同样动态拉取。页脚/hero 不放具体版本号（曾误写"站点 v2.4.0"被用户质疑，已删）。
- 文案书面化；具体、有实处，不用空泛营销词。

## 真实截图（最重要的"硬料"）
- 命名 `public/shots/shot-*.png`，来自桌面端实机截图（用户自己截的 10 张，1920×1020）：`shot-software` 软件下载页、`shot-download-detail` 详情页、`shot-ai` Hub AI、`shot-graph` 函数绘图、`shot-disk` 磁盘分析、`shot-appdata` AppData 管理、`shot-layout` 侧边布局、`shot-sidebar` 侧边栏、`shot-feedback` 反馈中心、`shot-app-home` 首页。
- 桌面端窗口可用 PowerShell `PrintWindow` + `PW_RENDERFULLCONTENT` 标志抓取（flag=2 能渲出 WinUI；flag=0 全白）。

## 验证方式
- `npm run check`（type-check + build）。
- 无头核对：dev 服务（端口以 Vite 实际分配为准，5180/5181 均可能，5173/5181 可能被占报 502）起好后，`audit.cjs` 一次审计三页：首页（无数量/口语词）、更新日志（等 `.cl-item`：列表条数/默认选中/显示更多）、下载页（`.dl-row-name` 动态版本号）；`.verify/home-shot.cjs` 截首页全页、`cl-shot.cjs` 截更新日志首屏；参考站截图 `ref-shoot.cjs` 落 `.verify/refs/`。
- **当前模型不可读图**，故截图后用 `audit.cjs` 做 DOM 文本断言替代肉眼核对；视觉最终以用户浏览器自看为准。
