import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import { Children, isValidElement, useState } from 'react';
import MermaidDiagram from './MermaidDiagram';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark-dimmed.css';
import { textOf } from '../lib/hast-text';
import type { HastNode } from '../lib/hast-text';

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
    <div style={{
      position: 'relative',
      margin: '1.5rem 0',
      borderRadius: '10px',
      overflow: 'hidden',
      background: 'var(--bg-code)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: 'var(--bg-code-header)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        <span>{language || 'code'}</span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
          }}
        >
          {/* aria-live 让“已复制 / 复制失败”的变化会被读屏播报 */}
          <span aria-live="polite">{copyLabel}</span>
        </button>
      </div>
      <pre style={{
        padding: '1rem',
        overflow: 'auto',
        margin: 0,
        fontSize: '0.9rem',
        lineHeight: 1.6,
      }}>
        <code style={{
          color: 'var(--text-code)',
          fontFamily: '"Fira Code", "Consolas", monospace',
        }}>
          {children ?? code}
        </code>
      </pre>
    </div>
  );
};

const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code style={{
    background: 'var(--bg-inline-code)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.9em',
    fontFamily: '"Fira Code", "Consolas", monospace',
    color: 'var(--text-inline-code)',
  }}>
    {children}
  </code>
);

interface MarkdownBodyProps {
  content: string;
}

const MarkdownBody = ({ content }: MarkdownBodyProps) => (
  <div className="article-body" style={{ overflowWrap: 'anywhere' }}>
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
        code({ children }) {
          return <InlineCode>{children}</InlineCode>;
        },
        img({ src, alt, title }) {
          return <img src={src || undefined} alt={alt ?? ''} title={title} loading="lazy" decoding="async"
            style={{ display: 'block', maxWidth: '100%', height: 'auto', margin: '1.25rem auto', borderRadius: 8 }} />;
        },
        h1({ children }) {
          return (
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              lineHeight: 1.2,
              fontWeight: 800,
              margin: '0 0 1.5rem',
              color: '#ff315f',
              letterSpacing: '0.01em',
              textShadow: '0 3px 12px rgba(255, 49, 95, 0.18)',
            }}>
              ✨ {children}
            </h1>
          );
        },
        h2({ children }) {
          const text = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
          return (
            <h2 id={text} style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              marginTop: '2.5rem',
              marginBottom: '1.2rem',
              color: 'var(--text-heading)',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #ff0040',
            }}>
              {children}
            </h2>
          );
        },
        h3({ children }) {
          return (
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              marginTop: '2rem',
              marginBottom: '1rem',
              color: 'var(--text-secondary)',
            }}>
              {children}
            </h3>
          );
        },
        h4({ children }) {
          return (
            <h4 style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              marginTop: '1.5rem',
              marginBottom: '0.8rem',
              color: 'var(--text-secondary)',
            }}>
              {children}
            </h4>
          );
        },
        p({ children }) {
          return (
            <p style={{
              marginBottom: '1.2rem',
              color: 'var(--text-body)',
              lineHeight: 1.8,
            }}>
              {children}
            </p>
          );
        },
        ul({ children }) {
          return (
            <ul style={{
              marginBottom: '1.2rem',
              paddingLeft: '1.5rem',
            }}>
              {children}
            </ul>
          );
        },
        ol({ children }) {
          return (
            <ol style={{
              marginBottom: '1.2rem',
              paddingLeft: '1.5rem',
            }}>
              {children}
            </ol>
          );
        },
        li({ children }) {
          return (
            <li style={{
              marginBottom: '0.5rem',
              color: 'var(--text-body)',
              lineHeight: 1.7,
            }}>
              {children}
            </li>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote style={{
              borderLeft: '4px solid #ff0040',
              paddingLeft: '1.5rem',
              margin: '1.5rem 0',
              fontStyle: 'italic',
              color: 'var(--text-muted)',
              background: 'var(--bg-blockquote)',
              padding: '1rem 1.5rem',
              borderRadius: '0 8px 8px 0',
            }}>
              {children}
            </blockquote>
          );
        },
        strong({ children }) {
          return (
            <strong style={{
              fontWeight: '600',
              color: 'var(--text-strong)',
            }}>
              {children}
            </strong>
          );
        },
        em({ children }) {
          return (
            <em style={{
              color: 'var(--text-muted)',
            }}>
              {children}
            </em>
          );
        },
        hr() {
          return (
            <hr style={{
              border: 'none',
              height: '1px',
              background: 'var(--border-section)',
              margin: '2rem 0',
            }} />
          );
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#ff0040',
                textDecoration: 'none',
              }}
            >
              {children}
            </a>
          );
        },
        table({ children }) {
          return (
            <div style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.95rem',
              }}>
                {children}
              </table>
            </div>
          );
        },
        thead({ children }) {
          return <thead style={{ background: 'var(--table-header-bg)' }}>{children}</thead>;
        },
        th({ children }) {
          return (
            <th style={{
              padding: '0.8rem 1rem',
              textAlign: 'left',
              borderBottom: '2px solid #ff0040',
              fontWeight: '600',
              color: 'var(--text-secondary)',
            }}>
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td style={{
              padding: '0.8rem 1rem',
              borderBottom: '1px solid var(--table-border)',
              color: 'var(--text-body)',
            }}>
              {children}
            </td>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>

    <style>{`
      @media (max-width: 768px) {
        .article-body h2 {
          font-size: 1.45rem !important;
        }

        .article-body h3 {
          font-size: 1.18rem !important;
        }

        .article-body h4 {
          font-size: 1.02rem !important;
        }

        .article-body blockquote {
          padding: 0.9rem 1rem !important;
        }
      }
    `}</style>
  </div>
);

export default MarkdownBody;
