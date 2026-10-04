import type { ComponentType, FormEvent } from 'react';
import type { StoredTodo } from '../lib/studyRoomStorage';
import AICompanionPanel from './AICompanionPanel';
import type { StudyUser } from './useStudyRoom';

// 自习室的纯展示区块：登录卡片、计时/任务面板、学习伙伴面板
interface LoginProps {
  nameInput: string;
  setNameInput: (value: string) => void;
  handleLogin: (e: FormEvent) => void;
}

export const StudyLoginSection = ({ nameInput, setNameInput, handleLogin }: LoginProps) => (
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
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>输入昵称即可进入你的自习室；数据按本机昵称隔离，不代表账号认证。</p>
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
);

const toClock = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const performancePanelStyle = {
  borderRadius: '14px',
  minHeight: '260px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-muted)',
  border: '1px solid rgba(255, 0, 64, 0.2)',
  background:
    'radial-gradient(circle at 30% 20%, rgba(255,0,64,0.18) 0%, rgba(255,0,64,0.06) 40%, rgba(26,26,26,0.55) 100%)',
};

interface CompanionPanelProps {
  isStudying: boolean;
  sessionSeconds: number;
  live2dEnabled: boolean;
  toggleLive2d: () => void;
  companionLine: string;
  Companion: ComponentType;
}

export const StudyCompanionPanel = ({
  isStudying,
  sessionSeconds,
  live2dEnabled,
  toggleLive2d,
  companionLine,
  Companion,
}: CompanionPanelProps) => (
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
      onClick={toggleLive2d}
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
      <Companion />
    ) : live2dEnabled && isStudying ? (
      <div style={performancePanelStyle}>学习进行中已暂停 Live2D，以保证流畅度。</div>
    ) : (
      <div style={performancePanelStyle}>当前为性能模式，Live2D 已关闭。</div>
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
      {isStudying ? companionLine : '点击“开始学习”，我会陪你进入状态。'}
    </div>
    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      如果你设备性能较低，建议学习时关闭 Live2D。
    </div>

    <AICompanionPanel isStudying={isStudying} sessionSeconds={sessionSeconds} />
  </div>
);

interface DashboardProps {
  user: StudyUser;
  isStudying: boolean;
  toggleStudying: () => void;
  stopStudying: () => void;
  sessionSeconds: number;
  totalSeconds: number;
  todoInput: string;
  setTodoInput: (value: string) => void;
  todos: StoredTodo[];
  completedCount: number;
  live2dEnabled: boolean;
  toggleLive2d: () => void;
  handleLogout: () => void;
  addTodo: (e: FormEvent) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
  companionLine: string;
  Companion: ComponentType;
}

export const StudyRoomDashboard = ({
  user,
  isStudying,
  toggleStudying,
  stopStudying,
  sessionSeconds,
  totalSeconds,
  todoInput,
  setTodoInput,
  todos,
  completedCount,
  live2dEnabled,
  toggleLive2d,
  handleLogout,
  addTodo,
  toggleTodo,
  removeTodo,
  companionLine,
  Companion,
}: DashboardProps) => (
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
            onClick={toggleStudying}
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
            onClick={stopStudying}
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

      <StudyCompanionPanel
        isStudying={isStudying}
        sessionSeconds={sessionSeconds}
        live2dEnabled={live2dEnabled}
        toggleLive2d={toggleLive2d}
        companionLine={companionLine}
        Companion={Companion}
      />
    </div>
  </div>
);
