// src/pages/AddExpense.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebase.config";
import { ref, push, set, onValue, runTransaction } from "firebase/database";
import { pathMembers, pathExpenses, pathBalance } from "../utils/rtdbPaths";
import { toMinor } from "../utils/money";

export default function AddExpense() {
  const { id: groupId } = useParams();
  const [members, setMembers] = React.useState([]);
  const [amount, setAmount] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const nav = useNavigate();

  React.useEffect(() => {
    const unsub = onValue(ref(db, pathMembers(groupId)), (s) => {
      const val = s.val() || {};
      setMembers(Object.keys(val));
    });
    return () => unsub();
  }, [groupId]);

  const submit = async (e) => {
    e.preventDefault();
    const u = auth.currentUser;
    const expenseRef = push(ref(db, pathExpenses(groupId)));
    const amtPoisha = toMinor(amount); // BDT -> poisha

    // Equal split across all members
    const shares = {};
    members.forEach((m) => (shares[m] = 1));

    await set(expenseRef, {
      payerUid: u.uid,
      amount: amtPoisha,
      currency: "BDT",
      category: "general",
      description: desc || "Expense",
      splitType: "shares",
      shares,
      createdAt: Date.now()
    });

    // Update balances per member
    const total = members.length || 1;
    const each = Math.round(amtPoisha / total);

    await Promise.all(
      members.map(async (m) => {
        // Payer gets + (amount - their share); others get - share
        const delta = m === u.uid ? amtPoisha - each : -each;
        await runTransaction(ref(db, pathBalance(groupId, m)), (cur) => (cur || 0) + delta);
      })
    );

    nav(`/groups/${groupId}`);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-3 text-xl font-semibold">Add Expense</h2>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded border p-2"
          type="number"
          placeholder="Amount (BDT)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button className="rounded bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">
          Save
        </button>
      </form>
      <div className="mt-3 text-sm text-gray-600">
        Members: {members.join(", ") || "loading…"}
      </div>
    </div>
  );
}