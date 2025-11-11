import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function AboutSection() {
  return (
    <section className="relative overflow-hidden py-24 px-6 bg-gradient-to-b from-white via-sky-50 to-white">
      {/* Decorative glowing background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15),transparent_60%)]"></div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left: About text */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-5xl md:text-5xl font-bold text-sky-900 mb-6 tracking-tight">
            About Us
          </h2>

          <p className="text-gray-700 text-lg leading-relaxed mb-5">
            <strong className="text-sky-700">PUB Student Hub</strong> is your
            digital companion at Pundra University — built to help students
            connect, find roommates, and share opportunities all in one
            community-driven space.
          </p>

          <p className="text-gray-700 text-lg leading-relaxed">
            Our goal is to foster a safe, collaborative, and vibrant ecosystem
            for PUB students — where connections become friendships and campus
            life becomes easier, smarter, and more fun.
          </p>
        </motion.div>

        {/* Right: Static Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-sky-100 hover:border-sky-300 backdrop-blur-sm"
        >
          <iframe
            title="Pundra University of Science & Technology Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d91190.03906932969!2d89.2666244!3d24.9222841!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fcff6dad46983f%3A0x32606b40b622acdb!2sPundra%20University%20of%20Science%20%26%20Technology%20(PUB)!5e0!3m2!1sen!2sbd!4v1731268120000!5m2!1sen!2sbd"
            width="100%"
            height="420"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>

          {/* Subtle blue overlay border glow */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-sky-200/40"></div>
        </motion.div>
      </div>
    </section>
  );
}
