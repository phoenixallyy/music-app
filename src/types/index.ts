export type UserRole = 'owner' | 'friend' | 'demo';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
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

export interface FriendUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  accessiblePlaylists: { id: string; name: string }[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
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
}
