// 文章卡的「内容截图」路径约定。
//
// 仓库里没有真实截图时，卡片用 scripts/capture-article-covers.mjs 自动生成的文章页截图，
// 文件名就是把 slug 里的 / 换成 -：基因组组装/spades-genome-assembly
//   → <base>/covers/基因组组装-spades-genome-assembly.webp
// 规则只有这一处，生成脚本和卡片都按它来；文件缺失时 <img> 报错，卡片回落到作息动图。
export const coverFileNameForSlug = (slug: string) => `${slug.replace(/\//g, '-')}.webp`;

export const generatedCoverUrl = (slug: string) => `${import.meta.env.BASE_URL}covers/${coverFileNameForSlug(slug)}`;
