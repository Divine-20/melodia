import { useState } from 'react';
import { Plus, Edit2, Trash2, Users, Music, AlertCircle } from 'lucide-react';
import { useArtists, useCreateArtist, useUpdateArtist, useDeleteArtist } from '../hooks/useArtists';
import { ArtistFormModal } from '../components/ArtistFormModal';
import { SearchBar } from '../components/SearchBar';
import type { Artist } from '../lib/database.types';

export function AdminArtistsView() {
  const [search, setSearch] = useState('');
  const [editArtist, setEditArtist] = useState<Artist | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: artists = [], isLoading } = useArtists(search);
  const createMutation = useCreateArtist();
  const updateMutation = useUpdateArtist();
  const deleteMutation = useDeleteArtist();

  async function handleSave(data: Omit<Artist, 'id' | 'created_at' | 'updated_at'>) {
    if (editArtist) {
      await updateMutation.mutateAsync({ id: editArtist.id, ...data });
      setEditArtist(null);
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
    <div className="flex-1 overflow-y-auto bg-gray-950">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Users size={28} className="text-amber-400" />
              <h1 className="text-3xl font-bold text-white">Manage Artists</h1>
            </div>
            <p className="text-gray-400 mt-1">{artists.length} artist{artists.length !== 1 ? 's' : ''} in catalog</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-64">
              <SearchBar value={search} onChange={setSearch} placeholder="Search artists..." />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              <Plus size={18} /> Add Artist
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-800/50 rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && artists.length === 0 && (
          <div className="text-center py-20">
            <Users size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No artists yet. Add your first artist above.</p>
          </div>
        )}

        <div className="space-y-3">
          {artists.map(artist => (
            <div key={artist.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4 hover:border-gray-600 transition-colors">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                {artist.image_url ? (
                  <img src={artist.image_url} alt={artist.performing_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                    <Music size={18} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{artist.performing_name}</p>
                <p className="text-gray-400 text-sm truncate">{artist.real_name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Born {new Date(artist.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditArtist(artist)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                {deleteConfirm === artist.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Confirm?</span>
                    <button
                      onClick={() => handleDelete(artist.id)}
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
                    onClick={() => setDeleteConfirm(artist.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {deleteMutation.isError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle size={16} />
            Cannot delete: artist may have associated albums.
          </div>
        )}
      </div>

      {(showAdd || editArtist) && (
        <ArtistFormModal
          artist={editArtist ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditArtist(null); }}
          loading={isSaving}
        />
      )}
    </div>
  );
}
