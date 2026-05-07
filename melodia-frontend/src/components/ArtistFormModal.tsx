import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Artist } from '../lib/database.types';

interface Props {
  artist?: Artist;
  onSave: (data: Omit<Artist, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  loading?: boolean;
}

export function ArtistFormModal({ artist, onSave, onClose, loading }: Props) {
  const [form, setForm] = useState({
    real_name: artist?.real_name ?? '',
    performing_name: artist?.performing_name ?? '',
    date_of_birth: artist?.date_of_birth ?? '',
    bio: artist?.bio ?? '',
    image_url: artist?.image_url ?? '',
  });

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">{artist ? 'Edit Artist' : 'Add Artist'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Performing Name', key: 'performing_name', type: 'text', placeholder: 'Stage name', required: true },
            { label: 'Real Name', key: 'real_name', type: 'text', placeholder: 'Legal name', required: true },
            { label: 'Date of Birth', key: 'date_of_birth', type: 'date', placeholder: '', required: true },
            { label: 'Image URL', key: 'image_url', type: 'url', placeholder: 'https://...', required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="text-sm text-gray-400 mb-1.5 block">{f.label}</label>
              <input
                type={f.type}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              rows={3}
              placeholder="Artist biography..."
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
              {loading ? 'Saving...' : 'Save Artist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
