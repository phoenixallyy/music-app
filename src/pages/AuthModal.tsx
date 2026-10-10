import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Lock, Mail, User as UserIcon, KeyRound, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  inviteToken?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  inviteToken = '',
  onClose,
  onSuccess,
}) => {
  const { login, register, loginQuickOwner } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tokenInput, setTokenInput] = useState(inviteToken);

  const [inviteInfo, setInviteInfo] = useState<{ email: string; playlists: { id: string; name: string }[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    if (inviteToken) {
      setTokenInput(inviteToken);
      setMode('register');
      // Verify token
      api.verifyInvitation(inviteToken)
        .then((res) => {
          setInviteInfo(res);
          if (res.email) setEmail(res.email);
        })
        .catch((err) => {
          setError(`Invitation notice: ${err.message}`);
        });
    }
  }, [initialMode, inviteToken]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        await login(email, password);
        onSuccess();
        onClose();
      } else if (mode === 'register') {
        await register({
          email,
          password,
          displayName: displayName || email.split('@')[0],
          inviteToken: tokenInput || undefined,
        });
        onSuccess();
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email);
        setSuccessMsg(res.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickOwner = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginQuickOwner();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not log in as owner');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#13131e] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-white">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join VibeVault' : 'Reset Password'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'login'
                ? 'Sign in to access your audio space'
                : mode === 'register'
                ? 'Create your private streaming profile'
                : 'Enter your email to receive recovery instructions'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invite banner */}
        {inviteInfo && (
          <div className="mt-3 p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-xs text-purple-200">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Friend Invitation Verified
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              You are invited to stream: {inviteInfo.playlists.map((p) => p.name).join(', ') || 'shared playlists'}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Display Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#1c1c28] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-purple-400 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-600/30 transition-colors mt-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </span>
          </button>
        </form>

        {/* Demo Fast Login */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col gap-2">
          <button
            type="button"
            onClick={handleQuickOwner}
            disabled={isLoading}
            className="w-full py-2 px-3 text-xs font-semibold text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-600/30 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Instant Demo: Owner Account</span>
          </button>

          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mt-1">
            {mode === 'login' ? (
              <>
                <span>Don't have an account?</span>
                <button
                  onClick={() => setMode('register')}
                  className="text-purple-400 font-semibold hover:underline"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <span>Already have an account?</span>
                <button
                  onClick={() => setMode('login')}
                  className="text-purple-400 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
