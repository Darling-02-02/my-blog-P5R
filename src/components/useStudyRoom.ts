import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { StoredTodo } from '../lib/studyRoomStorage';
import {
  LIVE2D_ENABLED_KEY,
  USER_KEY,
  clearAICompanionStorage,
  loadStoredTodos,
  loadStoredTotalSeconds,
  migrateLegacyStudyData,
  saveStoredTodos,
  saveStoredTotalSeconds,
} from '../lib/studyRoomStorage';

export interface StudyUser {
  name: string;
}

export interface StudyRoomState {
  user: StudyUser | null;
  nameInput: string;
  setNameInput: (value: string) => void;
  isStudying: boolean;
  toggleStudying: () => void;
  stopStudying: () => void;
  sessionSeconds: number;
  totalSeconds: number;
  lineIndex: number;
  todoInput: string;
  setTodoInput: (value: string) => void;
  todos: StoredTodo[];
  completedCount: number;
  live2dEnabled: boolean;
  toggleLive2d: () => void;
  handleLogin: (e: FormEvent) => void;
  handleLogout: () => void;
  addTodo: (e: FormEvent) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
}

const readStoredUser = (): StudyUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const savedUser = localStorage.getItem(USER_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as StudyUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

const readStoredLive2DEnabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(LIVE2D_ENABLED_KEY) === '1';
};

// 自习室的登录用户、计时、任务与 Live2D 开关状态编排，含 localStorage 读写时机
export const useStudyRoom = (companionLineCount: number): StudyRoomState => {
  const initialUser = readStoredUser();
  const [user, setUser] = useState<StudyUser | null>(initialUser);
  const [nameInput, setNameInput] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(() => {
    if (!initialUser || typeof window === 'undefined') return 0;
    migrateLegacyStudyData(localStorage, initialUser.name);
    return loadStoredTotalSeconds(localStorage, initialUser.name);
  });
  const [lineIndex, setLineIndex] = useState(0);
  const [todoInput, setTodoInput] = useState('');
  const [todos, setTodos] = useState<StoredTodo[]>(() => {
    if (!initialUser || typeof window === 'undefined') return [];
    return loadStoredTodos(localStorage, initialUser.name);
  });
  const [live2dEnabled, setLive2dEnabled] = useState(readStoredLive2DEnabled);
  const totalSecondsRef = useRef(0);
  const userNameRef = useRef<string | null>(initialUser?.name ?? null);

  useEffect(() => {
    totalSecondsRef.current = totalSeconds;
  }, [totalSeconds]);

  useEffect(() => {
    userNameRef.current = user?.name ?? null;
  }, [user?.name]);

  useEffect(() => {
    const persistTotal = () => {
      const name = userNameRef.current;
      if (!name) return;
      saveStoredTotalSeconds(localStorage, name, totalSecondsRef.current);
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
    if (!user) return;
    saveStoredTodos(localStorage, user.name, todos);
  }, [todos, user]);

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
      setLineIndex((prev) => (prev + 1) % companionLineCount);
    }, 12000);
    return () => window.clearInterval(speaker);
  }, [companionLineCount]);

  const completedCount = useMemo(() => todos.filter((t) => t.done).length, [todos]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;

    const nextUser = { name };
    migrateLegacyStudyData(localStorage, name);
    setTotalSeconds(loadStoredTotalSeconds(localStorage, name));
    setTodos(loadStoredTodos(localStorage, name));
    setSessionSeconds(0);
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setNameInput('');
  };

  const handleLogout = () => {
    const name = user?.name;
    if (name) {
      saveStoredTotalSeconds(localStorage, name, totalSecondsRef.current);
      saveStoredTodos(localStorage, name, todos);
    }
    setIsStudying(false);
    setSessionSeconds(0);
    setTotalSeconds(0);
    setTodos([]);
    setTodoInput('');
    setUser(null);
    clearAICompanionStorage(localStorage);
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

  return {
    user,
    nameInput,
    setNameInput,
    isStudying,
    toggleStudying: () => setIsStudying((prev) => !prev),
    stopStudying: () => {
      setIsStudying(false);
      setSessionSeconds(0);
    },
    sessionSeconds,
    totalSeconds,
    lineIndex,
    todoInput,
    setTodoInput,
    todos,
    completedCount,
    live2dEnabled,
    toggleLive2d: () => setLive2dEnabled((prev) => !prev),
    handleLogin,
    handleLogout,
    addTodo,
    toggleTodo,
    removeTodo,
  };
};
