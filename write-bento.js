const fs = require('fs');
const content = `import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { articles } from '../data/articles';

const base = import.meta.env.BASE_URL;

const BentoCard = ({ 
  children, 
  className = '', 
  style = {},
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string; 
  style?: React.CSSProperties;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    className={\`bento-card \${className}\`}
    style={{
      background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.85) 0%, rgba(255, 192, 203, 0.75) 100%)',
      borderRadius: '20px',
      border: '2px solid rgba(255, 105, 180, 0.5)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(255, 105, 180, 0.2)',
      ...style,
    }}
  >
    {children}
  </motion.div>
);

const AboutCard = () => {
  const [isSpinning, setIsSpinning] = useState(false);

  const socials = [
    { name: 'QQ', icon: '💬', link: 'https://wpa.qq.com/msgrd?v=3&uin=1651816574' },
    { name: 'Bilibili', icon: '📺', link: 'https://space.bilibili.com/84526582' },
    { name: 'GitHub', icon: '🐙', link: 'https://github.com/Darling-02-02' },
    { name: 'Steam', icon: '🎮', link: 'https://steamcommunity.com/profiles/76561199175590351/' },
  ];

  return (
    <BentoCard className="about-card" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} delay={0}>
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div 
            onMouseEnter={() => setIsSpinning(true)}
            onAnimationEnd={() => setIsSpinning(false)}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: \`url(\${base}头像.jpg) center/cover\`,
              border: '3px solid #ff69b4',
              boxShadow: '0 0 20px rgba(255, 105, 180, 0.5)',
              cursor: 'pointer',
              animation: isSpinning ? 'avatarSpin 0.5s ease-out 3' : 'none',
            }}
          />
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1a1a1a', marginBottom: '0.25rem' }}>
              灵敏度加满
            </h2>
          </div>
        </div>
        <p style={{ color: '#4a4a4a', lineHeight: 1.8, flex: 1, fontSize: '1.1rem', fontWeight: '500' }}>
          无限进步。
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          {socials.map(social => (
            <motion.a
              key={social.name}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 105, 180, 0.3)',
                border: '2px solid #ff69b4',
                borderRadius: '12px',
                fontSize: '0.9rem',
                color: '#1a1a1a',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <span>{social.icon}</span>
            </motion.a>
          ))}
        </div>
      </div>
      <style>{\`
        @keyframes avatarSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      \`}</style>
    </BentoCard>
  );
};

const TimeWeatherCard = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <BentoCard delay={0.1}>
      <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#4a4a4a', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{getGreeting()}</p>
        <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1a1a1a' }}>
          {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p style={{ color: '#4a4a4a', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          {time.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </BentoCard>
  );
};

const StatsCard = () => {
  const stats = [
    { label: '文章', value: articles.length, icon: '📝' },
    { label: '分类', value: '4', icon: '📁' },
    { label: '运行天数', value: Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000), icon: '⏱️' },
  ];

  return (
    <BentoCard delay={0.2}>
      <div style={{ padding: '1.5rem', height: '100%' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ff69b4', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📊</span> 状态统计
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stats.map(stat => (
            <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#4a4a4a', fontSize: '0.9rem' }}>{stat.icon} {stat.label}</span>
              <span style={{ color: '#1a1a1a', fontWeight: '700', fontSize: '1.1rem' }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </BentoCard>
  );
};

const LifeListCard = () => {
  const lifeList = [
    { item: '健身', done: false },
    { item: '徒步', done: false },
    { item: '中长跑', done: false },
  ];

  return (
    <BentoCard style={{ gridColumn: 'span 2' }} delay={0.3}>
      <div style={{ padding: '1.5rem', height: '100%' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ff69b4', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🎯</span> 人生清单
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {lifeList.map((listItem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0',
              }}
            >
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid #ff69b4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: listItem.done ? '#ff69b4' : 'transparent',
              }}>
                {listItem.done && <span style={{ color: 'white', fontSize: '0.7rem' }}>✓</span>}
              </span>
              <span style={{ color: '#1a1a1a', fontSize: '0.95rem' }}>{listItem.item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </BentoCard>
  );
};

const RecentPostsCard = () => {
  const recentPosts = articles.slice(0, 3);

  return (
    <BentoCard style={{ gridRow: 'span 2' }} delay={0.4}>
      <div style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ff69b4', marginBottom: '1rem', dis
