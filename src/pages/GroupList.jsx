import React from "react";
import { auth, db } from "../firebase/firebase.config";
import { ref, onValue, push, set, get, update } from "firebase/database";
import { Link } from "react-router-dom";
import {
  pathGroups,
  pathPublic,
  pathInvitesRoot,
  pathInvitesTo,
  pathInvitesFrom,
  pathInvite,
  pathEmailUid,
} from "../utils/rtdbPaths";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import { emailKey } from "../utils/emailKey";

function Avatar({ name = "", size = 22, bg = "#e5e7eb" }) {
  const initials = name
    ? name
        .split(/\s+/)
        .map((p) => p[0]?.toUpperCase())
        .slice(0, 2)
        .join("")
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
  const [inviteEmail, setInviteEmail] = React.useState("");

  const [incomingInvites, setIncomingInvites] = React.useState([]);
  const [sentInvites, setSentInvites] = React.useState([]);
  const [meGender, setMeGender] = React.useState("");

  const toast = useToast();
  const showToast =
    toast?.show ||
    (({ title, desc }) => alert(`${title || ""} ${desc || ""}`.trim()));

  // Load groups + user map + my gender
  React.useEffect(() => {
    const u = auth.currentUser;
    if (!u?.uid) return;

    // My gender (from public)
    get(ref(db, pathPublic(u.uid))).then((s) => {
      const pub = s.val() || {};
      setMeGender(pub.gender || "");
      // Prefill a nicer default based on gender
      setGroupName(
        pub.gender === "male"
          ? "Boys Room"
          : pub.gender === "female"
          ? "Girls Room"
          : "My Room"
      );
    });

    // Groups that I am a member of
    const unsubGroups = onValue(ref(db, pathGroups()), (snap) => {
      const val = snap.val() || {};
      const mine = Object.entries(val)
        .map(([id, g]) => ({ id, ...g }))
        .filter((g) => g.members && g.members[u.uid]);
      setGroups(mine);

      const allUids = new Set();
      mine.forEach((g) =>
        Object.keys(g.members || {}).forEach((m) => allUids.add(m))
      );
      Promise.all(
        [...allUids].map((id) => get(ref(db, pathPublic(id))))
      ).then((snaps) => {
        const ids = [...allUids];
        const map = {};
        snaps.forEach((s, i) => (map[ids[i]] = s.val() || {}));
        setUserMap(map);
      });
    });

    // Incoming invites (to me)
    const unsubTo = onValue(ref(db, pathInvitesTo(u.uid)), async (snap) => {
      const map = snap.val() || {};
      const ids = Object.keys(map);
      if (!ids.length) {
        setIncomingInvites([]);
        return;
      }
      const list = await Promise.all(
        ids.map((id) =>
          get(ref(db, pathInvite(id))).then((s) => ({ id, ...(s.val() || {}) }))
        )
      );
      setIncomingInvites(list.filter((x) => x.status === "pending"));
    });

    // Sent invites (from me)
    const unsubFrom = onValue(ref(db, pathInvitesFrom(u.uid)), async (snap) => {
      const map = snap.val() || {};
      const ids = Object.keys(map);
      if (!ids.length) {
        setSentInvites([]);
        return;
      }
      const list = await Promise.all(
        ids.map((id) =>
          get(ref(db, pathInvite(id))).then((s) => ({ id, ...(s.val() || {}) }))
        )
      );
      setSentInvites(list.filter((x) => x.status === "pending"));
    });

    return () => {
      unsubGroups();
      unsubTo();
      unsubFrom();
    };
  }, []);

  const acceptInvite = async (inv) => {
    try {
      const u = auth.currentUser;
      if (!u?.uid) throw new Error("Not signed in");

      const myPub = await get(ref(db, pathPublic(u.uid))).then(
        (s) => s.val() || {}
      );
      const myGender = myPub?.gender || null;
      if (inv.gender && myGender && inv.gender !== myGender) {
        showToast({
          status: "error",
          title: "Gender mismatch",
          desc: `This invite is for ${inv.gender} only.`,
        });
        return;
      }

      if (inv.type === "joinGroup" && inv.groupId) {
        await update(ref(db), {
          [`/groups/${inv.groupId}/members/${u.uid}`]: true,
        });
        const updates = {};
        updates[pathInvite(inv.id)] = null;
        updates[pathInvitesTo(u.uid) + `/${inv.id}`] = null;
        updates[pathInvitesFrom(inv.fromUid) + `/${inv.id}`] = null;
        await update(ref(db), updates);

        showToast({ status: "success", title: "Joined room" });
      } else {
        // New room creation only on accept
        const gRef = push(ref(db, pathGroups()));
        await set(gRef, {
          name: inv.groupName || `Room with ${String(inv.fromUid || "").slice(0, 6)}`,
          createdBy: inv.fromUid,
          members: { [inv.fromUid]: true, [u.uid]: true },
          gender: inv.gender || myGender || null,
          active: true,
          createdAt: Date.now(),
        });
        const updates = {};
        updates[pathInvite(inv.id)] = null;
        updates[pathInvitesTo(u.uid) + `/${inv.id}`] = null;
        updates[pathInvitesFrom(inv.fromUid) + `/${inv.id}`] = null;
        await update(ref(db), updates);
        showToast({ status: "success", title: "Room created" });
      }
    } catch (e) {
      console.error(e);
      showToast({ status: "error", title: "Failed", desc: e?.message || "Try again" });
    }
  };

  const declineInvite = async (inv) => {
    try {
      const u = auth.currentUser;
      const updates = {};
      updates[pathInvite(inv.id)] = null;
      updates[pathInvitesTo(u.uid) + `/${inv.id}`] = null;
      updates[pathInvitesFrom(inv.fromUid) + `/${inv.id}`] = null;
      await update(ref(db), updates);
      showToast({ status: "success", title: "Invite declined" });
    } catch (e) {
      console.error(e);
      showToast({ status: "error", title: "Failed", desc: e?.message || "Try again" });
    }
  };

  // Send an invite for a brand new room (room is created only on accept)
  const sendNewRoomInvite = async () => {
    try {
      const u = auth.currentUser;
      if (!u?.uid) throw new Error("Not signed in");
      const name = (groupName || "").trim().slice(0, 40) || "My Room";
      const email = (inviteEmail || "").trim().toLowerCase();
      if (!email) throw new Error("Invite email required");

      const myPub = await get(ref(db, pathPublic(u.uid))).then((s) => s.val() || {});
      const myGender = myPub?.gender || "";
      if (!myGender) {
        throw new Error("Please set your gender in profile first");
      }

      const key = emailKey(email);
      const toSnap = await get(ref(db, pathEmailUid(key)));
      if (!toSnap.exists()) throw new Error("User not found. Ask them to sign in first");

      const toUid = toSnap.val();
      if (toUid === u.uid) throw new Error("You cannot invite yourself");

      const invRef = push(ref(db, pathInvitesRoot()));
      await set(invRef, {
        fromUid: u.uid,
        toUid,
        groupName: name,
        gender: myGender, // lock to inviter's gender
        type: "newRoom",
        status: "pending",
        createdAt: Date.now(),
      });

      await set(ref(db, pathInvitesTo(toUid) + `/${invRef.key}`), true);
      await set(ref(db, pathInvitesFrom(u.uid) + `/${invRef.key}`), true);

      showToast({ status: "success", title: "Invite sent" });
      setCreateOpen(false);
      setGroupName(
        myGender === "male" ? "Boys Room" : myGender === "female" ? "Girls Room" : "My Room"
      );
      setInviteEmail("");
    } catch (e) {
      console.error(e);
      showToast({
        status: "error",
        title: "Failed",
        desc: e.message || "Try again",
      });
    }
  };

  return (
    <div className="space-y-4 mx-6 mt-5">
      {/* Invites section */}
      <section className="rounded-xl border bg-white p-4 shadow">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Invites</h3>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded bg-sky-600 px-3 py-2 text-white hover:bg-sky-700"
          >
            New Room Invite
          </button>
        </div>

        {!incomingInvites.length && !sentInvites.length ? (
          <div className="text-sm text-gray-600">No pending invites.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {/* Incoming */}
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-gray-500">
                Incoming
              </div>
              <div className="space-y-2">
                {incomingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">
                        {inv.groupName || "Room"}{" "}
                        <span className="text-xs text-gray-500">
                          {inv.type || "newRoom"}
                          {inv.gender ? ` · ${inv.gender}` : ""}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        From: {inv.fromUid}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => declineInvite(inv)}
                        className="rounded border px-2 py-1 hover:bg-gray-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => acceptInvite(inv)}
                        className="rounded bg-sky-600 px-2 py-1 text-white hover:bg-sky-700"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
                {!incomingInvites.length && (
                  <div className="text-xs text-gray-500">No incoming invites</div>
                )}
              </div>
            </div>

            {/* Sent */}
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-gray-500">
                Sent
              </div>
              <div className="space-y-2">
                {sentInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">
                        {inv.groupName || "Room"}{" "}
                        <span className="text-xs text-gray-500">
                          {inv.type || "newRoom"}
                          {inv.gender ? ` · ${inv.gender}` : ""}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        To: {inv.toUid}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Pending…</div>
                  </div>
                ))}
                {!sentInvites.length && (
                  <div className="text-xs text-gray-500">No sent invites</div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* My Groups */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Groups</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-5">
        {groups.map((g) => {
          const members = Object.keys(g.members || {});
          const names = members
            .map((id) => userMap[id]?.displayName || id)
            .slice(0, 3);

          return (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="rounded-xl border bg-white p-4 shadow hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{g.name}</div>
                <div className="text-xs text-gray-600">
                  {members.length} member(s)
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {members.slice(0, 5).map((id) => (
                  <Avatar
                    key={id}
                    name={userMap[id]?.displayName || id}
                    bg={colorFromString(
                      userMap[id]?.displayName || id
                    )}
                  />
                ))}
                {members.length > 5 && (
                  <span className="text-xs text-gray-600">
                    +{members.length - 5}
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-600 truncate">
                {names.join(", ")}
                {members.length > 3 ? " ..." : ""}
              </div>
              {g.gender && (
                <div className="mt-2 text-[10px] inline-block rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                  {g.gender} room
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {!groups.length && (
        <div className="text-gray-600 min-h-screen">
          No groups yet. Accept an invite or send one to start a room.
        </div>
      )}

      <Modal
        open={createOpen}
        title="Invite to a new room"
        onClose={() => setCreateOpen(false)}
        actions={
          <>
            <button
              onClick={() => setCreateOpen(false)}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={sendNewRoomInvite}
              className="rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700"
            >
              Send Invite
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">
              Invitee email
            </label>
            <input
              className="w-full rounded border p-2 text-sm"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">
              Room name
            </label>
            <input
              className="w-full rounded border p-2 text-sm"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Boys Room"
              maxLength={40}
            />
            <div className="text-xs text-gray-500 mt-1">
              Room will be created only after they accept. Gender is locked to
              your profile ({meGender || "unknown"}).
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}