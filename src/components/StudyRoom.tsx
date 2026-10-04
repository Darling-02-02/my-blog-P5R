import { memo, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { StudyLoginSection, StudyRoomDashboard } from './StudyRoomSections';
import { useStudyRoom } from './useStudyRoom';

// 陪伴自习室页面骨架：页面容器、登录分支与 Live2D 伙伴组件
const companionLines = [
  '先专注 25 分钟，我会一直陪着你。',
  '一点点进步，也是在变强。',
  '按自己的节奏来，你做得很好。',
  '这一轮结束后记得休息一下。',
  '再坚持一步，我们就离目标更近。',
];

const Live2DCompanion = memo(() => {
  const [loaded, setLoaded] = useState(false);
  const frameSrc = `${import.meta.env.BASE_URL}live2d-frame.html`;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '14px',
        minHeight: '260px',
        background:
          'radial-gradient(circle at 30% 20%, rgba(255,0,64,0.3) 0%, rgba(255,0,64,0.08) 40%, rgba(26,26,26,0.7) 100%)',
        border: '1px solid rgba(255, 0, 64, 0.35)',
        overflow: 'hidden',
      }}
    >
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            background: 'rgba(10,10,10,0.35)',
            fontSize: '0.92rem',
          }}
        >
          正在加载 Live2D...
        </div>
      )}

      <iframe
        title="Live2D 学习伙伴"
        src={frameSrc}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        loading="lazy"
        style={{
          width: '100%',
          height: '260px',
          border: 'none',
          background: 'transparent',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '0.8rem',
          bottom: '0.75rem',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.78rem',
        }}
      >
        Live2D 采用隔离模式运行，避免影响页面稳定性。
      </div>
    </div>
  );
});

const StudyRoom = () => {
  const {
    user,
    nameInput,
    setNameInput,
    isStudying,
    toggleStudying,
    stopStudying,
    sessionSeconds,
    totalSeconds,
    lineIndex,
    todoInput,
    setTodoInput,
    todos,
    completedCount,
    live2dEnabled,
    toggleLive2d,
    handleLogin,
    handleLogout,
    addTodo,
    toggleTodo,
    removeTodo,
  } = useStudyRoom(companionLines.length);

  return (
    <>
      <Header />
      <section
        style={{
          minHeight: '100vh',
          padding: '6.5rem 1rem 2rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              background: 'var(--bg-main-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                padding: '2rem',
                background:
                  'linear-gradient(135deg, rgba(255,0,64,0.24) 0%, rgba(15,15,35,0.62) 55%, rgba(0,212,255,0.12) 100%)',
                borderBottom: '1px solid var(--border-card)',
              }}
            >
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#fff', marginBottom: '0.65rem' }}>
                陪伴自习室
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)' }}>登录后即可开始学习计时，和二次元伙伴一起专注。</p>
            </div>

            {!user ? (
              <StudyLoginSection nameInput={nameInput} setNameInput={setNameInput} handleLogin={handleLogin} />
            ) : (
              <StudyRoomDashboard
                user={user}
                isStudying={isStudying}
                toggleStudying={toggleStudying}
                stopStudying={stopStudying}
                sessionSeconds={sessionSeconds}
                totalSeconds={totalSeconds}
                todoInput={todoInput}
                setTodoInput={setTodoInput}
                todos={todos}
                completedCount={completedCount}
                live2dEnabled={live2dEnabled}
                toggleLive2d={toggleLive2d}
                handleLogout={handleLogout}
                addTodo={addTodo}
                toggleTodo={toggleTodo}
                removeTodo={removeTodo}
                companionLine={companionLines[lineIndex]}
                Companion={Live2DCompanion}
              />
            )}
          </div>
        </div>
      </section>
      <Footer />

      <style>{`
        @media (max-width: 980px) {
          .study-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
};

export default StudyRoom;
