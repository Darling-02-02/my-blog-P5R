// 接单页（/hire）：服务清单 + 合作流程 + 计价口径 + FAQ + 提交表单。
// 文案全部来自 src/content/hire.json（改文案不用动组件）；外壳复用 ContentSection，和 /myself 一致。
// 提交走同源的 Cloudflare Pages Function（functions/api/orders.ts），不经过 backend/ 那套文章 API。
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { hireContent } from '../data/hire';
import { OrderApiError, ORDER_BUDGET_LABELS, ORDER_KIND_LABELS, submitOrder } from '../lib/order-client';
import type { OrderBudget, OrderKind } from '../lib/order-client';
import Header from './Header';
import ContentSection from './ContentSection';
import Footer from './Footer';

const cardStyle: CSSProperties = {
  marginBottom: '4rem',
  padding: 'clamp(1.25rem, 4vw, 2rem)',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-card)',
  borderRadius: 'var(--radius-card)',
};

const subHeadingStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '1.5rem',
};

const textStyle: CSSProperties = {
  color: 'var(--text-body)',
  fontSize: '1.05rem',
  lineHeight: 1.9,
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.4rem',
  color: 'var(--text-body)',
  fontSize: '0.95rem',
};

const controlStyle: CSSProperties = {
  padding: '0.7rem 0.8rem',
  border: '1px solid var(--border-card)',
  borderRadius: '8px',
  background: 'var(--bg-card)',
  color: 'var(--text-body)',
  font: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const hintStyle: CSSProperties = { color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 };

interface FormState {
  kind: OrderKind;
  name: string;
  contact: string;
  topic: string;
  details: string;
  dataNote: string;
  deadline: string;
  budget: OrderBudget;
  link: string;
  company: string;
  agree: boolean;
}

const emptyForm: FormState = {
  kind: 'bioinfo',
  name: '',
  contact: '',
  topic: '',
  details: '',
  dataNote: '',
  deadline: '',
  budget: 'talk',
  link: '',
  company: '',
  agree: false,
};

type SubmitPhase = 'idle' | 'submitting' | 'done' | 'error';

const HirePage = () => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  // 页面挂载时间：服务端用它拦住「两秒内填完」的机器人提交。
  const mountedAt = useRef(0);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  // 计时起点只能是挂载那一刻，而且不能在渲染期读时钟（React 要求渲染是纯的）。
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  // 提交成功后把焦点移到结果卡：读屏和键盘用户才知道「提交完了」。
  useEffect(() => {
    if (phase === 'done') resultRef.current?.focus();
  }, [phase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === 'submitting') return;

    if (!form.name.trim() || !form.contact.trim() || !form.topic.trim() || !form.details.trim()) {
      setPhase('error');
      setError('称呼、联系方式、项目一句话和详细需求都要填。');
      return;
    }
    if (!form.agree) {
      setPhase('error');
      setError('请先勾选「我了解数据只用于评估这次委托」。');
      return;
    }

    setPhase('submitting');
    setError('');
    try {
      const result = await submitOrder({
        kind: form.kind,
        name: form.name,
        contact: form.contact,
        topic: form.topic,
        details: form.details,
        dataNote: form.dataNote,
        deadline: form.deadline,
        budget: form.budget,
        link: form.link,
        company: form.company,
        elapsedMs: Date.now() - mountedAt.current,
      });
      setReference(result.ref);
      setPhase('done');
      setForm(emptyForm);
      // 客户可能连投两单：重置计时，别让第二单被「提交太快」拦掉。
      mountedAt.current = Date.now();
    } catch (caught) {
      setPhase('error');
      if (caught instanceof OrderApiError) {
        setError(
          caught.status === 0 || caught.status >= 500
            ? `暂时没法提交（${caught.message}）。可以直接发邮件到 ${hireContent.email}，或者稍后再试。`
            : caught.message,
        );
      } else {
        setError('提交失败，请稍后再试；也可以直接发邮件联系。');
      }
    }
  };

  const mailto = `mailto:${hireContent.email}?subject=${encodeURIComponent('接单咨询')}`;

  return (
    <>
      <Header />
      <ContentSection standalone>
        <div className="home-main-card" style={{ background: 'transparent', borderRadius: 'var(--radius-card)', border: 'none', boxShadow: 'none', padding: 0 }}>
          <style>{`
            .hire-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem}
            .hire-service{background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--radius-card);padding:1.25rem}
            .hire-service ul{margin:.75rem 0 0;padding-left:1.1rem;color:var(--text-muted);font-size:.9rem;line-height:1.9}
            .hire-steps{display:grid;gap:1rem;margin:0;padding:0;list-style:none;counter-reset:step}
            .hire-step{display:grid;grid-template-columns:2.2rem 1fr;gap:.9rem;align-items:start}
            .hire-step::before{counter-increment:step;content:counter(step);display:grid;place-items:center;width:2.2rem;height:2.2rem;border-radius:50%;background:var(--accent-fill);color:#fff;font-weight:700;font-size:.95rem}
            .hire-faq{border-top:1px solid var(--border-section);padding:.9rem 0}
            .hire-faq summary{cursor:pointer;color:var(--text-heading);font-weight:600;line-height:1.8}
            .hire-faq p{margin:.6rem 0 0;color:var(--text-muted);line-height:1.9;font-size:.95rem}
            .hire-form{display:grid;gap:1rem}
            .hire-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}
            .hire-honeypot{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
            @media (max-width:640px){.hire-step{grid-template-columns:1.8rem 1fr}.hire-step::before{width:1.8rem;height:1.8rem}}
          `}</style>

          <section className="home-content-block" style={cardStyle}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
              接单
            </h1>
            <p style={{ ...textStyle, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {hireContent.headline}
            </p>
            <p style={{ ...textStyle, marginBottom: '1.25rem' }}>{hireContent.intro}</p>
            <p style={{ ...hintStyle, marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
              🟢 {hireContent.availability} · 📧{' '}
              <a href={mailto} style={{ color: 'var(--text-link)' }}>{hireContent.email}</a>
            </p>

            <h2 style={subHeadingStyle}>能做些什么</h2>
            <div className="hire-grid">
              {hireContent.services.map((service) => (
                <article key={service.title} className="hire-service">
                  <h3 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '1.1rem' }}>{service.title}</h3>
                  {service.desc && <p style={{ ...hintStyle, margin: '.5rem 0 0' }}>{service.desc}</p>}
                  {service.items.length > 0 && (
                    <ul>
                      {service.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>

            <h2 style={{ ...subHeadingStyle, marginTop: '3rem' }}>怎么合作</h2>
            <ol className="hire-steps">
              {hireContent.process.map((step) => (
                <li key={step.title} className="hire-step">
                  <div>
                    <strong style={{ color: 'var(--text-heading)', display: 'block', marginBottom: '.2rem' }}>{step.title}</strong>
                    <span style={{ ...hintStyle, fontSize: '.92rem' }}>{step.desc}</span>
                  </div>
                </li>
              ))}
            </ol>

            <h2 style={{ ...subHeadingStyle, marginTop: '3rem' }}>价格怎么算</h2>
            <p style={{ ...textStyle, marginBottom: '1rem' }}>{hireContent.pricing.note}</p>
            {hireContent.pricing.hints.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '1.2rem', ...hintStyle, fontSize: '.92rem' }}>
                {hireContent.pricing.hints.map((hint) => (
                  <li key={hint} style={{ lineHeight: 1.9 }}>{hint}</li>
                ))}
              </ul>
            )}

            <h2 style={{ ...subHeadingStyle, marginTop: '3rem', marginBottom: '1rem' }}>常见问题</h2>
            {hireContent.faq.map((entry) => (
              <details key={entry.q} className="hire-faq">
                <summary>{entry.q}</summary>
                <p>{entry.a}</p>
              </details>
            ))}
          </section>

          <section id="order" className="home-content-block" style={{ ...cardStyle, marginBottom: 0 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '.75rem' }}>
              说说你的需求
            </h2>
            <p style={{ ...hintStyle, marginBottom: '2rem' }}>
              描述得越具体，报价越准。1–2 个工作日内回复；着急的话直接发邮件到{' '}
              <a href={mailto} style={{ color: 'var(--text-link)' }}>{hireContent.email}</a>。
            </p>

            {phase === 'done' ? (
              <div
                ref={resultRef}
                tabIndex={-1}
                role="status"
                style={{ border: '1px solid var(--border-card)', borderRadius: 'var(--radius-card)', padding: '1.5rem', background: 'var(--bg-hover)' }}
              >
                <h3 style={{ margin: '0 0 .5rem', color: 'var(--text-heading)' }}>已经收到啦 ✓</h3>
                <p style={{ ...textStyle, margin: 0 }}>
                  参考编号 <strong>{reference}</strong>。我会在 1–2 个工作日内通过你留的联系方式回复；
                  如果一直没收到，可以直接发邮件到 <a href={mailto} style={{ color: 'var(--text-link)' }}>{hireContent.email}</a> 催一下。
                </p>
                <button
                  type="button"
                  onClick={() => { setPhase('idle'); setError(''); }}
                  style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', border: '1px solid var(--border-card)', borderRadius: '8px', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}
                >
                  再提交一单
                </button>
              </div>
            ) : (
              <form className="hire-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
                <div className="hire-row">
                  <label style={labelStyle}>
                    项目类型
                    <select
                      value={form.kind}
                      onChange={(event) => update('kind', event.target.value as OrderKind)}
                      style={controlStyle}
                    >
                      {(Object.keys(ORDER_KIND_LABELS) as OrderKind[]).map((kind) => (
                        <option key={kind} value={kind}>{ORDER_KIND_LABELS[kind]}</option>
                      ))}
                    </select>
                  </label>
                  <label style={labelStyle}>
                    预算区间
                    <select
                      value={form.budget}
                      onChange={(event) => update('budget', event.target.value as OrderBudget)}
                      style={controlStyle}
                    >
                      {(Object.keys(ORDER_BUDGET_LABELS) as OrderBudget[]).map((budget) => (
                        <option key={budget} value={budget}>{ORDER_BUDGET_LABELS[budget]}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="hire-row">
                  <label style={labelStyle}>
                    怎么称呼你
                    <input
                      required
                      maxLength={40}
                      value={form.name}
                      onChange={(event) => update('name', event.target.value)}
                      style={controlStyle}
                      placeholder="老师 / 同学 / 昵称都行"
                    />
                  </label>
                  <label style={labelStyle}>
                    联系方式（邮箱 / 微信 / QQ）
                    <input
                      required
                      maxLength={120}
                      value={form.contact}
                      onChange={(event) => update('contact', event.target.value)}
                      style={controlStyle}
                      placeholder="留一个能找到你的就行"
                    />
                  </label>
                </div>

                <label style={labelStyle}>
                  一句话说明要做什么
                  <input
                    required
                    maxLength={120}
                    value={form.topic}
                    onChange={(event) => update('topic', event.target.value)}
                    style={controlStyle}
                    placeholder="例：小鼠肝脏转录组差异分析 + 富集图"
                  />
                </label>

                <label style={labelStyle}>
                  详细需求
                  <textarea
                    required
                    rows={7}
                    maxLength={4000}
                    value={form.details}
                    onChange={(event) => update('details', event.target.value)}
                    style={{ ...controlStyle, resize: 'vertical' }}
                    placeholder="物种 / 数据来源（GEO、测序公司、自有样本）/ 样本数与分组 / 想要的结果（哪些图、哪些表、要不要代码）/ 有没有参考文献里想复现的图"
                  />
                </label>

                <div className="hire-row">
                  <label style={labelStyle}>
                    数据情况（可选）
                    <input
                      maxLength={1000}
                      value={form.dataNote}
                      onChange={(event) => update('dataNote', event.target.value)}
                      style={controlStyle}
                      placeholder="例：已拿到 counts 矩阵，60 个样本，3 组"
                    />
                  </label>
                  <label style={labelStyle}>
                    期望交付时间（可选）
                    <input
                      maxLength={80}
                      value={form.deadline}
                      onChange={(event) => update('deadline', event.target.value)}
                      style={controlStyle}
                      placeholder="例：11 月底前 / 不着急"
                    />
                  </label>
                </div>

                <label style={labelStyle}>
                  数据或网盘链接（可选）
                  <input
                    maxLength={300}
                    value={form.link}
                    onChange={(event) => update('link', event.target.value)}
                    style={controlStyle}
                    placeholder="不要在这里填提取码；确认合作后再给也行"
                  />
                </label>

                {/* 蜜罐：真人是看不见它的（也拿不到焦点），机器人会老老实实填上。 */}
                <div className="hire-honeypot" aria-hidden="true">
                  <label>
                    公司名称
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.company}
                      onChange={(event) => update('company', event.target.value)}
                    />
                  </label>
                </div>

                <label style={{ ...labelStyle, gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '.6rem' }}>
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={(event) => update('agree', event.target.checked)}
                  />
                  <span style={hintStyle}>我了解：数据只用于评估这次委托，未经同意不会外传；不接代写论文与数据造假。</span>
                </label>

                <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={phase === 'submitting'}
                    style={{
                      padding: '0.75rem 1.6rem',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'var(--accent-fill)',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: phase === 'submitting' ? 'not-allowed' : 'pointer',
                      opacity: phase === 'submitting' ? 0.6 : 1,
                    }}
                  >
                    {phase === 'submitting' ? '提交中…' : '提交需求'}
                  </button>
                  <span style={hintStyle}>提交后不会立刻扣费；报价确认前你可以随时说不。</span>
                </div>

                {phase === 'error' && error && (
                  <p role="alert" style={{ margin: 0, color: 'var(--text-danger)', lineHeight: 1.8 }}>{error}</p>
                )}
              </form>
            )}
          </section>
        </div>
      </ContentSection>
      <Footer />
    </>
  );
};

export default HirePage;
