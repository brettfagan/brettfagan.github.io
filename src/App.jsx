import Hero from './components/Hero';
import About from './components/About';
import MyWork from './components/MyWork';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  return (
    <div className="homepage min-h-screen">
      <header style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#0c0c0c', borderBottom: '1px solid #222' }}>
        <nav
          className="w-[min(1080px,92%)] mx-auto flex items-center justify-between gap-4 max-[680px]:flex-col max-[680px]:items-start max-[680px]:py-3"
          style={{ minHeight: '64px' }}
          aria-label="Main navigation"
        >
          <a
            href="#top"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '1.05rem',
              color: '#f0f0f0',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <img src="/brettlabsicon.png" alt="" style={{ height: '22px', width: '22px', objectFit: 'contain', opacity: 0.9 }} />
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
              className="flex items-center"
            >
              <img src="/linkedin.webp" alt="LinkedIn" style={{ height: '18px', width: '18px', objectFit: 'contain', opacity: 0.5, transition: 'opacity 0.15s' }} />
            </a>
          </div>
        </nav>
      </header>

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
