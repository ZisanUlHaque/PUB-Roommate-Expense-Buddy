import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase.config";
import { ref, onValue, update, get, push, set } from "firebase/database";
import {
  pathGroup,
  pathExpenses,
  pathBalances,
  pathBalance,
  pathMembers,
  pathPublic,
  pathEmailUid,
  pathInvitesRoot,
  pathInvitesTo,
  pathInvitesFrom,
} from "../utils/rtdbPaths";
import { formatBDT, toMinor } from "../utils/money";
import { emailKey } from "../utils/emailKey";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";

const MAX_MEMBERS = 4;

// Small avatar chip (initials)
function Avatar({ name = "", size = 28, bg }) {
  const initials = name
    ? name
        .split(/\s+/)
        .map((p) => (p[0] || "").toUpperCase())
        .slice(0, 2)
        .join("")
    : "U";
  const color = bg || "#e5e7eb";
  return (
    <div
      className="flex items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ width: size, height: size, background: color }}
      title={name}
    >
      {initials}
    </div>
  );
}

// Color generator from string
function colorFromString(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function GroupDetail() {
  const { id: groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [userMap, setUserMap] = useState({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleAmt, setSettleAmt] = useState("");

  // Manage modal
  const [manageOpen, setManageOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const toast = useToast();
  const showToast =
    toast?.show ||
    (({ title, desc }) => console.log("[toast]", title || "", desc || ""));
  const nav = useNavigate();

  // Subscribe to group, expenses, balances
  useEffect(() => {
    if (!groupId) return;
    const unsub1 = onValue(ref(db, pathGroup(groupId)), (s) => {
      const g = s.val() || {};
      setGroup({ id: groupId, ...g });
      const u = auth.currentUser;
      const mem = Object.keys(g.members || {}).filter(
        (x) => x !== (u?.uid || "")
      );
      setSettleTo((old) => old || mem[0] || "");
      setNewName(g.name || "");
    });

    const unsub2 = onValue(ref(db, pathExpenses(groupId)), (s) => {
      const val = s.val() || {};
      const list = Object.entries(val)
        .map(([id, e]) => ({ id, ...e }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setExpenses(list);
    });

    const unsub3 = onValue(ref(db, pathBalances(groupId)), (s) => {
      setBalances(s.val() || {});
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [groupId]);

  // Load member and payer names from /public
  useEffect(() => {
    if (!group) return;
    const memUids = Object.keys(group.members || {});
    const payerUids = expenses.map((e) => e.payerUid).filter(Boolean);
    const all = Array.from(new Set([...memUids, ...payerUids]));
    if (!all.length) return;

    Promise.all(all.map((uid) => get(ref(db, pathPublic(uid))))).then(
      (snaps) => {
        const map = {};
        snaps.forEach((snap, i) => {
          map[all[i]] = snap.val() || {};
        });
        setUserMap(map);
      }
    );
  }, [group, expenses]);

  // Hooks before any return
  const me = auth.currentUser?.uid || "";
  const you = balances[me] || 0;

  const isOwner = group?.createdBy === me;
  const members = Object.keys(group?.members || {});
  const canInvite = members.length < MAX_MEMBERS;

  // Suggested settle targets if you owe
  const suggestions = useMemo(() => {
    if (you >= 0) return [];
    const owed = -you;
    const creditors = Object.entries(balances)
      .filter(([uid, amt]) => uid !== me && amt > 0)
      .sort((a, b) => b[1] - a[1]);
    const tx = [];
    let left = owed;
    for (const [uid, amt] of creditors) {
      if (left <= 0) break;
      const pay = Math.min(left, amt);
      tx.push({ toUid: uid, amount: pay });
      left -= pay;
    }
    return tx;
  }, [balances, you, me]);

  if (!group) return <div className="p-4">Loading...</div>;

  const nameOf = (uid) => (uid === me ? "You" : userMap[uid]?.displayName || uid);
  const avatarBg = (uid) => colorFromString(userMap[uid]?.displayName || uid);

  async function settleWith(toUid, amountBDT) {
    const amountPoisha = toMinor(amountBDT);
    if (!amountPoisha || amountPoisha <= 0) {
      showToast({ status: "error", title: "Enter a valid amount" });
      return;
    }
    if (!toUid || toUid === me) {
      showToast({ status: "error", title: "Pick a valid member" });
      return;
    }
    try {
      const updates = {};
      updates[pathBalance(groupId, me)] = (balances[me] || 0) + amountPoisha;
      updates[pathBalance(groupId, toUid)] = (balances[toUid] || 0) - amountPoisha;
      await update(ref(db), updates);
      showToast({
        status: "success",
        title: "Settlement recorded",
        desc: `Paid ${nameOf(toUid)} ${formatBDT(amountPoisha)}`,
        duration: 2500,
      });
      setSettleAmt("");
    } catch (e) {
      console.error(e);
      showToast({
        status: "error",
        title: "Failed to record",
        desc: e?.message || "Check rules or try again",
      });
    }
  }

  // Invite to join this existing group (sends an invite instead of adding immediately)
  async function inviteMember() {
    try {
      if (!canInvite) {
        showToast({ status: "error", title: `Max ${MAX_MEMBERS} members allowed` });
        return;
      }
      if (!inviteEmail.trim()) {
        showToast({ status: "error", title: "Enter an email" });
        return;
      }
      const key = emailKey(inviteEmail);
      const snap = await get(ref(db, pathEmailUid(key)));
      if (!snap.exists()) {
        showToast({
          status: "error",
          title: "User not found",
          desc: "Ask them to sign in first",
        });
        return;
      }
      const newUid = snap.val();
      if (group.members?.[newUid]) {
        showToast({ status: "error", title: "Already a member" });
        return;
      }

      // Enforce gender for the group if known
      const inviteePub = await get(ref(db, pathPublic(newUid))).then(
        (s) => s.val() || {}
      );
      const mePub = await get(ref(db, pathPublic(me))).then(
        (s) => s.val() || {}
      );

      // Determine group gender: prefer group's gender, fallback to owner's/public gender
      const groupGender = group.gender || mePub.gender || null;

      if (groupGender && inviteePub.gender && inviteePub.gender !== groupGender) {
        showToast({
          status: "error",
          title: "Gender mismatch",
          desc: `This room is for ${groupGender} only.`,
        });
        return;
      }

      // Create joinGroup invite
      const invRef = push(ref(db, pathInvitesRoot()));
      await set(invRef, {
        fromUid: me,
        toUid: newUid,
        type: "joinGroup",
        groupId: groupId,
        groupName: group.name || "Room",
        gender: groupGender || null,
        status: "pending",
        createdAt: Date.now(),
      });

      await set(ref(db, pathInvitesTo(newUid) + `/${invRef.key}`), true);
      await set(ref(db, pathInvitesFrom(me) + `/${invRef.key}`), true);

      showToast({ status: "success", title: "Invite sent" });
      setInviteEmail("");
    } catch (e) {
      console.error(e);
      showToast({
        status: "error",
        title: "Failed to send invite",
        desc: e?.message || "Try again",
      });
    }
  }

  function openManage() {
    setNewName(group.name || "");
    setManageOpen(true);
  }

  async function renameGroup() {
    try {
      const name = (newName || "").trim();
      if (!name) return showToast({ status: "error", title: "Name required" });
      if (name.length > 40)
        return showToast({ status: "error", title: "Max 40 characters" });
      await update(ref(db, pathGroup(groupId)), { name });
      showToast({ status: "success", title: "Renamed" });
      setManageOpen(false);
    } catch (e) {
      console.error(e);
      showToast({ status: "error", title: "Rename failed", desc: e?.message });
    }
  }

  async function leaveGroup() {
    try {
      if (!group.members?.[me]) return;
      const updates = {};
      updates[pathMembers(groupId) + `/${me}`] = null;
      await update(ref(db), updates);
      showToast({ status: "success", title: "You left the group" });
      nav("/groups");
    } catch (e) {
      console.error(e);
      showToast({ status: "error", title: "Leave failed", desc: e?.message });
    }
  }

  async function deleteGroup() {
    try {
      // Only owner can delete
      if (!isOwner) {
        showToast({ status: "error", title: "Only owner can delete" });
        return;
      }
      const updates = {};
      updates[pathGroup(groupId)] = null;
      updates[pathExpenses(groupId)] = null;
      updates[pathBalances(groupId)] = null;
      await update(ref(db), updates);
      showToast({ status: "success", title: "Group deleted" });
      setManageOpen(false);
      nav("/groups");
    } catch (e) {
      console.error(e);
      showToast({ status: "error", title: "Delete failed", desc: e?.message });
    }
  }

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="space-y-5 mx-6 mt-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{group.name}</h2>
            {group.gender && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {group.gender} room
              </span>
            )}
            {isOwner && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                Owner
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span>{members.length} member(s)</span>
            <span className="mx-1">•</span>
            <span>
              Total spent: <span className="font-medium">{formatBDT(total)}</span>
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map((m) => (
              <div
                key={m}
                className="flex items-center gap-2 rounded-full border bg-white px-2 py-1 text-xs shadow-sm"
              >
                <Avatar name={nameOf(m)} size={22} bg={avatarBg(m)} />
                <span className={m === me ? "font-medium" : ""}>{nameOf(m)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-white p-1 shadow-sm">
            <input
              className="w-56 rounded-md p-2 text-sm focus:outline-none"
              placeholder={
                canInvite ? "Invite by email" : `Limit reached (${MAX_MEMBERS})`
              }
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={!canInvite}
            />
            <button
              onClick={inviteMember}
              className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black disabled:opacity-50"
              disabled={!canInvite}
            >
              Invite
            </button>
          </div>

          <button
            onClick={openManage}
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Manage
          </button>

          <Link
            className="rounded bg-sky-600 px-3 py-2 text-white hover:bg-sky-700"
            to={`/groups/${groupId}/expenses/add`}
          >
            Add Expense
          </Link>
        </div>
      </div>

      {/* Balances + Settle */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl bg-white p-4 shadow">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">Balances</h3>
            <div className="text-xs text-gray-600">
              {you > 0 ? (
                <>
                  You are owed{" "}
                  <span className="font-medium text-green-700">
                    {formatBDT(you)}
                  </span>
                </>
              ) : you < 0 ? (
                <>
                  You owe{" "}
                  <span className="font-medium text-red-700">
                    {formatBDT(-you)}
                  </span>
                </>
              ) : (
                <>All settled</>
              )}
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li key={m} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={nameOf(m)} size={24} bg={avatarBg(m)} />
                  <span className={m === me ? "font-semibold" : ""}>
                    {nameOf(m)}
                  </span>
                </div>
                <span
                  className={`${
                    (balances[m] || 0) >= 0 ? "text-green-700" : "text-red-700"
                  } font-medium`}
                >
                  {formatBDT(balances[m] || 0)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-white p-4 shadow">
          <h3 className="mb-2 font-semibold">Settle up (manual)</h3>

          {you < 0 && suggestions.length ? (
            <div className="mb-3 text-xs text-gray-700">
              Suggested:
              <div className="mt-1 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSettleTo(s.toUid);
                      setSettleAmt((s.amount / 100).toFixed(0));
                    }}
                    className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-sky-700 hover:bg-sky-100"
                  >
                    Pay {nameOf(s.toUid)} {formatBDT(s.amount)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <select
              className="rounded border p-2"
              value={settleTo}
              onChange={(e) => setSettleTo(e.target.value)}
            >
              {members
                .filter((m) => m !== me)
                .map((c) => (
                  <option key={c} value={c}>
                    {nameOf(c)}
                  </option>
                ))}
            </select>
            <input
              className="rounded border p-2"
              placeholder="Amount (BDT)"
              type="number"
              min="0"
              step="1"
              value={settleAmt}
              onChange={(e) => setSettleAmt(e.target.value)}
            />
            <button
              onClick={() => settleWith(settleTo, settleAmt)}
              className="rounded bg-sky-600 px-3 py-2 text-white hover:bg-sky-700"
            >
              Record Settlement
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-600">
            Note: For digital payments in Bangladesh, integrate bKash/Nagad/SSLCOMMERZ later.
          </div>
        </section>
      </div>

      {/* Expenses */}
      <section className="rounded-xl bg-white p-4 shadow mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Expenses</h3>
        </div>
        <ul className="divide-y">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-3">
                <Avatar name={nameOf(e.payerUid)} size={24} bg={avatarBg(e.payerUid)} />
                <div>
                  <div className="font-medium">{e.description || "Expense"}</div>
                  <div className="text-gray-600">
                    Paid by <span className="font-medium">{nameOf(e.payerUid)}</span> · {timeAgo(e.createdAt)}
                  </div>
                </div>
              </div>
              <div className="font-medium">
                {formatBDT(e.amount)} {e.currency || "BDT"}
              </div>
            </li>
          ))}
          {!expenses.length && (
            <div className="p-2 text-sm text-gray-600">No expenses yet.</div>
          )}
        </ul>
      </section>

      {/* Manage modal */}
      <Modal
        open={manageOpen}
        title="Manage room"
        onClose={() => setManageOpen(false)}
        actions={
          <div className="flex items-center gap-2">
            {!isOwner && (
              <button
                onClick={leaveGroup}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Leave room
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={deleteGroup}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                >
                  Delete room
                </button>
                <button
                  onClick={renameGroup}
                  className="rounded bg-sky-600 px-3 py-1 text-sm text-white hover:bg-sky-700"
                >
                  Save name
                </button>
              </>
            )}
            <button
              onClick={() => setManageOpen(false)}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        }
      >
        {isOwner ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">Room name</label>
              <input
                className="w-full rounded border p-2 text-sm"
                value={newName}
                maxLength={40}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-1">
                Max 40 characters. Current: {newName.length}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Only the owner can rename or delete the room.
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700">
            You can leave the room. The owner can rename or delete it.
          </div>
        )}
      </Modal>
    </div>
  );
}