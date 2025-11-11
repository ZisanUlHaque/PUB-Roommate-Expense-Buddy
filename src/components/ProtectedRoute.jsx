import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase/firebase.config";
import { onAuthStateChanged } from "firebase/auth";

const ALLOWED_DOMAIN = "pundrauniv.edu"; // change if needed

export default function ProtectedRoute({ children }) {
  const [state, setState] = React.useState({ loading: true, user: null, error: "" });

  React.useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return setState({ loading: false, user: null, error: "" });
      const ok = (u.email || "").toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
      setState({ loading: false, user: ok ? u : null, error: ok ? "" : `Use your @${ALLOWED_DOMAIN} email` });
    });
  }, []);

  if (state.loading) return <div className="p-6">Loading…</div>;
  if (!state.user) return <Navigate to="/auth/sign-in" replace />;
  return children;
}