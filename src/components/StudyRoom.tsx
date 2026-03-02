import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Header from './Header';
import Footer from './Footer';
import AICompanionPanel from './AICompanionPanel';

interface StudyUser {
  name: string;
}

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

const USER_KEY = 'study_room_user';
const TOTAL_SECONDS_KEY = 'study_room_total_seconds';
const TODO_KEY = 'study_room_todos';
const LIVE2D_ENABLED_KEY = 'study_room_live2d_enabled';

const companionLines = [
  '先专注 25 分钟，我会一直陪着你。',
  '一点点进步，也是在变强。',
  '按自己的节奏来，你做得很好。',
  '这一轮结束后记得休息一下。',
  '再坚持一步，我们就离目标更近。',
];

const toClock = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

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
  const [user, setUser] = useState<StudyUser | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [todoInput, setTodoInput] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [live2dEnabled, setLive2dEnabled] = useState(false);
  const totalSecondsRef = useRef(0);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedTodos = localStorage.getItem(TODO_KEY);
    const savedTotalSeconds = Number(localStorage.getItem(TOTAL_SECONDS_KEY) ?? '0');
    const savedLive2dEnabled = localStorage.getItem(LIVE2D_ENABLED_KEY);

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as StudyUser);
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }

    if (!Number.isNaN(savedTotalSeconds) && savedTotalSeconds > 0) {
      setTotalSeconds(savedTotalSeconds);
    }

    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos) as TodoItem[]);
      } catch {
        localStorage.removeItem(TODO_KEY);
      }
    }

    setLive2dEnabled(savedLive2dEnabled === '1');
  }, []);

  useEffect(() => {
    totalSecondsRef.current = totalSeconds;
  }, [totalSeconds]);

  useEffect(() => {
    const persistTotal = () => {
      localStorage.setItem(TOTAL_SECONDS_KEY, String(totalSecondsRef.current));
    };

    const saveInterval = window.setInterval(persistTotal, 10000);
    window.addEventListener('beforeunload', persistTotal);
    return () => {
      window.clearInterval(saveInterval);
      window.removeEventListener('beforeunload', persistTotal);
      persistTotal();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(LIVE2D_ENABLED_KEY, live2dEnabled ? '1' : '0');
  }, [live2dEnabled]);

  useEffect(() => {
    if (!isStudying) return;
    const timer = window.setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
      setTotalSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isStudying]);

  useEffect(() => {
    const speaker = window.setInterval(() => {
      setLineIndex((prev) => (prev + 1) % companionLines.length);
    }, 12000);
    return () => window.clearInterval(speaker);
  }, []);

  const completedCount = useMemo(() => todos.filter((t) => t.done).length, [todos]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;

    const nextUser = { name };
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setNameInput('');
  };

  const handleLogout = () => {
    setIsStudying(false);
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  const addTodo = (e: FormEvent) => {
    e.preventDefault();
    const text = todoInput.trim();
    if (!text) return;
    setTodos((prev) => [...prev, { id: Date.now(), text, done: false }]);
    setTodoInput('');
  };

  const toggleTodo = (id: number) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  };

  const removeTodo = (id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

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
              <div style={{ padding: '2rem' }}>
                <form
                  onSubmit={handleLogin}
                  style={{
                    maxWidth: '460px',
                    margin: '0 auto',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '14px',
                    padding: '1.5rem',
                  }}
                >
                  <h2 style={{ color: 'var(--text-heading)', marginBottom: '0.8rem' }}>登录进入</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>输入昵称即可进入你的自习室。</p>
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="请输入昵称"
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '10px',
                      padding: '0.8rem 0.95rem',
                      outline: 'none',
                      marginBottom: '0.9rem',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: '#ff0040',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.82rem 1rem',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    进入自习室
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ padding: '1.5rem' }}>
                <div className="study-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '1rem' }}>
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>欢迎回来</div>
                        <div style={{ color: 'var(--text-heading)', fontSize: '1.2rem', fontWeight: 700 }}>{user.name}</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        style={{
                          border: '1px solid var(--border-card)',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          borderRadius: '8px',
                          padding: '0.45rem 0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        退出登录
                      </button>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'var(--bg-article-card)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '12px',
                      }}
                    >
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.45rem' }}>本次学习时长</div>
                      <div style={{ color: '#ff0040', fontWeight: 800, fontSize: '2rem', letterSpacing: '1px' }}>
                        {toClock(sessionSeconds)}
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        累计学习时长：{toClock(totalSeconds)}
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setIsStudying((prev) => !prev)}
                        style={{
                          background: isStudying ? 'var(--bg-hover)' : '#ff0040',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        {isStudying ? '暂停学习' : '开始学习'}
                      </button>
                      <button
                        onClick={() => {
                          setIsStudying(false);
                          setSessionSeconds(0);
                        }}
                        style={{
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-card)',
                          borderRadius: '10px',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                        }}
                      >
                        结束本次学习
                      </button>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.55rem' }}>
                        <input
                          value={todoInput}
                          onChange={(e) => setTodoInput(e.target.value)}
                          placeholder="添加学习任务"
                          style={{
                            flex: 1,
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-input)',
                            borderRadius: '10px',
                            padding: '0.7rem 0.9rem',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="submit"
                          style={{
                            background: '#ff0040',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '0.7rem 0.95rem',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                        >
                          添加
                        </button>
                      </form>

                      <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        已完成 {completedCount} / {todos.length}
                      </div>
                      <div style={{ marginTop: '0.65rem', display: 'grid', gap: '0.55rem' }}>
                        {todos.map((todo) => (
                          <div
                            key={todo.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.6rem',
                              border: '1px solid var(--border-card)',
                              borderRadius: '10px',
                              padding: '0.6rem 0.7rem',
                              background: 'var(--bg-article-card)',
                            }}
                          >
                            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                              <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
                              <span
                                style={{
                                  color: 'var(--text-body)',
                                  textDecoration: todo.done ? 'line-through' : 'none',
                                  opacity: todo.done ? 0.7 : 1,
                                }}
                              >
                                {todo.text}
                              </span>
                            </label>
                            <button
                              onClick={() => removeTodo(todo.id)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#ff0040',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              删除
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '14px',
                      padding: '1.2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    <h2 style={{ color: 'var(--text-heading)', fontSize: '1.1rem' }}>学习伙伴</h2>
                    <button
                      onClick={() => setLive2dEnabled((prev) => !prev)}
                      style={{
                        border: '1px solid var(--border-card)',
                        background: 'var(--bg-hover)',
                        color: 'var(--text-primary)',
                        borderRadius: '10px',
                        padding: '0.6rem 0.8rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {live2dEnabled ? '关闭 Live2D（更流畅）' : '开启 Live2D'}
                    </button>

                    {live2dEnabled && !isStudying ? (
                      <Live2DCompanion />
                    ) : live2dEnabled && isStudying ? (
                      <div
                        style={{
                          borderRadius: '14px',
                          minHeight: '260px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          border: '1px solid rgba(255, 0, 64, 0.2)',
                          background:
                            'radial-gradient(circle at 30% 20%, rgba(255,0,64,0.18) 0%, rgba(255,0,64,0.06) 40%, rgba(26,26,26,0.55) 100%)',
                        }}
                      >
                        学习进行中已暂停 Live2D，以保证流畅度。
                      </div>
                    ) : (
                      <div
                        style={{
                          borderRadius: '14px',
                          minHeight: '260px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          border: '1px solid rgba(255, 0, 64, 0.2)',
                          background:
                            'radial-gradient(circle at 30% 20%, rgba(255,0,64,0.18) 0%, rgba(255,0,64,0.06) 40%, rgba(26,26,26,0.55) 100%)',
                        }}
                      >
                        当前为性能模式，Live2D 已关闭。
                      </div>
                    )}

                    <div
                      style={{
                        border: '1px solid var(--border-card)',
                        borderRadius: '10px',
                        background: 'var(--bg-article-card)',
                        padding: '0.8rem',
                        color: 'var(--text-body)',
                        lineHeight: 1.7,
                      }}
                    >
                      {isStudying ? companionLines[lineIndex] : '点击“开始学习”，我会陪你进入状态。'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      如果你设备性能较低，建议学习时关闭 Live2D。
                    </div>

                    <AICompanionPanel isStudying={isStudying} sessionSeconds={sessionSeconds} />
                  </div>
                </div>
              </div>
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
