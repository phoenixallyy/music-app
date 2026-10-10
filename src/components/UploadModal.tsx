import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { Song } from '../types';
import { Upload, X, Music, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (song: Song) => void;
}

const PRESET_ARTWORKS = [
  { name: 'Curated Vibes', url: '/src/assets/images/art_curated_vibes_1791621255690.jpg' },
  { name: 'Midnight Echoes', url: '/src/assets/images/art_midnight_echoes_1791621274995.jpg' },
  { name: 'Neon Horizon', url: '/src/assets/images/art_neon_horizon_1791621288838.jpg' },
];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('Electronic');
  const [artworkUrl, setArtworkUrl] = useState(PRESET_ARTWORKS[0].url);
  const [duration, setDuration] = useState<number>(180);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setIsSuccess(false);

    // Parse default title from filename without extension
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setTitle(baseName);

    // Try measuring duration via temporary Audio object
    try {
      const tempAudio = new Audio();
      tempAudio.src = URL.createObjectURL(file);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          setDuration(Math.round(tempAudio.duration));
        }
      };
    } catch {
      // Fallback
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an audio file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('title', title || selectedFile.name);
      formData.append('artist', artist || 'Unknown Artist');
      formData.append('album', album || 'Vault Singles');
      formData.append('genre', genre || 'Ambient');
      formData.append('artworkUrl', artworkUrl);
      formData.append('duration', String(duration));

      setUploadProgress(65);
      const res = await api.uploadSong(formData);
      setUploadProgress(100);
      setIsSuccess(true);
      onUploaded(res.song);

      setTimeout(() => {
        handleReset();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTitle('');
    setArtist('');
    setAlbum('');
    setError(null);
    setIsSuccess(false);
    setUploadProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#13131e] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upload to Vault</h2>
              <p className="text-xs text-slate-400">Add songs to your private storage library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce mb-3" />
            <h3 className="text-base font-bold text-white">Upload Completed!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Song metadata saved and encoded for authorized streaming.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-purple-500/50 bg-purple-950/20'
                  : 'border-white/15 hover:border-purple-500/40 bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,audio/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <Music className="w-8 h-8 text-purple-400 mb-2 opacity-80" />
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                  <p className="text-xs text-purple-300 mt-1 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || 'audio'}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">
                    Drop audio file here or <span className="text-purple-400 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports MP3, WAV, M4A, FLAC, AAC, OGG up to 100MB
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Track Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midnight Horizon"
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Artist</label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Tycho"
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Album</label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="e.g. Frequencies EP"
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Ambient">Ambient</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Synthwave">Synthwave</option>
                  <option value="Lo-Fi">Lo-Fi</option>
                  <option value="Chillout">Chillout</option>
                  <option value="House / Deep">House / Deep</option>
                  <option value="Soundtrack">Soundtrack</option>
                  <option value="Acoustic">Acoustic</option>
                </select>
              </div>
            </div>

            {/* Artwork preset selection */}
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-2">
                Cover Artwork Preset
              </label>
              <div className="flex items-center gap-3">
                {PRESET_ARTWORKS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setArtworkUrl(preset.url)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      artworkUrl === preset.url
                        ? 'border-purple-500 scale-105 shadow-md shadow-purple-600/30'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Uploading audio stream...</span>
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

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
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
                disabled={!selectedFile || isUploading}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-600/30 transition-colors disabled:opacity-50"
              >
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Upload Song</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
