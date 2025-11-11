import React, { useState } from "react";
import { auth, db } from "../firebase/firebase.config";
import { ref, push, set } from "firebase/database";
import { pathPosts } from "../utils/rtdbPaths";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    type: "offer",
    title: "",
    location: "",
    minPrice: "",
    maxPrice: "",
    description: "",
    tags: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    const u = auth.currentUser;
    const pRef = push(ref(db, pathPosts()));

    const newPost = {
      ...form,
      tags:
        form.tags.trim() !== ""
          ? form.tags.split(",").map((t) => t.trim())
          : [],
      createdBy: u?.uid || "guest",
      // ✅ show display name, or email name, or fallback to "Anonymous"
      authorName:
        u?.displayName ||
        (u?.email ? u.email.split("@")[0] : "Anonymous"),
      createdAt: Date.now(),
      status: "active",
    };

    await set(pRef, newPost);
    nav("/community");
  };

  return (
    <section className="mx-auto max-w-xl px-6 py-10">
      <h2 className="mb-6 text-3xl font-bold text-gray-800 text-center">
        ✍️ Create a New Post
      </h2>

      <form
        onSubmit={submit}
        className="space-y-4 bg-white shadow-lg rounded-2xl p-6 border border-gray-100"
      >
        {/* Type */}
        <div>
          <label className="block mb-1 text-gray-700 font-medium">Type</label>
          <select
            className="w-full rounded border-gray-300 p-2"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="offer">Room Offered</option>
            <option value="need">Looking for Roommate</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block mb-1 text-gray-700 font-medium">Title</label>
          <input
            type="text"
            required
            className="w-full rounded border-gray-300 p-2"
            placeholder="e.g. Cozy shared flat in Dhanmondi"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block mb-1 text-gray-700 font-medium">
            Location
          </label>
          <input
            type="text"
            required
            className="w-full rounded border-gray-300 p-2"
            placeholder="e.g. Dhanmondi, Dhaka"
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Min Price
            </label>
            <input
              type="number"
              className="w-full rounded border-gray-300 p-2"
              placeholder="৳2000"
              onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 font-medium">
              Max Price
            </label>
            <input
              type="number"
              className="w-full rounded border-gray-300 p-2"
              placeholder="৳4000"
              onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block mb-1 text-gray-700 font-medium">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            className="w-full rounded border-gray-300 p-2"
            placeholder="wifi, near campus, air conditioned"
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 text-gray-700 font-medium">
            Description
          </label>
          <textarea
            rows="4"
            className="w-full rounded border-gray-300 p-2"
            placeholder="Describe your offer or what kind of roommate you're looking for..."
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-sky-600 text-white font-semibold py-2.5 rounded-lg shadow-md hover:bg-sky-700 transition-all"
        >
          🚀 Publish Post
        </button>
      </form>
    </section>
  );
}
