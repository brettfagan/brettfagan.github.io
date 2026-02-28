function Projects() {
  return (
    <section id="projects" className="py-[4.5rem] bg-[#f0f4fb] max-[680px]:py-14">
      <div className="w-[min(1080px,92%)] mx-auto">
        <h2 className="text-[clamp(1.6rem,4vw,2.4rem)] leading-[1.2] tracking-[-0.02em] mb-4">Projects</h2>
        <div className="grid grid-cols-1 gap-4">
          <article className="bg-white border border-[#dde5f3] rounded-[0.9rem] p-[1.4rem] shadow-[0_8px_24px_-20px_#6679ac]">
            <h3 className="text-[1.3rem] leading-[1.2] tracking-[-0.02em] mb-4">Credit Card Spending Analyzer (WIP)</h3>
            <p className="max-w-[70ch] mb-[1.2rem]">
              A work-in-progress tool to help visualize and understand spending
              trends across credit card statements.
            </p>
            <div className="flex gap-[0.85rem] flex-wrap mt-6">
              <a
                className="inline-block py-[0.7rem] px-[1.1rem] rounded-[0.55rem] border border-transparent no-underline font-semibold transition-transform duration-200 hover:-translate-y-px bg-[#3158d4] text-white shadow-[0_8px_20px_-12px_#3158d4]"
                href="/tools/spend-analyzer/"
              >
                Open App
              </a>
              <a
                className="inline-block py-[0.7rem] px-[1.1rem] rounded-[0.55rem] border no-underline font-semibold transition-transform duration-200 hover:-translate-y-px bg-[#e9eefb] text-[#20305c] border-[#ccd7f2]"
                href="https://github.com/brettfagan"
                target="_blank"
                rel="noreferrer"
              >
                Visit GitHub
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Projects;
