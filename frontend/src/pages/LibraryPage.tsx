import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { LibraryItem, PaginatedMeta } from "@/api/types";
import { useAuth } from "@/auth/AuthContext";
import { motion } from "framer-motion";

type PaginatedLibrary = { items: LibraryItem[]; meta: PaginatedMeta };

export function LibraryPage() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["library", accessToken, "page"],
    enabled: Boolean(accessToken),
    queryFn: () =>
      apiFetch<PaginatedLibrary>("/api/v1/me/library", {
        token: accessToken,
        params: { page: 1, page_size: 100, sort: "purchased_at", order: "desc" },
      }),
  });

  const rate = useMutation({
    mutationFn: async ({ albumId, score }: { albumId: number; score: number }) => {
      await apiFetch(`/api/v1/albums/${albumId}/rating`, {
        method: "PUT",
        token: accessToken,
        body: { score },
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["library"] });
      await qc.invalidateQueries({ queryKey: ["albums"] });
    },
  });

  if (!accessToken) {
    return <div className="empty">Sign in to view your personal library.</div>;
  }

  if (query.isLoading) return <div className="empty">Loading your collection…</div>;
  if (query.isError) return <div className="error">{(query.error as Error).message}</div>;

  const items = query.data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="empty">
        You have not purchased any albums yet. Visit the marketplace to add your first record.
      </div>
    );
  }

  return (
    <div>
      <div className="section-title">
        <h2>My library</h2>
        <div className="muted" style={{ fontSize: 14 }}>
          {query.data?.meta.total} owned
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((it) => (
          <motion.div
            key={it.purchase_id}
            className="card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: 16, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{it.album_name}</div>
              <div className="muted" style={{ marginTop: 6 }}>
                {it.artist_performing_name} · ${it.price}
              </div>
              <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                Purchased {new Date(it.purchased_at).toLocaleString()} · Avg{" "}
                {it.average_rating != null ? it.average_rating.toFixed(1) : "—"}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Your rating
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((s) => {
                  const active = it.user_rating != null && s <= it.user_rating;
                  return (
                    <button
                      key={s}
                      type="button"
                      className="btn"
                      style={{
                        padding: "8px 10px",
                        color: active ? "#ffd27a" : "rgba(255,255,255,0.28)",
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                      onClick={() => rate.mutate({ albumId: it.album_id, score: s })}
                      disabled={rate.isPending}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
