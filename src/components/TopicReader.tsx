import MarkdownBody from './MarkdownBody';
import type { Topic } from '../data/topics';

/**
 * 专题正文：简介 + 每小节正文按顺序渲染在同一页，读的时候一路往下滚就行。
 * 栏目页（一个栏目下所有专题）和专题页共用这一块；标题/简介由各自的页面渲染。
 */
const TopicReader = ({ topic }: { topic: Topic }) => (
  <div className="topic-reader">
    <MarkdownBody content={topic.intro} />
    {topic.sections.map((section) => (
      <section key={section.slug} id={section.slug} className="reader-section">
        <h3 className="reader-section-title">
          {section.title}
          {section.readTime && <span className="reader-section-meta">⏱️ {section.readTime}</span>}
        </h3>
        <MarkdownBody content={section.content} />
      </section>
    ))}
  </div>
);

export default TopicReader;
