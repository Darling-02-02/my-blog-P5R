import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Hero from './components/Hero'
import ContentSection from './components/ContentSection'
import Footer from './components/Footer'
import Article from './components/Article'
import AboutMe from './components/AboutMe'
import { GlobalBackground } from './components/GlobalBackground'

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
    <Router basename="/my-blog-P5R">
      <GlobalBackground>
        <div className="scanlines">
          <main>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/about" element={<AboutMe />} />
            </Routes>
          </main>
        </div>
      </GlobalBackground>
    </Router>
  )
}

export default App
