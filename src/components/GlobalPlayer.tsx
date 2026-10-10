import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Maximize2,
  Minimize2,
  AlertCircle,
  Loader2,
  Music,
} from 'lucide-react';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const GlobalPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    queue,
    queueIndex,
    isLoading,
    error,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    isFavorite,
    removeFromQueue,
  } = usePlayer();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isLiked = isFavorite(currentSong.id);

  return (
    <>
      {/* PERSISTENT BOTTOM AUDIO DOCK */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e0e17]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2.5 shadow-2xl"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Track Details */}
          <div className="flex items-center gap-3.5 min-w-0 w-1/4">
            <div
              className="relative w-13 h-13 rounded-lg overflow-hidden shrink-0 shadow-md bg-black/40 border border-white/10 cursor-pointer group"
              onClick={() => setIsFullScreen(true)}
            >
              {currentSong.artworkUrl ? (
                <img
                  src={currentSong.artworkUrl}
                  alt={currentSong.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-900/40 text-purple-300">
                  <Music className="w-6 h-6" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4
                onClick={() => setIsFullScreen(true)}
                className="text-xs sm:text-sm font-semibold text-white truncate cursor-pointer hover:underline"
              >
                {currentSong.title}
              </h4>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {currentSong.artist} · <span className="text-slate-400">{currentSong.album}</span>
              </p>
            </div>

            <button
              onClick={() => toggleFavorite(currentSong.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
              title={isLiked ? 'Remove from Liked' : 'Save to Liked'}
            >
              <Heart
                className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="flex-1 max-w-xl flex flex-col items-center">
            <div className="flex items-center gap-4 mb-1">
              <button
                onClick={toggleShuffle}
                className={`p-1.5 transition-colors ${
                  isShuffle ? 'text-purple-400' : 'text-slate-400 hover:text-white'
                }`}
                title={isShuffle ? 'Shuffle enabled' : 'Shuffle disabled'}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={prevTrack}
                className="p-1.5 text-slate-300 hover:text-white transition-colors"
                title="Previous track"
              >
                <SkipBack className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 text-black flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-70"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : isPlaying ? (
                  <Pause className="w-4.5 h-4.5 fill-black" />
                ) : (
                  <Play className="w-4.5 h-4.5 fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-1.5 text-slate-300 hover:text-white transition-colors"
                title="Next track"
              >
                <SkipForward className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={cycleRepeat}
                className={`p-1.5 transition-colors ${
                  repeatMode !== 'off' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Scrubber bar */}
            <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-slate-400">
              <span className="w-9 text-right tabular-nums">{formatTime(currentTime)}</span>
              <div className="flex-1 relative flex items-center group">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer focus:outline-none accent-purple-500 hover:h-1.5 transition-all"
                />
              </div>
              <span className="w-9 text-left tabular-nums">{formatTime(duration)}</span>
            </div>

            {/* Error or buffering notice */}
            {error && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Right: Volume & Extra Controls */}
          <div className="hidden sm:flex items-center justify-end gap-3 w-1/4">
            <button
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`p-1.5 transition-colors ${
                isQueueOpen ? 'text-purple-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <button
              onClick={() => setIsFullScreen(true)}
              className="p-1.5 text-slate-400 hover:text-white transition-colors ml-1"
              title="Expand Player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUEUE DRAWER */}
      {isQueueOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-h-96 bg-[#13131e] border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-purple-400" />
              Playback Queue ({queue.length})
            </h3>
            <button
              onClick={() => setIsQueueOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 space-y-1 pr-1">
            {queue.map((song, idx) => (
              <div
                key={`${song.id}_${idx}`}
                className={`flex items-center justify-between gap-2 p-2 rounded-lg text-xs transition-colors ${
                  idx === queueIndex
                    ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/20'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="w-4 text-slate-400 font-mono text-[10px]">
                    {idx === queueIndex ? '▶' : idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="truncate">{song.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>
                  </div>
                </div>
                {queue.length > 1 && (
                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="text-slate-400 hover:text-rose-400 px-1"
                    title="Remove from queue"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPANDABLE FULL SCREEN IMMERSIVE PLAYER */}
      {isFullScreen && (
        <div
          className="fixed inset-0 z-50 bg-[#09090f]/98 backdrop-blur-3xl flex flex-col p-6 sm:p-10 animate-in fade-in duration-300"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
              <Music className="w-4 h-4" />
              <span>Now Playing</span>
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-2 text-slate-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-full transition-colors"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 max-w-5xl mx-auto w-full my-auto">
            {/* Big Artwork */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/40 border border-white/15 bg-black/60 relative group">
              {currentSong.artworkUrl ? (
                <img
                  src={currentSong.artworkUrl}
                  alt={currentSong.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-950/40 text-purple-300">
                  <Music className="w-20 h-20 opacity-40" />
                </div>
              )}
            </div>

            {/* Controls & Track info */}
            <div className="w-full max-w-md flex flex-col justify-center">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {currentSong.title}
                  </h2>
                  <p className="text-base text-purple-300 mt-1 font-medium">{currentSong.artist}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{currentSong.album} · {currentSong.genre}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(currentSong.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Heart
                    className={`w-6 h-6 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                  />
                </button>
              </div>

              {/* Scrubber */}
              <div className="mb-6">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs font-mono text-slate-400 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Big playback controls */}
              <div className="flex items-center justify-center gap-6 mb-8">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 transition-colors ${
                    isShuffle ? 'text-purple-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button
                  onClick={prevTrack}
                  className="p-3 text-slate-200 hover:text-white transition-colors"
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="w-14 h-14 rounded-full bg-white hover:bg-slate-200 text-black flex items-center justify-center shadow-xl shadow-purple-600/30 transition-transform active:scale-95"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-black" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 fill-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black ml-1" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-3 text-slate-200 hover:text-white transition-colors"
                >
                  <SkipForward className="w-6 h-6" />
                </button>

                <button
                  onClick={cycleRepeat}
                  className={`p-2 transition-colors ${
                    repeatMode !== 'off' ? 'text-purple-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                </button>
              </div>

              {/* Volume bar */}
              <div className="flex items-center gap-3 justify-center text-slate-400">
                <button onClick={toggleMute} className="hover:text-white">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-32 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
