import type { Album, AlbumWithRating, Artist } from './database.types';
import { apiRequest, asArray, asObject } from './apiClient';

type UnknownObj = Record<string, unknown>;

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** IDs from JSON may be strings or numbers; empty id breaks `/resource/{id}` and often yields 405 on the collection route. */
function toEntityId(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'bigint') return String(value);
  return '';
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeArtist(raw: UnknownObj): Artist {
  const now = new Date().toISOString();
  return {
    id: toEntityId(raw.id ?? raw.artist_id),
    real_name: toStringValue(raw.real_name ?? raw.realName),
    performing_name: toStringValue(raw.performing_name ?? raw.performingName),
    date_of_birth: toStringValue(raw.date_of_birth ?? raw.dateOfBirth),
    bio: toStringValue(raw.bio),
    image_url: toStringValue(
      raw.picture_url ?? raw.pictureUrl ?? raw.image_url ?? raw.imageUrl
    ),
    created_at: toStringValue(raw.created_at ?? raw.createdAt, now),
    updated_at: toStringValue(raw.updated_at ?? raw.updatedAt, now),
  };
}

/**
 * Catalog albums use `id`. Library/purchase rows often expose the album as `album_id` (or nested
 * `album`) while `id` is the purchase row — we must resolve the same id the list endpoint uses.
 */
function canonicalAlbumId(raw: UnknownObj): string {
  const embeddedAlbum =
    raw.album && typeof raw.album === 'object' && !Array.isArray(raw.album)
      ? (raw.album as UnknownObj)
      : null;
  return (
    toEntityId(raw.album_id ?? raw.albumId) ||
    toEntityId(embeddedAlbum?.id ?? embeddedAlbum?.album_id ?? embeddedAlbum?.albumId) ||
    toEntityId(raw.id)
  );
}

function normalizeAlbum(raw: UnknownObj): AlbumWithRating {
  // Library/purchase endpoints return rows like `{ id: <purchaseId>, album_id, album: {...} }`
  // where the actual album payload is nested under `album`. Fall back to that object so name,
  // price, cover_url, etc. populate instead of coming back empty.
  const embeddedAlbum =
    raw.album && typeof raw.album === 'object' && !Array.isArray(raw.album)
      ? (raw.album as UnknownObj)
      : null;
  const pick = (...keys: string[]): unknown => {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null && raw[key] !== '') return raw[key];
    }
    if (embeddedAlbum) {
      for (const key of keys) {
        if (
          embeddedAlbum[key] !== undefined &&
          embeddedAlbum[key] !== null &&
          embeddedAlbum[key] !== ''
        )
          return embeddedAlbum[key];
      }
    }
    return undefined;
  };

  const artistObj = (() => {
    const fromRaw = raw.artist;
    if (fromRaw && typeof fromRaw === 'object' && !Array.isArray(fromRaw)) {
      return fromRaw as UnknownObj;
    }
    const fromEmbedded = embeddedAlbum?.artist;
    if (fromEmbedded && typeof fromEmbedded === 'object' && !Array.isArray(fromEmbedded)) {
      return fromEmbedded as UnknownObj;
    }
    return null;
  })();
  const now = new Date().toISOString();

  const artistName =
    toStringValue(pick('artist_performing_name', 'artistPerformingName')) ||
    toStringValue(pick('artist_name', 'artistName')) ||
    toStringValue(artistObj?.performing_name ?? artistObj?.performingName);
  const artistImage =
    toStringValue(pick('artist_picture_url', 'artistPictureUrl')) ||
    toStringValue(pick('artist_image', 'artistImage')) ||
    toStringValue(
      artistObj?.picture_url ??
        artistObj?.pictureUrl ??
        artistObj?.image_url ??
        artistObj?.imageUrl
    );

  return {
    id: canonicalAlbumId(raw),
    artist_id: toEntityId(pick('artist_id', 'artistId') ?? artistObj?.id),
    // Library rows use album_name / album_photo_url; catalog uses name / photo_url.
    name: toStringValue(pick('name', 'album_name', 'albumName')),
    price: toNumberValue(pick('price')),
    cover_url: toStringValue(
      pick(
        'photo_url',
        'photoUrl',
        'cover_url',
        'coverUrl',
        'album_photo_url',
        'albumPhotoUrl'
      )
    ),
    photo_url: toStringValue(
      pick(
        'photo_url',
        'photoUrl',
        'cover_url',
        'coverUrl',
        'album_photo_url',
        'albumPhotoUrl'
      )
    ),
    genre: toStringValue(pick('genre')),
    release_year: toNumberValue(pick('release_year', 'releaseYear')),
    description: toStringValue(pick('description')),
    created_at: toStringValue(pick('created_at', 'createdAt'), now),
    updated_at: toStringValue(pick('updated_at', 'updatedAt'), now),
    artist_name: artistName,
    artist_image: artistImage,
    avg_rating: toNumberValue(
      pick('average_rating', 'averageRating', 'avg_rating', 'avgRating')
    ),
    rating_count: toNumberValue(pick('rating_count', 'ratingCount')),
  };
}

