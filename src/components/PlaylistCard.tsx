import React from 'react';
import { Playlist } from '../types';
import { Play, Music, Lock, Globe } from 'lucide-react';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  onPlay?: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick, onPlay }) => {
  return (
    <div
      onClick={onClick}
      className="group relative bg-[#13131c] hover:bg-[#1a1a27] p-4 rounded-2xl border border-white/[0.05] hover:border-purple-500/30 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-purple-900/10 flex flex-col"
    >
      {/* Artwork container */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-black/40 mb-3.5 border border-white/5">
        {playlist.artworkUrl ? (
          <img
            src={playlist.artworkUrl}
            alt={playlist.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-950 to-indigo-950 text-purple-300">
            <Music className="w-10 h-10 opacity-50" />
          </div>
        )}

        {/* Hover play button */}
        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-xl shadow-black/60 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105"
            title="Play playlist"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        )}

        {/* Privacy icon badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-slate-300 flex items-center gap-1">
          {playlist.isPublicToFriends ? (
            <>
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Friends</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 text-purple-400" />
              <span>Private</span>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
        {playlist.name}
      </h3>
      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
        {playlist.description || `${playlist.trackIds.length} tracks in this collection`}
      </p>

      <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>{playlist.trackIds.length} tracks</span>
      </div>
    </div>
  );
};
