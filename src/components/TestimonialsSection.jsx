import React from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Rafi, EEE 2nd Year",
      quote:
        "I found a great roommate within a day! The matching was spot-on.",
    },
    {
      name: "Afsana, CSE 2nd Year",
      quote:
        "Expense tracking and payments are super smooth. No more confusion!",
    },
    {
      name: "Nayeem, BBA 1st Year",
      quote:
        "Finally a platform made just for PUB students. Love the community!",
    },
  ];

  return (
    <section className="relative overflow-hidden py-24 px-6 bg-gradient-to-b from-white via-sky-50 to-white">
      {/* Glowing decorative backdrop */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_60%)]"></div>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-5xl md:text-5xl font-bold text-center mb-14 text-sky-900 tracking-tight"
      >
        What Students Say
      </motion.h2>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 15px 35px rgba(56,189,248,0.25)",
            }}
            className="relative bg-white/70 backdrop-blur-md border border-sky-100 rounded-3xl shadow-sm p-8 text-center hover:bg-white/90 transition-all"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-sky-100 p-3 rounded-full shadow-md">
              <MessageSquare className="w-6 h-6 text-sky-600" />
            </div>

            <p className="italic text-gray-700 mt-6 mb-3 text-lg leading-relaxed">
              “{t.quote}”
            </p>
            <p className="text-sm font-medium text-sky-800">— {t.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Subtle divider line at bottom */}
      <div className="mt-20 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent"></div>
    </section>
  );
}
