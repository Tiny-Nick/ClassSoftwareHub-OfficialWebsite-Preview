/* public/ 里的资源按构建 base 解析：站点既可能部署在域名根，也可能在子路径（GitHub Pages 项目页）。
   写死的 /shots/... 在子路径下会指到域名根，图会全 404。 */
export function publicUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
