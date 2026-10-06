import type { Topic, TopicSection } from '../data/topics';
import { ArticleApiError } from './api';
import { contentsUrl, decodeBase64, encodeBase64, getFile, request } from './github';
import { topicDirectories } from '../data/category-source';
import { parseTopicDocument, serializeSection, serializeTopic, topicSlugPattern } from './topic-content';
import type { SectionDraftInput, TopicDraftInput } from './topic-content';

const root = 'src/content/topics';
const repo = '/repos/Darling-02-02/my-blog-P5R';
const branch = 'main';
const pathFor = (directories: Record<string, string>, category: string, slug: string) => {
  const dir = directories[category];
  if (!dir || !topicSlugPattern.test(slug)) throw new Error('请选择有效的栏目和专题 Slug');
  return `${root}/${dir}/${slug}`;
};

const read = async (token: string, path: string) => {
  const file = await getFile(token, path);
  if (!file) throw new ArticleApiError(404, 'NOT_FOUND', `文件未找到：${path}`);
  return parseTopicDocument(decodeBase64(file.content), path);
};

// 删一个仓库文件。sha 必须先读出来：Contents API 的删除是「带着 sha 的写」，
// 对不上的话说明别的窗口刚改过这个文件，宁可报错也不要覆盖。
const removeFile = async (token: string, path: string, message: string) => {
  const file = await getFile(token, path);
  if (!file) throw new ArticleApiError(404, 'NOT_FOUND', `文件未找到：${path}`);
  await request(token, contentsUrl(path), {
    method: 'DELETE', body: JSON.stringify({ message, sha: file.sha, branch }),
  });
};

