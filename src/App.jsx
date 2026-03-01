import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import Hero from './components/Hero';
import About from './components/About';
import MyWork from './components/MyWork';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center w-8 h-8 rounded-md text-[#2a3657] dark:text-[#9db4e8] hover:bg-[#e9eefb] dark:hover:bg-[#2a3657]/50 transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-linear-to-b from-white via-[#f7f9fc] to-[#eef2f9] dark:from-background dark:via-background dark:to-background">
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-white/85 dark:bg-background/85 border-b border-[#e7ecf5] dark:border-border">
        <nav
          className="w-[min(1080px,92%)] mx-auto flex items-center justify-between min-h-16 gap-4 max-[680px]:flex-col max-[680px]:items-start max-[680px]:py-3"
          aria-label="Main navigation"
        >
          <a className="font-bold text-[#1a2340] dark:text-foreground no-underline flex items-center gap-2" href="#top">
            <img src="/brettlabsicon.png" alt="" className="h-6 w-6 object-contain" />
            Brett Fagan
          </a>
          <div className="flex items-center gap-4">
            <a className="no-underline text-[#2a3657] dark:text-foreground font-medium" href="#about">About</a>
            <a className="no-underline text-[#2a3657] dark:text-foreground font-medium" href="#my-work">My Work</a>
            <a className="no-underline text-[#2a3657] dark:text-foreground font-medium" href="#personal-projects">Personal Projects</a>
            <a className="no-underline text-[#2a3657] dark:text-foreground font-medium" href="#contact">Contact</a>
            <a href="https://www.linkedin.com/in/brettfagan/" target="_blank" rel="noreferrer" className="flex items-center">
              <img src="/linkedin.webp" alt="LinkedIn" className="h-5 w-5 object-contain" />
            </a>
            <ThemeToggle />
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
