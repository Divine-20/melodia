import { useState } from 'react';
import { Plus, Edit2, Trash2, Disc3, Music } from 'lucide-react';
import { useAlbums, useCreateAlbum, useUpdateAlbum, useDeleteAlbum } from '../hooks/useAlbums';
import { useArtists } from '../hooks/useArtists';
import { AlbumFormModal } from '../components/AlbumFormModal';
import { SearchBar } from '../components/SearchBar';
import { StarRating } from '../components/StarRating';
import type { Album } from '../lib/database.types';

export function AdminAlbumsView() {
  const [search, setSearch] = useState('');
  const [editAlbum, setEditAlbum] = useState<Album | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: albums = [], isLoading } = useAlbums(search);
  const { data: artists = [] } = useArtists();
  const createMutation = useCreateAlbum();
  const updateMutation = useUpdateAlbum();
  const deleteMutation = useDeleteAlbum();

  async function handleSave(data: Omit<Album, 'id' | 'created_at' | 'updated_at'>) {
    if (editAlbum) {
      await updateMutation.mutateAsync({ id: editAlbum.id, ...data });
      setEditAlbum(null);
    } else {
      await createMutation.mutateAsync(data);
      setShowAdd(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirm(null);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950 overscroll-y-contain max-md:pl-[3.25rem]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Disc3 size={28} className="text-amber-400" />
              <h1 className="text-3xl font-bold text-white">Manage Albums</h1>
            </div>
            <p className="text-gray-400 mt-1">{albums.length} album{albums.length !== 1 ? 's' : ''} in catalog</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-64">
              <SearchBar value={search} onChange={setSearch} placeholder="Search albums..." />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              disabled={artists.length === 0}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} /> Add Album
            </button>
          </div>
        </div>

        {artists.length === 0 && !isLoading && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 text-sm">
            <Disc3 size={16} />
            Add artists first before creating albums.
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-800/50 rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && albums.length === 0 && (
          <div className="text-center py-20">
            <Disc3 size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No albums yet. Add your first album above.</p>
          </div>
        )}

        <div className="space-y-3">
          {albums.map(album => (
            <div key={album.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4 hover:border-gray-600 transition-colors">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                {album.cover_url ? (
                  <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                    <Music size={18} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{album.name}</p>
                <p className="text-gray-400 text-sm truncate">{album.artist_name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-rose-400 text-sm font-medium">${album.price}</span>
                  {album.genre && <span className="text-gray-500 text-xs bg-gray-700/50 px-2 py-0.5 rounded-full">{album.genre}</span>}
                  <StarRating value={album.avg_rating} readonly size="sm" />
                  <span className="text-gray-500 text-xs">({album.rating_count})</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditAlbum(album as unknown as Album)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                {deleteConfirm === album.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Confirm?</span>
                    <button
                      onClick={() => handleDelete(album.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-gray-700 text-white text-xs rounded-lg">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(album.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(showAdd || editAlbum) && (
        <AlbumFormModal
          album={editAlbum ?? undefined}
          artists={artists}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditAlbum(null); }}
          loading={isSaving}
        />
      )}
    </div>
  );
}
