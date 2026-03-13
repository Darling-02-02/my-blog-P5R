const loadingGif =
  'https://media1.tenor.com/m/D9qVE6hPMLcAAAAd/korone-buffering-inugami-korone.gif';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = '页面加载中...' }: LoadingScreenProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'grid',
        placeItems: 'center',
        padding: '1.5rem',
        background:
          'radial-gradient(circle at top, rgba(255, 0, 64, 0.18), rgba(8, 8, 12, 0.96) 52%)',
      }}
    >
      <div
        style={{
          width: 'min(100%, 340px)',
          textAlign: 'center',
          display: 'grid',
          gap: '0.9rem',
        }}
      >
        <img
          src={loadingGif}
          alt="加载中"
          referrerPolicy="no-referrer"
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.45)',
          }}
        />
        <div
          style={{
            color: '#fff',
            fontSize: '0.95rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
