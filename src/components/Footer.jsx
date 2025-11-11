import React from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-sky-900 text-sky-50"
    >
      {/* Main content */}
      <div className=" mx-auto grid md:grid-cols-3 gap-10 px-6 py-10">
        {/* Left: Brand */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            PUB Student Hub
          </h2>
          <p className="text-sky-100 text-sm leading-relaxed">
            A student-driven platform for finding roommates, forming groups, and
            connecting with the Pundra University community.
          </p>
        </div>

        {/* Center: Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sky-100 text-sm">
            <li>
              <Link to="/" className="hover:text-white transition">
                Home
              </Link>
            </li>
            <li>
              <Link to="/matches" className="hover:text-white transition">
                Matches
              </Link>
            </li>
            <li>
              <Link to="/groups" className="hover:text-white transition">
                Groups
              </Link>
            </li>
            <li>
              <Link to="/community" className="hover:text-white transition">
                Community
              </Link>
            </li>
          </ul>
        </div>

        {/* Right: Contact & Social */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Stay Connected
          </h3>
          <p className="text-sky-200 text-sm mb-3">
            Follow us on social media and be part of the PUB student community.
          </p>
          <div className="flex gap-4 mb-3">
            <a href="#" className="hover:text-sky-300 transition">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-sky-300 transition">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-sky-300 transition">
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="mailto:contact@pubhub.com"
              className="hover:text-sky-300 transition"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>

          <p className="text-sky-200 text-sm">
            Email us at{" "}
            <a
              href="mailto:contact@pubhub.com"
              className="underline hover:text-white"
            >
              contact@pubhub.com
            </a>
          </p>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="bg-sky-950 text-sky-300 text-center py-3 text-sm border-t border-sky-800">
        © {new Date().getFullYear()} PUB Student Hub. All rights reserved.
      </div>
    </motion.footer>
  );
}
