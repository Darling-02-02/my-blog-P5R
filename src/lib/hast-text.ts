// rehype-highlight 会把代码块拆成 span 树，复制按钮需要把纯文本重新拼回来。
export interface HastNode {
  value?: string;
  children?: HastNode[];
}

export const textOf = (node: HastNode | undefined): string =>
  node ? (node.value ?? '') + (node.children ?? []).map(textOf).join('') : '';
