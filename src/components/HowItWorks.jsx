import React from "react";
import { motion } from "framer-motion";
import { Users, Wallet, GraduationCap } from "lucide-react";

import step1 from "../assets/how1.png";
import step2 from "../assets/how2.png";
import step3 from "../assets/how3.png";

export default function HowItWorks() {
  const steps = [
    {
      image: step1,
      icon: <GraduationCap className="w-10 h-10 text-sky-600" />,
      title: "Create Your Profile",
      text: "Share your lifestyle, habits, and budget preferences.",
    },
    {
      image: step2,
      icon: <Users className="w-10 h-10 text-sky-600" />,
      title: "Get Matched",
      text: "Our smart algorithm connects you with the most compatible roommates.",
    },
    {
      image: step3,
      icon: <Wallet className="w-10 h-10 text-sky-600" />,
      title: "Split Expenses",
      text: "Track and manage shared rent, bills, and groceries with ease.",
    },
  ];

  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-white via-sky-50 to-white overflow-hidden">
      {/* subtle floating glow background */}
      <div className="absolute inset-0 -z-10 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.3),transparent_50%)]"></div>

      <h2 className="text-4xl md:text-5xl font-bold text-center mb-14 text-sky-900 tracking-tight">
        How It Works
      </h2>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
        {steps.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, duration: 0.7, ease: "easeOut" }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 15px 35px rgba(56, 189, 248, 0.25)",
            }}
            className="rounded-3xl overflow-hidden shadow-md bg-white border border-sky-100 hover:border-sky-200 transition-all duration-300 cursor-pointer backdrop-blur-sm"
          >
            {/* Image */}
            <div className="relative h-56 overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transform hover:scale-110 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex items-center justify-center">
                <div className="bg-white/90 p-3 rounded-full shadow-md">
                  {item.icon}
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="p-6 text-center">
              <h3 className="font-semibold text-lg text-sky-800 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
