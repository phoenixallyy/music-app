import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Song, RepeatMode } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  queueIndex: number;
  isLoading: boolean;
  error: string | null;
  favorites: Set<string>;
  playSong: (song: Song, newQueue?: Song[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleFavorite: (songId: string) => Promise<void>;
  isFavorite: (songId: string) => boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Initialize HTML5 Audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    // Prevent casual download menus
    audio.setAttribute('controlsList', 'nodownload');
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
    };
    const onPause = () => setIsPlaying(false);

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      if (audio.error) {
        setError('Unable to load or stream audio. Please verify access permission.');
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  // Sync favorites when user logs in
  useEffect(() => {
    if (user) {
      api.getFavorites().then(res => {
        setFavorites(new Set(res.favorites));
      }).catch(err => console.warn('Could not load favorites:', err));
    } else {
      setFavorites(new Set());
    }
  }, [user]);

  // Handle track end event
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
      } else {
        handleNextTrack();
      }
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [queue, queueIndex, repeatMode, isShuffle]);

  const playSong = (song: Song, newQueue?: Song[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(null);
    setIsLoading(true);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(s => s.id === song.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else if (!queue.some(s => s.id === song.id)) {
      setQueue(prev => [...prev, song]);
      setQueueIndex(queue.length);
    } else {
      const idx = queue.findIndex(s => s.id === song.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    }

    setCurrentSong(song);
    setDuration(song.duration || 0);

    const streamUrl = api.getStreamUrl(song.id);
    audio.src = streamUrl;
    audio.volume = isMuted ? 0 : volume;
    audio.load();

    audio.play()
      .then(() => {
        setIsPlaying(true);
        setIsLoading(false);
        // Record play history in background
        if (user) {
          api.recordPlay(song.id).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Playback error:', err);
        setIsLoading(false);
        setIsPlaying(false);
        setError('Playback authorization required or stream unavailable.');
      });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.warn('Play error:', err);
        setError('Click play to resume stream.');
      });
    }
  };

  const handleNextTrack = () => {
    if (queue.length === 0) return;

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      setQueueIndex(nextIndex);
      playSong(nextSong, queue);
    }
  };

  const prevTrack = () => {
    const audio = audioRef.current;
    if (!audio || queue.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : (repeatMode === 'all' ? queue.length - 1 : 0);
    const prevSong = queue[prevIndex];
    if (prevSong) {
      setQueueIndex(prevIndex);
      playSong(prevSong, queue);
    }
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const setVolume = (val: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audio) {
      audio.volume = isMuted ? 0 : clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audio) {
      audio.volume = nextMuted ? 0 : volume;
    }
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
  };

  const cycleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const addToQueue = (song: Song) => {
    setQueue(prev => [...prev, song]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index === queueIndex) {
      handleNextTrack();
    } else if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue(currentSong ? [currentSong] : []);
    setQueueIndex(0);
  };

  const toggleFavorite = async (songId: string) => {
    if (!user) return;
    try {
      const res = await api.toggleFavorite(songId);
      setFavorites(prev => {
        const next = new Set(prev);
        if (res.added) next.add(songId);
        else next.delete(songId);
        return next;
      });
    } catch (err) {
      console.warn('Failed to toggle favorite:', err);
    }
  };

  const isFavorite = (songId: string) => favorites.has(songId);

  return (
    <PlayerContext.Provider
      value={{
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
        favorites,
        playSong,
        togglePlay,
        nextTrack: handleNextTrack,
        prevTrack,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
};
