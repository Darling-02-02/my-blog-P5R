const Footer = () => {
  const runningTime = '0天 0时 0分 0秒';

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
