import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/auth/AuthContext";

export function AuthPage() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      nav("/");
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "30px auto" }}>
      <motion.div className="card" style={{ padding: 22 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button type="button" className={mode === "login" ? "btn btn-primary" : "btn"} onClick={() => setMode("login")}>
            Sign in
          </button>
          <button type="button" className={mode === "register" ? "btn btn-primary" : "btn"} onClick={() => setMode("register")}>
            Create account
          </button>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Welcome to Melodia</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {mode === "login"
            ? "Use the seeded accounts from the README for a quick review, or register a new listener."
            : "Create a listener account to purchase, rate, and build a library."}
        </p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <label className="muted" style={{ fontSize: 12 }}>
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="muted" style={{ fontSize: 12 }}>
            Password (min 8 chars)
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          {err && <div className="error">{err}</div>}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
          <Link to="/">Back to marketplace</Link>
        </p>
      </motion.div>
    </div>
  );
}
