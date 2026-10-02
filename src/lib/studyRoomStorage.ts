export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StoredTodo {
  id: number;
  text: string;
  done: boolean;
}

export const USER_KEY = 'study_room_user';
export const LIVE2D_ENABLED_KEY = 'study_room_live2d_enabled';

const TOTAL_SECONDS_KEY = 'study_room_total_seconds';
const TODO_KEY = 'study_room_todos';
const SCOPED_TOTAL_SECONDS_PREFIX = 'study_room_total_seconds:';
const SCOPED_TODO_PREFIX = 'study_room_todos:';

export const AI_API_BASE_KEY = 'study_ai_api_base';
export const AI_API_KEY = 'study_ai_api_key';
export const AI_MODEL_KEY = 'study_ai_model';

const scopedKey = (prefix: string, name: string) => `${prefix}${encodeURIComponent(name.trim())}`;

const parseTodos = (value: string | null): StoredTodo[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (todo): todo is StoredTodo =>
        typeof todo === 'object' &&
        todo !== null &&
        typeof (todo as StoredTodo).id === 'number' &&
        typeof (todo as StoredTodo).text === 'string' &&
        typeof (todo as StoredTodo).done === 'boolean',
    );
  } catch {
    return [];
  }
};

export const loadStoredTotalSeconds = (storage: KeyValueStorage, name: string) => {
  const value = Number(storage.getItem(scopedKey(SCOPED_TOTAL_SECONDS_PREFIX, name)) ?? '0');
  return Number.isFinite(value) && value >= 0 ? value : 0;
};

export const saveStoredTotalSeconds = (storage: KeyValueStorage, name: string, seconds: number) => {
  storage.setItem(scopedKey(SCOPED_TOTAL_SECONDS_PREFIX, name), String(Math.max(0, Math.floor(seconds))));
};

export const loadStoredTodos = (storage: KeyValueStorage, name: string) =>
  parseTodos(storage.getItem(scopedKey(SCOPED_TODO_PREFIX, name)));

export const saveStoredTodos = (storage: KeyValueStorage, name: string, todos: StoredTodo[]) => {
  storage.setItem(scopedKey(SCOPED_TODO_PREFIX, name), JSON.stringify(todos));
};

export const migrateLegacyStudyData = (storage: KeyValueStorage, name: string) => {
  if (!name.trim()) return;

  const scopedTotalKey = scopedKey(SCOPED_TOTAL_SECONDS_PREFIX, name);
  const scopedTodoKey = scopedKey(SCOPED_TODO_PREFIX, name);
  const legacyTotal = storage.getItem(TOTAL_SECONDS_KEY);
  const legacyTodos = storage.getItem(TODO_KEY);

  if (!storage.getItem(scopedTotalKey) && legacyTotal !== null) {
    const total = Number(legacyTotal);
    if (Number.isFinite(total) && total >= 0) {
      saveStoredTotalSeconds(storage, name, total);
    }
  }

  if (!storage.getItem(scopedTodoKey) && legacyTodos !== null) {
    saveStoredTodos(storage, name, parseTodos(legacyTodos));
  }

  storage.removeItem(TOTAL_SECONDS_KEY);
  storage.removeItem(TODO_KEY);
};

export const clearAICompanionStorage = (storage: KeyValueStorage) => {
  storage.removeItem(AI_API_BASE_KEY);
  storage.removeItem(AI_API_KEY);
  storage.removeItem(AI_MODEL_KEY);
};
