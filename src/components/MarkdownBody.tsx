import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { Children, isValidElement, memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import MermaidDiagram from './MermaidDiagram';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark-dimmed.css';
import { textOf } from '../lib/hast-text';
import type { HastNode } from '../lib/hast-text';

// 代码块只负责结构和复制行为，外观交给 index.css 里的 .markdown-body .md-code。
const CodeBlock = ({
  language,
  code,
  children,
}: {
  language: string;
  code: string;
  children?: React.ReactNode;
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  // clipboard 只在安全上下文可用（https / localhost）；局域网 http 访问会 reject，
  // 那时候必须说实话，不能骗用户已经复制成功。
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.setTimeout(() => setCopyState('idle'), 2000);
  };

  const copyLabel = copyState === 'copied' ? '已复制 ✓' : copyState === 'failed' ? '复制失败，请手动选中' : '复制';

  return (
    <div className="md-code">
      <div className="md-code-header">
        <span className="md-code-lang">{language || 'code'}</span>
        <button type="button" className="md-copy" onClick={() => void handleCopy()}>
          {/* aria-live 让“已复制 / 复制失败”的变化会被读屏播报 */}
          <span aria-live="polite">{copyLabel}</span>
        </button>
      </div>
      <pre><code>{children ?? code}</code></pre>
    </div>
  );
};

type ZoomTarget = { src: string; alt: string };

// alt 经常就是文件名或一个 "image"，那种别当图注显示，免得比图还抢眼。
const captionFromAlt = (alt: string) => {
  const text = alt.trim();
  if (!text || /^(image|img|图片|screenshot)$/i.test(text)) return '';
  return /^[\w./\\-]+\.(png|jpe?g|gif|webp|svg|avif)$/i.test(text) ? '' : text;
};

// 图片是一等公民：figure + 图注 + 加载失败兜底 + 点击看大图。
const MarkdownImage = ({
  src,
  alt,
  title,
  onZoom,
}: {
  src?: string;
  alt?: string;
  title?: string;
  onZoom: (target: ZoomTarget) => void;
}) => {
  const [failed, setFailed] = useState(false);
  const caption = captionFromAlt(alt ?? '');

  if (failed || !src) {
    return (
      <figure className="md-figure">
        <div className="md-image-fallback">
          <span className="md-image-fallback-title">{caption || alt || '图片'}</span>
          <span className="md-image-fallback-hint">图片没能加载，检查一下路径或网络</span>
          {src ? <code>{src}</code> : null}
        </div>
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className="md-figure">
      <img
        src={src}
        alt={alt ?? ''}
        title={title}
        loading="lazy"
        decoding="async"
        onClick={() => onZoom({ src, alt: caption })}
        onError={() => setFailed(true)}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
};

// 灯箱挂在 body 上：文章卡片的 backdrop-filter 会变成 fixed 的包含块，留在卡片里会被裁掉。
const ImageLightbox = ({ target, onClose }: { target: ZoomTarget; onClose: () => void }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="md-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={target.alt || '查看大图'}
      onClick={onClose}
    >
      <img src={target.src} alt={target.alt} />
      <button type="button" className="md-lightbox-close" autoFocus aria-label="关闭大图" onClick={onClose}>
        ✕
      </button>
    </div>
  );
};

interface MarkdownBodyProps {
  content: string;
}

const MarkdownBody = ({ content }: MarkdownBodyProps) => {
  const [zoom, setZoom] = useState<ZoomTarget | null>(null);
  const closeZoom = useCallback(() => setZoom(null), []);

  return (
    <div className="markdown-body article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { ignoreMissing: true }]]}
        components={{
          pre({ children, node }) {
            const codeNode = node?.children.find((child) => child.type === 'element' && child.tagName === 'code');
            const child = Children.only(children);
            if (!codeNode || codeNode.type !== 'element' || !isValidElement<{ children?: React.ReactNode }>(child)) {
              return <pre>{children}</pre>;
            }
            // Block structure, not a language label, distinguishes fences from inline code.
            const className = String(codeNode.properties.className ?? '');
            const language = /language-([^\s,]+)/.exec(className)?.[1] ?? 'text';
            const code = textOf(codeNode as HastNode).replace(/\n$/, '');
            const block = <CodeBlock language={language} code={code}>{child.props.children}</CodeBlock>;
            return language.toLowerCase() === 'mermaid'
              ? <MermaidDiagram source={code}>{block}</MermaidDiagram>
              : block;
          },
          img({ src, alt, title }) {
            return <MarkdownImage src={src} alt={alt} title={title} onZoom={setZoom} />;
          },
          h2({ children }) {
            const text = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
            return <h2 id={text}>{children}</h2>;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          table({ children }) {
            // 宽表格自己横向滚动，别把整篇文章顶宽。
            return (
              <div className="md-table-wrap">
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {zoom ? createPortal(<ImageLightbox target={zoom} onClose={closeZoom} />, document.body) : null}
    </div>
  );
};

// ReactMarkdown 每次重渲染都会把整篇 Markdown 重新解析、高亮、跑一遍 KaTeX。
// 内容没变就不该重做这件事（阅读进度、主题切换等父级更新都会触发重渲染）。
export default memo(MarkdownBody);
