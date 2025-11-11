// src/pages/MyProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase/firebase.config";
import { ref, get, set, update, onValue, push } from "firebase/database";
import { pathProfile, pathPrefs, pathPublic, pathGroups } from "../utils/rtdbPaths";
import { scorePair } from "../utils/scoring";
import { useToast } from "../components/Toast";

// Local Avatar and color generator (no external utils required)
function Avatar({ name = "", size = 36 }) {
  const initials = name
    ? name.split(/\s+/).map((p) => p[0]?.toUpperCase()).slice(0, 2).join("")
    : "U";
  const color = colorFromString(name || "user");
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold"
      style={{ width: size, height: size, background: color }}
      title={name}
    >
      {initials}
    </div>
  );
}
function colorFromString(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

export default function MyProfile() {
  const [loading, setLoading] = useState(true);

  // Profile
  const [profile, setProfile] = useState({
    displayName: "",
    department: "",
    studentId: "",
    gender: "",
    languages: ""
  });

  // Preferences
  const [prefs, setPrefs] = useState({
    budgetMin: 3000,
    budgetMax: 6000,
    cleanliness: 3,
    noiseTolerance: 3,
    sleepSchedule: "mid",
    smoker: false,
    drinker: false,
    guestsTolerance: 3,
    studyHabits: "mixed",
    roommateGenderPreference: "any"
  });

  // Groups + names
  const [groups, setGroups] = useState([]);
  const [userNames, setUserNames] = useState({});

  // Suggestions
  const [mePublic, setMePublic] = useState(null);
  const [othersPublic, setOthersPublic] = useState([]);
  const [scored, setScored] = useState([]);

  const nav = useNavigate();
  const toast = useToast();
  const showToast =
    toast?.show ||
    (({ title, desc }) => console.log("[toast]", title || "", desc || ""));

  // Load my profile, prefs, groups, and public data
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      nav("/auth/sign-in");
      return;
    }

    (async () => {
      try {
        setLoading(true);

        // Private profile and prefs
        const [pSnap, prefSnap] = await Promise.all([
          get(ref(db, pathProfile(u.uid))),
          get(ref(db, pathPrefs(u.uid)))
        ]);
        const p = pSnap.val() || {};
        const pr = prefSnap.val() || {};

        setProfile({
          displayName: p.displayName || u.displayName || "",
          department: p.department || "",
          studentId: p.studentId || "",
          gender: p.gender || "",
          languages: Array.isArray(p.languages) ? p.languages.join(", ") : ""
        });

        setPrefs({
          budgetMin: Number(pr.budgetMin ?? 3000),
          budgetMax: Number(pr.budgetMax ?? 6000),
          cleanliness: Number(pr.cleanliness ?? 3),
          noiseTolerance: Number(pr.noiseTolerance ?? 3),
          sleepSchedule: pr.sleepSchedule || "mid",
          smoker: !!pr.smoker,
          drinker: !!pr.drinker,
          guestsTolerance: Number(pr.guestsTolerance ?? 3),
          studyHabits: pr.studyHabits || "mixed",
          roommateGenderPreference: pr.roommateGenderPreference || "any"
        });

        // Subscribe to my groups
        const unsubGroups = onValue(ref(db, pathGroups()), (s) => {
          const val = s.val() || {};
          const mine = Object.entries(val)
            .map(([id, g]) => ({ id, ...g }))
            .filter((g) => g.members && g.members[u.uid]);
          setGroups(mine);

          // Load names for members from /public
          const allUids = new Set();
          mine.forEach((g) => Object.keys(g.members || {}).forEach((m) => allUids.add(m)));
          if (allUids.size) {
            Promise.all([...allUids].map((id) => get(ref(db, `/public/${id}`)))).then((snaps) => {
              const map = {};
              snaps.forEach((snap, idx) => {
                const id = [...allUids][idx];
                map[id] = snap.val() || {};
              });
              setUserNames(map);
            });
          } else {
            setUserNames({});
          }
        });

        // Ensure my public record exists and subscribe to others
        const myPubRef = ref(db, pathPublic(u.uid));
        let pub = (await get(myPubRef)).val();
        if (!pub) {
          pub = {
            displayName: p.displayName || u.displayName || "",
            gender: p.gender || "other",
            languages: Array.isArray(p.languages) ? p.languages : [],
            budgetMin: Number(pr.budgetMin ?? 3000),
            budgetMax: Number(pr.budgetMax ?? 6000),
            cleanliness: Number(pr.cleanliness ?? 3),
            noiseTolerance: Number(pr.noiseTolerance ?? 3),
            sleepSchedule: pr.sleepSchedule || "mid",
            smoker: !!pr.smoker,
            drinker: !!pr.drinker,
            guestsTolerance: Number(pr.guestsTolerance ?? 3),
            studyHabits: pr.studyHabits || "mixed",
            roommateGenderPreference: pr.roommateGenderPreference || "any",
            updatedAt: Date.now()
          };
          await set(myPubRef, pub);
        }
        setMePublic(pub);

        const unsubPublic = onValue(ref(db, "/public"), (snap) => {
          const val = snap.val() || {};
          const arr = Object.entries(val)
            .filter(([uid]) => uid !== u.uid)
            .map(([uid, d]) => ({ uid, ...(d || {}) }));
          setOthersPublic(arr);
        });

        setLoading(false);

        return () => {
          unsubGroups();
          unsubPublic();
        };
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
  }, [db]);

  // Compute top suggestions
  useEffect(() => {
    if (!mePublic) return setScored([]);
    const top = othersPublic
      .map((o) => {
        const r = scorePair(mePublic, mePublic, o, o);
        if (!r) return null;
        return { ...o, ...r };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    setScored(top);
  }, [mePublic, othersPublic]);

  // Save profile
  const saveProfile = async () => {
    try {
      const u = auth.currentUser;
      const langs = profile.languages.split(",").map((s) => s.trim()).filter(Boolean);

      await set(ref(db, pathProfile(u.uid)), {
        displayName: profile.displayName || "",
        department: profile.department || "",
        studentId: profile.studentId || "",
        gender: profile.gender || "",
        languages: langs,
        updatedAt: Date.now()
      });

      // Keep public in sync with safe fields
      await update(ref(db, pathPublic(u.uid)), {
        displayName: profile.displayName || "",
        gender: profile.gender || "other",
        languages: langs,
        updatedAt: Date.now()
      });

      // Also update /users for quick name/department lookup if needed
      await update(ref(db, `/users/${u.uid}`), {
        displayName: profile.displayName || "",
        department: profile.department || "",
        studentId: profile.studentId || "",
        updatedAt: Date.now()
      });

      showToast({ status: "success", title: "Profile saved" });
    } catch (e) {
      console.error(e);
      showToast({ status: "error", title: "Failed to save profile", desc: e.message || "Try again" });
    }
  };

  // Save preferences
  const savePrefs = async () => {
    try {
      const u = auth.currentUser;
      const data = {
        ...prefs,
        budgetMin: Number(prefs.budgetMin || 0),
        budgetMax: Number(prefs.budgetMax || 0),
        cleanliness: Number(prefs.cleanliness || 3),
        noiseTolerance: Number(prefs.noiseTolerance || 3),
        guestsTolerance: Number(prefs.guestsTolerance || 3),
        updatedAt: Date.now()
      };
      await set(ref(db, pathPrefs(u.uid)), data);

      // Sync public prefs
      await update(ref(db, pathPublic(u.uid)), {
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        cleanliness: data.cleanliness,
        noiseTolerance: data.noiseTolerance,
        sleepSchedule: data.sleepSchedule,
        smoker: !!data.smoker,
        drinker: !!data.drinker,
        guestsTolerance: data.guestsTolerance,
        studyHabits: data.studyHabits,
        roommateGenderPreference: data.roommateGenderPreference,
        updatedAt: Date.now()
      });

      setMePublic((old) => (old ? { ...old, ...data } : old));
      showToast({ status: "success", title: "Preferences saved" });
    } catch (e) {
      console.error(e);
      showToast({ status: "error", title: "Failed to save preferences", desc: e.message || "Try again" });
    }
  };

  // Create a group with suggested match
  const createPairGroup = async (peerUid, displayName) => {
    try {
      const u = auth.currentUser;
      const gRef = push(ref(db, "/groups"));
      await set(gRef, {
        name: `Room with ${displayName || (peerUid ? peerUid.slice(0, 6) : "mate")}`,
        createdBy: u.uid,
        members: { [u.uid]: true, [peerUid]: true },
        active: true,
        createdAt: Date.now()
      });
      showToast({ status: "success", title: "Group created", desc: "Opening..." });
      nav(`/groups/${gRef.key}`);
    } catch (e) {
      console.error(e);
      showToast({ status: "error", title: "Could not create group", desc: e.message || "Try again" });
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  const myUid = auth.currentUser?.uid;
  const roommates = Array.from(
    new Set(groups.flatMap((g) => Object.keys(g.members || {})).filter((id) => id !== myUid))
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left: edit profile + prefs */}
      <section className="md:col-span-2 space-y-6">
        {/* Profile */}
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 text-lg font-semibold">My Profile</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">Display name</label>
              <input
                className="w-full rounded border p-2"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Department</label>
              <input
                className="w-full rounded border p-2"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                placeholder="e.g. CSE"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Student ID</label>
              <input
                className="w-full rounded border p-2"
                value={profile.studentId}
                onChange={(e) => setProfile({ ...profile, studentId: e.target.value })}
                placeholder="e.g. 2210xxx"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Gender</label>
              <select
                className="w-full rounded border p-2"
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option value="male">male</option>
                <option value="female">female</option>
                <option value="other">other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Languages (comma separated)</label>
              <input
                className="w-full rounded border p-2"
                value={profile.languages}
                onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
                placeholder="Bangla, English"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={saveProfile} className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">
              Save profile
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 text-lg font-semibold">My Preferences</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm mb-1">Budget min (BDT)</label>
              <input
                className="w-full rounded border p-2"
                type="number"
                value={prefs.budgetMin}
                onChange={(e) => setPrefs({ ...prefs, budgetMin: +e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Budget max (BDT)</label>
              <input
                className="w-full rounded border p-2"
                type="number"
                value={prefs.budgetMax}
                onChange={(e) => setPrefs({ ...prefs, budgetMax: +e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Sleep schedule</label>
              <select
                className="w-full rounded border p-2"
                value={prefs.sleepSchedule}
                onChange={(e) => setPrefs({ ...prefs, sleepSchedule: e.target.value })}
              >
                <option value="early">early</option>
                <option value="mid">mid</option>
                <option value="late">late</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Cleanliness</label>
              <select
                className="w-full rounded border p-2"
                value={prefs.cleanliness}
                onChange={(e) => setPrefs({ ...prefs, cleanliness: +e.target.value })}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Noise tolerance</label>
              <select
                className="w-full rounded border p-2"
                value={prefs.noiseTolerance}
                onChange={(e) => setPrefs({ ...prefs, noiseTolerance: +e.target.value })}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Guests tolerance</label>
              <select
                className="w-full rounded border p-2"
                value={prefs.guestsTolerance}
                onChange={(e) => setPrefs({ ...prefs, guestsTolerance: +e.target.value })}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.smoker}
                  onChange={(e) => setPrefs({ ...prefs, smoker: e.target.checked })}
                />
                Smoker
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.drinker}
                  onChange={(e) => setPrefs({ ...prefs, drinker: e.target.checked })}
                />
                Drinker
              </label>
            </div>

            <div>
              <label className="block text-sm mb-1">Study habits</label>
              <select
                className="w-full rounded border p-2"
                value={prefs.studyHabits}
                onChange={(e) => setPrefs({ ...prefs, studyHabits: e.target.value })}
              >
                <option value="solo">solo</option>
                <option value="group">group</option>
                <option value="mixed">mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Roommate gender</label>
              <select
                className="w-full rounded border p-2"
                value={prefs.roommateGenderPreference}
                onChange={(e) => setPrefs({ ...prefs, roommateGenderPreference: e.target.value })}
              >
                <option value="any">any</option>
                <option value="male">male</option>
                <option value="female">female</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button onClick={savePrefs} className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">
              Save preferences
            </button>
          </div>
        </div>
      </section>

      {/* Right: groups + roommates + suggested */}
      <section className="space-y-6">
        <div className="rounded-xl bg-white p-5 shadow">
          <h3 className="mb-3 font-semibold">My groups</h3>
          {!groups.length ? (
            <div className="text-sm text-gray-600">No groups yet.</div>
          ) : (
            <ul className="space-y-2">
              {groups.map((g) => (
                <li key={g.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-gray-600">{Object.keys(g.members || {}).length} member(s)</div>
                  </div>
                  <Link to={`/groups/${g.id}`} className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300">
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h3 className="mb-3 font-semibold">Roommates (from groups)</h3>
          {!roommates.length ? (
            <div className="text-sm text-gray-600">No roommates yet.</div>
          ) : (
            <ul className="space-y-2">
              {roommates.map((id) => {
                const name = userNames[id]?.displayName || id;
                return (
                  <li key={id} className="flex items-center gap-3">
                    <Avatar name={name} size={28} />
                    <div className="text-sm">{name}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h3 className="mb-3 font-semibold">Suggested roommates</h3>
          {!scored.length ? (
            <div className="text-sm text-gray-600">No suggestions yet.</div>
          ) : (
            <ul className="space-y-3">
              {scored.map((m) => (
                <li key={m.uid} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.displayName || m.uid} size={28} />
                    <div>
                      <div className="text-sm font-medium">{m.displayName || "Student"}</div>
                      <div className="text-xs text-gray-500">Score: {(m.score * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  <button
                    onClick={() => createPairGroup(m.uid, m.displayName)}
                    className="rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700"
                  >
                    Invite to group
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}