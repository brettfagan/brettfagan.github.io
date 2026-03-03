import { motion } from 'motion/react';
import Hero from './components/Hero';
import About from './components/About';
import MyWork from './components/MyWork';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';

const ease = [0.25, 0.1, 0.25, 1];

function App() {
  return (
    <div className="homepage min-h-screen">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: '#0a0f19',
          borderBottom: '1px solid #1a2233',
        }}
      >
        <nav
          className="w-[min(1080px,92%)] mx-auto flex items-center justify-between gap-4 max-[680px]:flex-col max-[680px]:items-start max-[680px]:py-3"
          style={{ minHeight: '64px' }}
          aria-label="Main navigation"
        >
          <a
            href="#top"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: '1rem',
              color: '#e6edf3',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <img src="/brettlabsicon.png" alt="" style={{ height: '22px', width: '22px', objectFit: 'contain', opacity: 0.85 }} />
            Brett Fagan
          </a>
          <div className="flex items-center gap-6">
            <a className="hp-nav-link" href="#about">About</a>
            <a className="hp-nav-link" href="#my-work">My Work</a>
            <a className="hp-nav-link" href="#personal-projects">Projects</a>
            <a className="hp-nav-link" href="#contact">Contact</a>
            <a
              href="https://www.linkedin.com/in/brettfagan/"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', opacity: 0.45, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.45}
            >
              <img src="/linkedin.webp" alt="LinkedIn" style={{ height: '18px', width: '18px', objectFit: 'contain' }} />
            </a>
          </div>
        </nav>
      </motion.header>

      <main id="top">
        <Hero />
        <About />
        <MyWork />
        <Projects />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}

export default App;
