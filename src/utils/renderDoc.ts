/* 文档 Markdown 渲染器。
   输入为 classsoftwarehub-docs 仓库同步来的 md 快照，需支持：
   frontmatter 剥离、围栏代码块、::: 提示容器、GFM 表格、
   标题/列表/分隔线/行内（图片、链接、粗体、行内代码）。
   安全策略：所有文本先 HTML 转义，再套本站生成的标签；
   源文档中的 HTML 标签整体剥离（代码块内容除外，代码块同样转义）。 */

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

const CALLOUT_TITLES: Record<string, string> = {
  tip: '提示',
  info: '说明',
  warning: '注意',
  danger: '警告',
  note: '备注',
}

export function renderDoc(src: string): string {
  /* 1. 剥 frontmatter（同步脚本已剥，双保险） */
  let text = src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')

  /* 2. 代码块占位：先整体转义存起来，避免被后续规则误伤 */
  const codeBlocks: string[] = []
  text = text.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (_m, lang: string, code: string) => {
    codeBlocks.push(`<pre><code>${esc(code.replace(/\r?\n$/, ''))}</code></pre>`)
    return `\u0000CB${codeBlocks.length - 1}\u0000`
  })

  /* 3. 剥离源文档 HTML 标签（锚点 span 等），防注入 */
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, '')

  /* 4. 逐行解析 */
  const out: string[] = []
  const lines = text.split(/\r?\n/)
  let i = 0

  const flushParagraph = (buf: string[]) => {
    if (buf.length) {
      out.push(`<p>${inline(esc(buf.join(' ')))}</p>`)
      buf = []
    }
    return buf
  }

  let para: string[] = []
  let callout: { type: string; title: string; buf: string[] } | null = null

  const closeCallout = () => {
    if (callout) {
      const inner = renderLines(callout.buf)
      const label = CALLOUT_TITLES[callout.type] ?? callout.type
      out.push(
        `<div class="callout callout-${esc(callout.type)}">` +
          `<p class="callout-title">${esc(label)}${callout.title ? ' · ' + esc(callout.title) : ''}</p>` +
          inner +
          '</div>',
      )
      callout = null
    }
  }

  /* 表格块：连续 | 行；第二行是分隔行则跳过 */
  const tryTable = (start: number): number | null => {
    if (!/^\|.*\|\s*$/.test(lines[start])) return null
    let end = start
    while (end < lines.length && /^\|.*\|\s*$/.test(lines[end])) end++
    const rows: string[][] = []
    for (let r = start; r < end; r++) {
      const cells = lines[r]
        .replace(/^\||\|\s*$/g, '')
        .split('|')
        .map((c) => c.trim())
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue
      rows.push(cells)
    }
    if (!rows.length) return null
    const [head, ...body] = rows
    const th = head.map((c) => `<th>${inline(esc(c))}</th>`).join('')
    const trs = body.map((r) => `<tr>${r.map((c) => `<td>${inline(esc(c))}</td>`).join('')}</tr>`).join('')
    out.push(`<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`)
    return end
  }

  while (i < lines.length) {
    const line = lines[i]

    /* 代码块占位行 */
    const cb = line.match(/^\u0000CB(\d+)\u0000$/)
    if (cb) {
      para = flushParagraph(para)
      closeCallout()
      out.push(codeBlocks[Number(cb[1])])
      i++
      continue
    }

    /* ::: 容器起止 */
    const open = line.match(/^:::\s*(\w+)\s*(.*)$/)
    if (open) {
      para = flushParagraph(para)
      callout = { type: open[1], title: open[2].trim(), buf: [] }
      i++
      continue
    }
    if (/^:::\s*$/.test(line)) {
      para = flushParagraph(para)
      closeCallout()
      i++
      continue
    }

    /* 表格 */
    const tableEnd = tryTable(i)
    if (tableEnd) {
      para = flushParagraph(para)
      if (callout) callout.buf.push(...lines.slice(i, tableEnd))
      i = tableEnd
      continue
    }

    /* 空行 */
    if (!line.trim()) {
      para = flushParagraph(para)
      i++
      continue
    }

    /* 分隔线 */
    if (/^-{3,}$/.test(line.trim())) {
      para = flushParagraph(para)
      out.push('<hr>')
      i++
      continue
    }

    /* 标题：源文档 # 为页内大标题，降一级渲染（页头已有文档名）；带锚点 id 供本页目录跳转 */
    const h = line.match(/^(#{1,5})\s+(.*)$/)
    if (h) {
      para = flushParagraph(para)
      const lvl = Math.min(h[1].length + 1, 6)
      const text = h[2].trim()
      const id =
        'sec-' +
        text
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
          .replace(/^-+|-+$/g, '')
      const html = `<h${lvl} id="${id}">${inline(esc(text))}</h${lvl}>`
      if (callout) callout.buf.push(line)
      else out.push(html)
      i++
      continue
    }

    /* 列表 */
    const li = line.match(/^\s*[-*]\s+(.*)$/)
    if (li) {
      para = flushParagraph(para)
      out.push(`<ul><li>${inline(esc(li[1].trim()))}</li></ul>`)
      i++
      continue
    }
    const oli = line.match(/^\s*\d+\.\s+(.*)$/)
    if (oli) {
      para = flushParagraph(para)
      out.push(`<ol><li>${inline(esc(oli[1].trim()))}</li></ol>`)
      i++
      continue
    }

    /* 普通段落行 */
    if (callout) callout.buf.push(line)
    else para.push(line.trim())
    i++
  }

  para = flushParagraph(para)
  closeCallout()
  return out.join('\n')

  /* 容器内递归渲染 */
  function renderLines(buf: string[]): string {
    if (!buf.length) return ''
    return renderDoc(buf.join('\n'))
  }
}
