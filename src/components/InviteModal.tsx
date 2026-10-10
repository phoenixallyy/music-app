import React, { useState } from 'react';
import { api } from '../services/api';
import { Playlist, Invitation } from '../types';
import { X, UserPlus, Copy, Check, AlertCircle, Loader2, Link2 } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  onInviteCreated: (invitation: Invitation) => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  playlists,
  onInviteCreated,
}) => {
  const [email, setEmail] = useState('');
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>(
    playlists.filter((p) => p.isPublicToFriends).map((p) => p.id)
  );
  const [expirationDays, setExpirationDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.createInvitation({
        email: email.trim().toLowerCase(),
        assignedPlaylistIds: selectedPlaylists,
        expirationDays,
      });

      setGeneratedInvite(res.invitation);
      onInviteCreated(res.invitation);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const inviteUrl = generatedInvite
    ? `${window.location.origin}?invite=${generatedInvite.token}`
    : '';

  const copyToClipboard = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePlaylist = (id: string) => {
    setSelectedPlaylists((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#13131e] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Invite a Friend</h2>
              <p className="text-xs text-slate-400">Share your private music collections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {generatedInvite ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-xs font-semibold text-emerald-300">
                Invitation Generated for {generatedInvite.email}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Expires in {expirationDays} days. Send this secure streaming link:
              </p>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10">
              <Link2 className="w-4 h-4 text-purple-400 shrink-0" />
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full bg-transparent text-xs text-slate-300 font-mono focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Friend's Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Link Expiration</label>
              <select
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value={1}>24 Hours</option>
                <option value={7}>7 Days (Standard)</option>
                <option value={30}>30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Accessible Playlists ({selectedPlaylists.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {playlists.map((pl) => (
                  <label
                    key={pl.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlaylists.includes(pl.id)}
                      onChange={() => togglePlaylist(pl.id)}
                      className="w-4 h-4 accent-purple-600 rounded"
                    />
                    <span className="font-medium text-slate-200 truncate">{pl.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-auto">
                      {pl.trackIds.length} tracks
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 font-semibold text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !email.includes('@')}
                className="flex items-center gap-2 px-5 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-600/30 transition-colors disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Generate Invite</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
