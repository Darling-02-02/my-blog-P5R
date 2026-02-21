import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { articles } from '../data/articles';
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
      background: '#1e1e1e',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: '#2d2d2d',
        color: '#888',
        fontSize: '0.8rem',
      }}>
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
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
          color: '#d4d4d4',
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
    background: 'rgba(255, 0, 64, 0.1)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.9em',
    fontFamily: '"Fira Code", "Consolas", monospace',
    color: '#ff0040',
  }}>
    {children}
  </code>
);

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const article = articles.find(a => a.id === Number(id));

  if (!article) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: 'rgba(26, 26, 26, 0.9)',
            padding: '3rem',
            borderRadius: '10px',
            border: '2px solid var(--p5-red)',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: 'var(--p5-red)', marginBottom: '1rem', fontSize: '2rem' }}>
            文章未找到
          </h1>
          <p style={{ color: 'var(--p5-light-gray)', marginBottom: '2rem' }}>
            你在寻找的文章可能已被删除或不存在
          </p>
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '1rem 2rem',
              background: 'var(--p5-red)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '700',
            }}
          >
            返回首页
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        padding: '6rem 2rem 4rem',
      }}
    >
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <motion.button
          onClick={() => navigate('/')}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ x: -5 }}
          style={{
            marginBottom: '2rem',
            padding: '0.6rem 1.2rem',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '20px',
            color: '#ff0040',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          ← 返回
        </motion.button>

        <motion.header
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            marginBottom: '3rem',
          }}
        >
          <div style={{
            display: 'inline-block',
            background: '#ff0040',
            color: '#fff',
            padding: '0.4rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            borderRadius: '20px',
          }}>
            {article.category}
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '700',
            marginBottom: '1rem',
            lineHeight: 1.3,
            color: '#fff',
          }}>
            {article.title}
          </h1>
          
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            color: '#888',
            fontSize: '0.9rem',
            flexWrap: 'wrap',
          }}>
            <span>📅 {article.date}</span>
            <span>⏱️ {article.readTime}</span>
          </div>
        </motion.header>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '16px',
            padding: '3rem',
            color: '#333',
          }}
        >
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
                return (
                  <h2 style={{
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    marginTop: '2.5rem',
                    marginBottom: '1.2rem',
                    color: '#1a1a1a',
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
                    color: '#333',
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
                    color: '#333',
                  }}>
                    {children}
                  </h4>
                );
              },
              p({ children }) {
                return (
                  <p style={{
                    marginBottom: '1.2rem',
                    color: '#444',
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
                    color: '#444',
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
                    color: '#666',
                    background: 'rgba(255, 0, 64, 0.05)',
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
                    color: '#1a1a1a',
                  }}>
                    {children}
                  </strong>
                );
              },
              em({ children }) {
                return (
                  <em style={{
                    color: '#666',
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
                    background: '#eee',
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
                return <thead style={{ background: 'rgba(255,0,64,0.1)' }}>{children}</thead>;
              },
              th({ children }) {
                return (
                  <th style={{
                    padding: '0.8rem 1rem',
                    textAlign: 'left',
                    borderBottom: '2px solid #ff0040',
                    fontWeight: '600',
                    color: '#333',
                  }}>
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td style={{
                    padding: '0.8rem 1rem',
                    borderBottom: '1px solid #eee',
                    color: '#444',
                  }}>
                    {children}
                  </td>
                );
              },
            }}
          >
            {article.content}
          </ReactMarkdown>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            marginTop: '2rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {article.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '0.4rem 0.8rem',
                background: 'rgba(255, 0, 64, 0.1)',
                border: '1px solid rgba(255, 0, 64, 0.2)',
                borderRadius: '15px',
                fontSize: '0.85rem',
                color: '#ff0040',
              }}
            >
              #{tag}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.article>
  );
};

export default Article;
