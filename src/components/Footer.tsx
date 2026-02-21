import { useState, useEffect } from 'react';

const Footer = () => {
  const [runningTime, setRunningTime] = useState('');

  useEffect(() => {
    const startDate = new Date('2026-01-01');
    
    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - startDate.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setRunningTime(`${days}天 ${hours}时 ${minutes}分 ${seconds}秒`);
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <footer
      style={{
        background: 'rgba(26, 26, 26, 0.9)',
        borderTop: '2px solid #ff0040',
        padding: '1.5rem 2rem',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          灵敏度加满の博客已经运行了 <span style={{ color: '#ff0040', fontWeight: '600' }}>{runningTime}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
