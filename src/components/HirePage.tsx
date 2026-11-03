// 「捞点点吃的」：就一张联系卡，没有表单、没有服务清单、没有流程与报价。
// 想喂鱼或找本鱼干活的，直接微信/邮箱说一嘴就行，文案内联，不占内容流水线。
import type { CSSProperties } from 'react';
import Header from './Header';
import ContentSection from './ContentSection';
import Footer from './Footer';

const WECHAT = 'Darling13356424916';
const EMAIL = '19503862693@163.com';

const cardStyle: CSSProperties = {
  padding: 'clamp(1.5rem, 5vw, 2.5rem)',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-card)',
  borderRadius: 'var(--radius-card)',
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
  marginTop: '1.75rem',
};

const labelStyle: CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '0.85rem',
};

const valueStyle: CSSProperties = {
  color: 'var(--text-heading)',
  fontSize: 'clamp(1.05rem, 3.4vw, 1.4rem)',
  fontWeight: 700,
  letterSpacing: '0.02em',
  wordBreak: 'break-all',
};

const HirePage = () => (
  <>
    <Header />
    <ContentSection standalone>
      <section style={cardStyle}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 7vw, 2.75rem)',
            fontWeight: 700,
            color: 'var(--text-heading)',
            marginBottom: '1rem',
          }}
        >
          捞点点吃的
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.9, margin: 0 }}>
          有活想丢给本鱼、或者单纯想投喂点吃的，直接加微信或发邮件就行。
          <br />
          <strong style={{ color: 'var(--text-body)' }}>备注来意</strong>，不然分不清是投喂还是卖课的。
        </p>

        <div style={rowStyle}>
          <span style={labelStyle}>微信</span>
          <span style={valueStyle}>{WECHAT}</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>邮箱</span>
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent('备注来意')}`}
            style={{
              ...valueStyle,
              textDecoration: 'underline',
              textDecorationColor: 'var(--border-card)',
            }}
          >
            {EMAIL}
          </a>
        </div>
      </section>
    </ContentSection>
    <Footer />
  </>
);

export default HirePage;