/** Backend expects snake_case `picture_url` / `photo_url`; UI/forms use image_url / cover_url. */
function artistPayloadForApi(patch: UnknownObj): UnknownObj {
  const { image_url: imageUrl, imageUrl: legacyCamel, ...rest } = patch;
  const body: UnknownObj = { ...rest };
  if (Object.prototype.hasOwnProperty.call(patch, 'image_url')) {
    body.picture_url = imageUrl ?? null;
  } else if (Object.prototype.hasOwnProperty.call(patch, 'imageUrl')) {
    body.picture_url = legacyCamel ?? null;
  }
  return body;
}

function albumPayloadForApi(patch: UnknownObj): UnknownObj {
  const { cover_url: coverUrl, coverUrl: legacyCamel, ...rest } = patch;
  const body: UnknownObj = { ...rest };
  if (Object.prototype.hasOwnProperty.call(patch, 'cover_url')) {
    body.photo_url = coverUrl ?? null;
  } else if (Object.prototype.hasOwnProperty.call(patch, 'coverUrl')) {
    body.photo_url = legacyCamel ?? null;
  }
  return body;
}

function filterBySearch<T>(rows: T[], predicate: (row: T, q: string) => boolean, q?: string) {
  const query = q?.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) => predicate(row, query));
}

export type AlbumListSort = 'name' | 'price' | 'created_at' | 'average_rating';

export interface ListAlbumsParams {
  search?: string;
  genre?: string;
  minAverageRating?: number;
  sort?: AlbumListSort;
  order?: 'asc' | 'desc';
}

