import { useState, FormEvent } from 'react';
import { X, Music, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({ onClose, defaultTab = 'login' }: Props) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const isStrongPassword = passwordScore >= 4;

  function validateInputs() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Please enter a valid email address');
    }
    if (!password.trim()) throw new Error('Password is required');
    if (tab === 'register' && !isStrongPassword) {
      throw new Error('Use a stronger password (8+ chars with uppercase, lowercase, number, and symbol)');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      validateInputs();
      if (tab === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center mb-3">
            <Music size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {tab === 'login' ? 'Sign in to your account' : 'Join the music marketplace'}
          </p>
        </div>

        <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                tab === t ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">Password strength</p>
                <p className={`text-xs font-semibold ${
                  passwordScore >= 4 ? 'text-emerald-400' : passwordScore >= 2 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {passwordScore >= 4 ? 'Strong' : passwordScore >= 2 ? 'Medium' : 'Weak'}
                </p>
              </div>
              <div className="mb-2 h-1.5 w-full overflow-hidden rounded bg-gray-700">
                <div
                  className={`h-full transition-all ${
                    passwordScore >= 4 ? 'bg-emerald-400' : passwordScore >= 2 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${(passwordScore / 5) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Use at least 8 characters and combine uppercase, lowercase, number, and symbol.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Auth is backed by your API (`register`, `login`, `refresh`, `me`) and tokens are persisted securely in browser storage.
        </p>
      </div>
    </div>
  );
}
