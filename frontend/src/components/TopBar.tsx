import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/auth/AuthContext";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <motion.div
      className="topbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Link to="/" className="brand">
        <div className="brand-mark" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v18"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M8 7c2.5-2 6.5-2 9 0"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.65"
            />
            <path
              d="M8 17c2.5 2 6.5 2 9 0"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.65"
            />
          </svg>
        </div>
        <div>
          <div className="brand-title">Melodia</div>
          <div className="brand-sub">A luminous marketplace for albums</div>
        </div>
      </Link>

      <div className="nav-actions">
        <NavLink to="/" className={({ isActive }) => `btn btn-ghost ${isActive ? "" : ""}`} end>
          Marketplace
        </NavLink>
        {user && (
          <NavLink to="/library" className="btn btn-ghost">
            My library
          </NavLink>
        )}
        {user?.role === "admin" && (
          <NavLink to="/admin" className="btn btn-ghost">
            Admin
          </NavLink>
        )}
        {user ? (
          <>
            <span className="chip">{user.email}</span>
            <button type="button" className="btn" onClick={() => logout()}>
              Sign out
            </button>
          </>
        ) : (
          <span className="chip">Guest browsing</span>
        )}
      </div>
    </motion.div>
  );
}
