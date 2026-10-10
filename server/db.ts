import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth.js';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'owner' | 'friend' | 'demo';
  avatarUrl: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // in seconds
  audioFileName: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  artworkUrl: string;
  uploaderId: string;
  createdAt: string;
}

export interface Playlist {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  artworkUrl: string;
  isPublicToFriends: boolean;
  sharedWithUserIds: string[];
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  token: string;
  email: string;
  assignedPlaylistIds: string[];
  createdBy: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedByUserId?: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  songId: string;
  createdAt: string;
}

export interface ListeningHistory {
  id: string;
  userId: string;
  songId: string;
  playedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  songs: Song[];
  playlists: Playlist[];
  invitations: Invitation[];
  favorites: Favorite[];
  listeningHistory: ListeningHistory[];
  settings: {
    systemName: string;
    ownerEmail: string;
    version: string;
  };
}

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), 'data');
const DEFAULT_DB_FILE = path.join(DEFAULT_DATA_DIR, 'db.json');
const TMP_DATA_DIR = path.resolve('/tmp', 'vibevault');
const TMP_DB_FILE = path.join(TMP_DATA_DIR, 'db.json');

export class Database {
  private data: DatabaseSchema;

  constructor() {
    try {
      if (!fs.existsSync(DEFAULT_DATA_DIR)) {
        fs.mkdirSync(DEFAULT_DATA_DIR, { recursive: true });
      }
    } catch {
      // Read-only filesystem, will use /tmp or memory
    }
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    // 1. Check if newer data was written to /tmp in serverless environment
    if (fs.existsSync(TMP_DB_FILE)) {
      try {
        const content = fs.readFileSync(TMP_DB_FILE, 'utf-8');
        return JSON.parse(content);
      } catch (err) {
        console.warn('Notice reading tmp db.json, checking default:', err);
      }
    }

    // 2. Check default bundled db.json
    if (fs.existsSync(DEFAULT_DB_FILE)) {
      try {
        const content = fs.readFileSync(DEFAULT_DB_FILE, 'utf-8');
        return JSON.parse(content);
      } catch (err) {
        console.error('Error reading default db.json, reinitializing:', err);
      }
    }

    const initialData = this.getInitialSeed();
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema): void {
    // Attempt writing to standard location first
    try {
      if (!fs.existsSync(DEFAULT_DATA_DIR)) {
        fs.mkdirSync(DEFAULT_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DEFAULT_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return;
    } catch {
      // Read-only filesystem (e.g. Vercel Serverless / Lambda) -> Persist to /tmp
      try {
        if (!fs.existsSync(TMP_DATA_DIR)) {
          fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch (err2) {
        console.warn('[VibeVault DB] Persistence operating in-memory:', err2);
      }
    }
  }

  public save(): void {
    this.saveData(this.data);
  }

  private getInitialSeed(): DatabaseSchema {
    const ownerId = 'usr_owner_main';
    const initialOwner: User = {
      id: ownerId,
      email: 'owner@vibevault.io',
      passwordHash: hashPassword('owner1234'),
      displayName: 'VibeVault Owner',
      role: 'owner',
      avatarUrl: '',
      createdAt: new Date().toISOString()
    };

    const initialSongs: Song[] = [
      {
        id: 'sng_obsidian_echoes',
        title: 'Obsidian Echoes',
        artist: 'Auraform',
        album: 'Midnight Frequencies',
        genre: 'Ambient Downtempo',
        duration: 24,
        audioFileName: 'obsidian_echoes.wav',
        originalFilename: 'obsidian_echoes.wav',
        fileSize: 2116844,
        mimeType: 'audio/wav',
        artworkUrl: '/src/assets/images/art_midnight_echoes_1791621274995.jpg',
        uploaderId: ownerId,
        createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
      },
      {
        id: 'sng_neon_horizon',
        title: 'Neon Horizon',
        artist: 'Kroma Drive',
        album: 'Analog Dreams',
        genre: 'Synthwave',
        duration: 24,
        audioFileName: 'neon_horizon.wav',
        originalFilename: 'neon_horizon.wav',
        fileSize: 2116844,
        mimeType: 'audio/wav',
        artworkUrl: '/src/assets/images/art_neon_horizon_1791621288838.jpg',
        uploaderId: ownerId,
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
      },
      {
        id: 'sng_midnight_reverie',
        title: 'Midnight Reverie',
        artist: 'Sol & Luna',
        album: 'Resonance Sessions',
        genre: 'Lo-Fi Chill',
        duration: 24,
        audioFileName: 'midnight_reverie.wav',
        originalFilename: 'midnight_reverie.wav',
        fileSize: 2116844,
        mimeType: 'audio/wav',
        artworkUrl: '/src/assets/images/art_curated_vibes_1791621255690.jpg',
        uploaderId: ownerId,
        createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
      }
    ];

    const initialPlaylists: Playlist[] = [
      {
        id: 'pl_late_night_focus',
        ownerId,
        name: 'Late Night Focus',
        description: 'Immersive soundscapes and sonic depth for flow state listening.',
        artworkUrl: '/src/assets/images/art_curated_vibes_1791621255690.jpg',
        isPublicToFriends: true,
        sharedWithUserIds: [],
        trackIds: ['sng_obsidian_echoes', 'sng_neon_horizon', 'sng_midnight_reverie'],
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'pl_private_vault_gems',
        ownerId,
        name: 'Private Vault Archive',
        description: 'Unreleased sessions and studio master cuts reserved exclusively for owner ears.',
        artworkUrl: '/src/assets/images/art_midnight_echoes_1791621274995.jpg',
        isPublicToFriends: false,
        sharedWithUserIds: [],
        trackIds: ['sng_neon_horizon', 'sng_obsidian_echoes'],
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ];

    return {
      users: [initialOwner],
      songs: initialSongs,
      playlists: initialPlaylists,
      invitations: [],
      favorites: [],
      listeningHistory: [],
      settings: {
        systemName: 'VibeVault',
        ownerEmail: 'owner@vibevault.io',
        version: '1.0.0'
      }
    };
  }

  // --- User Queries ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User): void {
    this.data.users.push(user);
    this.save();
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  public deleteUser(id: string): boolean {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    // Also remove from any playlist shares
    for (const pl of this.data.playlists) {
      pl.sharedWithUserIds = pl.sharedWithUserIds.filter(uid => uid !== id);
    }
    this.save();
    return true;
  }

  public hasOwner(): boolean {
    return this.data.users.some(u => u.role === 'owner');
  }

  // --- Song Queries ---
  public getSongs(): Song[] {
    return this.data.songs;
  }

  public findSongById(id: string): Song | undefined {
    return this.data.songs.find(s => s.id === id);
  }

  public addSong(song: Song): void {
    this.data.songs.unshift(song);
    this.save();
  }

  public updateSong(id: string, updates: Partial<Song>): Song | undefined {
    const song = this.findSongById(id);
    if (!song) return undefined;
    Object.assign(song, updates);
    this.save();
    return song;
  }

  public deleteSong(id: string): boolean {
    const index = this.data.songs.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.data.songs.splice(index, 1);
    // Remove from all playlists
    for (const pl of this.data.playlists) {
      pl.trackIds = pl.trackIds.filter(tid => tid !== id);
    }
    // Remove from favorites & history
    this.data.favorites = this.data.favorites.filter(f => f.songId !== id);
    this.data.listeningHistory = this.data.listeningHistory.filter(h => h.songId !== id);
    this.save();
    return true;
  }

  // --- Playlist Queries ---
  public getPlaylists(): Playlist[] {
    return this.data.playlists;
  }

  public findPlaylistById(id: string): Playlist | undefined {
    return this.data.playlists.find(p => p.id === id);
  }

  public addPlaylist(playlist: Playlist): void {
    this.data.playlists.unshift(playlist);
    this.save();
  }

  public updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | undefined {
    const playlist = this.findPlaylistById(id);
    if (!playlist) return undefined;
    Object.assign(playlist, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return playlist;
  }

  public deletePlaylist(id: string): boolean {
    const index = this.data.playlists.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.playlists.splice(index, 1);
    this.save();
    return true;
  }

  // --- Invitations ---
  public getInvitations(): Invitation[] {
    return this.data.invitations;
  }

  public findInvitationByToken(token: string): Invitation | undefined {
    return this.data.invitations.find(i => i.token === token);
  }

  public addInvitation(invitation: Invitation): void {
    this.data.invitations.unshift(invitation);
    this.save();
  }

  public updateInvitation(id: string, updates: Partial<Invitation>): Invitation | undefined {
    const inv = this.data.invitations.find(i => i.id === id);
    if (!inv) return undefined;
    Object.assign(inv, updates);
    this.save();
    return inv;
  }

  public revokeInvitation(id: string): boolean {
    const inv = this.data.invitations.find(i => i.id === id);
    if (!inv) return false;
    inv.status = 'revoked';
    this.save();
    return true;
  }

  // --- Favorites ---
  public getFavorites(userId: string): string[] {
    return this.data.favorites.filter(f => f.userId === userId).map(f => f.songId);
  }

  public toggleFavorite(userId: string, songId: string): boolean {
    const existing = this.data.favorites.findIndex(f => f.userId === userId && f.songId === songId);
    if (existing !== -1) {
      this.data.favorites.splice(existing, 1);
      this.save();
      return false; // Removed
    } else {
      this.data.favorites.push({
        id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        songId,
        createdAt: new Date().toISOString()
      });
      this.save();
      return true; // Added
    }
  }

  // --- Listening History ---
  public getHistory(userId: string, limit = 20): ListeningHistory[] {
    return this.data.listeningHistory
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .slice(0, limit);
  }

  public recordPlay(userId: string, songId: string): void {
    this.data.listeningHistory.unshift({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      songId,
      playedAt: new Date().toISOString()
    });
    // Keep max 200 items per user
    if (this.data.listeningHistory.length > 500) {
      this.data.listeningHistory = this.data.listeningHistory.slice(0, 500);
    }
    this.save();
  }
}

export const db = new Database();