// directories: 栏目名 -> 专题目录。默认用构建期那份（src/data/category-source.ts）；
// 后台会把"仓库里正在生效"的实时栏目表传进来，否则刚建的栏目要等一次站点重建才能发专题。
export const topicPublisher = {
  list: async (token: string, directories: Record<string, string> = topicDirectories): Promise<Topic[]> => {
    const tree = await request<{ tree?: Array<{ path: string; type: string }>; truncated?: boolean }>(token, `${repo}/git/trees/${branch}?recursive=1`);
    if (!tree) throw new Error('无法读取仓库专题列表');
    if (tree.truncated) throw new Error('仓库文件列表不完整，请稍后重试');
    const paths = (tree?.tree ?? []).filter((entry) => entry.type === 'blob' && entry.path.startsWith(`${root}/`) && entry.path.endsWith('/topic.md'));
    return Promise.all(paths.map(async ({ path }) => {
      const parts = path.slice(root.length + 1).split('/');
      const category = Object.entries(directories).find(([, dir]) => dir === parts[0])?.[0];
      if (!category) throw new Error(`未知专题栏目：${parts[0]}（仓库里这个目录不在栏目表里）`);
      const base = path.slice(0, -'/topic.md'.length);
      const { meta, body } = await read(token, path);
      const sectionPaths = (tree?.tree ?? []).filter((entry) => entry.type === 'blob' && entry.path.startsWith(`${base}/sections/`) && /^[-a-z0-9]+\.md$/.test(entry.path.slice(`${base}/sections/`.length)));
      const sections = await Promise.all(sectionPaths.map(async (entry): Promise<TopicSection> => {
        const section = await read(token, entry.path);
        return {
          slug: entry.path.slice(`${base}/sections/`.length, -3),
          title: String(section.meta.title ?? ''),
          order: Number(section.meta.order ?? 0),
          readTime: String(section.meta.readTime ?? ''),
          content: section.body,
        };
      }));
      return {
        category,
        slug: parts[1],
        title: String(meta.title ?? ''),
        summary: String(meta.summary ?? ''),
        order: Number(meta.order ?? 0),
        cover: String(meta.cover ?? ''),
        tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
        intro: body,
        sections: sections.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN')),
      };
    }));
  },

  create: async (token: string, topic: TopicDraftInput, firstSection: SectionDraftInput, directories: Record<string, string> = topicDirectories) => {
    const base = pathFor(directories, topic.category, topic.slug);
    const topicText = serializeTopic(topic);
    const sectionText = serializeSection(firstSection);
    if (await getFile(token, `${base}/topic.md`)) throw new ArticleApiError(409, 'SLUG_EXISTS', '该栏目下的专题 Slug 已存在');
    // One Git commit adds both files so content validation never sees a topic without a section.
    const ref = await request<{ object: { sha: string } }>(token, `${repo}/git/ref/heads/${branch}`);
    if (!ref) throw new Error('无法读取仓库分支');
    const head = ref.object.sha;
    const commit = await request<{ tree: { sha: string } }>(token, `${repo}/git/commits/${head}`);
    if (!commit) throw new Error('无法读取仓库提交');
    const tree = await request<{ sha: string }>(token, `${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: commit.tree.sha, tree: [
        { path: `${base}/topic.md`, mode: '100644', type: 'blob', content: topicText },
        { path: `${base}/sections/${firstSection.slug}.md`, mode: '100644', type: 'blob', content: sectionText },
      ] }),
    });
    if (!tree) throw new Error('无法创建专题文件树');
    const next = await request<{ sha: string }>(token, `${repo}/git/commits`, {
      method: 'POST', body: JSON.stringify({ message: `新建专题：${topic.title}`, tree: tree.sha, parents: [head] }),
    });
    if (!next) throw new Error('无法创建专题提交');
    const updated = await request(token, `${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH', body: JSON.stringify({ sha: next.sha, force: false }),
    });
    if (!updated) throw new Error('无法更新仓库分支');
  },

  saveTopic: async (token: string, input: TopicDraftInput, directories: Record<string, string> = topicDirectories) => {
    const path = `${pathFor(directories, input.category, input.slug)}/topic.md`;
    const text = serializeTopic(input);
    const old = await getFile(token, path);
    if (!old) throw new ArticleApiError(404, 'NOT_FOUND', '专题未找到');
    await request(token, contentsUrl(path), {
      method: 'PUT', body: JSON.stringify({ message: `更新专题：${input.title}`, content: encodeBase64(text), sha: old.sha, branch }),
    });
  },

  saveSection: async (token: string, category: string, topicSlug: string, input: SectionDraftInput, creating: boolean, directories: Record<string, string> = topicDirectories) => {
    const base = pathFor(directories, category, topicSlug);
    if (!(await getFile(token, `${base}/topic.md`))) throw new ArticleApiError(404, 'NOT_FOUND', '专题未找到，请刷新列表');
    const path = `${base}/sections/${input.slug}.md`;
    const text = serializeSection(input);
    const old = await getFile(token, path);
    if (creating && old) throw new ArticleApiError(409, 'SLUG_EXISTS', '该专题下的章节 Slug 已存在');
    if (!creating && !old) throw new ArticleApiError(404, 'NOT_FOUND', '章节未找到');
    await request(token, contentsUrl(path), {
      method: 'PUT', body: JSON.stringify({ message: `${creating ? '新增' : '更新'}章节：${input.title}`, content: encodeBase64(text), ...(old ? { sha: old.sha } : {}), branch }),
    });
  },

  removeSection: async (token: string, category: string, topicSlug: string, sectionSlug: string, directories: Record<string, string> = topicDirectories) => {
    const base = pathFor(directories, category, topicSlug);
    await removeFile(token, `${base}/sections/${sectionSlug}.md`, `删除章节：${sectionSlug}`);
  },

  removeTopic: async (token: string, category: string, topicSlug: string, directories: Record<string, string> = topicDirectories) => {
    const base = pathFor(directories, category, topicSlug);
    const tree = await request<{ tree?: Array<{ path: string; type: string }> }>(token, `${repo}/git/trees/${branch}?recursive=1`);
    const paths = (tree?.tree ?? [])
      .filter((entry) => entry.type === 'blob' && entry.path.startsWith(`${base}/`))
      .map((entry) => entry.path);
    if (!paths.length) throw new ArticleApiError(404, 'NOT_FOUND', '专题未找到，请刷新列表');
    // 先删章节、最后删 topic.md：中途哪一步失败，仓库里剩下的要么还是完整专题，要么已经什么都不剩。
    // 反过来先删 topic.md 的话，中间的提交里 sections/ 就成了没有专题的孤儿，
    // validate:content 的「必须有 sections/ 且至少一节」会在这段时间里把构建卡红。
    const ordered = paths.sort((a, b) => Number(a.endsWith('/topic.md')) - Number(b.endsWith('/topic.md')));
    for (const path of ordered) await removeFile(token, path, `删除专题：${topicSlug}（${path.slice(base.length + 1)}）`);
  },
};
