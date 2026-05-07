import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Album, Artist } from '../lib/database.types';

interface Props {
  album?: Album;
  artists: Artist[];
  onSave: (data: Omit<Album, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  loading?: boolean;
}

export function AlbumFormModal({ album, artists, onSave, onClose, loading }: Props) {
  const [form, setForm] = useState({
    artist_id: album?.artist_id ?? (artists[0]?.id ?? ''),
    name: album?.name ?? '',
    price: album?.price?.toString() ?? '',
    cover_url: album?.cover_url ?? '',
    genre: album?.genre ?? '',
    release_year: album?.release_year?.toString() ?? new Date().getFullYear().toString(),
    description: album?.description ?? '',
  });

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      price: parseFloat(form.price),
      release_year: parseInt(form.release_year),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">{album ? 'Edit Album' : 'Add Album'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Artist</label>
            <select
              value={form.artist_id}
              onChange={e => set('artist_id', e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors"
            >
              {artists.map(a => (
                <option key={a.id} value={a.id}>{a.performing_name}</option>
              ))}
            </select>
          </div>

          {[
            { label: 'Album Name', key: 'name', type: 'text', placeholder: 'Album title', required: true },
            { label: 'Price ($)', key: 'price', type: 'number', placeholder: '9.99', required: true },
            { label: 'Cover Image URL', key: 'cover_url', type: 'url', placeholder: 'https://...', required: false },
            { label: 'Genre', key: 'genre', type: 'text', placeholder: 'Hip-Hop, R&B, Pop...', required: false },
            { label: 'Release Year', key: 'release_year', type: 'number', placeholder: '2024', required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="text-sm text-gray-400 mb-1.5 block">{f.label}</label>
              <input
                type={f.type}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                step={f.key === 'price' ? '0.01' : undefined}
                min={f.key === 'price' ? '0' : undefined}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Album description..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
