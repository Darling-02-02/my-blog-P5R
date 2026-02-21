import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero'
import ContentSection from './components/ContentSection'
import Footer from './components/Footer'
import Article from './components/Article'
import AboutMe from './components/AboutMe'
import { GlobalBackground } from './components/GlobalBackground'

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
