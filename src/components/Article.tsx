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
      borderRadius: '8px',
      overflow: 'hidden',
      border: '2px solid var(--p5-red)',
      boxShadow: '4px 4px 0 rgba(255, 0, 64, 0.3)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: 'linear-gradient(135deg, var(--p5-red) 0%, var(--p5-dark-red) 100%)',
        color: 'white',
        fontSize: '0.8rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        <span>{language || 'code'}</span>
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          {copied ? '已复制' : '复制'}
        </motion.button>
      </div>
      <pre style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%)',
        padding: '1.25rem',
        overflow: 'auto',
        margin: 0,
        fontSize: '0.9rem',
        lineHeight: 1.6,
      }}>
        <code style={{
          color: '#e0e0e0',
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
    background: 'linear-gradient(135deg, rgba(255, 0, 64, 0.3) 0%, rgba(255, 0, 64, 0.2) 100%)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.9em',
    fontFamily: '"Fira Code", "Consolas", monospace',
    border: '1px solid rgba(255, 0, 64, 0.5)',
    color: 'var(--p5-accent)',
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
          whileHover={{ x: -5, scale: 1.02 }}
          style={{
            marginBottom: '2rem',
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: '2px solid var(--p5-red)',
            color: 'var(--p5-red)',
            borderRadius: '0',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
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
            padding: '2rem',
            background: 'rgba(26, 26, 26, 0.8)',
            borderRadius: '0',
            border: '2px solid var(--p5-red)',
            clipPath: 'polygon(0 0, 100% 0, 98% 100%, 0 100%)',
            boxShadow: '8px 8px 0 rgba(255, 0, 64, 0.2)',
          }}
        >
          <div style={{
            display: 'inline-block',
            background: 'var(--p5-red)',
            padding: '0.4rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)',
          }}>
            {article.category}
          </div>
          
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: '900',
            marginBottom: '1.5rem',
            lineHeight: 1.2,
            background: 'linear-gradient(135deg, #fff 0%, #ff6b9d 50%, #c44569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {article.title}
          </h1>
          
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            color: 'var(--p5-light-gray)',
            fontSize: '0.9rem',
            flexWrap: 'wrap',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {article.date}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {article.readTime}
            </span>
          </div>
        </motion.header>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="markdown-content"
          style={{
            fontSize: '1.1rem',
            lineHeight: 1.9,
            color: 'var(--p5-white)',
            padding: '2rem',
            background: 'rgba(26, 26, 26, 0.6)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 0, 64, 0.3)',
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
                    fontWeight: '900',
                    marginTop: '3rem',
                    marginBottom: '1.5rem',
                    color: 'var(--p5-red)',
                    paddingBottom: '0.5rem',
                    borderBottom: '3px solid var(--p5-red)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                return (
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    marginTop: '2.5rem',
                    marginBottom: '1rem',
                    color: 'var(--p5-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <span style={{
                      width: '4px',
                      height: '1.4rem',
                      background: 'var(--p5-red)',
                      display: 'inline-block',
                    }} />
                    {children}
                  </h3>
                );
              },
              h4({ children }) {
                return (
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    marginTop: '2rem',
                    marginBottom: '0.8rem',
                    color: 'var(--p5-white)',
                  }}>
                    {children}
                  </h4>
                );
              },
              p({ children }) {
                return (
                  <p style={{
                    marginBottom: '1.5rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}>
                    {children}
                  </p>
                );
              },
              ul({ children }) {
                return (
                  <ul style={{
                    marginBottom: '1.5rem',
                    paddingLeft: '1.5rem',
                    listStyle: 'none',
                  }}>
                    {children}
                  </ul>
                );
              },
              ol({ children }) {
                return (
                  <ol style={{
                    marginBottom: '1.5rem',
                    paddingLeft: '1.5rem',
                  }}>
                    {children}
                  </ol>
                );
              },
              li({ children }) {
                return (
                  <li style={{
                    marginBottom: '0.75rem',
                    position: 'relative',
                    paddingLeft: '1rem',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '-1rem',
                      color: 'var(--p5-red)',
                      fontWeight: '700',
                    }}>▸</span>
                    {children}
                  </li>
                );
              },
              blockquote({ children }) {
                return (
                  <blockquote style={{
                    borderLeft: '4px solid var(--p5-red)',
                    paddingLeft: '1.5rem',
                    margin: '2rem 0',
                    fontStyle: 'italic',
                    color: 'var(--p5-light-gray)',
                    background: 'rgba(255, 0, 64, 0.1)',
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
                    color: 'var(--p5-accent)',
                    fontWeight: '700',
                  }}>
                    {children}
                  </strong>
                );
              },
              em({ children }) {
                return (
                  <em style={{
                    color: 'var(--p5-gold)',
                  }}>
                    {children}
                  </em>
                );
              },
              hr() {
                return (
                  <hr style={{
                    border: 'none',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, var(--p5-red) 50%, transparent 100%)',
                    margin: '3rem 0',
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
                      color: 'var(--p5-cyan)',
                      textDecoration: 'none',
                      borderBottom: '1px dashed var(--p5-cyan)',
                      transition: 'all 0.3s',
                    }}
                  >
                    {children}
                  </a>
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
            marginTop: '3rem',
            padding: '1.5rem',
            background: 'rgba(26, 26, 26, 0.8)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 0, 64, 0.3)',
          }}
        >
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: 'var(--p5-red)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            标签
          </h3>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}>
            {article.tags.map((tag) => (
              <motion.span
                key={tag}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(255, 0, 64, 0.2)',
                  border: '1px solid var(--p5-red)',
                  borderRadius: '0',
                  fontSize: '0.85rem',
                  color: 'var(--p5-red)',
                  fontWeight: '500',
                  clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)',
                }}
              >
                #{tag}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.article>
  );
};

export default Article;
