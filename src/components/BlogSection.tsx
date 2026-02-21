import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { articles } from '../data/articles';
import { PageLayout, MainContentCard } from './SidebarLayout';

const base = import.meta.env.BASE_URL;
const coverImage = `${base}cover.png`;

const mainPosts = articles.slice(0, 5).map(article => ({
  ...article,
  image: coverImage,
}));

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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      onClick={handleClick}
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid rgba(200, 200, 200, 0.3)',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
        <motion.img
          src={post.image}
          alt={post.title}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          left: '0.75rem',
          background: '#ff0040',
          color: '#fff',
          padding: '0.2rem 0.6rem',
          borderRadius: '15px',
          fontSize: '0.7rem',
          fontWeight: '600',
        }}>
          {post.category}
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#888' }}>
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.readTime}</span>
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', lineHeight: 1.4, color: '#1a1a1a' }}>
          {post.title}
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5, marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.excerpt}
        </p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{ padding: '0.15rem 0.4rem', background: 'rgba(255, 0, 64, 0.1)', borderRadius: '3px', fontSize: '0.65rem', color: '#ff0040' }}>
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
    <section id="blog" style={{ padding: 'clamp(2rem, 5vw, 4rem) 0', position: 'relative', zIndex: 1 }}>
      <PageLayout>
        <MainContentCard>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.5rem' }}>
            <span style={{ color: '#ff0040' }}>幕后</span>
          </h1>
          <p style={{ color: '#666', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid rgba(255, 0, 64, 0.2)' }}>
            一切都是为了正义
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {mainPosts.map((post, index) => (
              <BlogCard key={post.id} post={post} index={index} />
            ))}
          </div>

          {morePosts.length > 0 && (
            <div style={{ textAlign: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAll(true)}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'transparent',
                  border: '2px solid #ff0040',
                  color: '#ff0040',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderRadius: '25px',
                }}
              >
                查看全部
              </motion.button>
            </div>
          )}
        </MainContentCard>
      </PageLayout>

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
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '2rem 1rem',
              overflowY: 'auto',
            }}
            onClick={() => setShowAll(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '15px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '85vh',
                overflow: 'auto',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAll(false)}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'transparent',
                  border: '2px solid #ff0040',
                  color: '#ff0040',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>

              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1a1a1a', paddingRight: '2rem' }}>
                全部文章
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: '1rem' }}>
                {[...mainPosts, ...morePosts].map((post, index) => (
                  <BlogCard key={post.id} post={post} index={index} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default BlogSection;
