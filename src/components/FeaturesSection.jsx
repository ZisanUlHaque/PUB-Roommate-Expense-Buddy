import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

import img1 from "../assets/roommate.jpg";
import img2 from "../assets/community.jpg";
import img3 from "../assets/6500407.jpg";
import img4 from "../assets/SL-110820-37810-11.jpg";

export default function FeaturesSection() {
  const images = [img1, img2, img3, img4];

  const features = [
    {
      title: "Smart Roommate Matching",
      desc: "Get matched with the perfect roommate based on your lifestyle, habits, and budget.",
    },
    {
      title: "Digital Payments & Expense Tracker",
      desc: "Split rent and utilities using our tracker. (BDT gateways coming soon.)",
    },
    {
      title: "Verified Access for PUB Students",
      desc: "Only verified Pundra University students can join — safe and authentic.",
    },
    {
      title: "Community Board",
      desc: "Discover or post room offers, find flatmates, and engage with your peers.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-sky-50 to-white px-6 py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_60%)]" />

      <h2 className="mb-16 text-center text-5xl font-bold tracking-tight text-sky-900 md:text-5xl">
        Why Choose PUB Student Hub
      </h2>

      <div className="mx-auto grid max-w-7xl items-center gap-16 md:grid-cols-2">
        {/* LEFT: Collage */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 gap-6"
        >
          {images.map((img, i) => (
            <motion.div
              key={i}
              whileHover={{
                scale: 1.06,
                rotate: i % 2 === 0 ? -1 : 1,
                boxShadow: "0 15px 30px rgba(56,189,248,0.25)",
              }}
              transition={{ duration: 0.35 }}
              className={`transform cursor-pointer overflow-hidden rounded-3xl shadow-lg transition-all ${
                i % 2 === 0 ? "translate-y-6" : "-translate-y-6"
              }`}
            >
              <img
                src={img}
                alt={`feature-${i}`}
                className="h-56 w-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* RIGHT: Feature list */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="space-y-8"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 10px 25px rgba(56,189,248,0.15)",
              }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm hover:bg-white/90"
            >
              <h3 className="mb-2 text-2xl font-semibold text-sky-800">
                {f.title}
              </h3>
              <p className="text-base leading-relaxed text-gray-700">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}