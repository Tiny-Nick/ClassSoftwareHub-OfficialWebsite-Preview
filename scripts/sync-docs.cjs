/* 同步文档仓库（c1201y/classsoftwarehub-docs）的使用向 md 到 src/content/docs/。
   用法：node .verify/sync-docs.mjs
   依赖：curl + tar（Git Bash 环境自带）；需能访问 codeload.github.com。
   说明：官网文档为快照模式，内容更新后重跑本脚本即可刷新。 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const TMP = path.join(ROOT, '.docs-tmp')
const OUT = path.join(ROOT, 'src', 'content', 'docs')
const TARBALL =
  'https://codeload.github.com/c1201y/classsoftwarehub-docs/tar.gz/refs/heads/main'

/* 与 copy.ts docs.groups 的 key 一一对应（保留仓库内相对路径，便于拼 GitHub 链接） */
const FILES = [
  /* 入门 */
  'doc/overview.md',
  /* 使用文档 */
  'doc/guide/web.md',
  'doc/guide/desktop.md',
  'doc/guide/win7.md',
  'doc/guide/win10.md',
  /* 常见问题 */
  'doc/guide/faq.md',
  'faq/basic-settings.md',
  'faq/ipc-url-faq.md',
  'faq/startup-issues.md',
  /* 维护与排错 */
  'doc/guide/admin.md',
  'doc/guide/troubleshooting.md',
  /* 下载 */
  'download.md',
  /* 附录 */
  'doc/appendix/api.md',
  'doc/appendix/config.md',
  'doc/appendix/glossary.md',
  'doc/appendix/models.md',
  'doc/appendix/scripts.md',
  /* 开发文档 */
  'dev/index.md',
  'dev/architecture.md',
  'dev/api.md',
  'dev/build.md',
  'dev/cicd.md',
  'dev/config.md',
  'dev/contribute.md',
  'dev/desktop.md',
  'dev/requirements.md',
  'dev/security.md',
  'dev/stack.md',
  'dev/web.md',
  'dev/win7.md',
  /* 项目 */
  'team.md',
  'friends.md',
]

function sh(cmd) {
  return execSync(cmd, { stdio: 'pipe' }).toString()
}

/* 清理可能被环境删除保护拦截，失败时忽略（tar 解包会覆盖旧文件） */
function safeRm(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true })
  } catch {
    /* noop */
  }
}

function stripFrontmatter(src) {
  return src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
}

safeRm(TMP)
fs.mkdirSync(TMP, { recursive: true })

const tar = path.join(TMP, 'docs.tar.gz').replace(/\\/g, '/')
sh(`curl -sL --retry 3 --max-time 120 "${TARBALL}" -o "${tar}"`)
/* 在 TMP 目录里用相对路径解包：Windows 自带 bsdtar 会把 -C 的盘符当成远程主机 */
execSync('tar -xzf docs.tar.gz --strip-components=1', { cwd: TMP, stdio: 'pipe' })

let count = 0
for (const rel of FILES) {
  const src = path.join(TMP, 'docs', rel)
  if (!fs.existsSync(src)) {
    console.error('缺失:', rel)
    process.exitCode = 1
    continue
  }
  /* 保留 frontmatter（title/createTime 供阅读页展示元信息），渲染时由 renderDoc 剥离 */
  const body = fs.readFileSync(src, 'utf-8')
  const dest = path.join(OUT, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, body.trimStart(), 'utf-8')
  console.log('同步:', rel, `(${body.length} 字符)`)
  count++
}

safeRm(TMP)
console.log(`完成：${count}/${FILES.length} 篇`)
