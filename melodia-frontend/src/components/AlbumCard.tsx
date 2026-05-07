import { ShoppingCart, Check, Music } from 'lucide-react';
import type { AlbumWithRating } from '../lib/database.types';
import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';

interface Props {
  album: AlbumWithRating;
  isPurchased?: boolean;
  myRating?: number;
  onPurchase?: () => void;
  onRate?: (score: number) => void;
  onOpenDetail?: () => void;
  purchasing?: boolean;
}

export function AlbumCard({ album, isPurchased, myRating, onPurchase, onRate, onOpenDetail, purchasing }: Props) {
  const { user, isAdmin } = useAuth();
  return (
    <div
      className={`group bg-gray-800/50 hover:bg-gray-800 border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 cursor-pointer ${
        isPurchased && !isAdmin
          ? 'border-emerald-500/40 hover:border-emerald-500/50 ring-1 ring-emerald-500/20'
          : 'border-gray-700/50 hover:border-gray-600'
      }`}
      onClick={onOpenDetail}
    >
      <div className="relative aspect-square overflow-hidden">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt={album.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <Music size={48} className="text-gray-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {isPurchased && !isAdmin && (
          <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-1.5 shadow-lg">
            <Check size={12} className="text-white" />
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          {user && !isAdmin && !isPurchased && onPurchase && (
            <button
              onClick={e => { e.stopPropagation(); onPurchase(); }}
              disabled={purchasing}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <ShoppingCart size={14} />
              {purchasing ? 'Purchasing...' : `Buy $${album.price}`}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold truncate text-sm">{album.name}</h3>
        <p className="text-gray-400 text-xs mt-0.5 truncate">{album.artist_name}</p>

        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <StarRating value={album.avg_rating} readonly size="sm" />
            <span className="text-xs text-gray-500">({album.rating_count})</span>
          </div>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {isPurchased && !isAdmin && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Purchased
              </span>
            )}
            <span className="text-rose-400 font-semibold text-sm">${album.price}</span>
          </div>
        </div>

        {isPurchased && onRate && !isAdmin && (
          <div className="mt-3 pt-3 border-t border-gray-700/50" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-gray-500 mb-1.5">{myRating ? 'Your rating' : 'Rate this album'}</p>
            <StarRating value={myRating ?? 0} onChange={onRate} size="sm" />
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          {album.genre && (
            <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full">{album.genre}</span>
          )}
          {typeof album.release_year === 'number' && album.release_year > 0 && (
            <span className="text-xs text-gray-500">{album.release_year}</span>
          )}
        </div>
      </div>
    </div>
  );
}
