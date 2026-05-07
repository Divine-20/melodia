import { useState } from 'react';
import { BookOpen, Music } from 'lucide-react';
import { useMyLibrary } from '../hooks/usePurchases';
import { useMyRatings } from '../hooks/useRatings';
import { useRateAlbum } from '../hooks/useRatings';
import { AlbumCard } from '../components/AlbumCard';
import { AlbumDetailModal } from '../components/AlbumDetailModal';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import type { AlbumWithRating } from '../lib/database.types';

export function LibraryView() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithRating | null>(null);

  const { data: library = [], isLoading, isError } = useMyLibrary();
  const { data: myRatings = {} } = useMyRatings();
  const rateMutation = useRateAlbum();

  async function handleRate(albumId: string, score: number) {
    await rateMutation.mutateAsync({ albumId, score });
  }

  const filtered = search
    ? library.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.artist_name.toLowerCase().includes(search.toLowerCase()))
    : library;

  console.log(filtered,'filtered');

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BookOpen size={28} className="text-rose-400" />
              <h1 className="text-3xl font-bold text-white">My Library</h1>
            </div>
            <p className="text-gray-400 mt-1">
              {isAdmin
                ? 'Administrators use the catalog for management only'
                : `${library.length} album${library.length !== 1 ? 's' : ''} in your collection`}
            </p>
          </div>
          {library.length > 0 && !isAdmin && (
            <div className="w-full sm:w-72">
              <SearchBar value={search} onChange={setSearch} placeholder="Search your library..." />
            </div>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
          <div className="text-center py-20">
            <Music size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Failed to load your library.</p>
          </div>
        )}

        {!isLoading && !isError && library.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Music size={36} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isAdmin ? 'No personal library' : 'Your library is empty'}
            </h3>
            <p className="text-gray-400 max-w-sm">
              {isAdmin
                ? 'Admin accounts cannot purchase albums, so there is no consumer library here.'
                : 'Browse the marketplace and purchase albums to build your personal music collection.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && library.length > 0 && (
          <div className="text-center py-16">
            <Music size={40} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No results for "{search}"</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(album => (
              <AlbumCard
                key={album.id}
                album={album}
                isPurchased               
                myRating={myRatings[album.id]}
                onRate={score => handleRate(album.id, score)}
                onOpenDetail={() => setSelectedAlbum(album)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedAlbum && (
        <AlbumDetailModal
          album={selectedAlbum}
          isPurchased
          myRating={myRatings[selectedAlbum.id]}
          onRate={score => handleRate(selectedAlbum.id, score)}
          onClose={() => setSelectedAlbum(null)}
        />
      )}
    </div>
  );
}
