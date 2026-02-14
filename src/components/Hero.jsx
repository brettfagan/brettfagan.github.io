function Hero() {
  return (
    <section className="hero section">
      <div className="container hero-content">
        <p className="eyebrow">Welcome</p>
        <h1>Hi, I&apos;m Brett Fagan.</h1>
        <p className="subtitle">
          I build practical web tools and experiments that solve everyday
          problems.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#projects">
            View Projects
          </a>
          <a className="btn btn-secondary" href="#contact">
            Get in Touch
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
