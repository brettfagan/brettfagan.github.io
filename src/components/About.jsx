function About() {
  return (
    <section id="about" className="py-20 max-[680px]:py-14">
      <div
        className="w-[min(1080px,92%)] mx-auto"
        style={{ borderTop: '1px solid #d4c0a8', paddingTop: '3rem' }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.72rem',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#c44b2a',
            marginBottom: '0.75rem',
          }}
        >
          01 — About
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#1c140e',
            marginBottom: '1.25rem',
          }}
        >
          About
        </h2>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1.05rem',
            lineHeight: 1.7,
            color: '#5a4a3a',
            maxWidth: '62ch',
            marginBottom: '1.5rem',
          }}
        >
          I&apos;m a Product Manager and developer focused on creating clean,
          user-friendly web experiences. My interests include front-end
          engineering, data-driven utilities, and building products that make
          complex tasks easier to understand.
        </p>
        <a
          href="/Brett Fagan Resume.pdf"
          download="Brett_Fagan_Resume.pdf"
          className="inline-flex items-center gap-2 no-underline font-semibold transition-all duration-200"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            padding: '0.65rem 1.2rem',
            borderRadius: '0.4rem',
            backgroundColor: 'transparent',
            color: '#1f4e3d',
            border: '1.5px solid #1f4e3d',
            fontSize: '0.95rem',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#1f4e3d';
            e.currentTarget.style.color = '#faf4ec';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#1f4e3d';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download Resume
        </a>
      </div>
    </section>
  );
}

export default About;
