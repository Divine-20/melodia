import { useState } from 'react';
import { Users, Calendar, Music } from 'lucide-react';
import { useArtists } from '../hooks/useArtists';
import { useAlbumsByArtist } from '../hooks/useAlbums';
import { usePurchasedAlbumIdSet } from '../hooks/usePurchases';
import { useMyRatings } from '../hooks/useRatings';
import { usePurchaseAlbum } from '../hooks/usePurchases';
import { useRateAlbum } from '../hooks/useRatings';
import { AlbumCard } from '../components/AlbumCard';
import { AlbumDetailModal } from '../components/AlbumDetailModal';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import type { Artist, AlbumWithRating } from '../lib/database.types';

interface Props {
  onRequireAuth: () => void;
}

function ArtistAlbums({ artist, onRequireAuth }: { artist: Artist; onRequireAuth: () => void }) {
  const { user } = useAuth();
  const { data: albums = [] } = useAlbumsByArtist(artist.id);
  const purchasedAlbumIds = usePurchasedAlbumIdSet();
  const albumIsPurchased = (albumId: string) => purchasedAlbumIds.has(String(albumId).trim());
  const { data: myRatings = {} } = useMyRatings();
  const purchaseMutation = usePurchaseAlbum();
  const rateMutation = useRateAlbum();
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithRating | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  async function handlePurchase(albumId: string) {
    if (!user) { onRequireAuth(); return; }
    setPurchasingId(albumId);
    try { await purchaseMutation.mutateAsync(albumId); } finally { setPurchasingId(null); }
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
            onPurchase={() => handlePurchase(album.id)}
            onRate={score => rateMutation.mutateAsync({ albumId: album.id, score })}
            onOpenDetail={() => setSelectedAlbum(album)}
            purchasing={purchasingId === album.id}
          />
        ))}
      </div>
      {selectedAlbum && (
        <AlbumDetailModal
          album={selectedAlbum}
          isPurchased={albumIsPurchased(selectedAlbum.id)}
          myRating={myRatings[selectedAlbum.id]}
          onPurchase={() => handlePurchase(selectedAlbum.id)}
          onRate={score => rateMutation.mutateAsync({ albumId: selectedAlbum.id, score })}
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
  const { data: artists = [], isLoading } = useArtists(search);

  function toggle(id: string) {
    setExpanded(e => e === id ? null : id);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
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

        {!isLoading && artists.length === 0 && (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No artists found{search ? ` for "${search}"` : ''}.</p>
          </div>
        )}

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
      </div>
    </div>
  );
}
