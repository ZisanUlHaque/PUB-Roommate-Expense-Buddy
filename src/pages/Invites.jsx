import React from "react";
import { auth, db } from "../firebase/firebase.config";
import { ref, onValue, get, update, push, set } from "firebase/database";
import {
  pathInvitesTo,
  pathInvite,
  pathInvitesFrom,
  pathGroups,
  pathMembers,
  pathPublic,
} from "../utils/rtdbPaths";
import { useToast } from "../components/Toast";
import { Link, useNavigate } from "react-router-dom";

export default function Invites() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const toast = useToast();
  const nav = useNavigate();

  React.useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      setLoading(false);
      return;
    }
    const unsub = onValue(ref(db, pathInvitesTo(u.uid)), async (snap) => {
      const map = snap.val() || {};
      const ids = Object.keys(map);
      if (!ids.length) {
        setItems([]);
        setLoading(false);
        return;
      }
      const invites = await Promise.all(
        ids.map((id) =>
          get(ref(db, pathInvite(id))).then((s) => ({ id, ...(s.val() || {}) }))
        )
      );
      setItems(invites.filter((i) => i.status === "pending"));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function accept(inv) {
    try {
      const u = auth.currentUser;
      if (!u?.uid) throw new Error("Not signed in");
      const myPub = await get(ref(db, pathPublic(u.uid))).then((s) => s.val() || {});
      const myGender = myPub?.gender || null;

      // Gender guard: invite gender must match acceptor gender (if both exist)
      if (inv.gender && myGender && inv.gender !== myGender) {
        toast.show?.({
          status: "error",
          title: "Gender mismatch",
          desc: `This invite is for ${inv.gender} only.`,
        });
        return;
      }

      if (inv.type === "joinGroup" && inv.groupId) {
        // Add me to existing group
        await update(ref(db), {
          [pathMembers(inv.groupId) + `/${u.uid}`]: true,
        });

        // cleanup invite + indexes
        const updates = {};
        updates[pathInvite(inv.id)] = null;
        updates[pathInvitesTo(u.uid) + `/${inv.id}`] = null;
        updates[pathInvitesFrom(inv.fromUid) + `/${inv.id}`] = null;
        await update(ref(db), updates);

        toast.show?.({
          status: "success",
          title: "Joined room",
          desc: "Opening group…",
        });
        nav(`/groups/${inv.groupId}`);
      } else {
        // Create a brand new group only on accept
        const gRef = push(ref(db, pathGroups()));
        await set(gRef, {
          name: inv.groupName || `Room with ${String(inv.fromUid || "").slice(0, 6)}`,
          createdBy: inv.fromUid,
          members: { [inv.fromUid]: true, [u.uid]: true },
          gender: inv.gender || myGender || null, // stamp gender
          active: true,
          createdAt: Date.now(),
        });

        // delete invite + indexes
        const updates = {};
        updates[pathInvite(inv.id)] = null;
        updates[pathInvitesTo(u.uid) + `/${inv.id}`] = null;
        updates[pathInvitesFrom(inv.fromUid) + `/${inv.id}`] = null;
        await update(ref(db), updates);

        toast.show?.({
          status: "success",
          title: "Room created",
          desc: "Opening group…",
        });
        nav(`/groups/${gRef.key}`);
      }
    } catch (e) {
      console.error(e);
      toast.show?.({
        status: "error",
        title: "Failed to accept",
        desc: e?.message || "Try again",
      });
    }
  }

  async function decline(inv) {
    try {
      const u = auth.currentUser;
      const updates = {};
      updates[pathInvite(inv.id)] = null;
      updates[pathInvitesTo(u.uid) + `/${inv.id}`] = null;
      updates[pathInvitesFrom(inv.fromUid) + `/${inv.id}`] = null;
      await update(ref(db), updates);
      toast.show?.({ status: "success", title: "Invite declined" });
    } catch (e) {
      console.error(e);
      toast.show?.({
        status: "error",
        title: "Failed to decline",
        desc: e?.message || "Try again",
      });
    }
  }

  if (loading) return <div className="p-6">Loading invites…</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Invites</h2>
        <Link
          className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
          to="/matches"
        >
          Back to Matches
        </Link>
      </div>
      {!items.length ? (
        <div className="rounded bg-white p-6 text-center shadow">
          <div className="text-gray-600">No pending invites.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded border bg-white p-4 shadow-sm"
            >
              <div className="text-sm">
                <div className="font-medium">Room: {inv.groupName || "Room"}</div>
                <div className="text-xs text-gray-600">
                  From: {inv.fromUid}
                  {inv.gender ? ` · Gender: ${inv.gender}` : ""}
                  {inv.type ? ` · Type: ${inv.type}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => decline(inv)}
                  className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Decline
                </button>
                <button
                  onClick={() => accept(inv)}
                  className="rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}