function Hero() {
  return (
    <section className="pt-24 pb-20 max-[680px]:pt-16 max-[680px]:pb-14">
      <div className="w-[min(1080px,92%)] mx-auto flex items-center gap-16 max-[680px]:flex-col-reverse max-[680px]:gap-8">

        {/* Left: text column */}
        <div className="flex-1 min-w-0">
          <p
            className="hp-animate hp-animate-d0 mb-3"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#c44b2a',
            }}
          >
            Portfolio
          </p>
          <h1
            className="hp-animate hp-animate-d1 mb-5"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(2.8rem, 6vw, 4.2rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              fontWeight: 600,
              color: '#1c140e',
            }}
          >
            Hi, I&apos;m<br />Brett Fagan.
          </h1>
          <p
            className="hp-animate hp-animate-d2 mb-8"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '1.1rem',
              lineHeight: 1.65,
              color: '#5a4a3a',
              maxWidth: '44ch',
            }}
          >
            I build practical web tools and experiments that solve everyday problems.
          </p>
          <div className="hp-animate hp-animate-d3 flex gap-3 flex-wrap">
            <a
              href="#personal-projects"
              className="inline-block no-underline font-semibold transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                padding: '0.7rem 1.3rem',
                borderRadius: '0.4rem',
                backgroundColor: '#c44b2a',
                color: '#faf4ec',
                border: '1.5px solid #c44b2a',
                boxShadow: '0 6px 18px -8px rgba(196, 75, 42, 0.5)',
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
              View Projects
            </a>
            <a
              href="#contact"
              className="inline-block no-underline font-semibold transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                padding: '0.7rem 1.3rem',
                borderRadius: '0.4rem',
                backgroundColor: 'transparent',
                color: '#1f4e3d',
                border: '1.5px solid #1f4e3d',
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
              Get in Touch
            </a>
          </div>
        </div>

        {/* Right: photo column */}
        <div className="hp-animate hp-animate-d4 shrink-0 max-[680px]:self-center">
          <div
            style={{
              borderRadius: '50%',
              padding: '5px',
              background: 'linear-gradient(135deg, #c44b2a 0%, #e8a87c 50%, #c44b2a 100%)',
              boxShadow: '0 16px 48px -12px rgba(196, 75, 42, 0.3)',
            }}
          >
            <img
              src="/brett.jpeg"
              alt="Brett Fagan"
              style={{
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                objectFit: 'cover',
                objectPosition: 'top',
                display: 'block',
                border: '4px solid #f5ede0',
              }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;
