import { useEffect, useState } from 'react';

// 上线时刻：2026-10-03 是站点整体迁到 Cloudflare Pages 的那天（pipeline/cloudflare-pages-deployment.md
// 有记录），也就是 darling-02.cn 现在这套部署真正开始跑的日子。按别的日子算就改这一行。
const vpsLaunchedAt: string | null = '2026-10-03T00:00:00+08:00';
const blogStartedAt = vpsLaunchedAt ? new Date(vpsLaunchedAt).getTime() : Number.POSITIVE_INFINITY;

const formatRunningTime = (elapsed: number) => {
  const seconds = Math.max(0, Math.floor(elapsed / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${days}天 ${hours}时 ${minutes}分 ${seconds % 60}秒`;
};

const Footer = () => {
  const [runningTime, setRunningTime] = useState(() => formatRunningTime(Date.now() - blogStartedAt));

  useEffect(() => {
    const tick = () => setRunningTime(formatRunningTime(Date.now() - blogStartedAt));
    const timer = window.setInterval(tick, 1000);
    // 后台标签页里的定时器会被压到 1 分钟一跳，切回来立刻补齐。
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  return (
    <footer
      style={{
        background: 'var(--bg-footer)',
        borderTop: '2px solid var(--accent)',
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
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          灵敏度加满の博客已经运行了 <span style={{ color: 'var(--text-link)', fontWeight: '600' }}>{runningTime}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
