import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { BrowseView } from './views/BrowseView';
import { LibraryView } from './views/LibraryView';
import { ArtistsView } from './views/ArtistsView';
import { AdminArtistsView } from './views/AdminArtistsView';
import { AdminAlbumsView } from './views/AdminAlbumsView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { useAuth } from './context/AuthContext';
import { Music, Menu } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

type View = 'browse' | 'library' | 'artists' | 'admin' | 'admin-artists' | 'admin-albums';

function AppInner() {
  const [view, setView] = useState<View>('browse');
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { loading, user, isAdmin } = useAuth();

  useEffect(() => {
    if (loading || user) return;
    if (
      view === 'library' ||
      view === 'admin' ||
      view === 'admin-artists' ||
      view === 'admin-albums'
    ) {
      setView('browse');
    }
  }, [loading, user, view]);

  function handleNavigate(v: View) {
    if (v === 'library' && !user) {
      setAuthTab('login');
      setShowAuth(true);
      setMobileNavOpen(false);
      return;
    }
    if ((v === 'admin' || v === 'admin-artists' || v === 'admin-albums') && !isAdmin) return;
    setView(v);
    setMobileNavOpen(false);
  }

  function handleRequireAuth() {
    setAuthTab('login');
    setShowAuth(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Music size={32} className="text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 animate-ping opacity-30" />
          </div>
          <div className="flex gap-1.5 items-end">
            {[14, 22, 18, 26, 16].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-rose-500 rounded-full animate-bounce"
                style={{ height: `${h}px`, animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex overflow-hidden" style={{ height: '100dvh' }}>
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] touch-manipulation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <button
        type="button"
        aria-label="Open menu"
        className="md:hidden fixed top-3 left-3 z-30 p-2.5 rounded-xl bg-gray-900/95 border border-gray-700 text-white shadow-lg touch-manipulation"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu size={22} />
      </button>
      <Sidebar
        currentView={view}
        onNavigate={handleNavigate}
        onShowAuth={() => {
          setAuthTab('login');
          setShowAuth(true);
        }}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className="flex-1 flex overflow-hidden min-w-0 w-full">
        {view === 'browse' && <BrowseView onRequireAuth={handleRequireAuth} />}
        {view === 'library' && user && <LibraryView />}
        {view === 'artists' && <ArtistsView onRequireAuth={handleRequireAuth} />}
        {view === 'admin' && isAdmin && (
          <AdminDashboardView onNavigate={(sub) => setView(sub)} />
        )}
        {view === 'admin-artists' && isAdmin && <AdminArtistsView />}
        {view === 'admin-albums' && isAdmin && <AdminAlbumsView />}
      </main>

      {showAuth && (
        <AuthModal defaultTab={authTab} onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInner />
        <Toaster
          theme="dark"
          richColors
          position="top-right"
          toastOptions={{
            className: 'text-sm',
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
