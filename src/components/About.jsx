function About() {
  return (
    <section id="about" className="py-[4.5rem] max-[680px]:py-14">
      <div className="w-[min(1080px,92%)] mx-auto">
        <h2 className="text-[clamp(1.6rem,4vw,2.4rem)] leading-[1.2] tracking-[-0.02em] mb-4">About</h2>
        <p className="max-w-[70ch] mb-[1.2rem]">
          I&apos;m a Product Manager and developer focused on creating clean,
          user-friendly web experiences. My interests include front-end
          engineering, data-driven utilities, and building products that make
          complex tasks easier to understand.
        </p>
        <a
          href="/Brett Fagan Resume.pdf"
          download="Brett_Fagan_Resume.pdf"
          className="inline-flex items-center gap-2 py-[0.7rem] px-[1.1rem] rounded-[0.55rem] border no-underline font-semibold transition-transform duration-200 hover:-translate-y-px bg-[#e9eefb] text-[#20305c] border-[#ccd7f2]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download Resume
        </a>
      </div>
    </section>
  );
}

export default About;
