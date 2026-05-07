export interface Profile {
  id: string;
  username: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface Artist {
  id: string;
  real_name: string;
  performing_name: string;
  date_of_birth: string;
  bio: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  artist_id: string;
  name: string;
  price: number;
  cover_url: string;
  photo_url: string;
  genre: string;
  release_year: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithRating extends Album {
  artist_name: string;
  artist_image: string;
  avg_rating: number;
  rating_count: number;
  album_photo_url: string;
  album_name: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  album_id: string;
  purchased_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  album_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}
