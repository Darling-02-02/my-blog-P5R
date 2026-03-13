import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Header from './Header';
import Footer from './Footer';
import AICompanionPanel from './AICompanionPanel';
import type { ChatMessage } from './AICompanionPanel';

interface StudyUser {
  name: string;
}

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

interface ActiveSessionSnapshot {
  startedAt: number;
  sessionBaseSeconds: number;
  totalBaseSeconds: number;
}

const USER_KEY = 'study_room_user';
const TOTAL_SECONDS_KEY = 'study_room_total_seconds';
const TODO_KEY = 'study_room_todos';
const ACTIVE_SESSION_KEY = 'study_room_active_session';

const readJson = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const readStoredUser = () => readJson<StudyUser>(USER_KEY);

const readStoredTodos = (): TodoItem[] => readJson<TodoItem[]>(TODO_KEY) ?? [];

const readStoredTotalSeconds = () => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const parsed = Number(localStorage.getItem(TOTAL_SECONDS_KEY) ?? '0');
  return Number.isNaN(parsed) ? 0 : parsed;
};

const readActiveSession = () => readJson<ActiveSessionSnapshot>(ACTIVE_SESSION_KEY);

const toClock = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const StudyRoom = () => {
  const initialActiveSession = readActiveSession();
  const [user, setUser] = useState<StudyUser | null>(readStoredUser);
  const [nameInput, setNameInput] = useState('');
  const [todoInput, setTodoInput] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>(readStoredTodos);
  const [sessionBaseSeconds, setSessionBaseSeconds] = useState(initialActiveSession?.sessionBaseSeconds ?? 0);
  const [totalBaseSeconds, setTotalBaseSeconds] = useState(
    initialActiveSession?.totalBaseSeconds ?? readStoredTotalSeconds(),
  );
  const [startedAt, setStartedAt] = useState<number | null>(initialActiveSession?.startedAt ?? null);
  const [clockTick, setClockTick] = useState(Date.now());
  const [frameReady, setFrameReady] = useState(false);
  const [dialogMessage, setDialogMessage] = useState<ChatMessage>({
    role: 'assistant',
    content: '输入你的称呼，然后开始这轮自习。我会一直在右边盯着你。',
  });
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const frameSrc = `${import.meta.env.BASE_URL}live2d-frame.html`;
  const liveElapsed = startedAt ? Math.max(0, Math.floor((clockTick - startedAt) / 1000)) : 0;
  const sessionSeconds = sessionBaseSeconds + liveElapsed;
  const totalSeconds = totalBaseSeconds + liveElapsed;
  const isStudying = startedAt !== null;
  const completedCount = useMemo(() => todos.filter((todo) => todo.done).length, [todos]);

  useEffect(() => {
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(TOTAL_SECONDS_KEY, String(totalBaseSeconds));
  }, [totalBaseSeconds]);

  useEffect(() => {
    if (startedAt === null) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }

    localStorage.setItem(
      ACTIVE_SESSION_KEY,
      JSON.stringify({
        startedAt,
        sessionBaseSeconds,
        totalBaseSeconds,
      } satisfies ActiveSessionSnapshot),
    );
  }, [startedAt, sessionBaseSeconds, totalBaseSeconds]);

  useEffect(() => {
    if (!isStudying) {
      return;
    }

    const timer = window.setInterval(() => {
      setClockTick(Date.now());
    }, 250);

    return () => window.clearInterval(timer);
  }, [isStudying]);

  useEffect(() => {
    if (!frameReady) {
      return;
    }

    frameRef.current?.contentWindow?.postMessage(
      {
        type: 'live2d-dialog',
        payload: dialogMessage,
      },
      '*',
    );
  }, [dialogMessage, frameReady]);

  const commitElapsed = () => {
    if (startedAt === null) {
      return 0;
    }

    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    setSessionBaseSeconds((prev) => prev + elapsed);
    setTotalBaseSeconds((prev) => prev + elapsed);
    setStartedAt(null);
    setClockTick(Date.now());
    return elapsed;
  };

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();
    const name = nameInput.trim();

    if (!name) {
      return;
    }

    const nextUser = { name };
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setNameInput('');
    setDialogMessage({
      role: 'assistant',
      content: `欢迎回来，${name}。先把今天要做的事列出来，然后按开始学习。`,
    });
  };

  const handleLogout = () => {
    commitElapsed();
    setUser(null);
    localStorage.removeItem(USER_KEY);
    setDialogMessage({
      role: 'assistant',
      content: '今天先到这里。下次回来时，计时和待办都还在。',
    });
  };

  const handleToggleStudy = () => {
    if (isStudying) {
      const elapsed = commitElapsed();
      setDialogMessage({
        role: 'assistant',
        content: `先缓一口气。刚才这轮你已经专注了 ${toClock(elapsed || sessionSeconds)}。`,
      });
      return;
    }

    setStartedAt(Date.now());
    setClockTick(Date.now());
    setDialogMessage({
      role: 'assistant',
      content: '开始吧。我会把这轮时间盯紧，不再让计时慢半拍。',
    });
  };

  const handleResetSession = () => {
    if (isStudying) {
      commitElapsed();
    }

    setSessionBaseSeconds(0);
    setDialogMessage({
      role: 'assistant',
      content: '本轮自习已清零。重新整理一下，再开下一轮。',
    });
  };

  const addTodo = (event: FormEvent) => {
    event.preventDefault();
    const text = todoInput.trim();

    if (!text) {
      return;
    }

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
        className="study-room-shell"
        style={{
          minHeight: '100vh',
          padding: '6.5rem 1rem 2rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div
            style={{
              background: 'var(--bg-main-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                padding: '2rem',
                background:
                  'linear-gradient(135deg, rgba(255, 0, 64, 0.2) 0%, rgba(15, 15, 35, 0.7) 55%, rgba(0, 212, 255, 0.1) 100%)',
                borderBottom: '1px solid var(--border-card)',
              }}
            >
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', marginBottom: '0.65rem' }}>
                陪伴自习室
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', maxWidth: '42rem', lineHeight: 1.8 }}>
                这次把 Live2D 和 AI 对话收进了同一个人物区域，计时也改成了按真实时间差计算，不再靠定时器硬加秒。
              </p>
            </div>

            {!user ? (
              <div style={{ padding: '2rem' }}>
                <div
                  className="study-login-grid"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'stretch' }}
                >
                  <form
                    onSubmit={handleLogin}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '18px',
                      padding: '1.5rem',
                      display: 'grid',
                      gap: '0.9rem',
                    }}
                  >
                    <h2 style={{ color: 'var(--text-heading)', marginBottom: '0.2rem' }}>登录进入</h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                      输入你的称呼，直接进房间开始今天这轮学习。
                    </p>
                    <input
                      value={nameInput}
                      onChange={(event) => setNameInput(event.target.value)}
                      placeholder="请输入昵称"
                      style={{
                        width: '100%',
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-input)',
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        background: '#ff0040',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.9rem 1rem',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      进入自习室
                    </button>
                  </form>

                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-card)',
                      background: 'radial-gradient(circle at top, rgba(255, 0, 64, 0.2), rgba(12, 12, 18, 0.9) 58%)',
                      minHeight: '340px',
                    }}
                  >
                    <iframe
                      title="Live2D 学习搭子"
                      src={frameSrc}
                      onLoad={() => setFrameReady(true)}
                      ref={frameRef}
                      style={{ width: '100%', height: '100%', minHeight: '340px', border: 'none', background: 'transparent' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.5rem' }}>
                <div className="study-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '1rem' }}>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '18px',
                        padding: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>欢迎回来</div>
                          <div style={{ color: 'var(--text-heading)', fontSize: '1.25rem', fontWeight: 700 }}>{user.name}</div>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          style={{
                            border: '1px solid var(--border-card)',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            borderRadius: '10px',
                            padding: '0.5rem 0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          退出登录
                        </button>
                      </div>

                      <div className="study-timer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem', marginTop: '1rem' }}>
                        <div
                          style={{
                            padding: '1rem',
                            background: 'var(--bg-article-card)',
                            border: '1px solid var(--border-card)',
                            borderRadius: '14px',
                          }}
                        >
                          <div style={{ color: 'var(--text-muted)', marginBottom: '0.45rem' }}>本轮学习时长</div>
                          <div style={{ color: '#ff0040', fontWeight: 800, fontSize: '2rem', letterSpacing: '0.06em' }}>
                            {toClock(sessionSeconds)}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '1rem',
                            background: 'var(--bg-article-card)',
                            border: '1px solid var(--border-card)',
                            borderRadius: '14px',
                          }}
                        >
                          <div style={{ color: 'var(--text-muted)', marginBottom: '0.45rem' }}>累计学习时长</div>
                          <div style={{ color: 'var(--text-heading)', fontWeight: 800, fontSize: '2rem', letterSpacing: '0.06em' }}>
                            {toClock(totalSeconds)}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleToggleStudy}
                          style={{
                            background: isStudying ? 'var(--bg-hover)' : '#ff0040',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '0.78rem 1rem',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                        >
                          {isStudying ? '暂停学习' : '开始学习'}
                        </button>
                        <button
                          type="button"
                          onClick={handleResetSession}
                          style={{
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-card)',
                            borderRadius: '12px',
                            padding: '0.78rem 1rem',
                            cursor: 'pointer',
                          }}
                        >
                          清空本轮
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '18px',
                        padding: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                        <h2 style={{ color: 'var(--text-heading)', fontSize: '1.05rem' }}>学习待办</h2>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          已完成 {completedCount} / {todos.length}
                        </span>
                      </div>

                      <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.55rem', marginTop: '1rem' }}>
                        <input
                          value={todoInput}
                          onChange={(event) => setTodoInput(event.target.value)}
                          placeholder="添加本轮任务"
                          style={{
                            flex: 1,
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-input)',
                            borderRadius: '12px',
                            padding: '0.75rem 0.9rem',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="submit"
                          style={{
                            background: '#ff0040',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                        >
                          添加
                        </button>
                      </form>

                      <div style={{ marginTop: '0.9rem', display: 'grid', gap: '0.55rem' }}>
                        {todos.map((todo) => (
                          <div
                            key={todo.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.6rem',
                              border: '1px solid var(--border-card)',
                              borderRadius: '12px',
                              padding: '0.7rem 0.8rem',
                              background: 'var(--bg-article-card)',
                            }}
                          >
                            <label style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flex: 1 }}>
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
                              type="button"
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

                        {todos.length === 0 && (
                          <div
                            style={{
                              borderRadius: '12px',
                              border: '1px dashed var(--border-card)',
                              padding: '1rem',
                              color: 'var(--text-muted)',
                              textAlign: 'center',
                            }}
                          >
                            先写下这一轮最想完成的事。
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-card)',
                        borderRadius: '18px',
                        padding: '1.1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <div>
                          <h2 style={{ color: 'var(--text-heading)', fontSize: '1.05rem' }}>角色舞台</h2>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                            Live2D 常驻在线，AI 对话会同步进人物对话框。
                          </p>
                        </div>
                        <span
                          style={{
                            color: isStudying ? '#fff' : 'var(--text-primary)',
                            background: isStudying ? '#ff0040' : 'var(--bg-hover)',
                            borderRadius: '999px',
                            padding: '0.28rem 0.65rem',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                          }}
                        >
                          {isStudying ? '学习中' : '待机中'}
                        </span>
                      </div>

                      <div
                        style={{
                          position: 'relative',
                          borderRadius: '18px',
                          minHeight: '360px',
                          overflow: 'hidden',
                          background:
                            'radial-gradient(circle at top, rgba(255, 0, 64, 0.28), rgba(16, 16, 22, 0.92) 58%)',
                          border: '1px solid rgba(255, 0, 64, 0.25)',
                        }}
                      >
                        <iframe
                          title="Live2D 学习搭子"
                          src={frameSrc}
                          onLoad={() => setFrameReady(true)}
                          ref={frameRef}
                          style={{
                            width: '100%',
                            minHeight: '360px',
                            border: 'none',
                            background: 'transparent',
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: '0.85rem',
                          border: '1px solid var(--border-card)',
                          borderRadius: '14px',
                          background: 'var(--bg-article-card)',
                          padding: '0.8rem',
                          color: 'var(--text-body)',
                          lineHeight: 1.7,
                        }}
                      >
                        {dialogMessage.content}
                      </div>
                    </div>

                    <AICompanionPanel
                      isStudying={isStudying}
                      sessionSeconds={sessionSeconds}
                      onDialogChange={(message) => setDialogMessage(message)}
                    />
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
          .study-grid,
          .study-login-grid,
          .study-timer-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .study-room-shell {
            padding: 5.6rem 0.8rem 1.4rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default StudyRoom;
