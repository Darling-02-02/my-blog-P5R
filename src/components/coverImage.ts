import type { Article } from '../data/articles';

const base = import.meta.env.BASE_URL;

const coverPool = [
  `${base}cover.png`,
  `${base}R-C.jpg`,
  `${base}slideshow/slideshow-0.png`,
  `${base}slideshow/slideshow-1.png`,
  `${base}slideshow/slideshow-2.png`,
  `${base}slideshow/slideshow-3.png`,
  `${base}slideshow/slideshow-4.png`,
  `${base}slideshow/slideshow-5.png`,
  `${base}slideshow/slideshow-6.png`,
  `${base}slideshow/slideshow-7.png`,
  `${base}slideshow/slideshow-8.png`,
  `${base}slideshow/slideshow-9.png`,
  `${base}slideshow/slideshow-10.png`,
  `${base}slideshow/slideshow-11.png`,
  `${base}slideshow/slideshow-12.png`,
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

