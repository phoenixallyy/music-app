import { User, Song, Playlist, Invitation, FriendUser } from '../types';

const API_BASE = '/api';

let memoryToken: string | null = null;

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem('vibevault_token') || memoryToken;
  } catch {
    return memoryToken;
  }
}

export function setStoredToken(token: string): void {
  memoryToken = token;
  try {
    localStorage.setItem('vibevault_token', token);
  } catch {
    // In-memory fallback retained
  }
}

let memoryUser: User | null = null;

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('vibevault_user');
    return raw ? JSON.parse(raw) : memoryUser;
  } catch {
    return memoryUser;
  }
}

export function setStoredUser(user: User): void {
  memoryUser = user;
  try {
    localStorage.setItem('vibevault_user', JSON.stringify(user));
  } catch {
    // In-memory fallback
  }
}

export function clearStoredUser(): void {
  memoryUser = null;
  try {
    localStorage.removeItem('vibevault_user');
  } catch {
    // Cleared
  }
}

export function clearStoredToken(): void {
  memoryToken = null;
  clearStoredUser();
  try {
    localStorage.removeItem('vibevault_token');
  } catch {
    // In-memory cleared
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(data: { email: string; password: string; displayName: string; inviteToken?: string }) {
    return request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }) {
    return request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async loginDemoOwner() {
    return request<{ user: User; token: string }>('/auth/demo-owner', {
      method: 'POST',
    });
  },

  async getMe() {
    return request<{ user: User }>('/auth/me');
  },

  async updateProfile(data: { displayName?: string; avatarUrl?: string }) {
    return request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async forgotPassword(email: string) {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Songs
  async getSongs() {
    return request<{ songs: Song[] }>('/songs');
  },

  async uploadSong(formData: FormData) {
    return request<{ message: string; song: Song }>('/songs/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async updateSong(id: string, data: Partial<Song>) {
    return request<{ message: string; song: Song }>(`/songs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSong(id: string) {
    return request<{ message: string }>(`/songs/${id}`, {
      method: 'DELETE',
    });
  },

  getStreamUrl(songId: string): string {
    const token = getStoredToken();
    return `${API_BASE}/stream/${songId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  // Playlists
  async getPlaylists() {
    return request<{ playlists: Playlist[] }>('/playlists');
  },

  async getPlaylist(id: string) {
    return request<{ playlist: Playlist; tracks: Song[] }>(`/playlists/${id}`);
  },

  async createPlaylist(data: { name: string; description?: string; artworkUrl?: string; isPublicToFriends?: boolean; sharedWithUserIds?: string[] }) {
    return request<{ message: string; playlist: Playlist }>('/playlists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePlaylist(id: string, data: Partial<Playlist>) {
    return request<{ message: string; playlist: Playlist }>(`/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePlaylist(id: string) {
    return request<{ message: string }>(`/playlists/${id}`, {
      method: 'DELETE',
    });
  },

  async addTrackToPlaylist(playlistId: string, songId: string) {
    return request<{ message: string; trackIds: string[] }>(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ songId }),
    });
  },

  async removeTrackFromPlaylist(playlistId: string, songId: string) {
    return request<{ message: string; trackIds: string[] }>(`/playlists/${playlistId}/tracks/${songId}`, {
      method: 'DELETE',
    });
  },

  async reorderPlaylistTracks(playlistId: string, trackIds: string[]) {
    return request<{ message: string; trackIds: string[] }>(`/playlists/${playlistId}/tracks/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ trackIds }),
    });
  },

  async duplicatePlaylist(playlistId: string) {
    return request<{ message: string; playlist: Playlist }>(`/playlists/${playlistId}/duplicate`, {
      method: 'POST',
    });
  },

  // Invitations & Friends
  async getInvitations() {
    return request<{ invitations: Invitation[] }>('/invitations');
  },

  async createInvitation(data: { email: string; assignedPlaylistIds: string[]; expirationDays?: number }) {
    return request<{ message: string; invitation: Invitation }>('/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async revokeInvitation(id: string) {
    return request<{ message: string }>(`/invitations/${id}`, {
      method: 'DELETE',
    });
  },

  async verifyInvitation(token: string) {
    return request<{ email: string; expiresAt: string; playlists: { id: string; name: string; artworkUrl: string }[] }>(`/invitations/verify/${token}`);
  },

  async getFriends() {
    return request<{ friends: FriendUser[] }>('/friends');
  },

  async updateFriendPermissions(userId: string, playlistIds: string[]) {
    return request<{ message: string }>(`/friends/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ playlistIds }),
    });
  },

  async revokeFriend(userId: string) {
    return request<{ message: string }>(`/friends/${userId}`, {
      method: 'DELETE',
    });
  },

  // Favorites & History
  async getFavorites() {
    return request<{ favorites: string[] }>('/favorites');
  },

  async toggleFavorite(songId: string) {
    return request<{ added: boolean; songId: string }>(`/favorites/${songId}`, {
      method: 'POST',
    });
  },

  async getHistory() {
    return request<{ history: { id: string; songId: string; playedAt: string; song: Song }[] }>('/history');
  },

  async recordPlay(songId: string) {
    return request<{ success: boolean }>(`/history/${songId}`, {
      method: 'POST',
    });
  },
};
