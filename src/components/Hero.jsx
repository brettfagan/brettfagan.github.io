import { motion } from 'motion/react';

const ease = [0.25, 0.1, 0.25, 1];

const load = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.52, delay, ease },
});

function Hero() {
  return (
    <section
      style={{
        paddingTop: '5.5rem',
        paddingBottom: '5.5rem',
        background:
          'radial-gradient(ellipse 70% 45% at 60% -5%, rgba(167,139,250,0.06) 0%, transparent 70%)',
      }}
    >
      <div className="w-[min(1080px,92%)] mx-auto flex items-center gap-16 max-[680px]:flex-col max-[680px]:gap-10">

        {/* Text column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <motion.p
            {...load(0.12)}
            className="hp-section-label"
          >
            Product Manager &amp; Developer
          </motion.p>

          <motion.h1
            {...load(0.24)}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(2.6rem, 7vw, 4.75rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: '#e6edf3',
              marginBottom: '1.25rem',
            }}
          >
            Hi, I&apos;m<br />Brett Fagan.
          </motion.h1>

          <motion.p
            {...load(0.4)}
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.7,
              color: '#7d8590',
              maxWidth: '46ch',
              marginBottom: '2.25rem',
            }}
          >
            I build practical web tools and experiments that solve everyday
            problems — from spending analytics to bank integrations.
          </motion.p>

          <motion.div {...load(0.54)} className="flex gap-3 flex-wrap">
            <a className="hp-btn-primary" href="#personal-projects">
              View Projects
            </a>
            <a className="hp-btn-outline" href="#contact">
              Get in Touch
            </a>
          </motion.div>
        </div>

        {/* Photo column — flex:1 so it mirrors the text column width, photo centered within */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.3, ease }}
          style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
          className="max-[680px]:justify-start"
        >
          <img
            src="/brett.jpeg"
            alt="Brett Fagan"
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'top',
              boxShadow:
                '0 0 0 2px rgba(167,139,250,0.4), 0 0 0 6px #0e131f, 0 24px 56px rgba(0,0,0,0.45)',
              display: 'block',
            }}
          />
        </motion.div>
      </div>

      {/* Section divider */}
      <div
        className="w-[min(1080px,92%)] mx-auto"
        style={{ marginTop: '5rem', borderTop: '1px solid #1a2233' }}
      />
    </section>
  );
}

export default Hero;
