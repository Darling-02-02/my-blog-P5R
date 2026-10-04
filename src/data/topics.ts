import { pickCoverByKey } from '../lib/coverImage';
import { parseTopicDocument } from '../lib/topic-content';

export interface TopicSection {
  slug: string;
  title: string;
  order: number;
  readTime: string;
  content: string;
}

export interface Topic {
  category: string;
  slug: string;
  title: string;
  summary: string;
  order: number;
  cover: string;
  tags: string[];
  intro: string;
  sections: TopicSection[];
}

type Frontmatter = Record<string, unknown>;

const base = import.meta.env.BASE_URL;

// The directory names are also used by the admin GitHub publisher.
const categoryByDir: Record<string, string> = {
  'machine-learning': '机器学习',
  essays: '随笔',
  backend: '后端',
};

const topicModules = import.meta.glob('../content/topics/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const toOrder = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

interface TopicDraft {
  dir: string;
  slug: string;
  meta?: Frontmatter;
  intro: string;
  sections: TopicSection[];
}

const drafts = new Map<string, TopicDraft>();

const ensureDraft = (dir: string, slug: string): TopicDraft => {
  const key = `${dir}/${slug}`;
  const existing = drafts.get(key);
  if (existing) return existing;

  const created: TopicDraft = { dir, slug, intro: '', sections: [] };
  drafts.set(key, created);
  return created;
};

for (const [path, source] of Object.entries(topicModules)) {
  const relative = path
    .replace('../content/topics/', '')
    .replace(/\.md$/, '')
    .replace(/\\/g, '/');
  const parts = relative.split('/');
  const { meta, body } = parseTopicDocument(source, relative);

  // <dir>/<topic>/topic.md
  if (parts.length === 3 && parts[2] === 'topic') {
    const draft = ensureDraft(parts[0], parts[1]);
    draft.meta = meta;
    draft.intro = body;
    continue;
  }

  // <dir>/<topic>/sections/<section>.md
  if (parts.length === 4 && parts[2] === 'sections') {
    const draft = ensureDraft(parts[0], parts[1]);
    draft.sections.push({
      slug: parts[3],
      title: meta.title ? String(meta.title) : parts[3],
      order: toOrder(meta.order),
      readTime: meta.readTime ? String(meta.readTime) : '',
      content: body,
    });
    continue;
  }
}

const byOrder = (a: { order: number; title: string }, b: { order: number; title: string }) =>
  a.order - b.order || a.title.localeCompare(b.title, 'zh-CN');

export const topics: Topic[] = [...drafts.values()]
  .filter((draft) => draft.meta)
  .map((draft) => {
    const meta = draft.meta as Frontmatter;
    const category = categoryByDir[draft.dir] ?? draft.dir;
    const coverFile = meta.cover ? String(meta.cover) : '';
    const cover = coverFile ? (/^https?:\/\//i.test(coverFile) ? coverFile : `${base}${coverFile.replace(/^\//, '')}`) : pickCoverByKey(`${category}::${draft.slug}`);

    return {
      category,
      slug: draft.slug,
      title: String(meta.title ?? draft.slug),
      summary: String(meta.summary ?? ''),
      order: toOrder(meta.order),
      cover,
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      intro: draft.intro,
      sections: draft.sections.sort(byOrder),
    } satisfies Topic;
  })
  .sort(byOrder);

const topicIndex = new Map(topics.map((topic) => [`${topic.category}/${topic.slug}`, topic]));

export const getTopicsByCategory = (category: string) =>
  topics.filter((topic) => topic.category === category);

export const getTopicCountByCategory = (category: string) =>
  topics.reduce((count, topic) => (topic.category === category ? count + 1 : count), 0);

export const findTopic = (category: string | undefined, topicSlug: string | undefined) =>
  topicIndex.get(`${decodeURIComponent(category ?? '')}/${decodeURIComponent(topicSlug ?? '')}`);

export const findSection = (
  category: string | undefined,
  topicSlug: string | undefined,
  sectionSlug: string | undefined,
) => {
  const topic = findTopic(category, topicSlug);
  if (!topic) return undefined;
  const decoded = decodeURIComponent(sectionSlug ?? '');
  return topic.sections.find((section) => section.slug === decoded);
};

export const getTopicPath = (topic: Pick<Topic, 'category' | 'slug'>) =>
  `/topic/${encodeURIComponent(topic.category)}/${encodeURIComponent(topic.slug)}`;

export const getSectionPath = (
  topic: Pick<Topic, 'category' | 'slug'>,
  section: Pick<TopicSection, 'slug'>,
) => `${getTopicPath(topic)}/${encodeURIComponent(section.slug)}`;
