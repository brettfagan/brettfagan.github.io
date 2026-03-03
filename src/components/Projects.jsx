function Projects() {
  return (
    <section id="personal-projects" style={{ padding: '5rem 0', borderBottom: '1px solid #1e1e1e' }}>
      <div className="w-[min(1080px,92%)] mx-auto">
        <p className="hp-section-label">03 — Projects</p>
        <h2 className="hp-section-heading">Personal Projects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          <article className="hp-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
              <h3 style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '1.3rem',
                letterSpacing: '-0.02em',
                color: '#f0f0f0',
                lineHeight: 1.2,
              }}>
                Credit Card Spending Analyzer
              </h3>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#ffe600',
                border: '1px solid #ffe600',
                borderRadius: '2px',
                padding: '3px 8px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                WIP
              </span>
            </div>
            <p style={{ color: '#888', fontSize: '1rem', lineHeight: 1.65, maxWidth: '55ch', marginBottom: '1.75rem' }}>
              A tool to visualize and understand spending trends across credit
              card statements — imports CSVs and Plaid bank connections, with
              charts, categories, and budget tracking.
            </p>
            <div className="flex gap-4 flex-wrap">
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
        </div>
      </div>
    </section>
  );
}

export default Projects;
