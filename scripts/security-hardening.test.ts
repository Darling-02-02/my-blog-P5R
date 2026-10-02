import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearAICompanionStorage,
  loadStoredTodos,
  loadStoredTotalSeconds,
  saveStoredTodos,
  saveStoredTotalSeconds,
} from '../src/lib/studyRoomStorage.ts';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
};

test('study room data is isolated by nickname', () => {
  const storage = createStorage();
  const todos = [{ id: 1, text: 'Alice task', done: false }];

  saveStoredTotalSeconds(storage, 'Alice', 90);
  saveStoredTodos(storage, 'Alice', todos);

  assert.equal(loadStoredTotalSeconds(storage, 'Alice'), 90);
  assert.deepEqual(loadStoredTodos(storage, 'Alice'), todos);
  assert.equal(loadStoredTotalSeconds(storage, 'Bob'), 0);
  assert.deepEqual(loadStoredTodos(storage, 'Bob'), []);
});

test('clearing AI companion storage removes every persisted provider setting', () => {
  const storage = createStorage();
  storage.setItem('study_ai_api_base', 'https://example.test/v1');
  storage.setItem('study_ai_api_key', 'dummy-key');
  storage.setItem('study_ai_model', 'dummy-model');

  clearAICompanionStorage(storage);

  assert.equal(storage.getItem('study_ai_api_base'), null);
  assert.equal(storage.getItem('study_ai_api_key'), null);
  assert.equal(storage.getItem('study_ai_model'), null);
});
