import React, { useState, useEffect } from 'react';
import { Playlist, Song } from '../types';
import { api } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { SongRow } from '../components/SongRow';
import {
  Play,
  Shuffle,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Music,
  Clock,
  ArrowUp,
  ArrowDown,
  Globe,
  Lock,
  X,
  Search,
} from 'lucide-react';

interface PlaylistPageProps {
  playlistId: string;
  onEditPlaylist: (playlist: Playlist) => void;
  onDeleted: () => void;
  allLibrarySongs: Song[];
}

function formatTotalDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) return `${hrs} hr ${remMins} min`;
  return `${mins} min`;
}

export const PlaylistPage: React.FC<PlaylistPageProps> = ({
  playlistId,
  onEditPlaylist,
  onDeleted,
  allLibrarySongs,
}) => {
  const { isOwner } = useAuth();
  const { playSong } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add tracks modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getPlaylist(playlistId);
      setPlaylist(res.playlist);
      setTracks(res.tracks);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load playlist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [playlistId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading playlist details...
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="p-12 text-center text-xs text-rose-400">
        {error || 'Playlist not found'}
      </div>
    );
  }

  const totalDurationSeconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playSong(tracks[0], tracks);
    }
  };

  const handleShuffleAll = () => {
    if (tracks.length > 0) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled);
    }
  };

  const handleAddTrack = async (songId: string) => {
    try {
      await api.addTrackToPlaylist(playlist.id, songId);
      await loadData();
    } catch (err) {
      alert(`Could not add track: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleRemoveTrack = async (songId: string) => {
    try {
      await api.removeTrackFromPlaylist(playlist.id, songId);
      await loadData();
    } catch (err) {
      alert(`Could not remove track: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleMoveTrack = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tracks.length) return;

    const newTracks = [...tracks];
    const [moved] = newTracks.splice(index, 1);
    newTracks.splice(targetIndex, 0, moved);

    setTracks(newTracks);
    const newTrackIds = newTracks.map((t) => t.id);

    try {
      await api.reorderPlaylistTracks(playlist.id, newTrackIds);
    } catch (err) {
      console.warn('Reorder failed:', err);
      loadData();
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm(`Are you sure you want to delete "${playlist.name}"? Original audio files will remain safe in your library.`)) {
      return;
    }
    try {
      await api.deletePlaylist(playlist.id);
      onDeleted();
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDuplicate = async () => {
    try {
      await api.duplicatePlaylist(playlist.id);
      alert('Playlist duplicated successfully.');
    } catch (err) {
      alert(`Duplicate failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Filter available songs for Add Modal
  const availableToAdd = allLibrarySongs.filter(
    (s) =>
      !tracks.some((t) => t.id === s.id) &&
      (!addSearch ||
        s.title.toLowerCase().includes(addSearch.toLowerCase()) ||
        s.artist.toLowerCase().includes(addSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-32">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-purple-950/40 via-[#12121c]/60 to-transparent border-b border-white/[0.04] flex flex-col md:flex-row items-start md:items-end gap-6">
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shrink-0 shadow-2xl shadow-black/80 bg-black/50 border border-white/10">
          {playlist.artworkUrl ? (
            <img
              src={playlist.artworkUrl}
              alt={playlist.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-950/50 text-purple-300">
              <Music className="w-16 h-16 opacity-40" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1">
            {playlist.isPublicToFriends ? (
              <span className="flex items-center gap-1 text-cyan-400">
                <Globe className="w-3.5 h-3.5" />
                Shared with Friends
              </span>
            ) : (
              <span className="flex items-center gap-1 text-purple-400">
                <Lock className="w-3.5 h-3.5" />
                Private Playlist
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-balance">
            {playlist.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
            {playlist.description || 'No description provided.'}
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-3">
            <span>{tracks.length} tracks</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTotalDuration(totalDurationSeconds)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/30 transition-transform active:scale-95 disabled:opacity-50"
              title="Play All"
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </button>

            <button
              onClick={handleShuffleAll}
              disabled={tracks.length === 0}
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
              title="Shuffle All"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {isOwner && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Add Songs</span>
              </button>
            )}
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => onEditPlaylist(playlist)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                title="Edit Playlist Details"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDuplicate}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                title="Duplicate Playlist"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeletePlaylist}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tracks List */}
        {tracks.length === 0 ? (
          <div className="p-16 rounded-2xl bg-[#12121b] border border-white/5 text-center text-xs text-slate-400">
            <Music className="w-10 h-10 mx-auto text-purple-400 opacity-40 mb-2" />
            <p className="font-semibold text-white">This playlist has no songs yet.</p>
            {isOwner && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg"
              >
                Add songs from library
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#12121b] border border-white/[0.05] rounded-2xl p-1 divide-y divide-white/[0.04]">
            {tracks.map((song, idx) => (
              <div key={song.id} className="relative group/row flex items-center">
                {/* Reorder controls for owner */}
                {isOwner && (
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity pl-2 pr-1">
                    <button
                      onClick={() => handleMoveTrack(idx, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveTrack(idx, 'down')}
                      disabled={idx === tracks.length - 1}
                      className="p-0.5 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <SongRow
                    song={song}
                    index={idx}
                    allSongs={tracks}
                    currentPlaylistId={playlist.id}
                    onRemoveFromPlaylist={(_, sId) => handleRemoveTrack(sId)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Songs Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#13131e] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Add Songs to "{playlist.name}"
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative my-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="Search songs to add..."
                className="w-full bg-[#1c1c28] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {availableToAdd.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  All library tracks are already in this playlist, or none matched.
                </div>
              ) : (
                availableToAdd.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-black/40">
                        <img src={song.artworkUrl} alt={song.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{song.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddTrack(song.id)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-semibold shrink-0"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex justify-end">
              <button
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-white/10 rounded-lg hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
