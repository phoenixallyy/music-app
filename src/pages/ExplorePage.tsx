import React, { useState, useMemo } from 'react';
import { Song, Playlist } from '../types';
import { SongRow } from '../components/SongRow';
import { PlaylistCard } from '../components/PlaylistCard';
import { Search, Compass, Music, Disc3, Sparkles } from 'lucide-react';

interface ExplorePageProps {
  songs: Song[];
  playlists: Playlist[];
  onOpenPlaylist: (id: string) => void;
  onAddToPlaylist?: (playlistId: string, songId: string) => void;
}

const GENRES = ['All', 'Ambient', 'Synthwave', 'Lo-Fi', 'Electronic', 'Chillout'];

export const ExplorePage: React.FC<ExplorePageProps> = ({
  songs,
  playlists,
  onOpenPlaylist,
  onAddToPlaylist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        song.album.toLowerCase().includes(q) ||
        song.genre.toLowerCase().includes(q);

      const matchesGenre =
        selectedGenre === 'All' ||
        song.genre.toLowerCase().includes(selectedGenre.toLowerCase());

      return matchesSearch && matchesGenre;
    });
  }, [songs, searchQuery, selectedGenre]);

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const q = searchQuery.toLowerCase().trim();
    return playlists.filter(
      (pl) =>
        pl.name.toLowerCase().includes(q) ||
        pl.description.toLowerCase().includes(q)
    );
  }, [playlists, searchQuery]);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
          <Compass className="w-3.5 h-3.5" />
          <span>Discovery & Search</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Explore Music
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Search your authorized audio archives, filter moods, and stream lossless audio
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by song title, artist, album, or genre..."
          className="w-full bg-[#13131e] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500 shadow-lg"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Genre Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              selectedGenre === genre
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Songs Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <span>Tracks ({filteredSongs.length})</span>
          </h2>
        </div>

        {filteredSongs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#12121b] border border-white/5 text-center text-xs text-slate-400">
            <p>No songs found matching your search or filter.</p>
          </div>
        ) : (
          <div className="bg-[#12121b] border border-white/[0.05] rounded-2xl p-1 divide-y divide-white/[0.04]">
            {filteredSongs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                allSongs={filteredSongs}
                playlists={playlists}
                onAddToPlaylist={onAddToPlaylist}
              />
            ))}
          </div>
        )}
      </div>

      {/* Playlists Results */}
      {filteredPlaylists.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/[0.04]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Disc3 className="w-4 h-4 text-purple-400" />
            <span>Playlists ({filteredPlaylists.length})</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPlaylists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                onClick={() => onOpenPlaylist(pl.id)}
                onPlay={() => onOpenPlaylist(pl.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
