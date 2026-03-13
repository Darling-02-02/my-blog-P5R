import { useEffect, useMemo, useState } from 'react';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface AICompanionPanelProps {
  isStudying: boolean;
  sessionSeconds: number;
  onDialogChange?: (message: ChatMessage) => void;
}

const API_BASE_KEY = 'study_ai_api_base';
const API_KEY_KEY = 'study_ai_api_key';
const MODEL_KEY = 'study_ai_model';

const starterTips = [
  '帮我安排 25 分钟专注冲刺',
  '我有点分心，给我 3 条拉回状态的建议',
  '根据我现在的学习时长，帮我做个简短复盘',
];

const toClock = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const AICompanionPanel = ({ isStudying, sessionSeconds, onDialogChange }: AICompanionPanelProps) => {
  const [apiBase, setApiBase] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '我已经到位了。你可以让我拆任务、抽问、复盘，或者单纯提醒你别分心。',
    },
  ]);

  useEffect(() => {
    const savedBase = localStorage.getItem(API_BASE_KEY);
    const savedKey = localStorage.getItem(API_KEY_KEY);
    const savedModel = localStorage.getItem(MODEL_KEY);

    if (savedBase) setApiBase(savedBase);
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setModel(savedModel);
  }, []);

  useEffect(() => {
    localStorage.setItem(API_BASE_KEY, apiBase);
  }, [apiBase]);

  useEffect(() => {
    localStorage.setItem(API_KEY_KEY, apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem(MODEL_KEY, model);
  }, [model]);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      onDialogChange?.(latestMessage);
    }
  }, [messages, onDialogChange]);

  const studyStatus = useMemo(
    () => (isStudying ? `正在学习中，本轮已坚持 ${toClock(sessionSeconds)}` : '当前还没有开始学习'),
    [isStudying, sessionSeconds],
  );

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();

    if (!trimmed || sending) {
      return;
    }

    if (!apiBase.trim() || !apiKey.trim() || !model.trim()) {
      setError('请先填写 API Base、API Key 和模型名。');
      return;
    }

    setError('');
    setSending(true);

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setPrompt('');

    try {
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                '你是中文学习搭子，回答要短、稳、可执行。优先给明确步骤、专注建议和复盘意见，不要空泛安慰。',
            },
            {
              role: 'system',
              content: `用户学习状态：${studyStatus}`,
            },
            ...nextMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const textBody = await response.text();
        throw new Error(`请求失败（${response.status}）${textBody.slice(0, 120)}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('接口已返回，但没有拿到可用回复。');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : '请求失败，请检查网络和接口配置。';

      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '接口这边没有通。我先留在这里，等你把地址、Key 或跨域配置调好。',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-card)',
        borderRadius: '18px',
        background: 'var(--bg-article-card)',
        padding: '1rem',
        display: 'grid',
        gap: '0.85rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)' }}>AI 对话台</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>{studyStatus}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings((prev) => !prev)}
          style={{
            border: '1px solid var(--border-card)',
            background: 'transparent',
            color: 'var(--text-primary)',
            borderRadius: '999px',
            padding: '0.45rem 0.8rem',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          {showSettings ? '收起设置' : '接口设置'}
        </button>
      </div>

      {showSettings && (
        <div style={{ display: 'grid', gap: '0.45rem' }}>
          <input
            value={apiBase}
            onChange={(event) => setApiBase(event.target.value)}
            placeholder="API Base，例如 https://api.openai.com/v1"
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              padding: '0.6rem 0.75rem',
              outline: 'none',
            }}
          />
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="API Key"
            type="password"
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              padding: '0.6rem 0.75rem',
              outline: 'none',
            }}
          />
          <input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="模型名，例如 gpt-4o-mini"
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-input)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              padding: '0.6rem 0.75rem',
              outline: 'none',
            }}
          />
        </div>
      )}

      <div
        style={{
          border: '1px solid var(--border-card)',
          borderRadius: '14px',
          padding: '0.75rem',
          maxHeight: '220px',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          display: 'grid',
          gap: '0.6rem',
        }}
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            style={{
              justifySelf: message.role === 'user' ? 'end' : 'start',
              maxWidth: '90%',
              padding: '0.7rem 0.85rem',
              borderRadius: '14px',
              background: message.role === 'user' ? 'rgba(255, 0, 64, 0.14)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                color: message.role === 'user' ? '#ff7a95' : 'var(--text-secondary)',
                marginBottom: '0.25rem',
                fontWeight: 700,
              }}
            >
              {message.role === 'user' ? '你' : '搭子'}
            </div>
            <div style={{ fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text-body)' }}>{message.content}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
        {starterTips.map((tip) => (
          <button
            key={tip}
            type="button"
            onClick={() => void sendMessage(tip)}
            style={{
              border: '1px solid var(--border-tag)',
              background: 'var(--bg-tag)',
              color: '#ff0040',
              borderRadius: '999px',
              padding: '0.32rem 0.7rem',
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
          >
            {tip}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(prompt);
        }}
        style={{ display: 'flex', gap: '0.55rem', alignItems: 'stretch' }}
      >
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="和角色说点什么，例如：帮我把这轮学习拆成 3 步"
          style={{
            flex: 1,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            padding: '0.7rem 0.8rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{
            border: 'none',
            background: sending ? 'var(--bg-hover)' : '#ff0040',
            color: '#fff',
            borderRadius: '10px',
            padding: '0.7rem 0.95rem',
            fontWeight: 700,
            cursor: sending ? 'not-allowed' : 'pointer',
            minWidth: '84px',
          }}
        >
          {sending ? '发送中' : '发送'}
        </button>
      </form>

      {error && <div style={{ fontSize: '0.8rem', color: '#ff8f9d' }}>{error}</div>}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        当前仍是前端直连接口模式，Key 会保存在本地浏览器里。正式长期使用前，最好改成后端代理。
      </div>
    </div>
  );
};

export default AICompanionPanel;
