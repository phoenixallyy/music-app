import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Shield,
  Server,
  Cloud,
  CheckCircle2,
  Lock,
  Radio,
  FileCode,
  LogOut,
  Loader2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, isOwner, updateProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({ displayName });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(`Update failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-4xl mx-auto pb-32 text-xs">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.04]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account & Architecture
        </h1>
        <p className="text-slate-400 mt-1">
          Manage your listening profile, security privileges, and cloud deployment setup
        </p>
      </div>

      {/* Profile Settings */}
      <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-purple-400" />
          <span>Profile Information</span>
        </h2>

        <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Address</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full bg-[#1c1c28] border border-white/5 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Assigned Role</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-950/40 border border-purple-500/20 rounded-lg text-purple-300 font-semibold uppercase tracking-wider text-[11px]">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>{user?.role}</span>
              <span className="text-slate-400 font-normal lowercase ml-auto">
                {isOwner ? 'Full administrative vault authority' : 'Authorized private streaming listener'}
              </span>
            </div>
          </div>

          {saveSuccess && (
            <p className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Profile updated successfully</span>
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-600/30 transition-colors flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Profile</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>

      {/* Streaming Security Protocol (Section 9) */}
      <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Streaming Security & Anti-Ripping Protections</span>
        </h2>

        <p className="text-slate-300 leading-relaxed">
          VibeVault enforces server-side access controls to protect audio masters from casual downloads and unpermitted distribution:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              HTTP 206 Partial Content
            </span>
            <p className="text-[11px] text-slate-400">
              Audio is streamed in discrete byte ranges via <code className="text-purple-300">/api/stream/:songId</code>. Range requests allow instant seeking without buffering whole files into client memory.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Tokenized Authorization
            </span>
            <p className="text-[11px] text-slate-400">
              The streaming server verifies HMAC signatures on every chunk. If a listener's access to a playlist is revoked, subsequent byte chunk requests return HTTP 403 Forbidden.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Zero Public URLs
            </span>
            <p className="text-[11px] text-slate-400">
              Audio files are stored privately. Download buttons and HTML5 download controls are disabled, preventing direct URL extraction.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-violet-400" />
              Role Validation
            </span>
            <p className="text-[11px] text-slate-400">
              Listeners can only stream songs linked to playlists explicitly shared with them. The vault owner retains full modification rights.
            </p>
          </div>
        </div>
      </div>

      {/* Cloud & Firebase Deliverables Reference (Section 18) */}
      <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Cloud className="w-4 h-4 text-cyan-400" />
          <span>Cloud & Firebase Deployment Architecture</span>
        </h2>

        <p className="text-slate-300 leading-relaxed">
          The codebase contains production-ready configuration for seamless cloud deployment:
        </p>

        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] space-y-1 text-slate-300">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <FileCode className="w-4 h-4" />
              <span>firebase-blueprint.json & firestore.rules</span>
            </div>
            <p className="text-slate-400">
              Validated ABAC Firestore rules adhering to the Eight Pillars of Hardened Security, enforcing owner role immutability and relational playlist gates.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] space-y-1 text-slate-300">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <Server className="w-4 h-4" />
              <span>Full-Stack Express + Vite Integration</span>
            </div>
            <p className="text-slate-400">
              Development runs under <code className="text-purple-300">tsx server.ts</code> mounting Vite middlewares. Production compiles with <code className="text-purple-300">npm run build</code> and serves static assets from <code className="text-purple-300">/dist</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
