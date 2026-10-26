// 友链：想加谁的博客就往下面的数组里加一条，首页「友链」那一段会自动多一张卡片。
// name = 显示出来的名字，url = 对方主页（新窗口打开），desc = 名字下面的一句话说明。
// cover = 卡片顶部那张封面图（public/ 下的站点路径）。对面没有 og:image 时，
// 用它首页的截图（16:9）存进 public/links/ 再引用——不偷链别人域名的图。
// cover 省略就退回纯文字卡，不会留一个空图框。
export type FriendLink = {
  name: string;
  url: string;
  desc: string;
  cover?: string;
};

// 原来那条 BioJuse 只是做这个页面时的参考站，不是互链的友链，已撤掉。
export const friendLinks: FriendLink[] = [
  {
    name: 'Zzzovozz',
    url: 'https://zzzovozz.j3.ink/',
    desc: 'Zzzovozz 的个人博客。',
    cover: '/links/zzzovozz.webp',
  },
];
