function Hero() {
  return (
    <section className="pt-24 pb-20 max-[680px]:pt-[4.5rem]">
      <div className="w-[min(1080px,92%)] mx-auto">
        <p className="uppercase tracking-[0.08em] text-[0.8rem] text-[#536189] font-bold">Welcome</p>
        <h1 className="text-[clamp(2rem,5vw,3.6rem)] leading-[1.2] tracking-[-0.02em] mb-4">
          Hi, I&apos;m Brett Fagan. 👋
        </h1>
        <p className="text-[1.1rem] text-[#33415f] max-w-[70ch] mb-[1.2rem]">
          I build practical web tools and experiments that solve everyday
          problems.
        </p>
        <div className="flex gap-[0.85rem] flex-wrap mt-6">
          <a
            className="inline-block py-[0.7rem] px-[1.1rem] rounded-[0.55rem] border border-transparent no-underline font-semibold transition-transform duration-200 hover:-translate-y-px bg-[#3158d4] text-white shadow-[0_8px_20px_-12px_#3158d4]"
            href="#projects"
          >
            View Projects
          </a>
          <a
            className="inline-block py-[0.7rem] px-[1.1rem] rounded-[0.55rem] border no-underline font-semibold transition-transform duration-200 hover:-translate-y-px bg-[#e9eefb] text-[#20305c] border-[#ccd7f2]"
            href="#contact"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
