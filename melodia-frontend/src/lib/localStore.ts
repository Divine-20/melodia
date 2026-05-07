import type {
  Album,
  AlbumWithRating,
  Artist,
  Profile,
  Purchase,
  Rating,
} from './database.types';

const STORE_KEY = 'melodia_store_v1';
const SESSION_KEY = 'melodia_session';

interface LocalUser {
  id: string;
  email: string;
  /** Demo-only local auth; not for production. */
  password: string;
}

interface Persisted {
  artists: Artist[];
  albums: Album[];
  ratings: Rating[];
  purchases: Purchase[];
  users: LocalUser[];
  profiles: Profile[];
}

function nowIso() {
  return new Date().toISOString();
}

function seed(): Persisted {
  const t = nowIso();
  const artists: Artist[] = [
    {
      id: 'a1',
      real_name: 'Elena Voss',
      performing_name: 'Elena Voss',
      date_of_birth: '1990-04-12',
      bio: 'Singer-songwriter blending acoustic folk with electronic textures.',
      image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
      created_at: t,
      updated_at: t,
    },
    {
      id: 'a2',
      real_name: 'Marcus Bell',
      performing_name: 'The Night Keys',
      date_of_birth: '1986-11-03',
      bio: 'Jazz piano trio with modern production.',
      image_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200&h=200&fit=crop',
      created_at: t,
      updated_at: t,
    },
    {
      id: 'a3',
      real_name: 'Yuki Tanaka',
      performing_name: 'Yuki',
      date_of_birth: '1995-07-21',
      bio: 'Electronic producer focused on lush synthscapes.',
      image_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
      created_at: t,
      updated_at: t,
    },
  ];

  const albums: Album[] = [
    {
      id: 'al1',
      artist_id: 'a1',
      name: 'Northern Lights',
      price: 12.99,
      cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
      genre: 'Indie Folk',
      release_year: 2023,
      description: 'Debut full-length recorded in Reykjavik.',
      created_at: t,
      updated_at: t,
    },
    {
      id: 'al2',
      artist_id: 'a1',
      name: 'Paper Boats',
      price: 9.99,
      cover_url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop',
      genre: 'Indie Folk',
      release_year: 2021,
      description: 'Early EP including fan favorites.',
      created_at: t,
      updated_at: t,
    },
    {
      id: 'al3',
      artist_id: 'a2',
      name: 'Blue Hour Sessions',
      price: 14.5,
      cover_url: 'https://images.unsplash.com/photo-1415201368244-e6ee39063e56?w=400&h=400&fit=crop',
      genre: 'Jazz',
      release_year: 2024,
      description: 'Live trio recordings from Tokyo.',
      created_at: t,
      updated_at: t,
    },
    {
      id: 'al4',
      artist_id: 'a2',
      name: 'Sidewalk Stories',
      price: 11,
      cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      genre: 'Jazz',
      release_year: 2020,
      description: 'Standards reimagined.',
      created_at: t,
      updated_at: t,
    },
    {
      id: 'al5',
      artist_id: 'a3',
      name: 'Neon Tide',
      price: 10.99,
      cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
      genre: 'Electronic',
      release_year: 2023,
      description: 'Late-night synth journeys.',
      created_at: t,
      updated_at: t,
    },
    {
      id: 'al6',
      artist_id: 'a3',
      name: 'Glass Forms',
      price: 8.99,
      cover_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
      genre: 'Electronic',
      release_year: 2022,
      description: 'Minimal ambient set.',
      created_at: t,
      updated_at: t,
    },
  ];

  const adminId = 'admin-user';
  const users: LocalUser[] = [
    {
      id: adminId,
      email: 'admin@melodia.app',
      password: 'admin123',
    },
  ];

  const profiles: Profile[] = [
    {
      id: adminId,
      username: 'admin',
      full_name: 'Melodia Admin',
      is_admin: true,
      created_at: t,
    },
  ];

  const ratings: Rating[] = [
    {
      id: 'r1',
      user_id: adminId,
      album_id: 'al1',
      score: 5,
      created_at: t,
      updated_at: t,
    },
    {
      id: 'r2',
      user_id: adminId,
      album_id: 'al5',
      score: 4,
      created_at: t,
      updated_at: t,
    },
  ];

  return {
    artists,
    albums,
    ratings,
    purchases: [],
    users,
    profiles,
  };
}

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const initial = seed();
      localStorage.setItem(STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed.artists?.length) {
      const initial = seed();
      localStorage.setItem(STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    const initial = seed();
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(initial));
    } catch {
      /* ignore */
    }
    return initial;
  }
}

