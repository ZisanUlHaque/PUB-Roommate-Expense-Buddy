import React, { useState } from "react";
import { auth, db } from "../firebase/firebase.config";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { pathProfile, pathPublic } from "../utils/rtdbPaths";

export default function ProfileSetup() {
  const [form, setForm] = useState({ displayName: "", gender: "", department: "", languages: "" });
  const nav = useNavigate();

  const save = async (e) => {
    e.preventDefault();
    const u = auth.currentUser;
    const languages = form.languages.split(",").map((s) => s.trim()).filter(Boolean);
    await set(ref(db, pathProfile(u.uid)), {
      displayName: form.displayName,
      gender: form.gender,
      department: form.department,
      languages,
      updatedAt: Date.now()
    });
    // store public-safe fields for matching
    await set(ref(db, pathPublic(u.uid)), {
      displayName: form.displayName,
      gender: form.gender,
      languages,
      // prefs will be merged after next step
      updatedAt: Date.now()
    });
    nav("/onboarding/preferences");
  };

  return (
    <div className="mx-auto max-w-xl my-6">
      <h2 className="mb-3 text-xl font-semibold">Profile</h2>
      <form onSubmit={save} className="space-y-3">
        <input className="w-full rounded border p-2" placeholder="Full name" onChange={(e)=>setForm({...form, displayName:e.target.value})} />
        <select className="w-full rounded border p-2" onChange={(e)=>setForm({...form, gender:e.target.value})}>
          <option value="">Select gender</option>
          <option value="male">male</option><option value="female">female</option><option value="other">other</option>
        </select>
        <input className="w-full rounded border p-2" placeholder="Department" onChange={(e)=>setForm({...form, department:e.target.value})} />
        <input className="w-full rounded border p-2" placeholder="Languages (comma separated)" onChange={(e)=>setForm({...form, languages:e.target.value})} />
        <button className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Save & Continue</button>
      </form>
    </div>
  );
}