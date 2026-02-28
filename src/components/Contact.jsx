function Contact() {
  return (
    <section id="contact" className="py-18 max-[680px]:py-14">
      <div className="w-[min(1080px,92%)] mx-auto">
        <h2 className="text-[clamp(1.6rem,4vw,2.4rem)] leading-[1.2] tracking-[-0.02em] mb-4">Contact</h2>
        <p className="max-w-[70ch] mb-[1.2rem]">
          Interested in collaborating or learning more about my work? Feel free
          to reach out — I&apos;d love to connect.
        </p>
        <div className="flex gap-[0.85rem] flex-wrap">
          <a
            className="inline-block py-[0.7rem] px-[1.1rem] rounded-[0.55rem] border border-transparent no-underline font-semibold transition-transform duration-200 hover:-translate-y-px bg-[#3158d4] text-white shadow-[0_8px_20px_-12px_#3158d4]"
            href="mailto:fagan.brett@gmail.com"
          >
            Email Me
          </a>
          <a
            className="inline-block py-[0.7rem] px-[1.1rem] rounded-[0.55rem] border no-underline font-semibold transition-transform duration-200 hover:-translate-y-px bg-[#e9eefb] text-[#20305c] border-[#ccd7f2]"
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
