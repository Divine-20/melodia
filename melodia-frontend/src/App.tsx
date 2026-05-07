import { useState } from 'react';
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
import { Music } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

type View = 'browse' | 'library' | 'artists' | 'admin' | 'admin-artists' | 'admin-albums';

function AppInner() {
  const [view, setView] = useState<View>('browse');
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const { loading, user, isAdmin } = useAuth();

  function handleNavigate(v: View) {
    if (v === 'library' && !user) {
      setAuthTab('login');
      setShowAuth(true);
      return;
    }
    if ((v === 'admin' || v === 'admin-artists' || v === 'admin-albums') && !isAdmin) return;
    setView(v);
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
      <Sidebar currentView={view} onNavigate={handleNavigate} onShowAuth={() => { setAuthTab('login'); setShowAuth(true); }} />

      <main className="flex-1 flex overflow-hidden">
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
