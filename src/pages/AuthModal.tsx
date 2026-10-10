import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User } from '../types';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  KeyRound,
  AlertCircle,
  Loader2,
  Sparkles,
  Cloud,
  CheckCircle2,
  Info
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  inviteToken?: string;
  onClose: () => void;
  onSuccess: (user: User) => void | Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  inviteToken = '',
  onClose,
  onSuccess,
}) => {
  const { login, register, loginQuickOwner, firebaseConfigured, missingFirebaseVars } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tokenInput, setTokenInput] = useState(inviteToken);

  const [inviteInfo, setInviteInfo] = useState<{ email: string; playlists: { id: string; name: string }[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showFirebaseInfo, setShowFirebaseInfo] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);

    if (inviteToken) {
      setTokenInput(inviteToken);
      setMode('register');
      api.verifyInvitation(inviteToken)
        .then((res) => {
          setInviteInfo(res);
          if (res.email) setEmail(res.email);
        })
        .catch((err) => {
          setError(`Invitation notice: ${err.message}`);
        });
    }
  }, [initialMode, inviteToken, isOpen]);

  if (!isOpen) return null;

  const validateInputs = (): boolean => {
    setError(null);
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      return false;
    }

    if (mode !== 'forgot') {
      if (!cleanPassword) {
        setError('Please enter your password.');
        return false;
      }
      if (cleanPassword.length < 6) {
        setError('Password must contain at least 6 characters.');
        return false;
      }
    }

    if (mode === 'register' && !displayName.trim()) {
      setError('Please enter your display name.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      if (mode === 'login') {
        const authedUser = await login(cleanEmail, cleanPassword);
        await onSuccess(authedUser);
        onClose();
      } else if (mode === 'register') {
        const authedUser = await register({
          email: cleanEmail,
          password: cleanPassword,
          displayName: displayName.trim(),
          inviteToken: tokenInput.trim() || undefined,
        });
        await onSuccess(authedUser);
        onClose();
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(cleanEmail);
        setSuccessMsg(res.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickOwner = async () => {
    if (isDemoLoading || isLoading) return;
    setIsDemoLoading(true);
    setError(null);
    try {
      const authedUser = await loginQuickOwner();
      await onSuccess(authedUser);
      onClose();
    } catch (err: unknown) {
      console.error('Owner demo login error:', err);
      setError(err instanceof Error ? err.message : 'Could not launch Owner Demo');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleFillCredentials = () => {
    setEmail('owner@vibevault.io');
    setPassword('owner1234');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#13131e] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-white">
              {mode === 'login' ? 'Sign In to VibeVault' : mode === 'register' ? 'Join VibeVault' : 'Reset Password'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'login'
                ? 'Access your private music space'
                : mode === 'register'
                ? 'Create a private listener profile'
                : 'Enter your email for recovery'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 mt-3 bg-white/[0.04] rounded-lg text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'login'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'register'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Quick Demo Owner Banner */}
        <div className="mt-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-200 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              Demo Owner Access
            </span>
            <span className="text-[10px] text-purple-300 font-mono px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
              Admin Preview
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1.5">
            1-Click instant authentication or autofill credentials:
          </p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-500/20">
            <button
              type="button"
              onClick={handleQuickOwner}
              disabled={isDemoLoading || isLoading}
              className="flex-1 py-1.5 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-purple-900/30"
            >
              {isDemoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              <span>{isDemoLoading ? 'Entering Vault...' : '1-Click Owner Demo'}</span>
            </button>
            <button
              type="button"
              onClick={handleFillCredentials}
              className="py-1.5 px-2.5 bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              Autofill
            </button>
          </div>
        </div>

        {/* Firebase Environment Status Pill */}
        <div className="mt-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {firebaseConfigured ? (
                <span className="text-emerald-400 font-medium">Firebase Auth Active</span>
              ) : (
                <span className="text-slate-300">Secure Vault Auth Engine</span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowFirebaseInfo(!showFirebaseInfo)}
            className="text-[10px] text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3 h-3" />
            <span>{showFirebaseInfo ? 'Hide' : 'Info'}</span>
          </button>
        </div>

        {showFirebaseInfo && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 animate-in fade-in duration-150">
            {firebaseConfigured ? (
              <p className="text-emerald-300">
                Connected to project <code className="text-purple-300">{import.meta.env.VITE_FIREBASE_PROJECT_ID}</code> with browser-level local persistence.
              </p>
            ) : (
              <div>
                <p className="font-semibold text-slate-200">Firebase Auth Integration:</p>
                <p className="text-slate-400 text-[10px] mt-0.5">
                  Currently running on VibeVault&apos;s full-stack Express engine with cryptographically signed tokens.
                </p>
                <p className="text-slate-400 text-[10px] mt-1">
                  To switch to Google Firebase Auth, provide the following variables in <code className="text-purple-300">.env</code>:
                </p>
                <div className="mt-1 font-mono text-[10px] text-purple-300 bg-black/50 p-1.5 rounded border border-white/5 space-y-0.5">
                  {missingFirebaseVars.map((v) => (
                    <div key={v}>• {v}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invite Notice */}
        {inviteInfo && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-xs text-emerald-200">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Friend Invitation Token Verified
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              You will gain access to: {inviteInfo.playlists.map((p) => p.name).join(', ') || 'shared playlists'}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs" noValidate>
          {mode === 'register' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Display Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (error) setError(null);
                  }}
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. owner@vibevault.io"
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
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] text-purple-400 hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Invite Token (Optional)</label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste invite token from owner"
                className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isDemoLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-600/30 transition-colors mt-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {isLoading
                ? 'Authenticating...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Create Account'
                : 'Send Reset Link'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
