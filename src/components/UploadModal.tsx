import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { Song } from '../types';
import { Upload, X, Music, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, FileAudio } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (song?: Song) => void;
}

const PRESET_ARTWORKS = [
  { name: 'Curated Vibes', url: '/src/assets/images/art_curated_vibes_1791621255690.jpg' },
  { name: 'Midnight Echoes', url: '/src/assets/images/art_midnight_echoes_1791621274995.jpg' },
  { name: 'Neon Horizon', url: '/src/assets/images/art_neon_horizon_1791621288838.jpg' },
];

interface QueueItem {
  id: string;
  file: File;
  title: string;
  artist: string;
  album: string;
  genre: string;
  artworkUrl: string;
  customArtworkFile?: File;
  customArtworkPreview?: string;
  duration: number;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const artworkInputRef = useRef<HTMLInputElement | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeQueueIdForArt, setActiveQueueIdForArt] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  if (!isOpen) return null;

  const handleFilesAdded = (files: FileList | File[]) => {
    const validExts = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'];
    const newItems: QueueItem[] = [];

    Array.from(files).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValid = validExts.includes(ext) || file.type.startsWith('audio/');

      if (!isValid) {
        setError(`Skipped ${file.name}: only MP3, M4A, AAC, WAV, FLAC, OGG audio formats are supported.`);
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        setError(`Skipped ${file.name}: file exceeds 100MB limit.`);
        return;
      }

      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      let detectedDuration = 180;
      try {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setQueue((prev) =>
              prev.map((item) => (item.file === file ? { ...item, duration: Math.round(audio.duration) } : item))
            );
          }
        };
      } catch {
        // Fallback
      }

      newItems.push({
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        file,
        title: baseName,
        artist: 'Vault Artist',
        album: 'Vault Singles',
        genre: 'Electronic',
        artworkUrl: PRESET_ARTWORKS[0].url,
        duration: detectedDuration,
      });
    });

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
      setError(null);
      setIsSuccess(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<QueueItem>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleArtworkPicked = (file: File, itemId: string) => {
    if (!file.type.startsWith('image/')) {
      setError('Cover artwork must be an image file (JPG, PNG, WEBP).');
      return;
    }
    const preview = URL.createObjectURL(file);
    handleUpdateItem(itemId, {
      customArtworkFile: file,
      customArtworkPreview: preview,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queue.length === 0) {
      setError('Please select at least one audio file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    let completed = 0;
    let lastUploadedSong: Song | undefined;

    try {
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        let finalArtUrl = item.artworkUrl;

        // Custom artwork file upload if selected
        if (item.customArtworkFile) {
          try {
            const artData = new FormData();
            artData.append('artwork', item.customArtworkFile);
            const artRes = await api.uploadArtwork(artData);
            finalArtUrl = artRes.artworkUrl;
          } catch (artErr) {
            console.warn('Artwork upload notice:', artErr);
          }
        }

        const formData = new FormData();
        formData.append('audio', item.file);
        formData.append('title', item.title || item.file.name);
        formData.append('artist', item.artist || 'Unknown Artist');
        formData.append('album', item.album || 'Vault Singles');
        formData.append('genre', item.genre || 'Electronic');
        formData.append('artworkUrl', finalArtUrl);
        formData.append('duration', String(item.duration));

        const res = await api.uploadSong(formData);
        lastUploadedSong = res.song;
        completed++;
        setUploadProgress(Math.round(((i + 1) / queue.length) * 100));
      }

      setUploadedCount(completed);
      setIsSuccess(true);
      onUploaded(lastUploadedSong);

      setTimeout(() => {
        handleReset();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setQueue([]);
    setError(null);
    setIsSuccess(false);
    setUploadProgress(0);
    setUploadedCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#13131e] border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upload Audio to Vault</h2>
              <p className="text-xs text-slate-400">Lossless persistent audio storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,audio/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        />
        <input
          ref={artworkInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0] && activeQueueIdForArt) {
              handleArtworkPicked(e.target.files[0], activeQueueIdForArt);
            }
          }}
        />

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce mb-3" />
            <h3 className="text-base font-bold text-white">Upload Completed!</h3>
            <p className="text-xs text-slate-400 mt-1">
              {uploadedCount} track(s) saved to persistent storage and ready for streaming.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-purple-500/50 bg-white/[0.02] hover:bg-purple-950/10 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
            >
              <Music className="w-8 h-8 text-purple-400 mb-2 opacity-80" />
              <p className="text-sm font-semibold text-white text-center">
                Drop audio files here or <span className="text-purple-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1 text-center">
                Supports multiple MP3, M4A, AAC, WAV, FLAC, OGG files up to 100MB each
              </p>
            </div>

            {/* Queued tracks list */}
            {queue.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <span>Selected Tracks ({queue.length})</span>
                  <button
                    type="button"
                    onClick={() => setQueue([])}
                    className="text-rose-400 hover:text-rose-300 lowercase text-xs"
                  >
                    clear
                  </button>
                </div>

                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#1a1a28] border border-white/10 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 font-mono text-purple-300">
                        <FileAudio className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="truncate font-semibold text-white">{item.file.name}</span>
                        <span className="text-slate-500 shrink-0">
                          {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Track Title</label>
                        <input
                          type="text"
                          required
                          value={item.title}
                          onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                          className="w-full bg-[#12121e] border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Artist</label>
                        <input
                          type="text"
                          required
                          value={item.artist}
                          onChange={(e) => handleUpdateItem(item.id, { artist: e.target.value })}
                          className="w-full bg-[#12121e] border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Album</label>
                        <input
                          type="text"
                          value={item.album}
                          onChange={(e) => handleUpdateItem(item.id, { album: e.target.value })}
                          className="w-full bg-[#12121e] border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Genre</label>
                        <select
                          value={item.genre}
                          onChange={(e) => handleUpdateItem(item.id, { genre: e.target.value })}
                          className="w-full bg-[#12121e] border border-white/10 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="Electronic">Electronic</option>
                          <option value="Ambient">Ambient</option>
                          <option value="Synthwave">Synthwave</option>
                          <option value="Lo-Fi">Lo-Fi</option>
                          <option value="House / Deep">House / Deep</option>
                          <option value="Soundtrack">Soundtrack</option>
                        </select>
                      </div>
                    </div>

                    {/* Artwork option */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Art:</span>
                        {PRESET_ARTWORKS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() =>
                              handleUpdateItem(item.id, {
                                artworkUrl: preset.url,
                                customArtworkFile: undefined,
                                customArtworkPreview: undefined,
                              })
                            }
                            className={`w-7 h-7 rounded border transition-all ${
                              !item.customArtworkPreview && item.artworkUrl === preset.url
                                ? 'border-purple-500 scale-105'
                                : 'border-white/10 opacity-60'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                        {item.customArtworkPreview && (
                          <div className="w-7 h-7 rounded border-2 border-purple-500 overflow-hidden">
                            <img src={item.customArtworkPreview} alt="Custom" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveQueueIdForArt(item.id);
                          artworkInputRef.current?.click();
                        }}
                        className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Custom Cover</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Progress bar */}
            {isUploading && (
              <div className="space-y-1 pt-1 shrink-0">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Uploading audio master streams...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={queue.length === 0 || isUploading}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-600/30 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Upload {queue.length > 0 ? `(${queue.length}) Songs` : 'Songs'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
