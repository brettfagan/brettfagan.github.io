function Projects() {
  return (
    <section
      id="personal-projects"
      className="py-20 max-[680px]:py-14"
      style={{ backgroundColor: '#f5ede0' }}
    >
      <div className="w-[min(1080px,92%)] mx-auto">
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
          03 — Projects
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#1c140e',
            marginBottom: '1.75rem',
          }}
        >
          Personal Projects
        </h2>
        <div className="grid grid-cols-1 gap-5">
          <article
            style={{
              backgroundColor: '#faf4ec',
              border: '1px solid #d4c0a8',
              borderRadius: '0.6rem',
              overflow: 'hidden',
              boxShadow: '0 6px 24px -12px rgba(28, 20, 14, 0.18)',
            }}
          >
            <div style={{ height: '3px', backgroundColor: '#c44b2a' }} />
            <div style={{ padding: '1.5rem 1.75rem 1.75rem' }}>
              <h3
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: '1.35rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: '-0.015em',
                  color: '#1c140e',
                  marginBottom: '0.75rem',
                }}
              >
                Credit Card Spending Analyzer
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#c44b2a',
                    marginLeft: '0.75rem',
                    verticalAlign: 'middle',
                  }}
                >
                  WIP
                </span>
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  color: '#5a4a3a',
                  maxWidth: '60ch',
                  marginBottom: '1.5rem',
                }}
              >
                A work-in-progress tool to help visualize and understand spending
                trends across credit card statements.
              </p>
              <div className="flex gap-3 flex-wrap">
                <a
                  href="/tools/spend-analyzer/"
                  className="inline-block no-underline font-semibold transition-all duration-200"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    padding: '0.65rem 1.2rem',
                    borderRadius: '0.4rem',
                    backgroundColor: '#c44b2a',
                    color: '#faf4ec',
                    border: '1.5px solid #c44b2a',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 14px -6px rgba(196, 75, 42, 0.4)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#9e3a1e';
                    e.currentTarget.style.borderColor = '#9e3a1e';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#c44b2a';
                    e.currentTarget.style.borderColor = '#c44b2a';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Open App
                </a>
                <a
                  href="https://github.com/brettfagan"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block no-underline font-semibold transition-all duration-200"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    padding: '0.65rem 1.2rem',
                    borderRadius: '0.4rem',
                    backgroundColor: 'transparent',
                    color: '#1f4e3d',
                    border: '1.5px solid #1f4e3d',
                    fontSize: '0.9rem',
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
                  Visit GitHub
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Projects;
