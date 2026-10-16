// 标题锚点 id 的唯一一份规则：MarkdownBody 用它给 h2/h3 加 id，文章目录用它跳转。
// 规则沿用原来那句（小写、空白换连字符、只留中英文数字和连字符），所以带 ?#锚点 的老链接不会失效。
export const headingId = (text: string) =>
  text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');

export type TocItem = { id: string; text: string; level: number };

// 目录直接扫 Markdown 源码里的二、三级标题。headingId 会把 `*`、反引号、链接括号这些行内标记
// 一并抹掉，所以「## **粗**体」在正文里渲染出来的标题和这里算出的 id 是同一个。
// 代码围栏里的 ## 不算标题。
export const extractHeadings = (markdown: string): TocItem[] => {
  const items: TocItem[] = [];
  let inFence = false;

  markdown.split('\n').forEach((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) return;

    const text = match[2].replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim();
    items.push({ id: headingId(text), text, level: match[1].length });
  });

  return items;
};
