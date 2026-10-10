import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Song, Playlist, FriendUser, Invitation } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/api';
import { isFirebaseConfigured, getMissingFirebaseConfig } from '../services/firebase';
import {
  LayoutDashboard,
  Music,
  Upload,
  ListMusic,
  Users,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit3,
  Plus,
  Search,
  ArrowUpDown,
  HardDrive,
  Shield,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageIcon,
  Loader2,
  Volume2,
  Share2,
  Disc3,
  Clock,
  FolderPlus,
  UserCheck,
  ExternalLink,
  RefreshCw,
  Copy,
  ChevronRight,
  FileAudio,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface OwnerDashboardProps {
  initialSection?: 'overview' | 'music' | 'upload' | 'playlists' | 'friends' | 'settings';
  songs: Song[];
  playlists: Playlist[];
  onOpenUploadModal: () => void;
  onOpenCreatePlaylist: () => void;
  onOpenInviteModal: () => void;
  onRefreshData: () => Promise<void>;
  onNavigatePlaylist: (id: string) => void;
  onAddToPlaylist: (playlistId: string, songId: string) => Promise<void>;
}

interface QueuedUploadFile {
  id: string;
  file: File;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  artworkUrl: string;
  customArtworkFile?: File;
  customArtworkPreview?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  progress: number;
}

const PRESET_ARTWORKS = [
  { name: 'Curated Vibes', url: '/src/assets/images/art_curated_vibes_1791621255690.jpg' },
  { name: 'Midnight Echoes', url: '/src/assets/images/art_midnight_echoes_1791621274995.jpg' },
  { name: 'Neon Horizon', url: '/src/assets/images/art_neon_horizon_1791621288838.jpg' },
];

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  initialSection = 'overview',
  songs,
  playlists,
  onOpenUploadModal,
  onOpenCreatePlaylist,
  onOpenInviteModal,
  onRefreshData,
  onNavigatePlaylist,
  onAddToPlaylist,
}) => {
  const { user } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  const [activeSection, setActiveSection] = useState<'overview' | 'music' | 'upload' | 'playlists' | 'friends' | 'settings'>(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Notifications inside dashboard
  const [dashboardNotice, setDashboardNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setDashboardNotice({ type, message });
    setTimeout(() => setDashboardNotice(null), 4000);
  };

  // ----------------------------------------------------
  // SECTION: MY MUSIC STATE & FILTERS
  // ----------------------------------------------------
  const [musicSearch, setMusicSearch] = useState('');
  const [musicSort, setMusicSort] = useState<'recent' | 'title' | 'artist' | 'duration' | 'size'>('recent');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editArtworkUrl, setEditArtworkUrl] = useState('');

  // Add to playlist modal state
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(null);

  // Filter and sort songs
  const filteredSongs = useMemo(() => {
    let result = songs.filter((s) => {
      const q = musicSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q)
      );
    });

    result = [...result].sort((a, b) => {
      if (musicSort === 'title') return a.title.localeCompare(b.title);
      if (musicSort === 'artist') return a.artist.localeCompare(b.artist);
      if (musicSort === 'duration') return b.duration - a.duration;
      if (musicSort === 'size') return (b.fileSize || 0) - (a.fileSize || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [songs, musicSearch, musicSort]);

  // Total library storage
  const totalStorageBytes = useMemo(() => {
    return songs.reduce((acc, s) => acc + (s.fileSize || 0), 0);
  }, [songs]);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);

  // ----------------------------------------------------
  // SECTION: UPLOAD QUEUE & DRAG-AND-DROP
  // ----------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const artworkInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadQueue, setUploadQueue] = useState<QueuedUploadFile[]>([]);
  const [activeQueueIdForArtwork, setActiveQueueIdForArtwork] = useState<string | null>(null);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [uploadSuccessSummary, setUploadSuccessSummary] = useState<string | null>(null);

  const handleQueueFiles = (files: FileList | File[]) => {
    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'];
    const newItems: QueuedUploadFile[] = [];

    Array.from(files).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValid = validExtensions.includes(ext) || file.type.startsWith('audio/');

      if (!isValid) {
        showNotice(`Skipped ${file.name}: only MP3, M4A, AAC, WAV, FLAC, and OGG audio files are supported.`, 'error');
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        showNotice(`Skipped ${file.name}: file exceeds 100MB maximum size limit.`, 'error');
        return;
      }

      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      // Estimate or read duration
      let detectedDuration = 180;
      try {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setUploadQueue((prev) =>
              prev.map((item) => (item.file === file ? { ...item, duration: Math.round(audio.duration) } : item))
            );
          }
        };
      } catch {
        // fallback
      }

      newItems.push({
        id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        title: baseName,
        artist: user?.displayName || 'Vault Master',
        album: 'Vault Singles',
        genre: 'Electronic',
        duration: detectedDuration,
        artworkUrl: PRESET_ARTWORKS[0].url,
        status: 'pending',
        progress: 0,
      });
    });

    if (newItems.length > 0) {
      setUploadQueue((prev) => [...prev, ...newItems]);
      setUploadSuccessSummary(null);
    }
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleQueueFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveQueueItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQueueItem = (id: string, updates: Partial<QueuedUploadFile>) => {
    setUploadQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Custom artwork file selection for a queued track
  const handleCustomArtworkSelected = (file: File, queueId: string) => {
    if (!file.type.startsWith('image/')) {
      showNotice('Please select an image file (JPEG, PNG, WEBP) for album artwork.', 'error');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    handleUpdateQueueItem(queueId, {
      customArtworkFile: file,
      customArtworkPreview: previewUrl,
    });
  };

  // Process upload for all queued items
  const handleProcessUploadQueue = async () => {
    if (uploadQueue.length === 0 || isUploadingBatch) return;

    setIsUploadingBatch(true);
    setBatchProgress(5);
    let successCount = 0;

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status === 'completed') {
        successCount++;
        continue;
      }

      handleUpdateQueueItem(item.id, { status: 'uploading', progress: 30 });

      try {
        let finalArtworkUrl = item.artworkUrl;

        // If custom artwork file provided, upload artwork first
        if (item.customArtworkFile) {
          try {
            const artFormData = new FormData();
            artFormData.append('artwork', item.customArtworkFile);
            const artRes = await api.uploadArtwork(artFormData);
            finalArtworkUrl = artRes.artworkUrl;
          } catch (artErr) {
            console.warn('Custom artwork upload notice, using preset fallback:', artErr);
          }
        }

        // Upload audio track with metadata
        const songFormData = new FormData();
        songFormData.append('audio', item.file);
        songFormData.append('title', item.title || item.file.name);
        songFormData.append('artist', item.artist || 'Unknown Artist');
        songFormData.append('album', item.album || 'Vault Singles');
        songFormData.append('genre', item.genre || 'Electronic');
        songFormData.append('artworkUrl', finalArtworkUrl);
        songFormData.append('duration', String(item.duration));

        handleUpdateQueueItem(item.id, { progress: 75 });
        await api.uploadSong(songFormData);

        handleUpdateQueueItem(item.id, { status: 'completed', progress: 100 });
        successCount++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        handleUpdateQueueItem(item.id, { status: 'error', errorMessage: errorMsg, progress: 0 });
      }

      setBatchProgress(Math.round(((i + 1) / uploadQueue.length) * 100));
    }

    setIsUploadingBatch(false);
    await onRefreshData();

    if (successCount === uploadQueue.length) {
      setUploadSuccessSummary(`All ${successCount} song(s) successfully uploaded and saved to your persistent vault library!`);
      showNotice(`${successCount} track(s) added to your vault!`, 'success');
      setTimeout(() => {
        setUploadQueue([]);
      }, 2500);
    } else {
      showNotice(`${successCount} of ${uploadQueue.length} song(s) uploaded successfully.`, 'success');
    }
  };

  // ----------------------------------------------------
  // SECTION: PLAYLIST ACTIONS
  // ----------------------------------------------------
  const [selectedPlaylistForManage, setSelectedPlaylistForManage] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Song[]>([]);
  const [isManagingPlaylistLoading, setIsManagingPlaylistLoading] = useState(false);

  const handleOpenPlaylistManager = async (pl: Playlist) => {
    setSelectedPlaylistForManage(pl);
    setIsManagingPlaylistLoading(true);
    try {
      const res = await api.getPlaylist(pl.id);
      setPlaylistTracks(res.tracks || []);
    } catch {
      // Filter from existing songs
      const tracks = pl.trackIds
        .map((tid) => songs.find((s) => s.id === tid))
        .filter((s): s is Song => Boolean(s));
      setPlaylistTracks(tracks);
    } finally {
      setIsManagingPlaylistLoading(false);
    }
  };

  const handleRemoveTrackFromPlaylist = async (playlistId: string, songId: string) => {
    try {
      await api.removeTrackFromPlaylist(playlistId, songId);
      setPlaylistTracks((prev) => prev.filter((t) => t.id !== songId));
      await onRefreshData();
      showNotice('Track removed from playlist without deleting the file.', 'success');
    } catch (err) {
      showNotice(`Failed to remove track: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleMoveTrackOrder = async (index: number, direction: 'up' | 'down') => {
    if (!selectedPlaylistForManage) return;
    const newTracks = [...playlistTracks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTracks.length) return;

    const [moved] = newTracks.splice(index, 1);
    newTracks.splice(targetIndex, 0, moved);
    setPlaylistTracks(newTracks);

    try {
      const newIds = newTracks.map((t) => t.id);
      await api.reorderPlaylistTracks(selectedPlaylistForManage.id, newIds);
      await onRefreshData();
    } catch (err) {
      showNotice(`Could not reorder tracks: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  // ----------------------------------------------------
  // SECTION: FRIENDS & SHARING STATE
  // ----------------------------------------------------
  const [friendsList, setFriendsList] = useState<FriendUser[]>([]);
  const [invitationsList, setInvitationsList] = useState<Invitation[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  const loadFriendsData = async () => {
    setIsLoadingFriends(true);
    try {
      const [friendsRes, invitesRes] = await Promise.all([
        api.getFriends().catch(() => ({ friends: [] })),
        api.getInvitations().catch(() => ({ invitations: [] })),
      ]);
      setFriendsList(friendsRes.friends || []);
      setInvitationsList(invitesRes.invitations || []);
    } catch {
      // Ignore
    } finally {
      setIsLoadingFriends(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'friends' || activeSection === 'overview') {
      loadFriendsData();
    }
  }, [activeSection]);

  const handleRevokeInvitation = async (id: string) => {
    try {
      await api.revokeInvitation(id);
      setInvitationsList((prev) => prev.filter((inv) => inv.id !== id));
      showNotice('Invitation link revoked.', 'success');
    } catch (err) {
      showNotice(`Could not revoke: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleCopyInviteLink = (token: string) => {
    const url = `${window.location.origin}/?invite=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(url);
    showNotice('Invite link copied to clipboard!', 'success');
  };

  // ----------------------------------------------------
  // SECTION: SONG EDIT & DELETE CONFIRMATION
  // ----------------------------------------------------
  const handleOpenEdit = (song: Song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditAlbum(song.album);
    setEditGenre(song.genre);
    setEditArtworkUrl(song.artworkUrl);
  };

  const handleSaveSongEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    setIsSavingEdit(true);
    try {
      await api.updateSong(editingSong.id, {
        title: editTitle.trim(),
        artist: editArtist.trim(),
        album: editAlbum.trim(),
        genre: editGenre.trim(),
        artworkUrl: editArtworkUrl.trim() || undefined,
      });
      setEditingSong(null);
      await onRefreshData();
      showNotice('Song metadata updated successfully!', 'success');
    } catch (err) {
      showNotice(`Update failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDeleteSong = async () => {
    if (!deletingSong) return;
    setIsDeletingLoading(true);
    try {
      await api.deleteSong(deletingSong.id);
      setDeletingSong(null);
      await onRefreshData();
      showNotice(`"${deletingSong.title}" and its storage file were permanently deleted.`, 'success');
    } catch (err) {
      showNotice(`Delete failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsDeletingLoading(false);
    }
  };

  // Format helpers
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto pb-36 animate-in fade-in duration-200">
      {/* Toast Notice */}
      {dashboardNotice && (
        <div className="fixed top-16 right-6 z-50 animate-in slide-in-from-top duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-semibold backdrop-blur-md ${
              dashboardNotice.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/40'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/40'
            }`}
          >
            {dashboardNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{dashboardNotice.message}</span>
          </div>
        </div>
      )}

      {/* DASHBOARD TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Vault Administrator Control Center</span>
            {user?.isDemo && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono lowercase">
                demo mode
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Owner Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your audio masters, organize curated playlists, upload lossless music, and monitor access.
          </p>
        </div>

        {/* Global Primary Action: Upload Songs Button */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveSection('upload')}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Songs</span>
          </button>

          <button
            onClick={onRefreshData}
            title="Refresh database state"
            className="p-2.5 text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS BAR (6 Required Sections) */}
      <div className="flex items-center gap-1 sm:gap-2 p-1.5 bg-[#12121c] border border-white/[0.08] rounded-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'overview'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveSection('music')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'music'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>My Music</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {songs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'upload'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Songs</span>
          {uploadQueue.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-mono text-[10px]">
              {uploadQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'playlists'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>My Playlists</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {playlists.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('friends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'friends'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Friends & Sharing</span>
        </button>

        <button
          onClick={() => setActiveSection('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSection === 'settings'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 1. OVERVIEW SECTION                                  */}
      {/* ==================================================== */}
      {activeSection === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#12121e] border border-white/[0.06] hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between text-purple-400 mb-2">
                <Music className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  Tracks
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{songs.length}</p>
              <p className="text-xs text-slate-400 mt-1">Master Audio Files</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#12121e] border border-white/[0.06] hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center justify-between text-indigo-400 mb-2">
                <HardDrive className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Storage
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{totalStorageMB} MB</p>
              <p className="text-xs text-slate-400 mt-1">Persistent Disk Footprint</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#12121e] border border-white/[0.06] hover:border-violet-500/30 transition-colors">
              <div className="flex items-center justify-between text-violet-400 mb-2">
                <ListMusic className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                  Collections
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{playlists.length}</p>
              <p className="text-xs text-slate-400 mt-1">Active Playlists</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#12121e] border border-white/[0.06] hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Network
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{friendsList.length}</p>
              <p className="text-xs text-slate-400 mt-1">Authorized Listeners</p>
            </div>
          </div>

          {/* Prominent Quick Actions Panel */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#141424] to-[#12121e] border border-purple-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Audio Studio Actions</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  Add new songs to your private lossless vault
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Support lossless audio files including MP3, M4A, AAC, WAV, FLAC, and OGG. Files are stored securely on persistent disk storage with authorized HTTP stream range delivery.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveSection('upload')}
                  className="px-5 py-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Songs Now</span>
                </button>
                <button
                  onClick={onOpenCreatePlaylist}
                  className="px-4 py-3 text-xs font-semibold text-slate-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Playlist</span>
                </button>
                <button
                  onClick={onOpenInviteModal}
                  className="px-4 py-3 text-xs font-semibold text-slate-200 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Invite Friends</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Uploads & Playback Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Recently Uploaded Songs */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <div>
                  <h3 className="text-base font-bold text-white">Recently Uploaded Tracks</h3>
                  <p className="text-xs text-slate-400">Latest additions to your personal collection</p>
                </div>
                <button
                  onClick={() => setActiveSection('music')}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({songs.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {songs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#12121e] border border-dashed border-white/10 text-center space-y-3">
                  <Music className="w-10 h-10 text-purple-400/50 mx-auto" />
                  <p className="text-sm font-semibold text-white">No tracks uploaded yet</p>
                  <p className="text-xs text-slate-400">Upload your favorite audio files to begin streaming.</p>
                  <button
                    onClick={() => setActiveSection('upload')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg cursor-pointer"
                  >
                    Upload First Track
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {songs.slice(0, 5).map((song) => {
                    const isCurrent = currentSong?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        className={`p-3 rounded-xl bg-[#12121e] border transition-all flex items-center justify-between gap-3 group ${
                          isCurrent
                            ? 'border-purple-500/40 bg-purple-950/20'
                            : 'border-white/[0.04] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => (isCurrent ? togglePlay() : playSong(song, songs))}
                            className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0 group/img cursor-pointer"
                          >
                            <img
                              src={song.artworkUrl}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                              {isCurrent && isPlaying ? (
                                <Pause className="w-4 h-4 text-white" />
                              ) : (
                                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                              )}
                            </div>
                          </button>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {song.artist} · <span className="text-slate-500">{song.album}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400 font-mono">
                          <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] uppercase">
                            {song.genre}
                          </span>
                          <span>{formatDuration(song.duration)}</span>
                          <button
                            onClick={() => setSongToAddToPlaylist(song)}
                            title="Add to playlist"
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Playlists & Security Overview */}
            <div className="lg:col-span-4 space-y-6">
              {/* Playlists card */}
              <div className="p-5 rounded-2xl bg-[#12121e] border border-white/[0.06] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">Your Playlists</h4>
                  <button
                    onClick={() => setActiveSection('playlists')}
                    className="text-xs text-purple-400 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>

                {playlists.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No playlists created yet.</p>
                ) : (
                  <div className="space-y-2">
                    {playlists.slice(0, 3).map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => onNavigatePlaylist(pl.id)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <img
                          src={pl.artworkUrl}
                          alt={pl.name}
                          className="w-10 h-10 rounded-lg object-cover border border-white/5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                          <p className="text-[11px] text-slate-400">{pl.trackIds.length} tracks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security & Storage Status */}
              <div className="p-5 rounded-2xl bg-[#12121e] border border-white/[0.06] space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Vault Storage Engine</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-slate-400">Backend Provider</span>
                    <span className="font-semibold text-emerald-400">Self-Hosted Express & Disk</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-slate-400">Audio Directory</span>
                    <span className="font-mono text-[11px] text-slate-300">data/audio</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-slate-400">Streaming Authorization</span>
                    <span className="text-purple-300 font-semibold">JWT Bearer / HTTP Range</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Firebase Cloud Status</span>
                    <span className={isFirebaseConfigured() ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {isFirebaseConfigured() ? 'Connected' : 'Optional / Standalone'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. MY MUSIC SECTION (Full Library + Clearly Visible Upload Button) */}
      {/* ==================================================== */}
      {activeSection === 'music' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header with clearly visible Upload Songs button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                <Music className="w-3.5 h-3.5" />
                <span>Audio Vault Library</span>
              </div>
              <h2 className="text-2xl font-bold text-white">My Music</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {songs.length} audio masters · {totalStorageMB} MB total storage
              </p>
            </div>

            {/* Clearly visible Upload Songs button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSection('upload')}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Songs</span>
              </button>
            </div>
          </div>

          {/* Search and Sort Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={musicSearch}
                onChange={(e) => setMusicSearch(e.target.value)}
                placeholder="Search by title, artist, album, or genre..."
                className="w-full bg-[#12121e] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              {musicSearch && (
                <button
                  onClick={() => setMusicSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={musicSort}
                onChange={(e) => setMusicSort(e.target.value as any)}
                className="bg-[#12121e] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="recent">Sort by Date Added (Newest)</option>
                <option value="title">Sort by Title (A - Z)</option>
                <option value="artist">Sort by Artist (A - Z)</option>
                <option value="duration">Sort by Duration (Longest)</option>
                <option value="size">Sort by File Size (Largest)</option>
              </select>
            </div>
          </div>

          {/* Songs List Table */}
          {filteredSongs.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-[#12121e] border border-dashed border-white/10 space-y-4">
              <Music className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No songs found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {musicSearch
                  ? 'No songs match your search query. Try clearing the filter.'
                  : 'Your vault library is currently empty. Upload real audio files from your computer to get started.'}
              </p>
              <button
                onClick={() => setActiveSection('upload')}
                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Songs</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#12121e] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
              <div className="divide-y divide-white/[0.04]">
                {filteredSongs.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isTrackPlaying = isCurrent && isPlaying;
                  const ext = song.audioFileName.split('.').pop()?.toUpperCase() || 'AUDIO';

                  return (
                    <div
                      key={song.id}
                      className={`p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-colors group ${
                        isCurrent
                          ? 'bg-purple-950/20'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Left: Play button, artwork, title, artist */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <span className="w-5 text-center text-xs text-slate-500 font-mono hidden sm:inline-block">
                          {idx + 1}
                        </span>

                        <button
                          onClick={() => (isCurrent ? togglePlay() : playSong(song, filteredSongs))}
                          className="w-11 h-11 rounded-xl overflow-hidden relative shrink-0 shadow-md group/art cursor-pointer"
                        >
                          <img
                            src={song.artworkUrl}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                              isCurrent ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'
                            }`}
                          >
                            {isTrackPlaying ? (
                              <Pause className="w-5 h-5 text-purple-400" />
                            ) : (
                              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            )}
                          </div>
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-bold truncate ${
                              isCurrent ? 'text-purple-300' : 'text-white group-hover:text-purple-200'
                            }`}
                          >
                            {song.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {song.artist} <span className="text-slate-600">·</span> {song.album}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Badges & Info */}
                      <div className="hidden md:flex items-center gap-3 shrink-0 text-xs text-slate-400 font-mono">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]">
                          {song.genre}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] text-slate-400 border border-white/5">
                          {ext}
                        </span>
                        <span className="text-[11px] text-slate-500">{formatFileSize(song.fileSize)}</span>
                        <span>{formatDuration(song.duration)}</span>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSongToAddToPlaylist(song)}
                          title="Add to playlist"
                          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(song)}
                          title="Edit metadata"
                          className="p-2 text-slate-400 hover:text-purple-300 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSong(song)}
                          title="Delete from vault"
                          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. UPLOAD SONGS SECTION (Dedicated Full Upload Interface) */}
      {/* ==================================================== */}
      {activeSection === 'upload' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Audio Ingestion Engine</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Upload Songs to Vault</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag and drop audio files, edit track metadata, assign album art, and upload multiple songs.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 rounded-xl">
              <FileAudio className="w-4 h-4 text-purple-400" />
              <span>MP3 · M4A · AAC · WAV · FLAC · OGG (up to 100MB)</span>
            </div>
          </div>

          {/* Success summary if available */}
          {uploadSuccessSummary && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-200">Upload Complete!</h4>
                  <p className="text-xs text-emerald-300/80">{uploadSuccessSummary}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSection('music')}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                Go to My Music
              </button>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropFiles}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-purple-500/50 bg-[#12121e]/60 hover:bg-purple-950/10 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,audio/*"
              className="hidden"
              onChange={(e) => e.target.files && handleQueueFiles(e.target.files)}
            />

            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white text-center">
              Drop audio files here or <span className="text-purple-400 underline underline-offset-4">browse your computer</span>
            </h3>
            <p className="text-xs text-slate-400 text-center mt-1.5 max-w-md">
              Select one or multiple audio tracks. Supports lossless WAV, FLAC, high-quality MP3, M4A, AAC, and OGG up to 100MB per file.
            </p>
          </div>

          {/* Hidden file input for custom artwork replacement */}
          <input
            ref={artworkInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0] && activeQueueIdForArtwork) {
                handleCustomArtworkSelected(e.target.files[0], activeQueueIdForArtwork);
              }
            }}
          />

          {/* Queued Files Editor */}
          {uploadQueue.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Upload Queue</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono">
                      {uploadQueue.length} {uploadQueue.length === 1 ? 'track' : 'tracks'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Review metadata and artwork before uploading to persistent storage</p>
                </div>

                <button
                  onClick={() => setUploadQueue([])}
                  disabled={isUploadingBatch}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Clear Queue
                </button>
              </div>

              {/* Progress bar during batch upload */}
              {isUploadingBatch && (
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                  <div className="flex justify-between text-xs text-purple-200 font-mono">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <span>Ingesting audio master streams...</span>
                    </span>
                    <span>{batchProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${batchProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Individual Queued Track Cards */}
              <div className="space-y-4">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#12121e] border border-white/[0.08] space-y-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2 text-xs font-mono text-purple-300">
                        <FileAudio className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-white">{item.file.name}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        {item.duration > 0 && (
                          <>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-400">{formatDuration(item.duration)}</span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveQueueItem(item.id)}
                        disabled={isUploadingBatch}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Metadata fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Track Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateQueueItem(item.id, { title: e.target.value })}
                          className="w-full bg-[#181826] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Artist</label>
                        <input
                          type="text"
                          value={item.artist}
                          onChange={(e) => handleUpdateQueueItem(item.id, { artist: e.target.value })}
                          className="w-full bg-[#181826] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Album</label>
                        <input
                          type="text"
                          value={item.album}
                          onChange={(e) => handleUpdateQueueItem(item.id, { album: e.target.value })}
                          className="w-full bg-[#181826] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Genre</label>
                        <select
                          value={item.genre}
                          onChange={(e) => handleUpdateQueueItem(item.id, { genre: e.target.value })}
                          className="w-full bg-[#181826] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="Electronic">Electronic</option>
                          <option value="Ambient">Ambient</option>
                          <option value="Synthwave">Synthwave</option>
                          <option value="Lo-Fi">Lo-Fi</option>
                          <option value="House / Deep">House / Deep</option>
                          <option value="Soundtrack">Soundtrack</option>
                          <option value="Hip-Hop">Hip-Hop</option>
                          <option value="Rock">Rock</option>
                          <option value="Acoustic">Acoustic</option>
                        </select>
                      </div>
                    </div>

                    {/* Artwork selection & custom upload */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium">Artwork:</span>
                        {/* Preset options */}
                        {PRESET_ARTWORKS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() =>
                              handleUpdateQueueItem(item.id, {
                                artworkUrl: preset.url,
                                customArtworkFile: undefined,
                                customArtworkPreview: undefined,
                              })
                            }
                            className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              !item.customArtworkPreview && item.artworkUrl === preset.url
                                ? 'border-purple-500 scale-105 shadow-md shadow-purple-600/30'
                                : 'border-white/10 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}

                        {/* Custom uploaded artwork preview if set */}
                        {item.customArtworkPreview && (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-purple-500 scale-105 shadow-md shadow-purple-600/30">
                            <img
                              src={item.customArtworkPreview}
                              alt="Custom cover"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveQueueIdForArtwork(item.id);
                          artworkInputRef.current?.click();
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Upload Custom Cover Image</span>
                      </button>
                    </div>

                    {/* Status & Error */}
                    {item.errorMessage && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{item.errorMessage}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Start Batch Upload Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setUploadQueue([])}
                  disabled={isUploadingBatch}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleProcessUploadQueue}
                  disabled={isUploadingBatch}
                  className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                >
                  {isUploadingBatch ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingesting {uploadQueue.length} Tracks...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload All {uploadQueue.length} Tracks to Vault</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. MY PLAYLISTS SECTION                              */}
      {/* ==================================================== */}
      {activeSection === 'playlists' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                <ListMusic className="w-3.5 h-3.5" />
                <span>Audio Collections</span>
              </div>
              <h2 className="text-2xl font-bold text-white">My Playlists</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Curate tracks, manage running orders, and share authorized selections with friends.
              </p>
            </div>

            <button
              onClick={onOpenCreatePlaylist}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Playlist</span>
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-[#12121e] border border-dashed border-white/10 space-y-4">
              <ListMusic className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No playlists yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first audio playlist to organize tracks from your music library.
              </p>
              <button
                onClick={onOpenCreatePlaylist}
                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 rounded-xl cursor-pointer"
              >
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="bg-[#12121e] border border-white/[0.06] hover:border-purple-500/30 rounded-2xl overflow-hidden transition-all group flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={pl.artworkUrl}
                      alt={pl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121e] via-transparent to-transparent" />

                    {/* Quick Play complete playlist button */}
                    <button
                      onClick={() => {
                        const tracks = pl.trackIds
                          .map((tid) => songs.find((s) => s.id === tid))
                          .filter((s): s is Song => Boolean(s));
                        if (tracks.length > 0) {
                          playSong(tracks[0], tracks);
                          showNotice(`Playing playlist: "${pl.name}"`, 'success');
                        } else {
                          showNotice('This playlist is currently empty. Add tracks to play.', 'error');
                        }
                      }}
                      title="Play complete playlist"
                      className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/40 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </button>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-base font-bold text-white truncate">{pl.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 shrink-0">
                          {pl.trackIds.length} tracks
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {pl.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                      <button
                        onClick={() => handleOpenPlaylistManager(pl)}
                        className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Manage Tracks</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onNavigatePlaylist(pl.id)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Open View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. FRIENDS & SHARING SECTION                         */}
      {/* ==================================================== */}
      {activeSection === 'friends' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>Access Management</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Friends & Sharing</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate secure invitation links with assigned playlist permissions.
              </p>
            </div>

            <button
              onClick={onOpenInviteModal}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Invite New Friend</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Registered Friends */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Registered Friends ({friendsList.length})</span>
              </h3>

              {friendsList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#12121e] border border-white/[0.06] text-center text-xs text-slate-400">
                  No friends have joined yet. Click &quot;Invite New Friend&quot; to send an invitation.
                </div>
              ) : (
                <div className="space-y-3">
                  {friendsList.map((friend) => (
                    <div
                      key={friend.id}
                      className="p-4 rounded-xl bg-[#12121e] border border-white/[0.06] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                          {friend.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{friend.displayName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{friend.email}</p>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                        <span>{friend.accessiblePlaylists.length} playlists shared</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Invitations */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                <span>Pending Invite Links ({invitationsList.filter((i) => i.status === 'pending').length})</span>
              </h3>

              {invitationsList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#12121e] border border-white/[0.06] text-center text-xs text-slate-400">
                  No pending invitation links.
                </div>
              ) : (
                <div className="space-y-3">
                  {invitationsList.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-xl bg-[#12121e] border border-white/[0.06] flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{inv.email}</p>
                        <p className="text-[11px] text-slate-400">
                          Expires: {new Date(inv.expiresAt).toLocaleDateString()} · Status:{' '}
                          <span
                            className={
                              inv.status === 'pending'
                                ? 'text-amber-400 font-semibold'
                                : inv.status === 'accepted'
                                ? 'text-emerald-400'
                                : 'text-slate-500'
                            }
                          >
                            {inv.status}
                          </span>
                        </p>
                      </div>

                      {inv.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleCopyInviteLink(inv.token)}
                            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRevokeInvitation(inv.id)}
                            className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Revoke"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. SETTINGS SECTION                                  */}
      {/* ==================================================== */}
      {activeSection === 'settings' && (
        <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
          <div className="pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
              <Settings className="w-3.5 h-3.5" />
              <span>System & Storage Settings</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Vault Settings</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review persistent storage configurations, Firebase synchronization, and account privileges.
            </p>
          </div>

          {/* Persistent Storage Provider Details */}
          <div className="p-6 rounded-2xl bg-[#12121e] border border-white/[0.06] space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>Persistent Storage Architecture</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-slate-400">Audio Storage Location</span>
                <p className="font-mono text-purple-300 font-medium">data/audio (Master Cuts)</p>
                <p className="text-[11px] text-slate-500">Lossless local disk storage with HTTP 206 streaming</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-slate-400">Database Engine</span>
                <p className="font-mono text-purple-300 font-medium">data/database.json</p>
                <p className="text-[11px] text-slate-500">Atomic disk persistence preserving songs across reloads</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-slate-400">Artwork Directory</span>
                <p className="font-mono text-purple-300 font-medium">data/artwork</p>
                <p className="text-[11px] text-slate-500">Custom user-uploaded cover image repository</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-slate-400">Security Architecture</span>
                <p className="font-mono text-emerald-400 font-medium">Owner-Protected Streaming</p>
                <p className="text-[11px] text-slate-500">Friends can only stream assigned playlists</p>
              </div>
            </div>
          </div>

          {/* Firebase Integration Guide & Status */}
          <div className="p-6 rounded-2xl bg-[#12121e] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Firebase Cloud Synchronization</span>
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isFirebaseConfigured()
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isFirebaseConfigured() ? 'Firebase Configured' : 'Firebase Not Configured'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              VibeVault is currently powered by its self-hosted, persistent Express audio streaming engine. If you wish to replicate authentication or audio storage to Google Firebase Cloud Storage and Firestore, set the following environment variables in your deployment environment:
            </p>

            <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-purple-300 space-y-1 overflow-x-auto">
              <p>VITE_FIREBASE_API_KEY=your_api_key</p>
              <p>VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com</p>
              <p>VITE_FIREBASE_PROJECT_ID=your_project_id</p>
              <p>VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com</p>
              <p>VITE_FIREBASE_APP_ID=your_app_id</p>
            </div>

            {!isFirebaseConfigured() && (
              <p className="text-[11px] text-slate-400">
                Missing variables: {getMissingFirebaseConfig().join(', ')}. The app operates seamlessly with full disk storage and JWT authentication without requiring Firebase.
              </p>
            )}
          </div>

          {/* Account Profile Card */}
          <div className="p-6 rounded-2xl bg-[#12121e] border border-white/[0.06] flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Owner Credentials</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged in as <span className="text-white font-semibold">{user?.displayName}</span> ({user?.email})
              </p>
              <p className="text-[11px] text-purple-400 font-mono mt-1">Role: {user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT SONG METADATA                            */}
      {/* ==================================================== */}
      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141422] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>Edit Track Metadata</span>
              </h3>
              <button
                onClick={() => setEditingSong(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSongEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#1b1b2a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Artist</label>
                <input
                  type="text"
                  required
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  className="w-full bg-[#1b1b2a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Album</label>
                <input
                  type="text"
                  value={editAlbum}
                  onChange={(e) => setEditAlbum(e.target.value)}
                  className="w-full bg-[#1b1b2a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Genre</label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="w-full bg-[#1b1b2a] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DELETE SONG CONFIRMATION                      */}
      {/* ==================================================== */}
      {deletingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141422] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Audio Track?</h3>
                <p className="text-xs text-slate-400">This action will remove the physical audio file from storage.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs text-rose-200">
              <p className="font-semibold">{deletingSong.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{deletingSong.artist} · {deletingSong.album}</p>
            </div>

            <p className="text-xs text-slate-300">
              The audio file will be permanently deleted from <span className="font-mono text-purple-300">data/audio</span> and references will be purged from all playlists and favorites.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setDeletingSong(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Keep Song
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSong}
                disabled={isDeletingLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: ADD TRACK TO PLAYLIST                         */}
      {/* ==================================================== */}
      {songToAddToPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141422] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white">Add to Playlist</h3>
                <p className="text-xs text-slate-400 truncate max-w-[220px]">{songToAddToPlaylist.title}</p>
              </div>
              <button
                onClick={() => setSongToAddToPlaylist(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {playlists.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                <p>No playlists available.</p>
                <button
                  onClick={() => {
                    setSongToAddToPlaylist(null);
                    onOpenCreatePlaylist();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-900/40 rounded-lg cursor-pointer"
                >
                  Create One Now
                </button>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {playlists.map((pl) => {
                  const alreadyContains = pl.trackIds.includes(songToAddToPlaylist.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={async () => {
                        await onAddToPlaylist(pl.id, songToAddToPlaylist.id);
                        setSongToAddToPlaylist(null);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-600/20 hover:border-purple-500/30 border border-white/[0.06] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={pl.artworkUrl} alt={pl.name} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-xs font-semibold text-white truncate">{pl.name}</span>
                      </div>
                      {alreadyContains && (
                        <span className="text-[10px] text-emerald-400 font-mono">Added</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: MANAGE PLAYLIST TRACKS & ORDER                */}
      {/* ==================================================== */}
      {selectedPlaylistForManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141422] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPlaylistForManage.artworkUrl}
                  alt={selectedPlaylistForManage.name}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10"
                />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedPlaylistForManage.name}</h3>
                  <p className="text-xs text-slate-400">
                    {playlistTracks.length} tracks · Reorder tracks or remove from playlist without deleting file
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlaylistForManage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isManagingPlaylistLoading ? (
              <div className="py-12 flex justify-center text-purple-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : playlistTracks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                This playlist has no tracks. Add songs from &quot;My Music&quot;.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {playlistTracks.map((track, idx) => (
                  <div
                    key={track.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 text-center text-xs text-slate-500 font-mono">
                        {idx + 1}
                      </span>
                      <img src={track.artworkUrl} alt={track.title} className="w-9 h-9 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{track.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveTrackOrder(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/[0.06] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveTrackOrder(idx, 'down')}
                        disabled={idx === playlistTracks.length - 1}
                        title="Move Down"
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/[0.06] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveTrackFromPlaylist(selectedPlaylistForManage.id, track.id)}
                        title="Remove from playlist"
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 cursor-pointer ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setSelectedPlaylistForManage(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
