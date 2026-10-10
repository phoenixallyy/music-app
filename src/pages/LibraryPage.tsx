import React, { useState, useMemo } from 'react';
import { Song, Playlist } from '../types';
import { SongRow } from '../components/SongRow';
import { api } from '../services/api';
import {
  Library,
  Upload,
  Search,
  ArrowUpDown,
  HardDrive,
  Trash2,
  Edit3,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';

interface LibraryPageProps {
  songs: Song[];
  playlists: Playlist[];
  onOpenUpload: () => void;
  onRefresh: () => void;
  onAddToPlaylist?: (playlistId: string, songId: string) => void;
}

type SortField = 'recent' | 'title' | 'artist' | 'duration';

export const LibraryPage: React.FC<LibraryPageProps> = ({
  songs,
  playlists,
  onOpenUpload,
  onRefresh,
  onAddToPlaylist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('recent');

  // Edit Song modal state
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirmation modal state
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate total storage
  const totalSizeBytes = useMemo(() => {
    return songs.reduce((acc, s) => acc + (s.fileSize || 0), 0);
  }, [songs]);

  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  // Filter and Sort
  const processedSongs = useMemo(() => {
    let list = songs.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sortField === 'title') return a.title.localeCompare(b.title);
      if (sortField === 'artist') return a.artist.localeCompare(b.artist);
      if (sortField === 'duration') return b.duration - a.duration;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [songs, searchQuery, sortField]);

  const handleStartEdit = (song: Song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditAlbum(song.album);
    setEditGenre(song.genre);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;

    setIsSavingEdit(true);
    try {
      await api.updateSong(editingSong.id, {
        title: editTitle.trim(),
        artist: editArtist.trim(),
        album: editAlbum.trim(),
        genre: editGenre.trim(),
      });
      setEditingSong(null);
      onRefresh();
    } catch (err) {
      alert(`Update failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSong) return;
    setIsDeleting(true);
    try {
      await api.deleteSong(deletingSong.id);
      setDeletingSong(null);
      onRefresh();
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Find playlists referencing deleting song
  const referencingPlaylists = deletingSong
    ? playlists.filter((pl) => pl.trackIds.includes(deletingSong.id))
    : [];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Library className="w-3.5 h-3.5" />
            <span>Vault Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Music Library
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload, inspect, and organize all original audio master tracks
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Audio File</span>
        </button>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[#13131e] border border-white/5">
          <p className="text-slate-400">Total Vault Tracks</p>
          <p className="text-lg font-bold text-white mt-1 tabular-nums">{songs.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#13131e] border border-white/5">
          <p className="text-slate-400">Audio Storage Used</p>
          <p className="text-lg font-bold text-white mt-1 tabular-nums">{totalSizeMB} MB</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#13131e] border border-white/5">
          <p className="text-slate-400">Playlists Linked</p>
          <p className="text-lg font-bold text-white mt-1 tabular-nums">{playlists.length}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[#13131e] border border-white/5">
          <p className="text-slate-400">Streaming Access</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">Protected Range (206)</p>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library..."
            className="w-full bg-[#13131e] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
          <span className="text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort:
          </span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="bg-[#13131e] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="recent">Recently Added</option>
            <option value="title">Title (A-Z)</option>
            <option value="artist">Artist (A-Z)</option>
            <option value="duration">Longest Track</option>
          </select>
        </div>
      </div>

      {/* Tracks Table */}
      {processedSongs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#12121b] border border-white/5 text-center text-xs text-slate-400">
          <p>No audio files found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-[#12121b] border border-white/[0.05] rounded-2xl p-1 divide-y divide-white/[0.04]">
          {processedSongs.map((song, idx) => (
            <SongRow
              key={song.id}
              song={song}
              index={idx}
              allSongs={processedSongs}
              playlists={playlists}
              onAddToPlaylist={onAddToPlaylist}
              onEditSong={handleStartEdit}
              onDeleteSong={(s) => setDeletingSong(s)}
            />
          ))}
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#13131e] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                Edit Metadata
              </h3>
              <button onClick={() => setEditingSong(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Track Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Artist</label>
                <input
                  type="text"
                  required
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Album</label>
                <input
                  type="text"
                  value={editAlbum}
                  onChange={(e) => setEditAlbum(e.target.value)}
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Genre</label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
                  className="px-4 py-2 font-semibold text-slate-300 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-1.5"
                >
                  {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Song Confirmation Modal */}
      {deletingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#13131e] border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Audio Track?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to permanently delete{' '}
                  <span className="text-white font-semibold">{deletingSong.title}</span>?
                </p>
              </div>
            </div>

            {referencingPlaylists.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                <p className="font-semibold">Notice: Track is in {referencingPlaylists.length} playlist(s):</p>
                <ul className="list-disc list-inside mt-1 text-[11px] text-amber-300">
                  {referencingPlaylists.map((p) => (
                    <li key={p.id} className="truncate">{p.name}</li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] text-amber-400">
                  Deleting will remove this track and audio file from all referenced playlists.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-white/[0.06] text-xs">
              <button
                type="button"
                onClick={() => setDeletingSong(null)}
                className="px-4 py-2 font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
