import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { Playlist, Song } from '../types';
import { PlaylistCard } from '../components/PlaylistCard';
import { SongRow } from '../components/SongRow';
import { Sparkles, Plus, Upload, Music, Play, Shield, Compass } from 'lucide-react';

interface HomePageProps {
  playlists: Playlist[];
  songs: Song[];
  onOpenPlaylist: (id: string) => void;
  onOpenUpload: () => void;
  onOpenCreatePlaylist: () => void;
  onNavigateExplore: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  playlists,
  songs,
  onOpenPlaylist,
  onOpenUpload,
  onOpenCreatePlaylist,
  onNavigateExplore,
}) => {
  const { user, isOwner } = useAuth();
  const { playSong } = usePlayer();

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const quickPlaylists = playlists.slice(0, 6);
  const recentTracks = songs.slice(0, 5);

  return (
    <div className="p-6 sm:p-8 space-y-10 max-w-7xl mx-auto pb-32">
      {/* Header Greeting & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {greeting}, {user?.displayName || 'Listener'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isOwner
              ? 'Administrator access enabled: Full library management & friend sharing'
              : 'Streaming authorized playlists in private mode'}
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenCreatePlaylist}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>New Playlist</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Track</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Jump Playlist Grid */}
      <div>
        <h2 className="text-base font-bold text-white mb-4">Quick Jump</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onOpenPlaylist(pl.id)}
              className="group flex items-center gap-3.5 p-2 rounded-xl bg-[#141420] hover:bg-[#1a1a2a] border border-white/[0.05] hover:border-purple-500/20 transition-all cursor-pointer shadow-md"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/5 relative">
                {pl.artworkUrl ? (
                  <img
                    src={pl.artworkUrl}
                    alt={pl.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-950/40 text-purple-300">
                    <Music className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                  {pl.name}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {pl.trackIds.length} tracks
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPlaylist(pl.id);
                }}
                className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center mr-2 opacity-0 group-hover:opacity-100 transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Vault Playlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">Your Playlists</h2>
          <button
            onClick={onNavigateExplore}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            Browse All
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#13131e] border border-white/5 text-center text-xs text-slate-400">
            <Music className="w-8 h-8 mx-auto text-purple-400 mb-2 opacity-50" />
            <p>No playlists available yet.</p>
            {isOwner && (
              <button
                onClick={onOpenCreatePlaylist}
                className="mt-3 px-4 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/60 rounded-lg hover:bg-purple-900/60"
              >
                Create your first playlist
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                onClick={() => onOpenPlaylist(pl.id)}
                onPlay={() => onOpenPlaylist(pl.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recently Added Songs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Recently Added Songs</h2>
          <button
            onClick={onNavigateExplore}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
          >
            View More
          </button>
        </div>

        {songs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#13131e] border border-white/5 text-center text-xs text-slate-400">
            <p>No songs found in this vault.</p>
            {isOwner && (
              <button
                onClick={onOpenUpload}
                className="mt-3 px-4 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/60 rounded-lg"
              >
                Upload a song now
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#12121b] border border-white/[0.05] rounded-2xl p-1 divide-y divide-white/[0.04]">
            {recentTracks.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                allSongs={songs}
                playlists={playlists}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
