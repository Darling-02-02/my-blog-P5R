import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import Hero from './components/Hero'
import ContentSection from './components/ContentSection'
import Footer from './components/Footer'
import { GlobalBackground } from './components/GlobalBackground'
import { ThemeProvider } from './contexts/ThemeContext'
import { ArticleProvider } from './contexts/ArticleContext'
import { ContentProvider } from './contexts/ContentContext'
import ThemeToggle from './components/ThemeToggle'

const Article = lazy(() => import('./components/Article'));
const ArchivePage = lazy(() => import('./components/ArchivePage'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const MyselfPage = lazy(() => import('./components/MyselfPage'));
const GalleryPage = lazy(() => import('./components/GalleryPage'));

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // 带 hash 的链接（导航里的「幕后」「留言板」，以及老链接 /explore#blog 301 落地后）要滚到那一块，
    // 而不是回顶部；目标元素是这一帧渲染出来的，所以等一拍再滚。
    const timer = hash
      ? window.setTimeout(() => {
          document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120)
      : 0;

    if (!hash) {
      // 全局 CSS 开了 scroll-behavior: smooth，普通 scrollTo 会带着旧滚动位置"滑"到顶部，
      // 路由切换必须瞬时归零。
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [pathname, hash]);

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
  // 首屏（一张静态图）和原来的 /explore 内容合成一页：滚轮直接从图滑到内容，中间没有路由跳转。
  // secondary-page-theme 是内容区以前靠 /explore 那条路由拿到的玻璃令牌，合并后得自己包上。
  return (
    <>
      <Hero />
      <div className="secondary-page-theme">
        <ContentSection standalone />
      </div>
      <Footer />
    </>
  );
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
                      <Route path="/myself" element={<MyselfPage />} />
                      <Route path="/article/*" element={<Article />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/tag/:name" element={<ArchivePage mode="tag" />} />
                      <Route path="/category/:name" element={<ArchivePage mode="category" />} />
                      <Route path="/gallery" element={<GalleryPage />} />
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
