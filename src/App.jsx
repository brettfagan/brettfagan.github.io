import Hero from './components/Hero';
import About from './components/About';
import MyWork from './components/MyWork';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  return (
    <div className="homepage min-h-screen" style={{ backgroundColor: '#f5ede0' }}>
      <header
        className="sticky top-0 z-10 backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(245, 237, 224, 0.92)',
          borderBottom: '1px solid #d4c0a8',
        }}
      >
        <nav
          className="w-[min(1080px,92%)] mx-auto flex items-center justify-between min-h-16 gap-4 max-[680px]:flex-col max-[680px]:items-start max-[680px]:py-3"
          aria-label="Main navigation"
        >
          <a
            className="no-underline flex items-center gap-2"
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 600,
              fontSize: '1.1rem',
              color: '#1c140e',
            }}
            href="#top"
          >
            <img src="/brettlabsicon.png" alt="" className="h-6 w-6 object-contain" />
            Brett Fagan
          </a>
          <div className="flex items-center gap-5">
            {[
              ['About', '#about'],
              ['My Work', '#my-work'],
              ['Personal Projects', '#personal-projects'],
              ['Contact', '#contact'],
            ].map(([label, href]) => (
              <a
                key={label}
                className="no-underline font-medium transition-colors duration-200"
                style={{ color: '#5a4a3a', fontSize: '0.9rem', letterSpacing: '0.01em' }}
                href={href}
                onMouseEnter={e => (e.currentTarget.style.color = '#c44b2a')}
                onMouseLeave={e => (e.currentTarget.style.color = '#5a4a3a')}
              >
                {label}
              </a>
            ))}
            <a
              href="https://www.linkedin.com/in/brettfagan/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center"
              aria-label="LinkedIn profile"
            >
              <img src="/linkedin.webp" alt="LinkedIn" className="h-5 w-5 object-contain" />
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
