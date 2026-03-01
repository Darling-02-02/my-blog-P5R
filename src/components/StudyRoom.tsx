import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';

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

const companionLines = [
  'Focus for 25 minutes. I will stay here with you.',
  'Small progress is still progress.',
  'Keep your pace steady. You are doing well.',
  'Take a short break after this round.',
  'One more step, then we celebrate.',
];

const toClock = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const StudyRoom = () => {
  const [user, setUser] = useState<StudyUser | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [todoInput, setTodoInput] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as StudyUser);
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }

    const savedTotalSeconds = Number(localStorage.getItem(TOTAL_SECONDS_KEY) ?? '0');
    if (!Number.isNaN(savedTotalSeconds) && savedTotalSeconds > 0) {
      setTotalSeconds(savedTotalSeconds);
    }

    const savedTodos = localStorage.getItem(TODO_KEY);
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos) as TodoItem[]);
      } catch {
        localStorage.removeItem(TODO_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TOTAL_SECONDS_KEY, String(totalSeconds));
  }, [totalSeconds]);

  useEffect(() => {
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
  }, [todos]);

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
                Companion Study Room
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.9)' }}>
                Login, start study session, and stay focused with your anime companion.
              </p>
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
                  <h2 style={{ color: 'var(--text-heading)', marginBottom: '0.8rem' }}>Login to Enter</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Use any nickname to enter your private self-study room.
                  </p>
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your nickname"
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
                    Enter Study Room
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
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome back</div>
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
                        Logout
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
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.45rem' }}>Current Session</div>
                      <div style={{ color: '#ff0040', fontWeight: 800, fontSize: '2rem', letterSpacing: '1px' }}>
                        {toClock(sessionSeconds)}
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Total accumulated: {toClock(totalSeconds)}
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
                        {isStudying ? 'Pause' : 'Start Study'}
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
                        End Session
                      </button>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.55rem' }}>
                        <input
                          value={todoInput}
                          onChange={(e) => setTodoInput(e.target.value)}
                          placeholder="Add a study task"
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
                          Add
                        </button>
                      </form>

                      <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Completed {completedCount} / {todos.length}
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
                              Remove
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
                    <h2 style={{ color: 'var(--text-heading)', fontSize: '1.1rem' }}>Companion</h2>
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [0, -1, 1, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        position: 'relative',
                        borderRadius: '14px',
                        minHeight: '240px',
                        background:
                          'radial-gradient(circle at 30% 20%, rgba(255,0,64,0.3) 0%, rgba(255,0,64,0.08) 40%, rgba(26,26,26,0.7) 100%)',
                        border: '1px solid rgba(255, 0, 64, 0.35)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 'auto 0 0 0',
                          height: '65%',
                          background:
                            'linear-gradient(180deg, rgba(255,0,64,0.2) 0%, rgba(255,0,64,0.35) 30%, rgba(10,10,10,0.9) 100%)',
                          clipPath: 'polygon(16% 15%, 50% 0%, 84% 15%, 100% 100%, 0% 100%)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '16%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '118px',
                          height: '118px',
                          borderRadius: '50%',
                          background: 'linear-gradient(145deg, #ffd3de 0%, #ff9eb7 100%)',
                          border: '3px solid rgba(255,255,255,0.75)',
                          boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '37%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          color: '#fff',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          textShadow: '0 2px 10px rgba(0,0,0,0.6)',
                        }}
                      >
                        AOI
                      </div>
                    </motion.div>

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
                      {isStudying ? companionLines[lineIndex] : 'Press "Start Study" and I will guide your rhythm.'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Live2D-ready slot: this panel can be replaced with a real Live2D model later.
                    </div>
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
