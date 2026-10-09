import type { Article } from '../../backend/src/articles/article.types';

const base = import.meta.env.BASE_URL;

const coverPool = [
  `${base}cover.png`,
  `${base}R-C.jpg`,
  `${base}slideshow/slideshow-0.webp`,
  `${base}slideshow/slideshow-1.webp`,
  `${base}slideshow/slideshow-2.webp`,
  `${base}slideshow/slideshow-3.webp`,
  `${base}slideshow/slideshow-4.webp`,
  `${base}slideshow/slideshow-5.webp`,
  `${base}slideshow/slideshow-6.webp`,
  `${base}slideshow/slideshow-7.webp`,
  `${base}slideshow/slideshow-8.webp`,
  `${base}slideshow/slideshow-9.webp`,
  `${base}slideshow/slideshow-10.webp`,
  `${base}slideshow/slideshow-11.webp`,
  `${base}slideshow/slideshow-12.webp`,
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
