// src/pages/Matches.jsx
import React from "react";
import { auth, db } from "../firebase/firebase.config";
import { ref, onValue, get, push, set } from "firebase/database";
import { pathPublic, pathProfile, pathPrefs } from "../utils/rtdbPaths";
import { scorePair } from "../utils/scoring";
import { useNavigate, Link } from "react-router-dom";
import ProgressRing from "../components/ProgressRing";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";

function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "U";
  return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}
function colorFromString(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

export default function Matches() {
  const [me, setMe] = React.useState(null);
  const [others, setOthers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [needOnboarding, setNeedOnboarding] = React.useState(false);
  const [error, setError] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({
    gender: "any",
    smokerMatch: false,
    drinkerMatch: false,
    budgetMin: "",
    budgetMax: ""
  });
  const [invite, setInvite] = React.useState({
    open: false,
    peerUid: "",
    name: "",
    groupName: "",
    saving: false
  });

  const nav = useNavigate();
  const toast = useToast();

  React.useEffect(() => {
    let unsub = () => {};
    const u = auth.currentUser;
    if (!u) {
      setLoading(false);
      setError("Not signed in");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError("");

        // Ensure my public record exists (merge from /profiles + /prefs if missing)
        const myPubRef = ref(db, pathPublic(u.uid));
        const myPubSnap = await get(myPubRef);
        let myPub = myPubSnap.val();

        if (!myPub) {
          const [pSnap, prefSnap] = await Promise.all([
            get(ref(db, pathProfile(u.uid))),
            get(ref(db, pathPrefs(u.uid))),
          ]);
          const profile = pSnap.val();
          const prefs = prefSnap.val();
          if (!profile || !prefs) {
            setNeedOnboarding(true);
            setLoading(false);
            return;
          }
          myPub = {
            displayName: profile.displayName || "",
            gender: profile.gender || "other",
            languages: Array.isArray(profile.languages) ? profile.languages : [],
            budgetMin: Number(prefs.budgetMin ?? 0),
            budgetMax: Number(prefs.budgetMax ?? 0),
            cleanliness: Number(prefs.cleanliness ?? 3),
            noiseTolerance: Number(prefs.noiseTolerance ?? 3),
            sleepSchedule: prefs.sleepSchedule || "mid",
            smoker: !!prefs.smoker,
            drinker: !!prefs.drinker,
            guestsTolerance: Number(prefs.guestsTolerance ?? 3),
            studyHabits: prefs.studyHabits || "mixed",
            roommateGenderPreference: prefs.roommateGenderPreference || "any",
            updatedAt: Date.now(),
          };
          await set(myPubRef, myPub);
        }
        setMe(myPub);
        setFilters((f) => ({
          ...f,
          budgetMin: myPub.budgetMin ?? "",
          budgetMax: myPub.budgetMax ?? ""
        }));

        unsub = onValue(
          ref(db, "/public"),
          (snap) => {
            const val = snap.val() || {};
            const list = Object.entries(val)
              .filter(([uid]) => uid !== u.uid)
              .map(([uid, p]) => ({ uid, ...(p || {}) }));
            setOthers(list);
            setLoading(false);
          },
          (err) => {
            setError(err?.message || "Failed to load matches");
            setLoading(false);
          }
        );
      } catch (e) {
        console.error(e);
        setError(e?.message || "Something went wrong");
        setLoading(false);
      }
    })();

    return () => unsub && unsub();
  }, []);

  // Apply lightweight filters before scoring
  const filteredOthers = React.useMemo(() => {
    if (!me) return [];
    const g = filters.gender;
    const smokerReq = filters.smokerMatch;
    const drinkerReq = filters.drinkerMatch;
    const min = Number(filters.budgetMin || 0);
    const max = Number(filters.budgetMax || 0);
    return others.filter((o) => {
      if (g !== "any" && (o.gender || "other") !== g) return false;
      if (smokerReq && o.smoker !== me.smoker) return false;
      if (drinkerReq && o.drinker !== me.drinker) return false;
      const mine = { budgetMin: min || me.budgetMin || 0, budgetMax: max || me.budgetMax || 0 };
      const hasOverlap = Math.max(mine.budgetMin, o.budgetMin || 0) < Math.min(mine.budgetMax, o.budgetMax || 0);
      return hasOverlap;
    });
  }, [others, me, filters]);

  // Score and rank
  const scored = React.useMemo(() => {
    if (!me) return [];
    return filteredOthers
      .map((o) => {
        const result = scorePair(me, me, o, o);
        if (!result) return null;
        return { ...o, ...result };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [filteredOthers, me]);

  // Invite flow
  const openInvite = (peerUid, name) => {
    const defaultName = `Room with ${name || (peerUid ? peerUid.slice(0, 6) : "mate")}`;
    setInvite({ open: true, peerUid, name: name || "", groupName: defaultName, saving: false });
  };

  const confirmInvite = async () => {
    try {
      setInvite((s) => ({ ...s, saving: true }));
      const u = auth.currentUser;
      if (!u) return nav("/auth/sign-in");
      const gRef = push(ref(db, "/groups"));
      await set(gRef, {
        name: invite.groupName || `Room with ${invite.name || invite.peerUid?.slice(0, 6) || "mate"}`,
        createdBy: u.uid,
        members: { [u.uid]: true, [invite.peerUid]: true },
        active: true,
        createdAt: Date.now(),
      });
      setInvite({ open: false, peerUid: "", name: "", groupName: "", saving: false });
      toast.show?.({
        status: "success",
        title: "Group created",
        desc: "Taking you to the group...",
        duration: 2000
      });
      nav(`/groups/${gRef.key}`);
    } catch (e) {
      console.error(e);
      toast.show?.({
        status: "error",
        title: "Failed to create group",
        desc: e?.message || "Try again"
      });
      setInvite((s) => ({ ...s, saving: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-6">
        <h2 className="mb-4 mt-6 text-2xl font-bold">Top Matches</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded bg-white p-4 shadow animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  <div className="h-3 w-1/4 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (needOnboarding)
    return (
      <EmptyState
        full
        title="Complete onboarding"
        desc="Please finish your profile and preferences."
        actions={
          <div className="flex gap-2">
            <Link className="rounded bg-sky-600 px-3 py-1 text-white" to="/onboarding/profile">
              Profile
            </Link>
            <Link className="rounded bg-sky-600 px-3 py-1 text-white" to="/onboarding/preferences">
              Preferences
            </Link>
          </div>
        }
      />
    );

  if (error)
    return (
      <EmptyState
        full
        title="Couldn’t load matches"
        desc={error}
        actions={
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-gray-900 px-3 py-1 text-white"
          >
            Retry
          </button>
        }
      />
    );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between mx-6 mt-6">
        <h2 className="text-2xl font-bold">Top Matches</h2>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
        >
          {filtersOpen ? "Hide filters" : "Show filters"}
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm mx-6 mt-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Gender</label>
              <select
                className="w-full rounded border p-2 text-sm"
                value={filters.gender}
                onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Budget Min (BDT)</label>
              <input
                className="w-full rounded border p-2 text-sm"
                type="number"
                value={filters.budgetMin}
                onChange={(e) => setFilters((f) => ({ ...f, budgetMin: e.target.value }))}
                placeholder="e.g. 3000"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Budget Max (BDT)</label>
              <input
                className="w-full rounded border p-2 text-sm"
                type="number"
                value={filters.budgetMax}
                onChange={(e) => setFilters((f) => ({ ...f, budgetMax: e.target.value }))}
                placeholder="e.g. 6000"
              />
            </div>
            <div className="flex items-center gap-4 mt-6 md:mt-0">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.smokerMatch}
                  onChange={(e) => setFilters((f) => ({ ...f, smokerMatch: e.target.checked }))}
                />
                Smoker match
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.drinkerMatch}
                  onChange={(e) => setFilters((f) => ({ ...f, drinkerMatch: e.target.checked }))}
                />
                Drinker match
              </label>
            </div>
          </div>
        </div>
      )}

      {!others.length ? (
        <EmptyState
          full
          title="No other students yet"
          desc="Invite friends to join and complete their profiles to see matches."
          actions={
            <Link className="rounded bg-sky-600 px-3 py-1 text-white" to="/community">
              Go to Community
            </Link>
          }
        />
      ) : scored.length === 0 ? (
        <EmptyState
          full
          title="No compatible matches"
          desc="Try widening your budget or relaxing some preferences."
          actions={
            <Link className="rounded bg-sky-600 px-3 py-1 text-white" to="/onboarding/preferences">
              Edit preferences
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-3 mx-6 mt-6 mb-5">
          {scored.map((m) => {
            const pct = Math.round(m.score * 100);
            const chipColor = colorFromString(m.displayName || m.uid);
            return (
              <div key={m.uid} className="rounded bg-white p-4 shadow hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-white font-semibold"
                      style={{ background: chipColor }}
                      title={m.displayName || "Student"}
                    >
                      {initials(m.displayName || m.uid)}
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{m.displayName || "Student"}</div>
                      <div className="text-xs text-gray-500">
                        Budget: {m.budgetMin || "?"}–{m.budgetMax || "?"} BDT
                      </div>
                    </div>
                  </div>
                  <ProgressRing value={pct} />
                </div>

                {m.languages?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.languages.slice(0, 4).map((lang, i) => (
                      <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {lang}
                      </span>
                    ))}
                  </div>
                ) : null}

                {m.reasons?.length ? (
                  <ul className="mt-2 list-inside list-disc text-sm text-gray-700">
                    {m.reasons.slice(0, 3).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => openInvite(m.uid, m.displayName)}
                    className="rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700"
                  >
                    Invite to group
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={invite.open}
        title="Create group with this match?"
        onClose={() => setInvite({ open: false, peerUid: "", name: "", groupName: "", saving: false })}
        actions={
          <>
            <button
              onClick={() => setInvite({ open: false, peerUid: "", name: "", groupName: "", saving: false })}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              disabled={invite.saving}
            >
              Cancel
            </button>
            <button
              onClick={confirmInvite}
              className="rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700 disabled:opacity-60"
              disabled={invite.saving}
            >
              {invite.saving ? "Creating..." : "Create"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">Group name</label>
            <input
              className="w-full rounded border p-2 text-sm"
              value={invite.groupName}
              onChange={(e) => setInvite((s) => ({ ...s, groupName: e.target.value }))}
            />
          </div>
          <p className="text-xs text-gray-500">You and your match will be added as members.</p>
        </div>
      </Modal>
    </div>
  );
}

function EmptyState({ title, desc, actions, full = false }) {
  return (
    <div className={`w-full ${full ? "min-h-screen flex items-center justify-center px-6" : ""}`}>
      <div className="rounded bg-white p-6 shadow max-w-xl mx-auto text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-gray-600">{desc}</p>
        <div className="mt-3">{actions}</div>
      </div>
    </div>
  );
}