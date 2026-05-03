export type UserRole = "admin" | "user";

export interface UserPublic {
  id: number;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Artist {
  id: number;
  real_name: string;
  date_of_birth: string;
  performing_name: string;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: number;
  name: string;
  price: string;
  description: string | null;
  artist_id: number;
  average_rating: number | null;
  rating_count: number;
  artist_performing_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryItem {
  purchase_id: number;
  purchased_at: string;
  album_id: number;
  album_name: string;
  price: string;
  artist_performing_name: string;
  average_rating: number | null;
  user_rating: number | null;
}
