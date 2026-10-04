import { motion } from 'framer-motion';
import { aboutMeQuotes } from './aboutMeContent';
import type { AboutMeSection } from './aboutMeContent';
import { useAboutMeTheme } from './useAboutMeTheme';
import type { AboutMeColors } from './useAboutMeTheme';

// 职责：/about 页面的展示区块（统计条、引言、单个内容区块、页脚），全部通过 useAboutMeTheme 取主题色

export const AboutMeStatsRow = () => {
  const { chipPanel, borderColor, subtleText } = useAboutMeTheme();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '1.5rem',
      flexWrap: 'wrap',
    }}>
      {[
        { label: '文章', value: '50+' },
        { label: '项目', value: '20+' },
        { label: '技能', value: '6+' },
      ].map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.1 }}
          style={{
            padding: '0.5rem 1.5rem',
            background: chipPanel,
            border: `1px solid ${borderColor}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '900',
            color: 'var(--p5-red)',
          }}>
            {stat.value}
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: subtleText,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const AboutMeQuoteBlock = () => {
  const { subtleText, tilePanel } = useAboutMeTheme();

  return (
    <motion.blockquote
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="about-quote"
      style={{
        borderLeft: '4px solid var(--p5-red)',
        paddingLeft: '1.5rem',
        margin: '2rem 0',
        fontStyle: 'italic',
        color: subtleText,
        background: tilePanel,
        padding: '1.5rem',
        borderRadius: '0 8px 8px 0',
        fontSize: '1.1rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      "{aboutMeQuotes[0]}"
      <div style={{
        fontSize: '0.9rem',
        marginTop: '0.5rem',
        textAlign: 'right',
        color: 'var(--p5-accent)',
      }}>
        —— Blog 主人
      </div>
    </motion.blockquote>
  );
};

const SectionItem = ({
  item,
  index,
  colors,
}: {
  item: { label: string; value: string; link: string };
  index: number;
  colors: AboutMeColors;
}) => {
  const { innerPanel, borderColor, subtleText, bodyText } = colors;

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4 + index * 0.05 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1rem',
        background: innerPanel,
        borderRadius: '5px',
        border: `1px solid ${borderColor}`,
      }}
    >
      <span style={{
        minWidth: '60px',
        color: subtleText,
        fontWeight: '500',
      }}>
        {item.label}:
      </span>
      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--p5-cyan)',
            textDecoration: 'none',
            borderBottom: '1px dashed var(--p5-cyan)',
          }}
        >
          {item.value}
        </a>
      ) : (
        <span style={{ color: bodyText }}>{item.value}</span>
      )}
    </motion.div>
  );
};

const SectionList = ({
  list,
  colors,
}: {
  list: string[];
  colors: AboutMeColors;
}) => {
  const { bodyText } = colors;

  return (
    <ul style={{
      listStyle: 'none',
      padding: 0,
      margin: 0,
    }}>
      {list.map((item, index) => (
        <motion.li
          key={index}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 + index * 0.05 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 0',
            borderBottom: '1px solid rgba(255, 0, 64, 0.1)',
          }}
        >
          <span style={{
            color: 'var(--p5-red)',
            fontSize: '1.2rem',
          }}>▸</span>
          <span style={{ color: bodyText }}>{item}</span>
        </motion.li>
      ))}
    </ul>
  );
};

const SectionSkills = ({
  skills,
  colors,
}: {
  skills: { name: string; level: number }[];
  colors: AboutMeColors;
}) => {
  const { tilePanel, headingText } = colors;

  return (
    <div style={{
      display: 'grid',
      gap: '1rem',
    }}>
      {skills.map((skill, index) => (
        <motion.div
          key={skill.name}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 + index * 0.05 }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}>
            <span style={{
              color: headingText,
              fontWeight: '500',
            }}>
              {skill.name}
            </span>
            <span style={{
              color: 'var(--p5-red)',
              fontWeight: '700',
            }}>
              {skill.level}%
            </span>
          </div>
          <div style={{
            height: '8px',
            background: tilePanel,
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${skill.level}%` }}
              transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--p5-red) 0%, var(--p5-accent) 100%)',
                borderRadius: '4px',
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const SectionLinks = ({
  links,
  colors,
}: {
  links: { name: string; url: string; desc: string }[];
  colors: AboutMeColors;
}) => {
  const { innerPanel, borderColor, subtleText, headingText } = colors;

  return (
    <div className="about-links-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '1rem',
    }}>
      {links.map((link, index) => (
        <motion.a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 + index * 0.05 }}
          whileHover={{ scale: 1.02, y: -2 }}
          style={{
            display: 'block',
            padding: '1rem',
            background: innerPanel,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            textDecoration: 'none',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{
            color: headingText,
            fontWeight: '700',
            marginBottom: '0.25rem',
          }}>
            {link.name}
          </div>
          <div style={{
            color: subtleText,
            fontSize: '0.85rem',
          }}>
            {link.desc}
          </div>
        </motion.a>
      ))}
    </div>
  );
};

export const AboutMeSectionCard = ({
  section,
  sectionIndex,
}: {
  section: AboutMeSection;
  sectionIndex: number;
}) => {
  const colors = useAboutMeTheme();
  const { cardPanel, borderColor } = colors;

  return (
    <motion.section
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 + sectionIndex * 0.1 }}
      className="about-section"
      style={{
        marginBottom: '2rem',
        padding: '2rem',
        background: cardPanel,
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '900',
        marginBottom: '1.5rem',
        color: 'var(--p5-red)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        <span>{section.icon}</span>
        {section.title}
      </h2>

      {section.content && (
        <div style={{
          display: 'grid',
          gap: '1rem',
        }}>
          {section.content.map((item, index) => (
            <SectionItem key={index} item={item} index={index} colors={colors} />
          ))}
        </div>
      )}

      {section.list && <SectionList list={section.list} colors={colors} />}

      {section.skills && <SectionSkills skills={section.skills} colors={colors} />}

      {section.links && <SectionLinks links={section.links} colors={colors} />}
    </motion.section>
  );
};

export const AboutMeFooter = () => {
  const { borderColor, chipPanel, subtleText } = useAboutMeTheme();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="about-footer"
        style={{
          textAlign: 'center',
          padding: '2rem',
          borderTop: `1px solid ${borderColor}`,
          marginTop: '3rem',
        }}
      >
      <div className="about-footer-socials" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        marginBottom: '1rem',
      }}>
        {[
          { icon: '📧', url: '#' },
          { icon: '🐙', url: 'https://github.com' },
          { icon: '📺', url: 'https://space.bilibili.com' },
        ].map((social, index) => (
          <motion.a
            key={index}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.2, rotate: 5 }}
            style={{
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: chipPanel,
              border: `1px solid ${borderColor}`,
              borderRadius: '50%',
              fontSize: '1.5rem',
              textDecoration: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            {social.icon}
          </motion.a>
        ))}
      </div>
      <p style={{
        color: subtleText,
        fontSize: '0.9rem',
      }}>
        © 2026 灵敏度加满的blog
      </p>
    </motion.footer>
  );
};
