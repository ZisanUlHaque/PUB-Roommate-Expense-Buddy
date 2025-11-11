import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function JoinCommunity() {
  return (
    <section className="relative overflow-hidden py-24 px-6 md:px-16 bg-gradient-to-r from-sky-50 via-white to-sky-100">
      {/* Background glow and subtle motion blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-200/30 blur-3xl rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-200/30 blur-3xl rounded-full animate-pulse"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-3xl mx-auto"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-sky-900 mb-6 leading-tight">
          Join our community and find your perfect{" "}
          <span className="text-sky-700">roommate</span> today
        </h2>

        <p className="text-gray-700 text-lg md:text-xl mb-10">
          Connect with PUB students, find trusted roommates, and enjoy a
          friendly campus experience. Be part of a network that helps you feel
          at home.
        </p>

        <motion.a
          href="/community"
          whileHover={{
            scale: 1.07,
            boxShadow: "0px 10px 30px rgba(79,70,229,0.3)",
          }}
          whileTap={{ scale: 0.96 }}
          className="inline-block bg-sky-700 text-white font-semibold px-10 py-4 rounded-full shadow-md hover:bg-indigo-700 transition-all"
        >
          Join Our Community
        </motion.a>
      </motion.div>
    </section>
  );
}
