import { motion } from "framer-motion";

export function Hero() {
  return (
    <motion.section
      className="hero"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="hero-visual" aria-hidden />
      <div style={{ position: "relative", zIndex: 1 }}>
        <motion.div
          className="stat-pill pill-shimmer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Live pulse</span>
          <span style={{ fontWeight: 700 }}>New arrivals weekly</span>
        </motion.div>
        <h1>Discover albums that feel handcrafted.</h1>
        <p>
          Browse artists, preview the pulse of the catalog, and collect albums with a single tap.
          Ratings come only from listeners who truly own the music — averages stay honest.
        </p>
      </div>
    </motion.section>
  );
}
