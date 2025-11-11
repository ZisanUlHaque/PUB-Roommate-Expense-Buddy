import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase.config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import logo from "../assets/logo.png";

export default function Navbar() {
  const [user, setUser] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  React.useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u || null));
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    nav("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-sky-100/60 bg-white/60 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex items-center justify-between px-4 py-2">
        {/* Left: Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <motion.img
            src={logo}
            alt="PUB logo"
            className="w-14 h-14"
            whileHover={{ rotate: -5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <span className="font-bold text-sky-700 text-lg md:text-xl tracking-tight">
            PUB Student Hub
          </span>
        </Link>

        {/* Center: Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm absolute left-1/2 -translate-x-1/2">
          <NavLink to="/" label="Home" loc={loc} />
          <NavLink to="/about" label="About" loc={loc} />
          {user && (
            <>
              <NavLink to="/matches" label="Matches" loc={loc} />
              <NavLink to="/groups" label="Groups" loc={loc} />
              <NavLink to="/community" label="Community" loc={loc} />
            </>
          )}
        </nav>

        {/* Right: Auth/Profile */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/auth/sign-in"
                className="rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-2 text-white font-medium shadow-sm hover:shadow-md transition-all duration-300"
              >
                Sign In
              </Link>
            </motion.div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown((v) => !v)}
                className="rounded-full border border-sky-100 bg-white/70 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 transition-all shadow-sm"
              >
                {user.email?.split("@")[0] || "User"}
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-44 rounded-xl bg-white/80 backdrop-blur-lg shadow-lg border border-sky-100 p-2 text-sm"
                  >
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-lg hover:bg-sky-50 transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-sky-50 text-red-600 transition"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-sky-50 transition"
        >
          {menuOpen ? (
            <X className="w-5 h-5 text-sky-700" />
          ) : (
            <Menu className="w-5 h-5 text-sky-700" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white/90 backdrop-blur-lg border-t border-sky-100 px-5 py-4 shadow-lg"
          >
            <div className="flex flex-col gap-3">
              {user && (
                <>
                  <MobileLink
                    to="/matches"
                    label="Matches"
                    loc={loc}
                    setMenuOpen={setMenuOpen}
                  />
                  <MobileLink
                    to="/groups"
                    label="Groups"
                    loc={loc}
                    setMenuOpen={setMenuOpen}
                  />
                  <MobileLink
                    to="/community"
                    label="Community"
                    loc={loc}
                    setMenuOpen={setMenuOpen}
                  />
                </>
              )}

              {!user ? (
                <Link
                  to="/auth/sign-in"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-2 text-center text-white font-medium shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Sign In
                </Link>
              ) : (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMenuOpen(false);
                  }}
                  className="rounded-xl bg-gray-100 px-4 py-2 hover:bg-gray-200 text-center font-medium"
                >
                  Sign Out
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/* 🔹 Desktop NavLink */
function NavLink({ to, label, loc }) {
  const active = loc.pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`relative font-medium tracking-wide transition-all duration-300 ${
        active
          ? "text-sky-700"
          : "text-gray-700 hover:text-sky-600 hover:scale-[1.02]"
      }`}
    >
      {label}
      {active && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 to-sky-700 rounded-full"
        />
      )}
    </Link>
  );
}

/* 🔹 Mobile Link */
function MobileLink({ to, label, loc, setMenuOpen }) {
  const active = loc.pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={() => setMenuOpen(false)}
      className={`block rounded-lg px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-sky-50 text-sky-700"
          : "text-gray-700 hover:bg-gray-100 hover:text-sky-700"
      }`}
    >
      {label}
    </Link>
  );
}