export const marketplaceApi = {
  async listArtists(search?: string): Promise<Artist[]> {
    const payload = await apiRequest('/api/v1/artists', { method: 'GET' });
    const artists = asArray<UnknownObj>(payload).map(normalizeArtist);
    return filterBySearch(
      artists,
      (artist, q) =>
        artist.performing_name.toLowerCase().includes(q) ||
        artist.real_name.toLowerCase().includes(q),
      search
    ).sort((a, b) => a.performing_name.localeCompare(b.performing_name));
  },

  async getArtistById(id: string): Promise<Artist | undefined> {
    const safeId = encodeURIComponent(toEntityId(id));
    if (!safeId) return undefined;
    const payload = await apiRequest(`/api/v1/artists/${safeId}`, { method: 'GET' });
    const raw = asObject(payload);
    if (!toEntityId(raw.id)) return undefined;
    return normalizeArtist(raw);
  },

  async createArtist(artist: Omit<Artist, 'id' | 'created_at' | 'updated_at'>): Promise<Artist> {
    const payload = await apiRequest('/api/v1/artists', {
      method: 'POST',
      body: JSON.stringify(artistPayloadForApi({ ...artist } as UnknownObj)),
      requireAuth: true,
    });
    return normalizeArtist(asObject(payload));
  },

  async updateArtist(artist: Partial<Artist> & { id: string }): Promise<Artist> {
    const { id: rawId, created_at, updated_at, ...patch } = artist;
    void created_at;
    void updated_at;
    const id = toEntityId(rawId);
    if (!id) {
      throw new Error('Artist id is missing; cannot update. Check that list/detail responses include a string or numeric id.');
    }
    const safeId = encodeURIComponent(id);
    const body = { id, ...artistPayloadForApi(patch as UnknownObj) };
    const payload = await apiRequest(`/api/v1/artists/${safeId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      requireAuth: true,
    });
    return normalizeArtist(asObject(payload));
  },

  async deleteArtist(id: string): Promise<void> {
    const safeId = encodeURIComponent(toEntityId(id));
    if (!safeId) throw new Error('Artist id is required to delete');
    await apiRequest(`/api/v1/artists/${safeId}`, { method: 'DELETE', requireAuth: true });
  },

  async listAlbums(params?: ListAlbumsParams): Promise<AlbumWithRating[]> {
    const sp = new URLSearchParams();
    sp.set('page_size', '100');
    sp.set('page', '1');
    const q = params?.search?.trim();
    if (q) sp.set('q', q);
    const g = params?.genre?.trim();
    if (g) sp.set('genre', g);
    if (params?.minAverageRating != null && params.minAverageRating > 0) {
      sp.set('min_average_rating', String(params.minAverageRating));
    }
    if (params?.sort) sp.set('sort', params.sort);
    if (params?.order) sp.set('order', params.order);
    const qs = sp.toString();
    const payload = await apiRequest(`/api/v1/albums?${qs}`, { method: 'GET' });
    return asArray<UnknownObj>(payload).map(normalizeAlbum);
  },

  async getAlbumById(id: string): Promise<AlbumWithRating | undefined> {
    const safeId = encodeURIComponent(toEntityId(id));
    if (!safeId) return undefined;
    const payload = await apiRequest(`/api/v1/albums/${safeId}`, { method: 'GET' });
    const raw = asObject(payload);
    if (!toEntityId(raw.id)) return undefined;
    return normalizeAlbum(raw);
  },

  async listAlbumsByArtist(artistId: string): Promise<AlbumWithRating[]> {
    const albums = await this.listAlbums();
    return albums.filter((album) => album.artist_id === artistId);
  },

  async getFavoriteAlbumIds(): Promise<number[]> {
    const payload = await apiRequest<{ album_ids?: number[] }>('/api/v1/me/favorites', {
      method: 'GET',
      requireAuth: true,
    });
    const ids = payload?.album_ids;
    return Array.isArray(ids) ? ids : [];
  },

  async addFavoriteAlbum(albumId: string): Promise<void> {
    const safeId = encodeURIComponent(toEntityId(albumId));
    if (!safeId) throw new Error('Album id is required');
    await apiRequest(`/api/v1/me/favorites/${safeId}`, { method: 'PUT', requireAuth: true });
  },

  async removeFavoriteAlbum(albumId: string): Promise<void> {
    const safeId = encodeURIComponent(toEntityId(albumId));
    if (!safeId) throw new Error('Album id is required');
    await apiRequest(`/api/v1/me/favorites/${safeId}`, { method: 'DELETE', requireAuth: true });
  },

  async createAlbum(album: Omit<Album, 'id' | 'created_at' | 'updated_at'>): Promise<AlbumWithRating> {
    const payload = await apiRequest('/api/v1/albums', {
      method: 'POST',
      body: JSON.stringify(albumPayloadForApi({ ...album } as UnknownObj)),
      requireAuth: true,
    });
    return normalizeAlbum(asObject(payload));
  },

  async updateAlbum(album: Partial<Album> & { id: string }): Promise<AlbumWithRating> {
    const { id: rawId, created_at, updated_at, ...patch } = album;
    void created_at;
    void updated_at;
    const id = toEntityId(rawId);
    if (!id) {
      throw new Error('Album id is missing; cannot update.');
    }
    const safeId = encodeURIComponent(id);
    const body = { id, ...albumPayloadForApi(patch as UnknownObj) };
    const payload = await apiRequest(`/api/v1/albums/${safeId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      requireAuth: true,
    });
    return normalizeAlbum(asObject(payload));
  },

  async deleteAlbum(id: string): Promise<void> {
    const safeId = encodeURIComponent(toEntityId(id));
    if (!safeId) throw new Error('Album id is required to delete');
    await apiRequest(`/api/v1/albums/${safeId}`, { method: 'DELETE', requireAuth: true });
  },

  async purchaseAlbum(albumId: string): Promise<void> {
    const safeId = encodeURIComponent(toEntityId(albumId));
    if (!safeId) throw new Error('Album id is required to purchase');
    await apiRequest(`/api/v1/albums/${safeId}/purchase`, { method: 'POST', requireAuth: true });
  },

  async upsertRating(albumId: string, score: number): Promise<void> {
    const safeId = encodeURIComponent(toEntityId(albumId));
    if (!safeId) throw new Error('Album id is required to rate');
    await apiRequest(`/api/v1/albums/${safeId}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ score }),
      requireAuth: true,
    });
  },

  async getMyLibrary(): Promise<AlbumWithRating[]> {
    const payload = await apiRequest('/api/v1/me/library', { method: 'GET', requireAuth: true });
    return asArray<UnknownObj>(payload).map(normalizeAlbum);
  },

  async getMyRatingsMap(): Promise<Record<string, number>> {
    const payload = await apiRequest('/api/v1/albums?page_size=100&page=1', {
      method: 'GET',
      requireAuth: true,
    });
    const rows = asArray<UnknownObj>(payload);
    const map: Record<string, number> = {};
    for (const row of rows) {
      const id = canonicalAlbumId(row);
      const myRating = toNumberValue(row.my_rating ?? row.myRating, -1);
      if (id && myRating >= 0) map[id] = myRating;
    }
    return map;
  },
};
