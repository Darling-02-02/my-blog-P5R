import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero'
import BentoSection from './components/BentoSection'
import BlogSection from './components/BlogSection'
import AboutSection from './components/AboutSection'
import Footer from './components/Footer'
import Article from './components/Article'
import AboutMe from './components/AboutMe'
import { GlobalBackground } from './components/GlobalBackground'

function Home() {
  return (
    <>
      <Hero />
      <BentoSection />
      <BlogSection />
      <AboutSection />
    </>
  );
}

function App() {
  return (
    <Router basename="/my-blog-P5R">
      <GlobalBackground>
        <div className="scanlines">
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/about" element={<AboutMe />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </GlobalBackground>
    </Router>
  )
}

export default App
