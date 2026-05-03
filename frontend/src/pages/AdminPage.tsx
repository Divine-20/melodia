import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { Album, Artist, PaginatedMeta } from "@/api/types";
import { useAuth } from "@/auth/AuthContext";
import { motion } from "framer-motion";

type PagedArtists = { items: Artist[]; meta: PaginatedMeta };
type PagedAlbums = { items: Album[]; meta: PaginatedMeta };

export function AdminPage() {
  const { accessToken, user } = useAuth();
  const qc = useQueryClient();
  const [aq, setAq] = useState("");

  const artists = useQuery({
    queryKey: ["artists", "admin", aq],
    enabled: user?.role === "admin" && Boolean(accessToken),
    queryFn: () =>
      apiFetch<PagedArtists>("/api/v1/artists", {
        token: accessToken,
        params: { q: aq, page: 1, page_size: 100, sort: "performing_name", order: "asc" },
      }),
  });

  const albums = useQuery({
    queryKey: ["albums", "admin"],
    enabled: user?.role === "admin" && Boolean(accessToken),
    queryFn: () =>
      apiFetch<PagedAlbums>("/api/v1/albums", {
        token: accessToken,
        params: { page: 1, page_size: 200, sort: "name", order: "asc" },
      }),
  });

  const createArtist = useMutation({
    mutationFn: (body: {
      real_name: string;
      date_of_birth: string;
      performing_name: string;
      bio: string;
    }) =>
      apiFetch<Artist>("/api/v1/artists", { method: "POST", token: accessToken, body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["artists"] });
    },
  });

  const deleteArtist = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/artists/${id}`, { method: "DELETE", token: accessToken }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["artists"] });
      await qc.invalidateQueries({ queryKey: ["albums"] });
    },
  });

  const createAlbum = useMutation({
    mutationFn: (body: { name: string; price: string; artist_id: number; description: string }) =>
      apiFetch<Album>("/api/v1/albums", { method: "POST", token: accessToken, body }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["albums"] });
    },
  });

  const deleteAlbum = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/v1/albums/${id}`, { method: "DELETE", token: accessToken }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["albums"] });
    },
  });

  const artistOptions = useMemo(() => artists.data?.items ?? [], [artists.data?.items]);

  if (!accessToken) return <div className="empty">Sign in as an administrator.</div>;
  if (user?.role !== "admin") return <div className="empty">This area is reserved for admins.</div>;

  return (
    <div>
      <div className="section-title">
        <h2>Admin studio</h2>
        <div className="muted" style={{ fontSize: 14 }}>
          Manage artists and albums
        </div>
      </div>

      <div className="admin-grid">
        <motion.div className="card" style={{ padding: 16 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Artists</h3>
          <input className="input" placeholder="Search artists…" value={aq} onChange={(e) => setAq(e.target.value)} style={{ marginBottom: 12 }} />
          <ArtistForm
            onCreate={(b) => createArtist.mutate(b)}
            busy={createArtist.isPending}
          />
          {artists.isLoading && <div className="muted">Loading…</div>}
          {artists.isError && <div className="error">{(artists.error as Error).message}</div>}
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Performing</th>
                <th>Real name</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {artistOptions.map((ar) => (
                <tr key={ar.id}>
                  <td>{ar.performing_name}</td>
                  <td className="muted">{ar.real_name}</td>
                  <td style={{ textAlign: "right" }}>
                    <button type="button" className="btn" onClick={() => deleteArtist.mutate(ar.id)} disabled={deleteArtist.isPending}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div className="card" style={{ padding: 16 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Albums</h3>
          <AlbumForm
            artists={artistOptions}
            onCreate={(b) => createAlbum.mutate(b)}
            busy={createAlbum.isPending}
          />
          {albums.isLoading && <div className="muted">Loading…</div>}
          {albums.isError && <div className="error">{(albums.error as Error).message}</div>}
          <table className="table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Album</th>
                <th>Price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(albums.data?.items ?? []).map((al) => (
                <tr key={al.id}>
                  <td>{al.name}</td>
                  <td>${al.price}</td>
                  <td style={{ textAlign: "right" }}>
                    <button type="button" className="btn" onClick={() => deleteAlbum.mutate(al.id)} disabled={deleteAlbum.isPending}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}

function ArtistForm({
  onCreate,
  busy,
}: {
  onCreate: (b: { real_name: string; date_of_birth: string; performing_name: string; bio: string }) => void;
  busy: boolean;
}) {
  const [real_name, setReal] = useState("");
  const [performing_name, setPerf] = useState("");
  const [date_of_birth, setDob] = useState("1990-01-01");
  const [bio, setBio] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({ real_name, performing_name, date_of_birth, bio });
        setReal("");
        setPerf("");
        setBio("");
      }}
      style={{ display: "grid", gap: 10 }}
    >
      <input className="input" placeholder="Real name" value={real_name} onChange={(e) => setReal(e.target.value)} required />
      <input className="input" placeholder="Performing name" value={performing_name} onChange={(e) => setPerf(e.target.value)} required />
      <input className="input" type="date" value={date_of_birth} onChange={(e) => setDob(e.target.value)} required />
      <input className="input" placeholder="Bio (optional)" value={bio} onChange={(e) => setBio(e.target.value)} />
      <button type="submit" className="btn btn-primary" disabled={busy}>
        Add artist
      </button>
    </form>
  );
}

function AlbumForm({
  artists,
  onCreate,
  busy,
}: {
  artists: Artist[];
  onCreate: (b: { name: string; price: string; artist_id: number; description: string }) => void;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("9.99");
  const [artist_id, setArtist] = useState<number | "">("");
  const [description, setDesc] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (artist_id === "") return;
        onCreate({ name, price, artist_id, description });
        setName("");
        setDesc("");
      }}
      style={{ display: "grid", gap: 10 }}
    >
      <input className="input" placeholder="Album name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="input" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <select
        className="input"
        value={artist_id}
        onChange={(e) => setArtist(e.target.value ? Number(e.target.value) : "")}
        required
      >
        <option value="">Select artist…</option>
        {artists.map((a) => (
          <option key={a.id} value={a.id}>
            {a.performing_name}
          </option>
        ))}
      </select>
      <input className="input" placeholder="Description (optional)" value={description} onChange={(e) => setDesc(e.target.value)} />
      <button type="submit" className="btn btn-primary" disabled={busy || artists.length === 0}>
        Add album
      </button>
    </form>
  );
}
