import { motion } from "framer-motion";
import type { Album } from "@/api/types";

type Props = {
  album: Album;
  owned: boolean;
  userRating?: number | null;
  isAuthed: boolean;
  busy?: boolean;
  onPurchase?: () => void;
  onRate?: (score: number) => void;
};

export function AlbumCard({
  album,
  owned,
  userRating,
  isAuthed,
  busy,
  onPurchase,
  onRate,
}: Props) {
  const avg =
    album.average_rating != null ? album.average_rating.toFixed(1) : "—";

  return (
    <motion.article
      className="card"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      style={{ padding: 16 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "-0.02em" }}>
            {album.name}
          </div>
          <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
            {album.artist_performing_name ?? "Artist"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>${album.price}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Avg {avg} ({album.rating_count})
          </div>
        </div>
      </div>

      {album.description && (
        <p className="muted" style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.45 }}>
          {album.description}
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14, alignItems: "center" }}>
        {!isAuthed && <span className="chip">Sign in to purchase</span>}
        {isAuthed && !owned && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onPurchase}>
            {busy ? "Working…" : "Purchase"}
          </button>
        )}
        {isAuthed && owned && (
          <span className="chip" style={{ borderColor: "rgba(124,92,255,0.35)" }}>
            In your library
          </span>
        )}
        {isAuthed && owned && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              Your score
            </span>
            <StarPicker value={userRating ?? null} onChange={onRate} disabled={busy} />
          </div>
        )}
      </div>
    </motion.article>
  );
}

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange?: (n: number) => void;
  disabled?: boolean;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {stars.map((s) => {
        const active = value != null && s <= value;
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(s)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 18,
              cursor: disabled ? "default" : "pointer",
              color: active ? "#ffd27a" : "rgba(255,255,255,0.25)",
              filter: active ? "drop-shadow(0 0 10px rgba(255,210,122,0.35))" : "none",
            }}
            aria-label={`Rate ${s} stars`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
