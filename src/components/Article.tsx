import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { articles } from '../data/articles';

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
        <h1 style={{ color: 'var(--p5-red)', marginBottom: '1rem' }}>文章未找到</h1>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '1rem 2rem',
            background: 'var(--p5-red)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        padding: '6rem 2rem 4rem',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          marginBottom: '2rem',
          padding: '0.5rem 1rem',
          background: 'transparent',
          border: '2px solid var(--p5-red)',
          color: 'var(--p5-red)',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        ← 返回首页
      </button>

      {/* Article Header */}
      <header style={{ marginBottom: '3rem' }}>
        <div style={{
          display: 'inline-block',
          background: 'var(--p5-red)',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '700',
          marginBottom: '1rem',
        }}>
          {article.category}
        </div>
        
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: '900',
          marginBottom: '1rem',
          lineHeight: 1.3,
        }}>
          {article.title}
        </h1>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          color: 'var(--p5-light-gray)',
          fontSize: '0.9rem',
        }}>
          <span>{article.date}</span>
          <span>•</span>
          <span>{article.readTime}</span>
        </div>
      </header>

      {/* Article Content */}
      <div className="markdown-content" style={{
        fontSize: '1.1rem',
        lineHeight: 1.8,
        color: 'var(--p5-white)',
      }}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({node, inline, className, children, ...props}: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  padding: '1rem',
                  borderRadius: '8px',
                  overflow: 'auto',
                  border: '1px solid rgba(255, 0, 64, 0.3)',
                }}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code style={{
                  background: 'rgba(255, 0, 64, 0.2)',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '4px',
                  fontSize: '0.9em',
                }} {...props}>
                  {children}
                </code>
              );
            },
            h2: ({children}: any) => (
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                marginTop: '2.5rem',
                marginBottom: '1rem',
                color: 'var(--p5-red)',
              }}>{children}</h2>
            ),
            h3: ({children}: any) => (
              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: '600',
                marginTop: '2rem',
                marginBottom: '0.8rem',
              }}>{children}</h3>
            ),
            p: ({children}: any) => (
              <p style={{ marginBottom: '1.2rem' }}>{children}</p>
            ),
            ul: ({children}: any) => (
              <ul style={{ 
                marginBottom: '1.2rem',
                paddingLeft: '1.5rem',
              }}>{children}</ul>
            ),
            li: ({children}: any) => (
              <li style={{ marginBottom: '0.5rem' }}>{children}</li>
            ),
            blockquote: ({children}: any) => (
              <blockquote style={{
                borderLeft: '4px solid var(--p5-red)',
                paddingLeft: '1rem',
                margin: '1.5rem 0',
                fontStyle: 'italic',
                color: 'var(--p5-light-gray)',
              }}>{children}</blockquote>
            ),
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      {/* Tags */}
      <div style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid rgba(255, 0, 64, 0.3)',
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}>
        {article.tags.map((tag) => (
          <span
            key={tag}
            style={{
              padding: '0.25rem 0.75rem',
              background: 'rgba(255, 0, 64, 0.2)',
              border: '1px solid var(--p5-red)',
              borderRadius: '20px',
              fontSize: '0.8rem',
              color: 'var(--p5-red)',
            }}
          >
            #{tag}
          </span>
        ))}
      </div>
    </motion.article>
  );
};

export default Article;
