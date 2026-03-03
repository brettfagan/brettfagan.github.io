function Hero() {
  return (
    <section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <div
        className="w-[min(1080px,92%)] mx-auto flex items-center gap-16 max-[680px]:flex-col max-[680px]:gap-8"
      >
        {/* Text column */}
        <div style={{ flex: 1 }}>
          <p
            className="hp-section-label"
            style={{ animation: 'fadeUp 0.45s ease both' }}
          >
            Portfolio · Brett Fagan
          </p>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              lineHeight: 1.0,
              letterSpacing: '-0.035em',
              color: '#f0f0f0',
              marginBottom: '1.25rem',
              animation: 'fadeUp 0.45s ease 0.1s both',
            }}
          >
            Hi, I&apos;m<br />Brett Fagan.
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.65,
              color: '#999',
              maxWidth: '48ch',
              marginBottom: '2rem',
              animation: 'fadeUp 0.45s ease 0.2s both',
            }}
          >
            Product Manager and developer building practical web tools and
            experiments that solve everyday problems.
          </p>
          <div
            className="flex gap-4 flex-wrap"
            style={{ animation: 'fadeUp 0.45s ease 0.3s both' }}
          >
            <a className="hp-btn-primary" href="#personal-projects">
              View Projects
            </a>
            <a className="hp-btn-outline" href="#contact">
              Get in Touch
            </a>
          </div>
        </div>

        {/* Photo with geometric yellow frame */}
        <div className="hp-hero-photo-wrap">
          <img
            src="/brett.jpeg"
            alt="Brett Fagan"
            style={{
              width: '220px',
              height: '220px',
              objectFit: 'cover',
              objectPosition: 'top',
            }}
          />
        </div>
      </div>

      {/* Horizontal rule divider */}
      <div
        className="w-[min(1080px,92%)] mx-auto"
        style={{ marginTop: '4rem', borderTop: '1px solid #222' }}
      />
    </section>
  );
}

export default Hero;
