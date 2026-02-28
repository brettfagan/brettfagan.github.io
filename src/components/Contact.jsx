function Contact() {
  return (
    <section id="contact" className="py-[4.5rem] max-[680px]:py-14">
      <div className="w-[min(1080px,92%)] mx-auto">
        <h2 className="text-[clamp(1.6rem,4vw,2.4rem)] leading-[1.2] tracking-[-0.02em] mb-4">Contact</h2>
        <p className="max-w-[70ch] mb-[1.2rem]">
          Interested in collaborating or learning more about my work? Reach out
          via GitHub and let&apos;s connect.
        </p>
        <a
          className="inline-block py-[0.7rem] px-[1.1rem] rounded-[0.55rem] border border-transparent no-underline font-semibold transition-transform duration-200 hover:-translate-y-px bg-[#3158d4] text-white shadow-[0_8px_20px_-12px_#3158d4]"
          href="https://github.com/brettfagan"
        >
          Visit GitHub
        </a>
      </div>
    </section>
  );
}

export default Contact;
