function Contact() {
  return (
    <section
      id="contact"
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
          04 — Contact
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#1c140e',
            marginBottom: '1rem',
          }}
        >
          Contact
        </h2>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '1.05rem',
            lineHeight: 1.7,
            color: '#5a4a3a',
            maxWidth: '52ch',
            marginBottom: '1.75rem',
          }}
        >
          Interested in collaborating or learning more about my work? Feel free
          to reach out — I&apos;d love to connect.
        </p>
        <div className="flex gap-3 flex-wrap">
          <a
            href="mailto:fagan.brett@gmail.com"
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
            Email Me
          </a>
          <a
            href="https://www.linkedin.com/in/brettfagan/"
            target="_blank"
            rel="noreferrer"
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
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