const state: Persisted = loadPersisted();

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function getArtist(artistId: string): Artist | undefined {
  return state.artists.find((a) => a.id === artistId);
}

function albumWithRating(album: Album): AlbumWithRating {
  const artist = getArtist(album.artist_id);
  const albumRatings = state.ratings.filter((r) => r.album_id === album.id);
  const sum = albumRatings.reduce((s, r) => s + r.score, 0);
  const avg = albumRatings.length ? sum / albumRatings.length : 0;
  return {
    ...album,
    artist_name: artist?.performing_name ?? '',
    artist_image: artist?.image_url ?? '',
    avg_rating: Math.round(avg * 10) / 10,
    rating_count: albumRatings.length,
  };
}

function matchesSearch(haystacks: (string | undefined)[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return haystacks.some((h) => h?.toLowerCase().includes(s));
}

export const localStore = {
  listArtists(search?: string): Artist[] {
    let list = [...state.artists].sort((a, b) =>
      a.performing_name.localeCompare(b.performing_name)
    );
    if (search?.trim()) {
      const q = search.trim();
      list = list.filter((a) =>
        matchesSearch([a.performing_name, a.real_name], q)
      );
    }
    return list;
  },

  getArtistById(id: string): Artist | undefined {
    return state.artists.find((a) => a.id === id);
  },

  createArtist(
    input: Omit<Artist, 'id' | 'created_at' | 'updated_at'>
  ): Artist {
    const t = nowIso();
    const row: Artist = {
      ...input,
      id: crypto.randomUUID(),
      created_at: t,
      updated_at: t,
    };
    state.artists.push(row);
    save();
    return row;
  },

  updateArtist(partial: Partial<Artist> & { id: string }): Artist {
    const i = state.artists.findIndex((a) => a.id === partial.id);
    if (i < 0) throw new Error('Artist not found');
    const t = nowIso();
    state.artists[i] = { ...state.artists[i], ...partial, updated_at: t };
    save();
    return state.artists[i];
  },

  deleteArtist(id: string): void {
    const removedAlbumIds = new Set(
      state.albums.filter((a) => a.artist_id === id).map((a) => a.id)
    );
    state.artists = state.artists.filter((a) => a.id !== id);
    state.albums = state.albums.filter((a) => a.artist_id !== id);
    state.ratings = state.ratings.filter((r) => !removedAlbumIds.has(r.album_id));
    state.purchases = state.purchases.filter(
      (p) => !removedAlbumIds.has(p.album_id)
    );
    save();
  },

  listAlbumsWithRatings(search?: string): AlbumWithRating[] {
    let list = state.albums.map(albumWithRating).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    if (search?.trim()) {
      const q = search.trim();
      list = list.filter((a) =>
        matchesSearch([a.name, a.artist_name, a.genre], q)
      );
    }
    return list;
  },

  getAlbumWithRatingById(id: string): AlbumWithRating | undefined {
    const album = state.albums.find((a) => a.id === id);
    return album ? albumWithRating(album) : undefined;
  },

  listAlbumsByArtist(artistId: string): AlbumWithRating[] {
    return state.albums
      .filter((a) => a.artist_id === artistId)
      .map(albumWithRating)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  createAlbum(
    input: Omit<Album, 'id' | 'created_at' | 'updated_at'>
  ): Album {
    const t = nowIso();
    const row: Album = {
      ...input,
      id: crypto.randomUUID(),
      created_at: t,
      updated_at: t,
    };
    state.albums.push(row);
    save();
    return row;
  },

  updateAlbum(partial: Partial<Album> & { id: string }): Album {
    const i = state.albums.findIndex((a) => a.id === partial.id);
    if (i < 0) throw new Error('Album not found');
    const t = nowIso();
    state.albums[i] = { ...state.albums[i], ...partial, updated_at: t };
    save();
    return state.albums[i];
  },

  deleteAlbum(id: string): void {
    state.albums = state.albums.filter((a) => a.id !== id);
    state.ratings = state.ratings.filter((r) => r.album_id !== id);
    state.purchases = state.purchases.filter((p) => p.album_id !== id);
    save();
  },

  getMyRatingsMap(userId: string): Record<string, number> {
    const rows = state.ratings.filter((r) => r.user_id === userId);
    return Object.fromEntries(rows.map((r) => [r.album_id, r.score]));
  },

  upsertRating(userId: string, albumId: string, score: number): void {
    const t = nowIso();
    const existing = state.ratings.find(
      (r) => r.user_id === userId && r.album_id === albumId
    );
    if (existing) {
      existing.score = score;
      existing.updated_at = t;
    } else {
      state.ratings.push({
        id: crypto.randomUUID(),
        user_id: userId,
        album_id: albumId,
        score,
        created_at: t,
        updated_at: t,
      });
    }
    save();
  },

  getPurchaseAlbumIds(userId: string): string[] {
    return state.purchases
      .filter((p) => p.user_id === userId)
      .map((p) => p.album_id);
  },

  getLibrary(
    userId: string
  ): (AlbumWithRating & { purchased_at: string })[] {
    const purchases = state.purchases.filter((p) => p.user_id === userId);
    if (!purchases.length) return [];
    return purchases.map((p) => {
      const album = state.albums.find((a) => a.id === p.album_id);
      if (!album) {
        return null;
      }
      return {
        ...albumWithRating(album),
        purchased_at: p.purchased_at,
      };
    }).filter(Boolean) as (AlbumWithRating & { purchased_at: string })[];
  },

  insertPurchase(userId: string, albumId: string): void {
    const exists = state.purchases.some(
      (p) => p.user_id === userId && p.album_id === albumId
    );
    if (exists) return;
    const row: Purchase = {
      id: crypto.randomUUID(),
      user_id: userId,
      album_id: albumId,
      purchased_at: nowIso(),
    };
    state.purchases.push(row);
    save();
  },

  getProfile(userId: string): Profile | undefined {
    return state.profiles.find((p) => p.id === userId);
  },

  signUp(
    email: string,
    password: string,
    username: string
  ): { userId: string; error: Error | null } {
    const normalized = email.trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === normalized)) {
      return { userId: '', error: new Error('Account already exists') };
    }
    const t = nowIso();
    const id = crypto.randomUUID();
    state.users.push({ id, email: normalized, password });
    state.profiles.push({
      id,
      username,
      full_name: username,
      is_admin: false,
      created_at: t,
    });
    save();
    return { userId: id, error: null };
  },

  signIn(email: string, password: string): { userId: string; error: Error | null } {
    const normalized = email.trim().toLowerCase();
    const u = state.users.find((x) => x.email.toLowerCase() === normalized);
    if (!u || u.password !== password) {
      return { userId: '', error: new Error('Invalid email or password') };
    }
    return { userId: u.id, error: null };
  },

  getSessionUserId(): string | null {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  },

  setSessionUserId(userId: string | null): void {
    try {
      if (userId) localStorage.setItem(SESSION_KEY, userId);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  },

  getUserEmail(userId: string): string | undefined {
    return state.users.find((u) => u.id === userId)?.email;
  },
};
