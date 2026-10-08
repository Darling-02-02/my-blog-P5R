/**
 * 阅读时长由正文估算：后台不再提供「阅读时长」输入框（那个框只是在问作者打算写几分钟）。
 * 中文按 400 字/分钟、英文按 200 词/分钟，四舍五入，最少 1 分钟。
 */
export const estimateReadTime = (markdown: string) => {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ') // 代码块不计入阅读量
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' '); // 图片和链接的地址不算字数
  const characters = text.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const words = text.match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return `${Math.max(1, Math.round(characters / 400 + words / 200))} 分钟`;
};
