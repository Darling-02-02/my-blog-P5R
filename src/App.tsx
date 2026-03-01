import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import Hero from './components/Hero'
import ContentSection from './components/ContentSection'
import Footer from './components/Footer'
import { GlobalBackground } from './components/GlobalBackground'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemeToggle from './components/ThemeToggle'

const Article = lazy(() => import('./components/Article'));
const AboutMe = lazy(() => import('./components/AboutMe'));
const ArchivePage = lazy(() => import('./components/ArchivePage'));

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
  return (
    <ThemeProvider>
      <Router basename="/my-blog-P5R">
        <GlobalBackground>
          <div className="scanlines">
            <main>
              <ScrollToTop />
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/article/:id" element={<Article />} />
                  <Route path="/about" element={<AboutMe />} />
                  <Route path="/tag/:name" element={<ArchivePage mode="tag" />} />
                  <Route path="/category/:name" element={<ArchivePage mode="category" />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </GlobalBackground>
        <ThemeToggle />
      </Router>
    </ThemeProvider>
  )
}

export default App
