// 文章正文里的本地图片引用。
//
// 文章页的地址是 /article/<分类>/<slug>，正文里写相对路径（编辑器导出的 "数据库下载.assets/a.png"）
// 一定会被解析到那个嵌套目录下，于是永远 404 —— 2026-10-12 的 datadownload.md 就是这么三张图全挂的。
// 线上唯一稳的写法是 public/ 下的绝对路径（/images/...）。
//
// 这里只判断、不碰文件系统：public 里有没有这个文件由调用方传进来（validate-content.mjs 用 fs 查）。
export interface LocalImageProblem {
  src: string;
  reason: 'relative' | 'missing';
}

const imagePattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
// 围栏代码块里的 ![alt](x.png) 是给人看的示例，不是真引用。
const fencedBlockPattern = /^```[\s\S]*?^```/gm;

/** http(s)://、data:、mailto: 这类非本地引用，交给插件自己去解析，不在这里管。 */
const isRemote = (src: string) => /^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith('//');

export const findLocalImageProblems = (
  body: string,
  fileExists: (pathUnderPublic: string) => boolean,
): LocalImageProblem[] => {
  const problems: LocalImageProblem[] = [];
  for (const match of body.replace(fencedBlockPattern, '').matchAll(imagePattern)) {
    const src = match[1];
    if (isRemote(src)) continue;
    if (!src.startsWith('/')) {
      problems.push({ src, reason: 'relative' });
      continue;
    }
    let decoded = src;
    try {
      decoded = decodeURIComponent(src);
    } catch {
      // 编码是坏的（比如落单的 %）就按原样找，找不到自然报 missing。
    }
    if (!fileExists(decoded.slice(1))) problems.push({ src, reason: 'missing' });
  }
  return problems;
};
