import React, { useState } from 'react';
import { api } from '../services/api';
import { Playlist, FriendUser } from '../types';
import { X, FolderPlus, CheckCircle2, AlertCircle, Loader2, Globe, Lock } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (playlist: Playlist) => void;
  playlistToEdit?: Playlist | null;
  friends?: FriendUser[];
}

const PRESETS = [
  { name: 'Curated Vibes', url: '/src/assets/images/art_curated_vibes_1791621255690.jpg' },
  { name: 'Midnight Echoes', url: '/src/assets/images/art_midnight_echoes_1791621274995.jpg' },
  { name: 'Neon Horizon', url: '/src/assets/images/art_neon_horizon_1791621288838.jpg' },
];

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  playlistToEdit,
  friends = [],
}) => {
  const [name, setName] = useState(playlistToEdit?.name || '');
  const [description, setDescription] = useState(playlistToEdit?.description || '');
  const [artworkUrl, setArtworkUrl] = useState(playlistToEdit?.artworkUrl || PRESETS[0].url);
  const [isPublicToFriends, setIsPublicToFriends] = useState(
    playlistToEdit ? playlistToEdit.isPublicToFriends : true
  );
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>(
    playlistToEdit?.sharedWithUserIds || []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Playlist name is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (playlistToEdit) {
        const res = await api.updatePlaylist(playlistToEdit.id, {
          name: name.trim(),
          description: description.trim(),
          artworkUrl,
          isPublicToFriends,
          sharedWithUserIds,
        });
        onCreated(res.playlist);
      } else {
        const res = await api.createPlaylist({
          name: name.trim(),
          description: description.trim(),
          artworkUrl,
          isPublicToFriends,
          sharedWithUserIds,
        });
        onCreated(res.playlist);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFriendShare = (userId: string) => {
    setSharedWithUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#13131e] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {playlistToEdit ? 'Edit Playlist' : 'Create Playlist'}
              </h2>
              <p className="text-xs text-slate-400">Curate tracks for yourself and friends</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Playlist Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deep Focus Synth"
              className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A few words about the vibe..."
              className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Artwork Preset */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">Artwork Theme</label>
            <div className="flex items-center gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setArtworkUrl(preset.url)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    artworkUrl === preset.url
                      ? 'border-purple-500 scale-105 shadow-md shadow-purple-600/30'
                      : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isPublicToFriends ? (
                <Globe className="w-4 h-4 text-cyan-400" />
              ) : (
                <Lock className="w-4 h-4 text-purple-400" />
              )}
              <div>
                <p className="font-semibold text-white">
                  {isPublicToFriends ? 'Visible to All Friends' : 'Private to Owner'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isPublicToFriends
                    ? 'Invited listeners can stream these tracks'
                    : 'Only you can stream this playlist'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPublicToFriends}
              onChange={(e) => setIsPublicToFriends(e.target.checked)}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
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
              disabled={isLoading || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-600/30 transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{playlistToEdit ? 'Save Changes' : 'Create'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
