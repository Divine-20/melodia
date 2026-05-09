import { Music, LayoutGrid, BookOpen, Users, Disc3, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type View = 'browse' | 'library' | 'artists' | 'admin' | 'admin-artists' | 'admin-albums';

interface Props {
  currentView: View;
  onNavigate: (view: View) => void;
  onShowAuth: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  currentView,
  onNavigate,
  onShowAuth,
  onMobileClose,
  mobileOpen = false,
}: Props) {
  const { user, profile, isAdmin, signOut } = useAuth();

  const navItems = [
    { view: 'browse' as View, icon: LayoutGrid, label: 'Browse' },
    { view: 'artists' as View, icon: Users, label: 'Artists' },
    ...(user ? [{ view: 'library' as View, icon: BookOpen, label: 'My Library' }] : []),
  ];

  const adminItems = isAdmin
    ? [
        { view: 'admin' as View, icon: Shield, label: 'Admin overview' },
        { view: 'admin-artists' as View, icon: Users, label: 'Manage Artists' },
        { view: 'admin-albums' as View, icon: Disc3, label: 'Manage Albums' },
      ]
    : [];

  function go(view: View) {
    onNavigate(view);
    onMobileClose?.();
  }

  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[min(19rem,88vw)] md:w-60 max-w-[20rem]
        bg-gray-950 border-r border-gray-800 flex flex-col h-full flex-shrink-0
        transform transition-transform duration-200 ease-out shadow-2xl md:shadow-none
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `.replace(/\s+/g, ' ')}
    >
      <div className="p-5 sm:p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Music size={18} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-tight block">Melodia</span>
            <span className="text-gray-500 text-xs">Music Marketplace</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">Discover</p>
        {navItems.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            type="button"
            onClick={() => go(view)}
            className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all touch-manipulation ${
              currentView === view
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}

        {adminItems.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 pt-4">Admin</p>
            {adminItems.map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                type="button"
                onClick={() => go(view)}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all touch-manipulation ${
                  currentView === view
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-gray-800">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.username ?? 'User'}</p>
              {isAdmin && <p className="text-xs text-amber-400">Admin</p>}
            </div>
            <button
              type="button"
              onClick={() => {
                signOut();
                onMobileClose?.();
              }}
              className="text-gray-400 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onShowAuth();
              onMobileClose?.();
            }}
            className="w-full min-h-[44px] bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors touch-manipulation"
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}
