import FadeUp from './FadeUp';

function About() {
  return (
    <section
      id="about"
      style={{ padding: '5rem 0', borderBottom: '1px solid #1a2233' }}
    >
      <div className="w-[min(1080px,92%)] mx-auto">
        <FadeUp>
          <p className="hp-section-label">01 — About</p>
          <h2 className="hp-section-heading">About Me</h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p style={{ maxWidth: '60ch', lineHeight: 1.75, color: '#94a3b8', marginBottom: '2rem', fontSize: '1.05rem' }}>
            I&apos;m a Product Manager and developer focused on creating clean,
            user-friendly web experiences. My interests include front-end
            engineering, data-driven utilities, and building products that make
            complex tasks easier to understand.
          </p>
          <a
            href="/Brett Fagan Resume.pdf"
            download="Brett_Fagan_Resume.pdf"
            className="hp-btn-outline inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Resume
          </a>
        </FadeUp>
      </div>
    </section>
  );
}

export default About;
