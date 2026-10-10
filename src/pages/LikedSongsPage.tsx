import React from 'react';
import { Song, Playlist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/SongRow';
import { Heart, Play, Shuffle, Music } from 'lucide-react';

interface LikedSongsPageProps {
  songs: Song[];
  playlists: Playlist[];
  onAddToPlaylist?: (playlistId: string, songId: string) => void;
}

export const LikedSongsPage: React.FC<LikedSongsPageProps> = ({
  songs,
  playlists,
  onAddToPlaylist,
}) => {
  const { favorites, playSong } = usePlayer();

  const likedTracks = songs.filter((s) => favorites.has(s.id));

  const handlePlayAll = () => {
    if (likedTracks.length > 0) {
      playSong(likedTracks[0], likedTracks);
    }
  };

  const handleShuffleAll = () => {
    if (likedTracks.length > 0) {
      const shuffled = [...likedTracks].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-rose-950/40 via-[#12121c]/60 to-transparent border-b border-white/[0.04] rounded-2xl flex flex-col md:flex-row items-start md:items-end gap-6">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-rose-950/50 shrink-0">
          <Heart className="w-20 h-20 text-white fill-white" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            Favorites Collection
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
            Liked Songs
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Tracks you've pinned for instant access
          </p>
          <div className="mt-3 text-xs text-slate-400 font-mono">
            {likedTracks.length} tracks favorited
          </div>
        </div>
      </div>

      {/* Actions */}
      {likedTracks.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayAll}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-transform active:scale-95"
            title="Play All"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
          <button
            onClick={handleShuffleAll}
            className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
            title="Shuffle All"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Tracks */}
      {likedTracks.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#12121b] border border-white/5 text-center text-xs text-slate-400">
          <Heart className="w-10 h-10 mx-auto text-rose-500/40 mb-2" />
          <p className="font-semibold text-white">No liked songs yet.</p>
          <p className="mt-1">Click the heart icon on any track in your library or explore view.</p>
        </div>
      ) : (
        <div className="bg-[#12121b] border border-white/[0.05] rounded-2xl p-1 divide-y divide-white/[0.04]">
          {likedTracks.map((song, idx) => (
            <SongRow
              key={song.id}
              song={song}
              index={idx}
              allSongs={likedTracks}
              playlists={playlists}
              onAddToPlaylist={onAddToPlaylist}
            />
          ))}
        </div>
      )}
    </div>
  );
};
