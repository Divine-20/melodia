import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch } from "@/api/client";
import type { Album, LibraryItem, PaginatedMeta } from "@/api/types";
import { useAuth } from "@/auth/AuthContext";
import { AlbumCard } from "@/components/AlbumCard";
import { Hero } from "@/components/Hero";

type PaginatedAlbums = { items: Album[]; meta: PaginatedMeta };
type PaginatedLibrary = { items: LibraryItem[]; meta: PaginatedMeta };

export function MarketplacePage() {
  const { accessToken, user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"name" | "price" | "created_at" | "average_rating">("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const albumsQuery = useQuery({
    queryKey: ["albums", q, page, sort, order],
    queryFn: () =>
      apiFetch<PaginatedAlbums>("/api/v1/albums", {
        params: { q, page, page_size: 8, sort, order },
      }),
  });

  const libraryQuery = useQuery({
    queryKey: ["library", accessToken],
    enabled: Boolean(accessToken),
    queryFn: () =>
      apiFetch<PaginatedLibrary>("/api/v1/me/library", {
        token: accessToken,
        params: { page: 1, page_size: 200 },
      }),
  });

  const ownedMap = useMemo(() => {
    const m = new Map<number, { user_rating: number | null }>();
    for (const it of libraryQuery.data?.items ?? []) {
      m.set(it.album_id, { user_rating: it.user_rating });
    }
    return m;
  }, [libraryQuery.data?.items]);

  const purchase = useMutation({
    mutationFn: async (albumId: number) => {
      await apiFetch(`/api/v1/albums/${albumId}/purchase`, {
        method: "POST",
        token: accessToken,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["albums"] });
      await qc.invalidateQueries({ queryKey: ["library"] });
    },
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
      await qc.invalidateQueries({ queryKey: ["albums"] });
      await qc.invalidateQueries({ queryKey: ["library"] });
    },
  });

  return (
    <div>
      <Hero />

      <div className="section-title">
        <h2>Marketplace</h2>
        <div className="muted" style={{ fontSize: 14 }}>
          {albumsQuery.isLoading
            ? "Loading catalog…"
            : `${albumsQuery.data?.meta.total ?? 0} albums`}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 180px 180px 120px",
          gap: 10,
          marginBottom: 16,
        }}
        className="market-filters"
      >
        <input
          className="input"
          placeholder="Search albums or artists…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <select
          className="input"
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value as typeof sort);
          }}
        >
          <option value="name">Sort: name</option>
          <option value="price">Sort: price</option>
          <option value="created_at">Sort: newest</option>
          <option value="average_rating">Sort: rating</option>
        </select>
        <select
          className="input"
          value={order}
          onChange={(e) => {
            setPage(1);
            setOrder(e.target.value as typeof order);
          }}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <button type="button" className="btn" onClick={() => albumsQuery.refetch()}>
          Refresh
        </button>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .market-filters { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {albumsQuery.isError && (
        <div className="error" style={{ marginBottom: 12 }}>
          {(albumsQuery.error as Error).message}
        </div>
      )}

      {albumsQuery.isLoading && <div className="empty">Loading…</div>}

      {!albumsQuery.isLoading && (albumsQuery.data?.items.length ?? 0) === 0 && (
        <div className="empty">No albums match your search.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        {albumsQuery.data?.items.map((a) => {
          const owned = accessToken ? ownedMap.has(a.id) : false;
          const ur = ownedMap.get(a.id)?.user_rating;
          return (
            <AlbumCard
              key={a.id}
              album={a}
              owned={owned}
              userRating={ur ?? null}
              isAuthed={Boolean(accessToken)}
              busy={purchase.isPending || rate.isPending}
              onPurchase={
                accessToken
                  ? () => purchase.mutate(a.id)
                  : undefined
              }
              onRate={
                accessToken && owned
                  ? (score) => rate.mutate({ albumId: a.id, score })
                  : undefined
              }
            />
          );
        })}
      </div>

      {albumsQuery.data && albumsQuery.data.meta.pages > 1 && (
        <motion.div
          style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <div className="chip">
            Page {page} / {albumsQuery.data.meta.pages}
          </div>
          <button
            type="button"
            className="btn"
            disabled={page >= albumsQuery.data.meta.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </motion.div>
      )}

      {!user && (
        <div className="empty" style={{ marginTop: 22 }}>
          Want to buy or rate? Create an account or sign in — guests can still browse and search.
        </div>
      )}
    </div>
  );
}
