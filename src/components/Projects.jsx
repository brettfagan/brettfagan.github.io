import FadeUp from './FadeUp';

function Projects() {
  return (
    <section
      id="personal-projects"
      style={{ padding: '5rem 0', borderBottom: '1px solid #1a2233' }}
    >
      <div className="w-[min(1080px,92%)] mx-auto">
        <FadeUp>
          <p className="hp-section-label">03 — Projects</p>
          <h2 className="hp-section-heading">Personal Projects</h2>
        </FadeUp>

        <FadeUp delay={0.12}>
          <article className="hp-card">
            <div className="flex items-start justify-between gap-4" style={{ marginBottom: '0.875rem' }}>
              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                  color: '#e6edf3',
                  lineHeight: 1.2,
                }}
              >
                Credit Card Spending Analyzer
              </h3>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#a78bfa',
                  border: '1px solid rgba(167,139,250,0.35)',
                  borderRadius: '6px',
                  padding: '3px 9px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  backgroundColor: 'rgba(167,139,250,0.07)',
                }}
              >
                WIP
              </span>
            </div>
            <p style={{ color: '#7d8590', fontSize: '0.975rem', lineHeight: 1.7, maxWidth: '55ch', marginBottom: '1.75rem' }}>
              A tool to visualize and understand spending trends across credit
              card statements — imports CSVs and Plaid bank connections, with
              charts, categories, and budget tracking.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a className="hp-btn-primary" href="/tools/spend-analyzer/">
                Open App
              </a>
              <a
                className="hp-btn-outline"
                href="https://github.com/brettfagan"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </article>
        </FadeUp>
      </div>
    </section>
  );
}

export default Projects;
