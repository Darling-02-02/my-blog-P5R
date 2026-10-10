import { useEffect, useState } from 'react';

// VPS 上线时刻：正式部署那天把 ISO 时间填在这里（只放这一个日期，其余全是算出来的）。
// 空着 = 还没开始计时，显示 0天 0时 0分 0秒，不拿仓库第一次提交的日期冒充运行时长。
const vpsLaunchedAt: string | null = null;
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
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          灵敏度加满の博客已经运行了 <span style={{ color: '#ff0040', fontWeight: '600' }}>{runningTime}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
