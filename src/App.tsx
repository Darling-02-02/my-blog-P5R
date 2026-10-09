import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import Hero from './components/Hero'
import { GlobalBackground } from './components/GlobalBackground'
import { ThemeProvider } from './contexts/ThemeContext'
import { ArticleProvider } from './contexts/ArticleContext'
import { ContentProvider } from './contexts/ContentContext'
import ThemeToggle from './components/ThemeToggle'
// /explore 是首屏路由，跟 Hero 一样静态导入：懒加载要多等一个串行往返，实测把它的 LCP 拖到 900ms 上下。
import ExplorePage from './components/ExplorePage'

const Article = lazy(() => import('./components/Article'));
const AboutMe = lazy(() => import('./components/AboutMe'));
const ArchivePage = lazy(() => import('./components/ArchivePage'));
const StudyRoom = lazy(() => import('./components/StudyRoom'));
const AdminPage = lazy(() => import('./components/AdminPage'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 全局 CSS 开了 scroll-behavior: smooth，普通 scrollTo 会带着旧滚动位置"滑"到顶部，
    // 路由切换必须瞬时归零。
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

// 路由组件是懒加载的：没有 fallback 时会先白屏一段时间，看起来像卡死。
const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: '0.95rem',
    }}
  >
    正在加载页面…
  </div>
);

function Home() {
  return <Hero />;
}

function App() {
  return (
    <ThemeProvider>
      <ArticleProvider>
        <ContentProvider>
          <Router basename={import.meta.env.BASE_URL}>
            <GlobalBackground>
              <div className="scanlines">
                <main>
                  <ScrollToTop />
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/explore" element={<ExplorePage />} />
                      <Route path="/article/*" element={<Article />} />
                      <Route path="/about" element={<AboutMe />} />
                      <Route path="/study-room" element={<StudyRoom />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/tag/:name" element={<ArchivePage mode="tag" />} />
                      <Route path="/category/:name" element={<ArchivePage mode="category" />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </GlobalBackground>
            <ThemeToggle />
          </Router>
        </ContentProvider>
      </ArticleProvider>
    </ThemeProvider>
  )
}

export default App
