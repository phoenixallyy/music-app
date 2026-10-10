import React, { useState } from 'react';
import { Song, Playlist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { Play, Pause, Heart, MoreVertical, Plus, Trash2, Edit3, Music } from 'lucide-react';

interface SongRowProps {
  song: Song;
  index: number;
  allSongs?: Song[];
  playlists?: Playlist[];
  currentPlaylistId?: string;
  onAddToPlaylist?: (playlistId: string, songId: string) => void;
  onRemoveFromPlaylist?: (playlistId: string, songId: string) => void;
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (song: Song) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  allSongs,
  playlists = [],
  currentPlaylistId,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onEditSong,
  onDeleteSong,
}) => {
  const { currentSong, isPlaying, playSong, togglePlay, toggleFavorite, isFavorite } = usePlayer();
  const { isOwner } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isCurrent = currentSong?.id === song.id;
  const isLiked = isFavorite(song.id);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, allSongs);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsMenuOpen(false);
      }}
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors select-none text-xs ${
        isCurrent
          ? 'bg-purple-600/15 text-purple-300'
          : 'text-slate-300 hover:bg-white/[0.04]'
      }`}
    >
      {/* Index or Play icon */}
      <div className="w-8 flex items-center justify-center shrink-0">
        {isHovered || isCurrent ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick();
            }}
            className="text-white hover:text-purple-400 transition-colors"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        ) : (
          <span className="font-mono text-slate-400 tabular-nums">{index + 1}</span>
        )}
      </div>

      {/* Song details */}
      <div
        onClick={handleRowClick}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer pr-3"
      >
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10">
          {song.artworkUrl ? (
            <img
              src={song.artworkUrl}
              alt={song.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-950/40 text-purple-300">
              <Music className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className={`font-semibold truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
            {song.title}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {song.artist}
          </p>
        </div>
      </div>

      {/* Album (hidden on tiny screens) */}
      <div className="hidden md:block w-1/4 truncate text-slate-400 pr-2">
        {song.album}
      </div>

      {/* Genre (hidden on small screens) */}
      <div className="hidden lg:block w-28 truncate text-slate-400 pr-2">
        <span className="text-[11px] text-slate-300">
          {song.genre}
        </span>
      </div>

      {/* Actions: Like, Duration, Menu */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(song.id);
          }}
          className={`p-1.5 transition-colors ${
            isLiked ? 'text-rose-500' : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white'
          }`}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
        </button>

        <span className="font-mono text-slate-400 tabular-nums w-10 text-right">
          {formatTime(song.duration)}
        </span>

        {/* Context Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1.5 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-52 py-1.5 bg-[#161622] border border-white/10 rounded-xl shadow-2xl z-40 backdrop-blur-md"
            >
              {isOwner && onAddToPlaylist && playlists.length > 0 && (
                <div className="px-2 py-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Add to Playlist
                  </p>
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        onAddToPlaylist(pl.id, song.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/[0.06] text-left truncate"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{pl.name}</span>
                    </button>
                  ))}
                  <div className="my-1 border-t border-white/[0.06]" />
                </div>
              )}

              {currentPlaylistId && onRemoveFromPlaylist && isOwner && (
                <button
                  onClick={() => {
                    onRemoveFromPlaylist(currentPlaylistId, song.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-400 hover:bg-white/[0.04] text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove from this playlist
                </button>
              )}

              {isOwner && onEditSong && (
                <button
                  onClick={() => {
                    onEditSong(song);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.04] text-left"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                  Edit Metadata
                </button>
              )}

              {isOwner && onDeleteSong && (
                <button
                  onClick={() => {
                    onDeleteSong(song);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Audio File
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
