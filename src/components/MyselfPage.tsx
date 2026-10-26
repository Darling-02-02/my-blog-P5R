// 「我自己」独立页：个人简介从 /explore 搬过来（首页内容区不再出现这块）。
// 整页只留一张大卡片，内容从上往下排；外壳复用 ContentSection（背景、侧栏、窄屏规则都在那边）。
import type { CSSProperties } from 'react';
import { Fragment } from 'react';
import { myselfContent } from '../data/myself';
import Header from './Header';
import ContentSection from './ContentSection';
import Footer from './Footer';

const cardStyle: CSSProperties = {
  marginBottom: '4rem',
  // 窄屏别再吃 2rem 的内边距：手机上一张卡片就够挤了。
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

const interests = [
  '👤 CN：灵敏度加满，欢迎扩列',
  '📸 摄影：偶尔拍拍，设备索尼zve10，镜头55mm',
  '🏃 中长跑：纵有疾风起！！',
  '💪 健身：卧推25kg，不中嘞',
  '🎨 画画：反正没在签绘墙上画过',
  '🎮 游戏：第九艺术！！3A永远滴神',
  '✨ 梦想能手握switch2、5090和PS5',
];

const textStyle: CSSProperties = {
  color: 'var(--text-body)',
  fontSize: '1.1rem',
  lineHeight: 2.2,
};

// OPC 同行社：身份 + 两句口语化的介绍 + 官方链接。
// 城市代理人 = 这个城市这一摊的联系人；文案刻意不用「赋能/生态」那套官方口气。
const opc = {
  title: '🏙️ OPC 同行社 · 城市代理人',
  intro: '一人公司的社区，一堆想自己做点东西的人凑在一块，聊项目、聊坑、聊怎么活下去。',
  invite: '我在福州站当城市代理人，随时欢迎来玩福州站。',
  site: 'https://www.opc.community/china',
  siteLabel: 'OPC 同行社',
  city: 'https://www.opc.community/city/fuzhou',
  cityLabel: '福州站 · 城市页',
};

// 中转站：同域路径 /opc，由 functions/opc/[[path]].ts 反代到 Omni Router 的源站
// （源站地址配在 Pages 环境变量 OPC_ORIGIN 里）。合作与需求文档都从这儿进。
const relay = {
  title: '📮 中转站',
  intro: '合作与需求对接用。需求文档都放在这里，点进去就能看。',
  href: '/opc/',
  label: 'darling-02.cn/opc',
};

/* 整行就是一条链接时用的样式。颜色复用主题里现成的 --text-link（深色主题白、浅色主题 #111），
   跟正文区分开；下划线单独调细一点、离字远一点，长 URL 不显得挤。 */
const linkStyle: CSSProperties = {
  color: 'var(--text-link)',
  textDecoration: 'underline',
  textDecorationThickness: '0.08em',
  textUnderlineOffset: '0.2em',
};

const lines = myselfContent.mystic.split('\n');

const MyselfContent = () => (
  <div className="home-main-card" style={{ background: 'transparent', borderRadius: 'var(--radius-card)', border: 'none', boxShadow: 'none', padding: 0 }}>
    {/* 个人简介：整页一张大卡片，简介 / 神秘力量 / 兴趣爱好都在里面，不再拆成并列小卡 */}
    <section id="profile" className="home-content-block" style={cardStyle}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '1rem' }}>
        个人简介
      </h1>
      <p style={{ ...textStyle, color: 'var(--text-muted)', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '2px solid var(--border-section)' }}>
        离神很近，也就是离人很远。——一个臭看番的。
      </p>

      {/* 文案来自 src/content/myself.json，后台 /admin 的「🔮 个人简介」页签能改它。
          后台是一个多行 textarea，敲的回车存成 JSON 里的 \n（仓库里当前那份正是三处换行）。
          HTML 默认会把它们折成一个空格，所以这里必须开 white-space: pre-line——
          pre-line 只认换行、不认行首缩进：回车显示得出来，也不会把内容缩进一起画出来。 */}
      <h3 style={subHeadingStyle}>🔮 神秘力量</h3>
      <p style={{ ...textStyle, whiteSpace: 'pre-line' }}>
        {lines.map((line, index) =>
          // 整行是一条链接才算链接：只有整行匹配才是「用户贴了一条链接」，
          // 句子中间的 URL 维持纯文本，免得把一句中文切得七零八落。
          // 行尾的 \n 自己还原——拆开成多个节点后，HTML 只会合并「同一个节点内」的换行，
          // 之前那三处回车靠的就是这个；这里不留住的话它们会全部塌掉。
          /^https?:\/\/\S+$/.test(line.trim()) ? (
            <Fragment key={index}>
              <a href={line.trim()} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                {line.trim()}
              </a>
              {index < lines.length - 1 ? '\n' : ''}
            </Fragment>
          ) : (
            <Fragment key={index}>
              {line}
              {index < lines.length - 1 ? '\n' : ''}
            </Fragment>
          ),
        )}
      </p>

      <h3 style={{ ...subHeadingStyle, marginTop: '2.5rem' }}>{opc.title}</h3>
      <p style={textStyle}>{opc.intro}</p>
      <p style={textStyle}>{opc.invite}</p>
      <p style={{ ...textStyle, marginTop: '0.75rem' }}>
        <a href={opc.site} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {opc.siteLabel} ↗
        </a>
        {'　'}
        <a href={opc.city} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {opc.cityLabel} ↗
        </a>
      </p>

      <h3 style={{ ...subHeadingStyle, marginTop: '2.5rem' }}>{relay.title}</h3>
      <p style={textStyle}>{relay.intro}</p>
      <p style={{ ...textStyle, marginTop: '0.75rem' }}>
        <a href={relay.href} style={linkStyle}>{relay.label} ↗</a>
      </p>

      <h3 style={{ ...subHeadingStyle, marginTop: '2.5rem' }}>💡 兴趣爱好</h3>
      <ul style={{ ...textStyle, paddingLeft: 0, listStyle: 'none' }}>
        {interests.map((item, index) => (
          <li key={item} style={index === 0 ? { color: 'var(--text-link)', fontWeight: 500 } : { marginTop: index === 1 ? '0.5rem' : undefined }}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  </div>
);

const MyselfPage = () => (
  <>
    <Header />
    <ContentSection standalone>
      <MyselfContent />
    </ContentSection>
    <Footer />
  </>
);

export default MyselfPage;
