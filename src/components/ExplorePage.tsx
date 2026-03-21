import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import ContentSection from './ContentSection';
import Footer from './Footer';

const ExplorePage = () => {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.slice(1);
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const scrollToHash = () => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const timer = window.setTimeout(scrollToHash, 120);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <>
      <Header />
      <ContentSection standalone />
      <Footer />
    </>
  );
};

export default ExplorePage;
