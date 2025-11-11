import React, { useState } from "react";
import { auth, db } from "../firebase/firebase.config";
import { ref, set, get, child, update } from "firebase/database";
import { pathPrefs, pathPublic } from "../utils/rtdbPaths";
import { useNavigate } from "react-router-dom";

export default function PreferencesSetup() {
  const nav = useNavigate();
  const [pref, setPref] = useState({
    budgetMin: 3000, budgetMax: 6000,
    cleanliness: 3, noiseTolerance: 3, sleepSchedule: "mid",
    smoker: false, drinker: false, guestsTolerance: 3,
    studyHabits: "mixed", foodPreference: "any",
    roommateGenderPreference: "any"
  });

  const save = async (e) => {
    e.preventDefault();
    const u = auth.currentUser;
    await set(ref(db, pathPrefs(u.uid)), { ...pref, updatedAt: Date.now() });
    // merge public-safe prefs into /public
    const pubRef = ref(db, pathPublic(u.uid));
    const snap = await get(pubRef);
    const pub = snap.val() || {};
    await update(pubRef, {
      budgetMin: pref.budgetMin, budgetMax: pref.budgetMax,
      cleanliness: pref.cleanliness, noiseTolerance: pref.noiseTolerance,
      sleepSchedule: pref.sleepSchedule, smoker: pref.smoker, drinker: pref.drinker,
      guestsTolerance: pref.guestsTolerance, studyHabits: pref.studyHabits,
      roommateGenderPreference: pref.roommateGenderPreference,
      updatedAt: Date.now()
    });
    nav("/matches");
  };

  return (
    <div className="mx-auto max-w-xl space-y-3 my-6">
      <h2 className="text-xl font-semibold">Preferences</h2>
      <div className="grid grid-cols-2 gap-3">
        <input className="rounded border p-2" type="number" placeholder="Budget Min" onChange={(e)=>setPref({...pref, budgetMin:+e.target.value})}/>
        <input className="rounded border p-2" type="number" placeholder="Budget Max" onChange={(e)=>setPref({...pref, budgetMax:+e.target.value})}/>
        <select className="rounded border p-2" onChange={(e)=>setPref({...pref, cleanliness:+e.target.value})}>
          <option>Cleanliness (1–5)</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <select className="rounded border p-2" onChange={(e)=>setPref({...pref, noiseTolerance:+e.target.value})}>
          <option>Noise (1–5)</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
        <select className="rounded border p-2" onChange={(e)=>setPref({...pref, sleepSchedule:e.target.value})}>
          <option value="mid">Sleep</option><option value="early">early</option><option value="mid">mid</option><option value="late">late</option>
        </select>
        <select className="rounded border p-2" onChange={(e)=>setPref({...pref, roommateGenderPreference:e.target.value})}>
          <option value="any">Roommate Gender</option><option value="male">male</option><option value="female">female</option><option value="any">any</option>
        </select>
        <select className="rounded border p-2" onChange={(e)=>setPref({...pref, studyHabits:e.target.value})}>
          <option value="mixed">Study</option><option value="solo">solo</option><option value="group">group</option><option value="mixed">mixed</option>
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" onChange={(e)=>setPref({...pref, smoker:e.target.checked})}/>Smoker</label>
        <label className="flex items-center gap-2"><input type="checkbox" onChange={(e)=>setPref({...pref, drinker:e.target.checked})}/>Drinker</label>
      </div>
      <button onClick={save} className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Save & See Matches</button>
    </div>
  );
}