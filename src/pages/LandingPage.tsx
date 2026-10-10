import React from 'react';
import { Song, Playlist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import {
  Play,
  Pause,
  UploadCloud,
  ListMusic,
  Users2,
  Sliders,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Sparkles,
  Disc3,
  Heart,
  Music,
} from 'lucide-react';

interface LandingPageProps {
  onStartListening: () => void;
  onExplore: () => void;
  onQuickOwnerDemo?: () => void;
  isDemoLoading?: boolean;
  recentSongs: Song[];
  featuredPlaylists: Playlist[];
  onOpenPlaylist: (id: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartListening,
  onExplore,
  onQuickOwnerDemo,
  isDemoLoading = false,
  recentSongs,
  featuredPlaylists,
  onOpenPlaylist,
}) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();

  return (
    <div className="bg-[#0a0a0f] text-slate-100 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-6 overflow-hidden">
        {/* Ambient violet background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-purple-800/20 via-violet-600/15 to-transparent blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Proposition */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Personal Music Vault & Private Streaming</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
              Your Music. <br />
              <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                Your Vibe.
              </span>{' '}
              Your Space.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
              Host your lossless audio library in private storage. Curate custom playlists and stream exclusively with invited friends through a lightning-fast, protected music player.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={onStartListening}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Listening</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {onQuickOwnerDemo && (
                <button
                  onClick={onQuickOwnerDemo}
                  disabled={isDemoLoading}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-sm text-purple-200 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/40 shadow-lg shadow-purple-950/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDemoLoading ? (
                    <>
                      <Disc3 className="w-4 h-4 animate-spin text-purple-400" />
                      <span>Opening Owner Vault...</span>
                    </>
                  ) : (
                    <>
                      <Disc3 className="w-4 h-4 text-purple-400" />
                      <span>1-Click Owner Demo</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onExplore}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <span>Explore Music</span>
              </button>
            </div>

            {/* Proof snippet */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Private audio encryption</span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5">
                <Users2 className="w-4 h-4 text-purple-400" />
                <span>Invite-only friend sharing</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset + Interactive Floating Player Mockup */}
          <div className="lg:col-span-6 relative z-10 flex justify-center">
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-950/40 bg-[#12121b]">
              <img
                src="/src/assets/images/hero_vibevault_visual_1791621322319.jpg"
                alt="VibeVault Listening Studio"
                referrerPolicy="no-referrer"
                className="w-full h-80 sm:h-96 object-cover opacity-85 hover:opacity-95 transition-opacity duration-500"
              />

              {/* Glass Audio Player Card floating over the hero photo */}
              <div className="absolute bottom-4 left-4 right-4 bg-[#0d0d15]/90 backdrop-blur-xl border border-white/15 p-4 rounded-xl shadow-2xl flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/50">
                  <img
                    src="/src/assets/images/art_curated_vibes_1791621255690.jpg"
                    alt="Current Track"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">Obsidian Echoes</span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                      Lossless
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">Auraform · Midnight Frequencies</p>
                  <div className="w-full h-1 bg-white/15 rounded-full mt-2 overflow-hidden">
                    <div className="w-2/3 h-full bg-purple-500" />
                  </div>
                </div>

                {recentSongs.length > 0 && (
                  <button
                    onClick={() => {
                      if (currentSong?.id === recentSongs[0].id) {
                        togglePlay();
                      } else {
                        playSong(recentSongs[0], recentSongs);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/30 transition-transform active:scale-95"
                  >
                    {currentSong?.id === recentSongs[0].id && isPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE SECTION (Section C) */}
      <section id="features" className="py-20 px-6 border-t border-white/[0.06] bg-[#0c0c14]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">
              Architected for Sound Purists
            </h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              A private haven for your personal discography
            </p>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Full control over audio storage, track sequencing, and listening circles without third-party algorithms or public exposure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] hover:border-purple-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Your Personal Music Library</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload uncompressed MP3, WAV, FLAC, and AAC masters. Store your private audio collection securely with comprehensive metadata management.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] hover:border-purple-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                <ListMusic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Custom Playlists</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Craft aesthetic playlists with custom cover artwork, track ordering, and descriptions. Reorganize and duplicate sets effortlessly.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] hover:border-purple-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-105 transition-transform">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Music for Your Friends</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send time-limited invitation links to selected friends. Assign specific playlist access while keeping the rest of your vault confidential.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] hover:border-purple-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Seamless Listening</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Persistent global player with HTTP 206 range-request streaming. Seek and scrub across tracks without audio buffer delay or reloads.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] hover:border-purple-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Private, Controlled Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No permanent public URLs or open download links. Every stream requires authorization, preventing casual ripping and unpermitted distribution.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] hover:border-purple-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-pink-950/60 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Mobile-Friendly Music Experience</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Responsive dock player with full-screen expansion, touch-friendly seek bars, and background playback support on iOS and Android.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PLAYLISTS & RECENT MUSIC PREVIEW (Sections D & E) */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Featured Playlists */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Curated Vault Playlists</h3>
                <p className="text-xs text-slate-400 mt-1">Explore sets currently active in the vault</p>
              </div>
              <button
                onClick={onExplore}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onOpenPlaylist(pl.id)}
                  className="group bg-[#13131e] hover:bg-[#1a1a28] p-4 rounded-2xl border border-white/[0.06] hover:border-purple-500/30 transition-all cursor-pointer shadow-lg"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3.5 bg-black/40">
                    <img
                      src={pl.artworkUrl}
                      alt={pl.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPlaylist(pl.id);
                      }}
                      className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                    >
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pl.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Added Tracks preview */}
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight">Recently Added Audio</h3>
              <p className="text-xs text-slate-400 mt-1">Direct stream previews available in your player</p>
            </div>

            <div className="bg-[#12121b] border border-white/[0.06] rounded-2xl p-2 divide-y divide-white/[0.04]">
              {recentSongs.slice(0, 3).map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <div
                    key={song.id}
                    onClick={() => {
                      if (isCurrent) togglePlay();
                      else playSong(song, recentSongs);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/40">
                        <img
                          src={song.artworkUrl}
                          alt={song.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-purple-300' : 'text-white'}`}>
                          {song.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span className="hidden sm:inline text-slate-400">{song.genre}</span>
                      <span>{Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}</span>
                      <button className="w-8 h-8 rounded-full bg-white/[0.06] group-hover:bg-purple-600 group-hover:text-white text-slate-300 flex items-center justify-center transition-colors">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION (Section F) */}
      <section id="how-it-works" className="py-20 px-6 border-t border-white/[0.06] bg-[#0c0c14]/40">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">
            Simplicity by Design
          </h2>
          <p className="text-3xl font-extrabold text-white tracking-tight mb-14">
            How VibeVault Operates
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] relative">
              <div className="text-3xl font-mono font-bold text-purple-500/40 mb-3">01</div>
              <h3 className="text-base font-bold text-white mb-2">Upload Your Music</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drop your lossless FLAC or high-bitrate MP3 cuts directly into the owner dashboard. Automatic metadata parsing organizes your library.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] relative">
              <div className="text-3xl font-mono font-bold text-purple-500/40 mb-3">02</div>
              <h3 className="text-base font-bold text-white mb-2">Create Your Playlists</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sequence tracks into evocative mood boards, study mixes, or late-night selections with custom artwork and descriptions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#13131e] border border-white/[0.06] relative">
              <div className="text-3xl font-mono font-bold text-purple-500/40 mb-3">03</div>
              <h3 className="text-base font-bold text-white mb-2">Invite & Listen Together</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate secure links for friends. They sign in, experience your curated playlists, and stream without public downloads.
              </p>
            </div>
          </div>

          <div className="mt-14">
            <button
              onClick={onStartListening}
              className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/30 transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION (Section G) */}
      <footer className="mt-auto py-12 px-6 border-t border-white/[0.06] bg-[#08080d] text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center">
              <Disc3 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">VibeVault</span>
            <span className="text-slate-600">·</span>
            <span>Private Personal Music Streaming</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onExplore} className="hover:text-white transition-colors">Explore</button>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <span className="text-slate-600">·</span>
            <span>Zero Public Audio Links</span>
          </div>

          <p className="text-slate-400 font-mono text-[11px]">
            © {new Date().getFullYear()} VibeVault. Private Streaming Infrastructure.
          </p>
        </div>
      </footer>
    </div>
  );
};
