import React from "react";
import { db } from "../firebase/firebase.config";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Community() {
  const [posts, setPosts] = React.useState([]);

  React.useEffect(() => {
    const unsub = onValue(ref(db, "communityPosts"), (s) => {
      const val = s.val() || {};
      const formatted = Object.entries(val)
        .map(([id, p]) => ({ id, ...p }))
        .sort((a, b) => b.createdAt - a.createdAt);
      setPosts(formatted);
    });
    return () => unsub();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-800 flex items-center gap-2">
          🏠 Community Board
        </h2>
        <Link
          to="/community/create"
          className="rounded-lg bg-sky-600 px-5 py-2 font-semibold text-white shadow-md transition-all hover:bg-sky-700 hover:shadow-lg"
        >
          + Create Post
        </Link>
      </div>

      {/* Posts */}
      {posts.length > 0 ? (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          {posts.map((p) => {
            // 💰 Price range display
            let priceRange = "N/A";
            if (p.minPrice && p.maxPrice)
              priceRange = `৳${p.minPrice} - ৳${p.maxPrice}`;
            else if (p.minPrice) priceRange = `From ৳${p.minPrice}`;
            else if (p.maxPrice) priceRange = `Up to ৳${p.maxPrice}`;

            return (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.03 }}
                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-md hover:shadow-xl transition-all"
              >
                {/* Header info */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      p.type === "offer"
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {p.type === "offer" ? "OFFER" : "LOOKING"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-sky-600 transition-colors">
                  {p.title}
                </h3>

                {/* Location & price */}
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  📍 {p.location || "Unknown"} <span>· 💰 {priceRange}</span>
                </p>

                {/* Description */}
                <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                  {p.description}
                </p>

                {/* Tags */}
                {Array.isArray(p.tags) && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {p.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-sky-100 text-sky-700 text-xs px-2 py-1 rounded-full font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 👤 Author */}
                <div className="text-xs text-gray-500 border-t pt-2 mt-2 flex justify-between items-center">
                  <span>👤 {p.authorName || "Anonymous"}</span>
                  <span className="italic text-gray-400">
                    {p.status === "active" ? "🟢 Active" : "⚪ Inactive"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="mt-10 text-center text-gray-500 text-lg">
          No posts yet. Be the first to share something! 🚀
        </div>
      )}
    </section>
  );
}
