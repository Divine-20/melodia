import { X, ShoppingCart, Check, Music, Calendar, Tag, Heart } from 'lucide-react';
import type { AlbumWithRating } from '../lib/database.types';
import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';

interface Props {
  album: AlbumWithRating;
  isPurchased?: boolean;
  myRating?: number;
  isFavorite?: boolean;
  onPurchase?: () => void;
  onRate?: (score: number) => void;
  onToggleFavorite?: () => void;
  onClose: () => void;
  purchasing?: boolean;
  onRequireAuth?: () => void;
}

export function AlbumDetailModal({
  album,
  isPurchased,
  myRating,
  isFavorite,
  onPurchase,
  onRate,
  onToggleFavorite,
  onClose,
  purchasing,
  onRequireAuth,
}: Props) {
  const { user, isAdmin } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[min(92dvh,800px)] overflow-y-auto overscroll-contain shadow-2xl animate-scale-in">
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {onToggleFavorite && !isAdmin && (
            <button
              type="button"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              className="bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors ring-1 ring-white/25"
              onClick={onToggleFavorite}
            >
              <Heart
                size={18}
                className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}
              />
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 flex-shrink-0">
            {album.cover_url ? (
              <img src={album.cover_url} alt={album.name} className="w-full h-64 md:h-full object-cover" />
            ) : (
              <div className="w-full h-64 md:h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <Music size={64} className="text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-1">
                {album.artist_image && (
                  <img src={album.artist_image} alt={album.artist_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                )}
                <div>
                  <p className="text-gray-400 text-sm">{album.artist_name}</p>
                  <h2 className="text-2xl font-bold text-white">{album.name}</h2>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 mb-4">
                <StarRating value={album.avg_rating} readonly size="md" />
                <span className="text-gray-400 text-sm">{Number(album.avg_rating).toFixed(1)} ({album.rating_count} ratings)</span>
              </div>

              {album.description && (
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{album.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {album.genre && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    <Tag size={11} /> {album.genre}
                  </span>
                )}
                {album.release_year && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    <Calendar size={11} /> {album.release_year}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-gray-700/50 pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-white">${album.price}</span>
                {isPurchased && !isAdmin && (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                    <Check size={16} /> Owned
                  </span>
                )}
              </div>

              {isAdmin ? (
                <p className="text-sm text-gray-500">
                  Administrator accounts cannot purchase or rate albums.
                </p>
              ) : !user ? (
                <button
                  onClick={onRequireAuth}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart size={18} /> Sign in to Purchase
                </button>
              ) : isPurchased ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">{myRating ? 'Update your rating:' : 'Rate this album:'}</p>
                  <StarRating value={myRating ?? 0} onChange={onRate} size="lg" />
                  {myRating && <p className="text-xs text-gray-500">You rated this {myRating}/5</p>}
                </div>
              ) : (
                <button
                  onClick={onPurchase}
                  disabled={purchasing}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <ShoppingCart size={18} />
                  {purchasing ? 'Processing...' : `Purchase for $${album.price}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
