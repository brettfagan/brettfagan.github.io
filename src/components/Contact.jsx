function Contact() {
  return (
    <section id="contact" style={{ padding: '5rem 0', backgroundColor: '#141414' }}>
      <div className="w-[min(1080px,92%)] mx-auto">
        <p className="hp-section-label">04 — Contact</p>
        <h2 className="hp-section-heading">Get in Touch</h2>
        <p style={{ maxWidth: '52ch', lineHeight: 1.7, color: '#aaa', marginBottom: '2rem', fontSize: '1.05rem' }}>
          Interested in collaborating or learning more about my work? Feel free
          to reach out — I&apos;d love to connect.
        </p>
        <div className="flex gap-4 flex-wrap">
          <a className="hp-btn-primary" href="mailto:fagan.brett@gmail.com">
            Email Me
          </a>
          <a
            className="hp-btn-outline"
            href="https://www.linkedin.com/in/brettfagan/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
