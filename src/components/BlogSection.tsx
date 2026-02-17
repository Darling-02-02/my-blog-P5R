import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { articles } from '../data/articles';

const coverImage = '/cover.png';

// 主页面显示的5个栏目
const mainPosts = articles.slice(0, 5).map(article => ({
  ...article,
  image: coverImage,
}));

// 弹窗中显示的额外栏目
const morePosts = articles.slice(5).map(article => ({
  ...article,
  image: coverImage,
}));

interface BlogCardProps {
  post: typeof articles[0] & { image: string };
  index: number;
}

const BlogCard = ({ post, index }: BlogCardProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/article/${post.id}`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      onClick={handleClick}
      style={{
        background: 'rgba(26, 26, 26, 0.7)',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 0, 64, 0.3)',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Image */}
      <div style={{
        position: 'relative',
        height: '200px',
        overflow: 'hidden',
      }}>
        <motion.img
          src={post.image}
          alt={post.title}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'var(--p5-red)',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: '700',
          textTransform: 'uppercase',
        }}>
          {post.category}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '0.75rem',
          fontSize: '0.875rem',
          color: 'var(--p5-light-gray)',
        }}>
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>

        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          marginBottom: '0.75rem',
          lineHeight: 1.4,
          color: 'var(--p5-white)',
        }}>
          {post.title}
        </h3>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--p5-light-gray)',
          lineHeight: 1.6,
          marginBottom: '1rem',
        }}>
          {post.excerpt}
        </p>

        {/* Tags */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 0, 64, 0.2)',
                border: '1px solid var(--p5-red)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: 'var(--p5-red)',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
};

const BlogSection = () => {
  const [showAll, setShowAll] = useState(false);

  return (
    <section
      id="blog"
      style={{
        padding: '6rem 2rem',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景图片 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/图片_1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.6,
        zIndex: 0,
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            textAlign: 'center',
            marginBottom: '4rem',
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: '900',
            marginBottom: '1rem',
            color: 'var(--p5-white)',
          }}>
            <span style={{ color: 'var(--p5-red)' }}>幕后</span>
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--p5-light-gray)',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            一切都是为了正义
          </p>
        </motion.div>

        {/* Blog Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '2rem',
        }}>
          {mainPosts.map((post, index) => (
            <BlogCard key={post.id} post={post} index={index} />
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            textAlign: 'center',
            marginTop: '4rem',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAll(true)}
            style={{
              padding: '1rem 3rem',
              background: 'transparent',
              border: '2px solid var(--p5-red)',
              color: 'var(--p5-red)',
              fontSize: '1rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              cursor: 'pointer',
              borderRadius: '5px',
            }}
          >
            查看全部教程
          </motion.button>
        </motion.div>

        {/* View All Modal */}
        <AnimatePresence>
          {showAll && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
              }}
              onClick={() => setShowAll(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  background: 'rgba(26, 26, 26, 0.95)',
                  borderRadius: '20px',
                  padding: '3rem',
                  maxWidth: '1200px',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  border: '2px solid var(--p5-red)',
                  position: 'relative',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowAll(false)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'transparent',
                    border: '2px solid var(--p5-red)',
                    color: 'var(--p5-red)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>

                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  marginBottom: '2rem',
                  textAlign: 'center',
                  color: 'var(--p5-red)',
                }}>
                  全部教程
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '2rem',
                }}>
                  {[...mainPosts, ...morePosts].map((post, index) => (
                    <BlogCard key={post.id} post={post} index={index} />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default BlogSection;
