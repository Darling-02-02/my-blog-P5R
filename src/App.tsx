import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import Hero from './components/Hero';
import ContentSection from './components/ContentSection';
import Footer from './components/Footer';
import { GlobalBackground } from './components/GlobalBackground';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import LoadingScreen from './components/LoadingScreen';
import NotFoundPage from './components/NotFoundPage';

const Article = lazy(() => import('./components/Article'));
const AboutMe = lazy(() => import('./components/AboutMe'));
const ArchivePage = lazy(() => import('./components/ArchivePage'));
const StudyRoom = lazy(() => import('./components/StudyRoom'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function Home() {
  return (
    <>
      <Hero />
      <ContentSection />
      <Footer />
    </>
  );
}

function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let disposed = false;
    let hasLoaded = document.readyState === 'complete';
    let hasWaited = false;

    const maybeFinish = () => {
      if (!disposed && hasLoaded && hasWaited) {
        setIsBooting(false);
      }
    };

    const delayTimer = window.setTimeout(() => {
      hasWaited = true;
      maybeFinish();
    }, 900);

    const handleLoaded = () => {
      hasLoaded = true;
      maybeFinish();
    };

    if (!hasLoaded) {
      window.addEventListener('load', handleLoaded, { once: true });
    } else {
      maybeFinish();
    }

    return () => {
      disposed = true;
      window.clearTimeout(delayTimer);
      window.removeEventListener('load', handleLoaded);
    };
  }, []);

  return (
    <ThemeProvider>
      {isBooting ? (
        <>
          <GlobalBackground>
            <LoadingScreen message="正在唤醒 blog..." />
          </GlobalBackground>
          <ThemeToggle />
        </>
      ) : (
        <Router basename="/my-blog-P5R">
          <GlobalBackground>
            <div className="scanlines">
              <main>
                <ScrollToTop />
                <Suspense fallback={<LoadingScreen message="页面传送中..." />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/article/:id" element={<Article />} />
                    <Route path="/about" element={<AboutMe />} />
                    <Route path="/study-room" element={<StudyRoom />} />
                    <Route path="/tag/:name" element={<ArchivePage mode="tag" />} />
                    <Route path="/category/:name" element={<ArchivePage mode="category" />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </GlobalBackground>
          <ThemeToggle />
        </Router>
      )}
    </ThemeProvider>
  );
}

export default App;
