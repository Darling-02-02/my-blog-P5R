// 友链：想加谁的博客就往下面的数组里加一条，首页「友链」那一段会自动多一张卡片。
// name = 显示出来的名字，url = 对方主页（新窗口打开），desc = 名字下面的一句话说明。
export type FriendLink = {
  name: string;
  url: string;
  desc: string;
};

// 原来那条 BioJuse 只是做这个页面时的参考站，不是互链的友链，已撤掉。
export const friendLinks: FriendLink[] = [
  { name: 'Zzzovozz', url: 'https://zzzovozz.j3.ink/', desc: 'Zzzovozz 的个人博客。' },
];
