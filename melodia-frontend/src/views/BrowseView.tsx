import { useState } from 'react';
import { Disc3, TrendingUp, Sparkles } from 'lucide-react';
import { useAlbums } from '../hooks/useAlbums';
import { usePurchasedAlbumIdSet } from '../hooks/usePurchases';
import { useMyRatings } from '../hooks/useRatings';
import { usePurchaseAlbum } from '../hooks/usePurchases';
import { useRateAlbum } from '../hooks/useRatings';
import { AlbumCard } from '../components/AlbumCard';
import { AlbumDetailModal } from '../components/AlbumDetailModal';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import type { AlbumWithRating } from '../lib/database.types';

interface Props {
  onRequireAuth: () => void;
}

export function BrowseView({ onRequireAuth }: Props) {
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithRating | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const { data: albums, isLoading, isError } = useAlbums(search);
  const purchasedAlbumIds = usePurchasedAlbumIdSet();
  const albumIsPurchased = (albumId: string) => purchasedAlbumIds.has(String(albumId).trim());
  const { data: myRatings = {} } = useMyRatings();
  const purchaseMutation = usePurchaseAlbum();
  const rateMutation = useRateAlbum();

  async function handlePurchase(albumId: string) {
    if (!user) { onRequireAuth(); return; }
    setPurchasingId(albumId);
    try {
      await purchaseMutation.mutateAsync(albumId);
    } finally {
      setPurchasingId(null);
    }
  }

  async function handleRate(albumId: string, score: number) {
    await rateMutation.mutateAsync({ albumId, score });
  }

  const featured = albums?.slice(0, 1)[0];
  const topRated = albums?.filter(a => a.rating_count > 0).sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 4) ?? [];
  const allAlbums = albums ?? [];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Discover Music</h1>
            <p className="text-gray-400 mt-1">
              {isAdmin ? 'Browse the catalog (admin)' : 'Browse and purchase from our catalog'}
            </p>
          </div>
          <div className="w-full sm:w-80">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        {/* Featured hero */}
        {!search && featured && (
          <div
            className="relative rounded-3xl overflow-hidden h-64 cursor-pointer group"
            onClick={() => setSelectedAlbum(featured)}
          >
            <img
              src={featured.cover_url || 'https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg'}
              alt={featured.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-rose-400" />
                <span className="text-rose-400 text-xs font-semibold uppercase tracking-wider">Featured Album</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-1">{featured.name}</h2>
              <p className="text-gray-300 text-lg">{featured.artist_name}</p>
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <span className="text-2xl font-bold text-white">${featured.price}</span>
                {!isAdmin && albumIsPurchased(featured.id) && (
                  <span className="bg-emerald-500/90 text-white text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-xl">
                    Purchased
                  </span>
                )}
                {!isAdmin && !albumIsPurchased(featured.id) && (
                  <button
                    onClick={e => { e.stopPropagation(); handlePurchase(featured.id); }}
                    disabled={purchasingId === featured.id}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {purchasingId === featured.id ? 'Purchasing...' : 'Purchase'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top Rated */}
        {!search && topRated.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={20} className="text-rose-400" />
              <h2 className="text-xl font-bold text-white">Top Rated</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {topRated.map(album => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  isPurchased={albumIsPurchased(album.id)}
                  myRating={myRatings[album.id]}
                  onPurchase={() => handlePurchase(album.id)}
                  onRate={score => handleRate(album.id, score)}
                  onOpenDetail={() => setSelectedAlbum(album)}
                  purchasing={purchasingId === album.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Albums */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Disc3 size={20} className="text-rose-400" />
            <h2 className="text-xl font-bold text-white">
              {search ? `Results for "${search}"` : 'All Albums'}
            </h2>
            {albums && <span className="text-gray-500 text-sm ml-1">({allAlbums.length})</span>}
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="text-center py-16 text-gray-400">
              <Disc3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Failed to load albums. Please try again.</p>
            </div>
          )}

          {!isLoading && !isError && allAlbums.length === 0 && (
            <div className="text-center py-16">
              <Disc3 size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No albums found{search ? ` for "${search}"` : ''}.</p>
            </div>
          )}

          {!isLoading && !isError && allAlbums.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {allAlbums.map(album => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  isPurchased={albumIsPurchased(album.id)}
                  myRating={myRatings[album.id]}
                  onPurchase={() => handlePurchase(album.id)}
                  onRate={score => handleRate(album.id, score)}
                  onOpenDetail={() => setSelectedAlbum(album)}
                  purchasing={purchasingId === album.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedAlbum && (
        <AlbumDetailModal
          album={selectedAlbum}
          isPurchased={albumIsPurchased(selectedAlbum.id)}
          myRating={myRatings[selectedAlbum.id]}
          onPurchase={() => handlePurchase(selectedAlbum.id)}
          onRate={score => handleRate(selectedAlbum.id, score)}
          onClose={() => setSelectedAlbum(null)}
          purchasing={purchasingId === selectedAlbum.id}
          onRequireAuth={onRequireAuth}
        />
      )}
    </div>
  );
}
