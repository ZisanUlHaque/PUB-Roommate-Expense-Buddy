// src/pages/GroupList.jsx
import React from "react";
import { auth, db } from "../firebase/firebase.config";
import { ref, onValue, push, set, get } from "firebase/database";
import { Link } from "react-router-dom";
import { pathGroups, pathPublic } from "../utils/rtdbPaths";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";

function Avatar({ name = "", size = 22, bg = "#e5e7eb" }) {
  const initials = name
    ? name.split(/\s+/).map((p) => p[0]?.toUpperCase()).slice(0, 2).join("")
    : "U";
  return (
    <div
      className="flex items-center justify-center rounded-full text-[10px] font-semibold text-white"
      style={{ width: size, height: size, background: bg }}
      title={name}
    >
      {initials}
    </div>
  );
}
const colorFromString = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h}, 70%, 50%)`;
};

export default function GroupList() {
  const [groups, setGroups] = React.useState([]);
  const [userMap, setUserMap] = React.useState({});
  const [createOpen, setCreateOpen] = React.useState(false);
  const [groupName, setGroupName] = React.useState("My Room");
  const toast = useToast();
  const showToast = toast?.show || (({ title, desc }) => alert(`${title || ""} ${desc || ""}`.trim()));

  React.useEffect(() => {
    const u = auth.currentUser;
    if (!u?.uid) return;
    const unsub = onValue(ref(db, pathGroups()), (snap) => {
      const val = snap.val() || {};
      const mine = Object.entries(val).map(([id, g]) => ({ id, ...g })).filter((g) => g.members && g.members[u.uid]);
      setGroups(mine);

      const allUids = new Set();
      mine.forEach((g) => Object.keys(g.members || {}).forEach((m) => allUids.add(m)));
      Promise.all([...allUids].map((id) => get(ref(db, pathPublic(id))))).then((snaps) => {
        const ids = [...allUids];
        const map = {};
        snaps.forEach((s, i) => (map[ids[i]] = s.val() || {}));
        setUserMap(map);
      });
    });
    return () => unsub();
  }, []);

  const createGroup = async () => {
    try {
      const u = auth.currentUser;
      if (!u?.uid) throw new Error("Not signed in");
      const name = (groupName || "").trim().slice(0, 40) || "My Room";
      const gRef = push(ref(db, pathGroups()));
      await set(gRef, {
        name,
        createdBy: u.uid,
        members: { [u.uid]: true },
        active: true,
        createdAt: Date.now(),
      });
      showToast({ status: "success", title: "Group created" });
      setCreateOpen(false);
      setGroupName("My Room");
    } catch (e) {
      console.error(e);
      showToast({ status: "error", title: "Failed", desc: e.message || "Try again" });
    }
  };

  return (
    <div className="space-y-4 mx-6 mt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Groups</h2>
        <button onClick={() => setCreateOpen(true)} className="rounded bg-sky-600 px-3 py-2 text-white hover:bg-sky-700">New Group</button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-5">
        {groups.map((g) => {
          const members = Object.keys(g.members || {});
          const names = members.map((id) => userMap[id]?.displayName || id).slice(0, 3);

          return (
            <Link key={g.id} to={`/groups/${g.id}`} className="rounded-xl border bg-white p-4 shadow hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{g.name}</div>
                <div className="text-xs text-gray-600">{members.length} member(s)</div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {members.slice(0, 5).map((id) => (
                  <Avatar key={id} name={userMap[id]?.displayName || id} bg={colorFromString(userMap[id]?.displayName || id)} />
                ))}
                {members.length > 5 && <span className="text-xs text-gray-600">+{members.length - 5}</span>}
              </div>
              <div className="mt-2 text-xs text-gray-600 truncate">
                {names.join(", ")}{members.length > 3 ? " ..." : ""}
              </div>
            </Link>
          );
        })}
      </div>

      {!groups.length && <div className="text-gray-600 min-h-screen">No groups yet. Create one to start tracking expenses.</div>}

      <Modal
        open={createOpen}
        title="Create a new group"
        onClose={() => setCreateOpen(false)}
        actions={
          <>
            <button onClick={() => setCreateOpen(false)} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={createGroup} className="rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700">Create</button>
          </>
        }
      >
        <label className="mb-1 block text-xs text-gray-600">Group name</label>
        <input className="w-full rounded border p-2 text-sm" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Room with Zisan" maxLength={40} />
        <div className="text-xs text-gray-500 mt-1">Max 40 characters.</div>
      </Modal>
    </div>
  );
}