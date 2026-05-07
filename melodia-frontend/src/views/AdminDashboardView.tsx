import { Shield, Users, Disc3, ArrowRight } from 'lucide-react';

type AdminViewId = 'admin-artists' | 'admin-albums';

interface Props {
  onNavigate: (view: AdminViewId) => void;
}

const cards: { id: AdminViewId; title: string; description: string; icon: typeof Users }[] = [
  {
    id: 'admin-artists',
    title: 'Manage Artists',
    description: 'Create, edit, list, and remove artists in the catalog.',
    icon: Users,
  },
  {
    id: 'admin-albums',
    title: 'Manage Albums',
    description: 'Create, edit, list, and remove albums and pricing.',
    icon: Disc3,
  },
];

export function AdminDashboardView({ onNavigate }: Props) {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-950">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
            <Shield size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin</h1>
            <p className="text-gray-400 mt-1 max-w-xl">
              Full catalog control: manage artists and albums. User management is not part of this app.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map(({ id, title, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="text-left group bg-gray-800/40 border border-gray-700/50 hover:border-amber-500/30 rounded-2xl p-6 transition-all hover:bg-gray-800/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-rose-400" />
                </div>
                <ArrowRight
                  size={20}
                  className="text-gray-500 group-hover:text-amber-400 transition-colors flex-shrink-0 mt-1"
                />
              </div>
              <h2 className="text-lg font-semibold text-white mt-4">{title}</h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
