import { useState } from 'react';
import { AlertCircle, Calendar, Music, Users } from 'lucide-react';
import { useArtists } from '../hooks/useArtists';
import { useAlbumsByArtist } from '../hooks/useAlbums';
import { usePurchasedAlbumIdSet } from '../hooks/usePurchases';
import { useMyRatings } from '../hooks/useRatings';
import { usePurchaseAlbum } from '../hooks/usePurchases';
import { useRateAlbum } from '../hooks/useRatings';
import { useFavoriteAlbumIds, useSetFavoriteAlbum } from '../hooks/useFavorites';
import { AlbumCard } from '../components/AlbumCard';
import { AlbumDetailModal } from '../components/AlbumDetailModal';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import type { Artist, AlbumWithRating } from '../lib/database.types';
import { getErrorMessage } from '../lib/errors';

interface Props {
  onRequireAuth: () => void;
}

function ArtistAlbums({ artist, onRequireAuth }: { artist: Artist; onRequireAuth: () => void }) {
  const { user, isAdmin } = useAuth();
  const { data: albums = [] } = useAlbumsByArtist(artist.id);
  const purchasedAlbumIds = usePurchasedAlbumIdSet();
  const albumIsPurchased = (albumId: string) => purchasedAlbumIds.has(String(albumId).trim());
  const { data: myRatings = {} } = useMyRatings();
  const { data: favoriteIdSet } = useFavoriteAlbumIds();
  const purchaseMutation = usePurchaseAlbum();
  const rateMutation = useRateAlbum();
  const setFavoriteMutation = useSetFavoriteAlbum();
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithRating | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  async function handlePurchase(albumId: string) {
    if (!user) { onRequireAuth(); return; }
    setPurchasingId(albumId);
    try { await purchaseMutation.mutateAsync(albumId); } finally { setPurchasingId(null); }
  }

  function handleToggleFavorite(albumId: string) {
    if (isAdmin) return;
    if (!user) { onRequireAuth(); return; }
    const isFav = favoriteIdSet?.has(String(albumId)) ?? false;
    setFavoriteMutation.mutate({ albumId, favorite: !isFav });
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {albums.map(album => (
          <AlbumCard
            key={album.id}
            album={album}
            isPurchased={albumIsPurchased(album.id)}
            myRating={myRatings[album.id]}
            isFavorite={favoriteIdSet?.has(String(album.id)) ?? false}
            onPurchase={() => handlePurchase(album.id)}
            onRate={score => rateMutation.mutateAsync({ albumId: album.id, score })}
            onOpenDetail={() => setSelectedAlbum(album)}
            onToggleFavorite={
              isAdmin ? undefined : () => handleToggleFavorite(album.id)
            }
            purchasing={purchasingId === album.id}
          />
        ))}
      </div>
      {selectedAlbum && (
        <AlbumDetailModal
          album={selectedAlbum}
          isPurchased={albumIsPurchased(selectedAlbum.id)}
          myRating={myRatings[selectedAlbum.id]}
          isFavorite={favoriteIdSet?.has(String(selectedAlbum.id)) ?? false}
          onPurchase={() => handlePurchase(selectedAlbum.id)}
          onRate={score => rateMutation.mutateAsync({ albumId: selectedAlbum.id, score })}
          onToggleFavorite={
            isAdmin ? undefined : () => handleToggleFavorite(selectedAlbum.id)
          }
          onClose={() => setSelectedAlbum(null)}
          purchasing={purchasingId === selectedAlbum.id}
          onRequireAuth={onRequireAuth}
        />
      )}
    </>
  );
}

export function ArtistsView({ onRequireAuth }: Props) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: artists = [], isLoading, isError, error, refetch, isRefetching } =
    useArtists(search);

  function toggle(id: string) {
    setExpanded(e => e === id ? null : id);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950 overscroll-y-contain max-md:pl-[3.25rem]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Users size={28} className="text-rose-400" />
              <h1 className="text-3xl font-bold text-white">Artists</h1>
            </div>
            <p className="text-gray-400 mt-1">Explore our roster of talented artists</p>
          </div>
          <div className="w-full sm:w-72">
            <SearchBar value={search} onChange={setSearch} placeholder="Search artists..." />
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-800/50 rounded-2xl p-6 animate-pulse flex gap-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-5 bg-gray-700 rounded w-1/3" />
                  <div className="h-4 bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div
            className="rounded-2xl border border-red-500/35 bg-red-950/40 px-5 py-12 text-center max-w-lg mx-auto"
            role="alert"
          >
            <AlertCircle size={44} className="mx-auto mb-4 text-red-400" aria-hidden />
            <h3 className="text-lg font-semibold text-white mb-2">Couldn’t load artists</h3>
            <p className="text-sm text-red-100/90 mb-6 leading-relaxed">
              {getErrorMessage(
                error,
                'The artist list could not be loaded. Check your connection and try again.'
              )}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 touch-manipulation"
            >
              {isRefetching ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        )}

        {!isLoading && !isError && artists.length === 0 && (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No artists found{search ? ` for "${search}"` : ''}.</p>
          </div>
        )}

        {!isError && (
        <div className="space-y-4">
          {artists.map(artist => (
            <div key={artist.id} className="bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/50 rounded-2xl overflow-hidden transition-all duration-200">
              <button
                className="w-full text-left p-6 flex items-center gap-4"
                onClick={() => toggle(artist.id)}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-700">
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.performing_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                      <Music size={24} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg">{artist.performing_name}</h3>
                  <p className="text-gray-400 text-sm">{artist.real_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar size={12} className="text-gray-500" />
                    <span className="text-gray-500 text-xs">{new Date(artist.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
                <span className={`text-gray-400 text-sm transition-transform duration-200 ${expanded === artist.id ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {artist.bio && expanded === artist.id && (
                <div className="px-6 pb-2">
                  <p className="text-gray-300 text-sm leading-relaxed">{artist.bio}</p>
                </div>
              )}

              {expanded === artist.id && (
                <div className="px-6 py-4 border-t border-gray-700/50">
                  <h4 className="text-white font-semibold mb-4">Discography</h4>
                  <ArtistAlbums artist={artist} onRequireAuth={onRequireAuth} />
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
