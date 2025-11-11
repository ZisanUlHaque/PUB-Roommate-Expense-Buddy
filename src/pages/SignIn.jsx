// src/pages/SignIn.jsx
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../firebase/firebase.config";
import { ref, update, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { emailKey } from "../utils/emailKey";
import { pathUser, pathEmailUid, pathProfile, pathPublic } from "../utils/rtdbPaths";

const ALLOWED_DOMAIN = "pundrauniv.edu";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [sid, setSid] = useState("");
  const [mode, setMode] = useState("signin"); // signup | signin
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function upsertAfterAuth(user, { isSignup = false } = {}) {
    const now = Date.now();
    const key = emailKey(user.email || "");
    const updates = {};

    // Read existing (for sign-in) so we don't overwrite dept/sid with empty
    let existing = {};
    if (!isSignup) {
      const snap = await get(ref(db, pathUser(user.uid)));
      existing = snap.val() || {};
    }

    // Basic index
    updates[pathUser(user.uid)] = {
      displayName: user.displayName || name || existing.displayName || "",
      email: user.email || "",
      department: isSignup ? dept : existing.department || "",
      studentId: isSignup ? sid : existing.studentId || "",
      updatedAt: now,
    };
    updates[pathEmailUid(key)] = user.uid;

    if (isSignup) {
      // Seed private profile
      updates[pathProfile(user.uid)] = {
        displayName: name || "",
        department: dept || "",
        studentId: sid || "",
        gender: "",
        languages: [],
        updatedAt: now,
      };
      // Seed public (for names in groups/matches)
      updates[pathPublic(user.uid)] = {
        displayName: name || "",
        gender: "other",
        languages: [],
        updatedAt: now,
      };
    } else {
      const pubSnap = await get(ref(db, pathPublic(user.uid)));
      if (!pubSnap.exists()) {
        updates[pathPublic(user.uid)] = {
          displayName: user.displayName || existing.displayName || "",
          updatedAt: now,
        };
      } else {
        updates[`${pathPublic(user.uid)}/displayName`] =
          user.displayName || pubSnap.val()?.displayName || existing.displayName || "";
        updates[`${pathPublic(user.uid)}/updatedAt`] = now;
      }
    }

    await update(ref(db), updates);
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const ok = email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
      if (!ok) {
        setErr(`Use your @${ALLOWED_DOMAIN} email`);
        return;
      }

      if (mode === "signup") {
        const res = await createUserWithEmailAndPassword(auth, email, pw);
        await updateProfile(res.user, { displayName: name });
        await upsertAfterAuth(res.user, { isSignup: true });
        nav("/onboarding/preferences");
      } else {
        const res = await signInWithEmailAndPassword(auth, email, pw);
        await upsertAfterAuth(res.user);
        nav("/matches");
      }
    } catch (e) {
      setErr(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-100 relative overflow-hidden">
      <div className="absolute w-72 h-72 bg-sky-200/40 blur-3xl rounded-full top-20 left-10 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-indigo-200/40 blur-3xl rounded-full bottom-10 right-10 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-8 border border-sky-100 relative z-10"
      >
        <h2 className="text-3xl font-bold text-center text-sky-900 mb-6">
          {mode === "signup" ? "Create Your PUB Account" : "Welcome Back"}
        </h2>

        {err && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="CSE">CSE</option>
                    <option value="EEE">EEE</option>
                    <option value="BBA">BBA</option>
                    <option value="English">English</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-sky-400 focus:outline-none"
                    type="text"
                    value={sid}
                    onChange={(e) => setSid(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PUB Email</label>
            <input
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-sky-400 focus:outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-sky-400 focus:outline-none"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 py-2.5 text-white font-semibold shadow-md hover:bg-sky-700 transition disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
          </motion.button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-sky-700 font-medium hover:underline"
          >
            {mode === "signup" ? "Already have an account? Sign In" : "New here? Create one"}
          </button>
        </div>
      </motion.div>
    </section>
  );
}