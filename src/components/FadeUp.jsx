import { motion } from 'motion/react';

const ease = [0.25, 0.1, 0.25, 1];

export default function FadeUp({ children, delay = 0, className, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
