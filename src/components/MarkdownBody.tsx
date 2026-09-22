import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

const CodeBlock = ({ language, code }: { language: string; code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
          }}
        >
          {copied ? '已复制 ✓' : '复制'}
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
          {code}
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
  <>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          const isInline = !match;

          if (isInline) {
            return <InlineCode>{children}</InlineCode>;
          }

          return (
            <CodeBlock
              language={match[1]}
              code={codeString}
            />
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
  </>
);

export default MarkdownBody;
