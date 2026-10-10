import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Disc3, UserCircle, LogOut, Shield, Radio, KeyRound } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenAuth }) => {
  const { user, logout, isOwner, loginQuickOwner } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0e0e16]/80 backdrop-blur-md border-b border-white/[0.06]">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onNavigate(user ? 'home' : 'landing')}
        className="flex items-center gap-2.5 text-left group focus:outline-none"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-violet-400 flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform duration-200">
          <Disc3 className="w-4.5 h-4.5 text-white animate-[spin_10s_linear_infinite]" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          Vibe<span className="text-purple-400">Vault</span>
        </span>
      </button>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
        {!user ? (
          <>
            <button
              onClick={() => onNavigate('landing')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                currentTab === 'landing' ? 'text-white border-b-2 border-purple-500' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                currentTab === 'explore' ? 'text-white border-b-2 border-purple-500' : ''
              }`}
            >
              Explore Music
            </button>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
          </>
        ) : (
          <>
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                currentTab === 'home' ? 'text-white border-b-2 border-purple-500 font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                currentTab === 'explore' ? 'text-white border-b-2 border-purple-500 font-semibold' : ''
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => onNavigate('playlists')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                currentTab === 'playlists' ? 'text-white border-b-2 border-purple-500 font-semibold' : ''
              }`}
            >
              Playlists
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => onNavigate('library')}
                  className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    currentTab === 'library' ? 'text-white border-b-2 border-purple-500 font-semibold' : ''
                  }`}
                >
                  Music Library
                </button>
                <button
                  onClick={() => onNavigate('friends')}
                  className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                    currentTab === 'friends' ? 'text-white border-b-2 border-purple-500 font-semibold' : ''
                  }`}
                >
                  Friends & Sharing
                </button>
              </>
            )}
          </>
        )}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {!user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors shadow-md shadow-purple-600/20 whitespace-nowrap shrink-0"
            >
              Get Started
            </button>
            <button
              onClick={() => loginQuickOwner()}
              title="Quick demo access as Administrator"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-purple-300 bg-purple-950/60 border border-purple-700/40 rounded-lg hover:bg-purple-900/60 transition-colors whitespace-nowrap shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Owner Demo</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors focus:outline-none"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-[11px] font-bold text-white uppercase">
                {user.displayName.charAt(0)}
              </div>
              <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
                {user.displayName}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {user.role}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 py-1.5 bg-[#14141e] border border-white/10 rounded-xl shadow-2xl shadow-black/80 z-50">
                <div className="px-3.5 py-2 border-b border-white/[0.06]">
                  <p className="text-xs font-semibold text-white truncate">{user.displayName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => {
                    onNavigate('settings');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors text-left"
                >
                  <UserCircle className="w-4 h-4 text-purple-400" />
                  Account & Settings
                </button>

                {isOwner && (
                  <button
                    onClick={() => {
                      onNavigate('friends');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Friends & Sharing
                  </button>
                )}

                <div className="my-1 border-t border-white/[0.06]" />

                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                    onNavigate('landing');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
