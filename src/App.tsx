import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header'
import Hero from './components/Hero'
import BlogSection from './components/BlogSection'
import AboutSection from './components/AboutSection'
import Footer from './components/Footer'
import Article from './components/Article'
import { GlobalBackground } from './components/GlobalBackground'

function Home() {
  return (
    <>
      <Hero />
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
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<Article />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </GlobalBackground>
    </Router>
  )
}

export default App
