import React, { useState, useEffect } from 'react';
import { Invitation, FriendUser, Playlist } from '../types';
import { api } from '../services/api';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Clock,
  ShieldAlert,
  Edit2,
  X,
  Loader2,
  Link2,
} from 'lucide-react';

interface FriendsPageProps {
  playlists: Playlist[];
  onOpenInvite: () => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({ playlists, onOpenInvite }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit friend permissions modal
  const [editingFriend, setEditingFriend] = useState<FriendUser | null>(null);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invRes, friendsRes] = await Promise.all([
        api.getInvitations(),
        api.getFriends(),
      ]);
      setInvitations(invRes.invitations);
      setFriends(friendsRes.friends);
    } catch (err) {
      console.warn('Failed to load friends/invitations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = (token: string, id: string) => {
    const url = `${window.location.origin}?invite=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeInvite = async (id: string) => {
    if (!confirm('Revoke this invitation? The recipient will no longer be able to use this link.')) return;
    try {
      await api.revokeInvitation(id);
      loadData();
    } catch (err) {
      alert(`Could not revoke: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleRevokeFriend = async (userId: string, email: string) => {
    if (!confirm(`Revoke streaming access for "${email}"? Their account will be removed and audio access cut immediately.`)) return;
    try {
      await api.revokeFriend(userId);
      loadData();
    } catch (err) {
      alert(`Could not revoke friend: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleOpenEditPermissions = (friend: FriendUser) => {
    setEditingFriend(friend);
    setSelectedPlaylistIds(friend.accessiblePlaylists.map((p) => p.id));
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFriend) return;
    setIsSavingPermissions(true);
    try {
      await api.updateFriendPermissions(editingFriend.id, selectedPlaylistIds);
      setEditingFriend(null);
      loadData();
    } catch (err) {
      alert(`Update failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSavingPermissions(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-10 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Access Control & Circles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Friends & Sharing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grant private streaming permissions to friends without public downloads or leakable URLs
          </p>
        </div>

        <button
          onClick={onOpenInvite}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New Friend</span>
        </button>
      </div>

      {/* SECTION 1: Registered Friends */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Active Listeners ({friends.length})</span>
        </h2>

        {friends.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#12121b] border border-white/5 text-center text-xs text-slate-400">
            <p>No friends have registered yet. Generate an invite link to share music.</p>
          </div>
        ) : (
          <div className="bg-[#12121b] border border-white/[0.05] rounded-2xl overflow-hidden divide-y divide-white/[0.04] text-xs">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                    {friend.displayName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{friend.displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{friend.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                  {friend.accessiblePlaylists.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic">No shared playlists</span>
                  ) : (
                    friend.accessiblePlaylists.map((pl) => (
                      <span
                        key={pl.id}
                        className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/20 text-purple-300 text-[11px]"
                      >
                        {pl.name}
                      </span>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleOpenEditPermissions(friend)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
                    title="Edit Playlist Permissions"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRevokeFriend(friend.id, friend.email)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Revoke Friend Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Pending Invitations */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Pending Invitations ({invitations.length})</span>
        </h2>

        {invitations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#12121b] border border-white/5 text-center text-xs text-slate-400">
            <p>No active invitations. Click "Invite New Friend" above to create one.</p>
          </div>
        ) : (
          <div className="bg-[#12121b] border border-white/[0.05] rounded-2xl overflow-hidden divide-y divide-white/[0.04] text-xs">
            {invitations.map((inv) => {
              const isExpired = new Date(inv.expiresAt).getTime() < Date.now();
              const isPending = inv.status === 'pending' && !isExpired;

              return (
                <div
                  key={inv.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{inv.email}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        inv.status === 'accepted'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : inv.status === 'revoked'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isExpired
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {isExpired && inv.status === 'pending' ? 'Expired' : inv.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isPending && (
                      <button
                        onClick={() => handleCopyLink(inv.token, inv.id)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 flex items-center gap-1.5 transition-colors"
                      >
                        {copiedId === inv.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    )}

                    {inv.status === 'pending' && (
                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Revoke Invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Friend Permissions Modal */}
      {editingFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#13131e] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white">
                Edit Permissions: {editingFriend.displayName}
              </h3>
              <button onClick={() => setEditingFriend(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-300">
                Select which playlists {editingFriend.displayName} is authorized to stream:
              </p>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {playlists.map((pl) => {
                  const isChecked = selectedPlaylistIds.includes(pl.id);
                  return (
                    <label
                      key={pl.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedPlaylistIds((prev) =>
                            isChecked ? prev.filter((id) => id !== pl.id) : [...prev, pl.id]
                          );
                        }}
                        className="w-4 h-4 accent-purple-600 rounded"
                      />
                      <span className="font-medium text-slate-200 truncate">{pl.name}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setEditingFriend(null)}
                  className="px-4 py-2 font-semibold text-slate-300 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPermissions}
                  className="px-5 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-1.5"
                >
                  {isSavingPermissions && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Permissions</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
