function MyWork() {
  return (
    <section
      id="my-work"
      className="py-20 max-[680px]:py-14"
      style={{ backgroundColor: '#ede0ce' }}
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
          02 — My Work
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#1c140e',
            marginBottom: '1.5rem',
          }}
        >
          My Work
        </h2>
        <div style={{ borderLeft: '3px solid #d4c0a8', paddingLeft: '1.5rem' }}>
          <p
            style={{
              fontFamily: "'Fraunces', serif",
              fontStyle: 'italic',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              fontWeight: 300,
              lineHeight: 1.5,
              color: '#5a4a3a',
              maxWidth: '52ch',
            }}
          >
            Details about products I&apos;ve managed throughout my career&mdash;coming soon.
          </p>
        </div>
      </div>
    </section>
  );
}

export default MyWork;
