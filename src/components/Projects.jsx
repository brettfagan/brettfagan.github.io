function Projects() {
  return (
    <section id="projects" className="section section-alt">
      <div className="container">
        <h2>Projects</h2>
        <div className="project-grid">
          <article className="project-card">
            <h3>Credit Card Spending Analyzer (WIP)</h3>
            <p>
              A work-in-progress tool to help visualize and understand spending
              trends across credit card statements.
            </p>
            <div className="project-actions">
              <a className="btn btn-primary" href="/cc-analyzer/">
                Open App
              </a>
              <a
                className="text-link"
                href="https://github.com/your-username/cc-analyzer"
                target="_blank"
                rel="noreferrer"
              >
                View GitHub Repo
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Projects;
