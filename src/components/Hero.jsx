function Hero() {
  return (
    <section className="pt-24 pb-20 max-[680px]:pt-18">
      <div className="w-[min(1080px,92%)] mx-auto flex items-center gap-12 max-[680px]:flex-col-reverse max-[680px]:gap-8">
        <div>
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
              href="#personal-projects"
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
        <div className="flex items-center gap-4 shrink-0 max-[680px]:gap-3">
          <img
            src="/brett.jpeg"
            alt="Brett Fagan"
            className="w-56 h-56 rounded-full object-cover object-top shadow-[0_8px_32px_-12px_#6679ac] max-[680px]:w-36 max-[680px]:h-36"
          />
          <img
            src="/brettlabsicon.png"
            alt="BrettLabs"
            className="w-56 h-56 rounded-full object-cover shadow-[0_8px_32px_-12px_#6679ac] max-[680px]:w-36 max-[680px]:h-36"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
