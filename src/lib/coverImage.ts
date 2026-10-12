import type { Article } from '../../backend/src/articles/article.types';

const base = import.meta.env.BASE_URL;

// 首页改成单图后 public/slideshow/ 只剩 slideshow-0，池子里不再列已删掉的那 12 张。
const coverPool = [
  `${base}cover.png`,
  `${base}R-C.jpg`,
  `${base}slideshow/slideshow-0.webp`,
];

const hashKey = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const pickCoverByKey = (key: string) => {
  return coverPool[hashKey(key) % coverPool.length];
};

export const pickCoverForArticle = (article: Pick<Article, 'category' | 'tags'>) => {
  const category = article.category || 'uncategorized';
  const tags = article.tags.length ? article.tags.join('|') : 'untagged';
  return pickCoverByKey(`${category}::${tags}`);
};
