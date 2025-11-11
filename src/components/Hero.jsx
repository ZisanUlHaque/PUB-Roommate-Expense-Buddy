import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import hero from "../assets/hero.jpg";

function CountUp({ value = 0, duration = 900 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const delta = value - from;
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(from + delta * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{v}</>;
}

export default function HeroSection({
  user,
  checking,
  hasProfile,
  hasPrefs,
  handleGetStarted,
}) {
  const phrases = ["ideal roommate", "friendly flatmate", "hostel partner"];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % phrases.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-sky-100 pb-20"
    >
      {/* Decorative Blur Elements */}
      <div className="pointer-events-none absolute top-[-6rem] right-[-6rem] h-96 w-96 rounded-full bg-sky-300/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-[-4rem] h-96 w-96 rounded-full bg-sky-400/10 blur-[150px]" />

      {/* Top Marquee */}
      <div className="flex items-center gap-3 border-b border-sky-200/40 bg-sky-100/70 px-4 py-2 backdrop-blur-sm">
        <p className="rounded-lg bg-sky-700 px-3 py-1 font-semibold text-white shadow-sm">
          Latest
        </p>
        <Marquee pauseOnHover gradient={false} speed={45}>
          🎓 Built for Pundra University Students — 🏠 Find Your Perfect Roommate — 🤝 Connect, Share & Save Together — 💬 Join the PUB Student Community
        </Marquee>
      </div>

      {/* Hero content */}
      <div className="relative mx-auto grid  items-center gap-10 px-6 pt-10 md:grid-cols-2">
        {/* LEFT: TEXT */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center md:text-left"
        >
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-sky-900 md:text-6xl">
            Find your{" "}
            <span className="bg-gradient-to-r from-sky-500 to-sky-700 bg-clip-text text-transparent transition-colors">
              {phrases[idx]}
            </span>
            .
            <br className="hidden md:block" />
            Live smarter, together.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-lg text-gray-600 md:mx-0 md:text-xl">
            Designed exclusively for{" "}
            <span className="font-semibold text-sky-700">Pundra University</span> students — connect, collaborate, and share smarter living.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetStarted}
              disabled={checking}
              className="rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-7 py-3 font-semibold text-white shadow-lg backdrop-blur transition-all duration-300 hover:shadow-xl disabled:opacity-60"
            >
              {checking ? "Loading…" : "Get Started"}
            </motion.button>
            <Link
              to="/community"
              className="rounded-xl border border-sky-200 bg-white/70 px-7 py-3 font-semibold text-sky-800 shadow-sm backdrop-blur transition-all duration-300 hover:bg-sky-50"
            >
              Visit Community
            </Link>
          </div>

          {user && !checking && (
            <p className="mt-4 text-sm text-gray-500">
              {!hasProfile
                ? "Complete your profile to continue."
                : !hasPrefs
                ? "Set up your preferences next."
                : "All set! Check your matches."}
            </p>
          )}

          {/* Mini stats */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: "Students joined", value: 1200 },
              { label: "Groups created", value: 340 },
              { label: "Expenses tracked", value: 5800 },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-sky-100 bg-white/80 p-3 text-center shadow-sm backdrop-blur-sm"
              >
                <div className="text-2xl font-extrabold text-slate-900">
                  <CountUp value={s.value} />+
                </div>
                <div className="text-xs text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT: IMAGE */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative flex justify-center md:justify-end"
        >
          <div className="absolute inset-0 -z-10 rounded-full bg-sky-400/10 blur-3xl" />
          <motion.img
            whileHover={{ scale: 1.03 }}
            src={hero}
            alt="Roommates illustration"
            className="w-full max-w-md rounded-3xl border border-sky-100 bg-white shadow-2xl md:max-w-lg"
            loading="lazy"
          />
        </motion.div>
      </div>
    </motion.section>
  );
}