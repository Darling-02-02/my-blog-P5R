import { useEffect, useMemo, useState } from 'react';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface AICompanionPanelProps {
  isStudying: boolean;
  sessionSeconds: number;
}

const API_BASE_KEY = 'study_ai_api_base';
const API_KEY_KEY = 'study_ai_api_key';
const MODEL_KEY = 'study_ai_model';

const toClock = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const starterTips = [
  '帮我规划一个45分钟学习冲刺',
  '根据我现在状态给一句鼓励',
  '我容易分心，给我3个专注建议',
];

const AICompanionPanel = ({ isStudying, sessionSeconds }: AICompanionPanelProps) => {
  const [apiBase, setApiBase] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '我是你的学习搭子。你可以让我做计划、复盘、背诵抽问，或给你专注提醒。',
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

  const studyStatus = useMemo(
    () => (isStudying ? `正在学习中，本次已学习 ${toClock(sessionSeconds)}` : '当前未开始学习'),
    [isStudying, sessionSeconds],
  );

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (!apiBase.trim() || !apiKey.trim() || !model.trim()) {
      setError('请先配置 API Base URL / API Key / Model。');
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
                '你是一个中文学习陪伴助手，输出简洁、执行导向。优先给明确步骤、时间块安排和鼓励反馈。',
            },
            {
              role: 'system',
              content: `用户学习状态：${studyStatus}`,
            },
            ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const textBody = await response.text();
        throw new Error(`请求失败(${response.status}) ${textBody.slice(0, 120)}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('接口已返回，但没有拿到可用回复。');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求失败，请检查网络和接口配置。');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '我这边连接接口失败了。请检查 API 地址、Key 或跨域设置。' },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        marginTop: '0.8rem',
        border: '1px solid var(--border-card)',
        borderRadius: '12px',
        background: 'var(--bg-article-card)',
        padding: '0.9rem',
      }}
    >
      <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '0.6rem' }}>AI 学习搭子</h3>

      <div style={{ display: 'grid', gap: '0.45rem' }}>
        <input
          value={apiBase}
          onChange={(e) => setApiBase(e.target.value)}
          placeholder="API Base URL，例如 https://api.openai.com/v1"
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            padding: '0.55rem 0.7rem',
            outline: 'none',
          }}
        />
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API Key"
          type="password"
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            padding: '0.55rem 0.7rem',
            outline: 'none',
          }}
        />
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="模型名，例如 gpt-4o-mini / deepseek-chat"
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            padding: '0.55rem 0.7rem',
            outline: 'none',
          }}
        />
      </div>

      <div
        style={{
          marginTop: '0.7rem',
          border: '1px solid var(--border-card)',
          borderRadius: '10px',
          padding: '0.65rem',
          maxHeight: '190px',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          display: 'grid',
          gap: '0.5rem',
        }}
      >
        {messages.map((msg, idx) => (
          <div key={`${msg.role}-${idx}`} style={{ fontSize: '0.87rem', lineHeight: 1.6, color: 'var(--text-body)' }}>
            <strong style={{ color: msg.role === 'user' ? '#ff0040' : 'var(--text-secondary)' }}>
              {msg.role === 'user' ? '你' : 'AI'}：
            </strong>
            {msg.content}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '0.55rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
        {starterTips.map((tip) => (
          <button
            key={tip}
            onClick={() => sendMessage(tip)}
            style={{
              border: '1px solid var(--border-tag)',
              background: 'var(--bg-tag)',
              color: '#ff0040',
              borderRadius: '999px',
              padding: '0.28rem 0.6rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            {tip}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(prompt);
        }}
        style={{ marginTop: '0.6rem', display: 'flex', gap: '0.45rem' }}
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="问AI：帮我安排下一轮学习"
          style={{
            flex: 1,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            padding: '0.6rem 0.7rem',
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
            borderRadius: '8px',
            padding: '0.6rem 0.85rem',
            fontWeight: 700,
            cursor: sending ? 'not-allowed' : 'pointer',
          }}
        >
          {sending ? '发送中...' : '发送'}
        </button>
      </form>

      {error && <div style={{ marginTop: '0.45rem', fontSize: '0.8rem', color: '#ff7676' }}>{error}</div>}
      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        说明：这是前端直连模式，Key 会保存在本地浏览器。生产环境建议走后端代理。
      </div>
    </div>
  );
};

export default AICompanionPanel;
