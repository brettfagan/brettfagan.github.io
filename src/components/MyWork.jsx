import FadeUp from './FadeUp';

function MyWork() {
  return (
    <section
      id="my-work"
      style={{ padding: '5rem 0', backgroundColor: '#141b2b', borderBottom: '1px solid #1a2233' }}
    >
      <div className="w-[min(1080px,92%)] mx-auto">
        <FadeUp>
          <p className="hp-section-label">02 — My Work</p>
          <h2 className="hp-section-heading">My Work</h2>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p style={{ fontSize: '1.05rem', color: '#475569', maxWidth: '52ch', lineHeight: 1.75 }}>
            Details about products I&apos;ve managed throughout my career —{' '}
            <span style={{ color: '#64748b', fontStyle: 'italic' }}>coming soon.</span>
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

export default MyWork;
