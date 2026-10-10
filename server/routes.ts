import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, User, Song, Playlist, Invitation } from './db.js';
import { hashPassword, verifyPassword, createToken, verifyToken, generateRandomToken, TokenPayload } from './auth.js';

const router = express.Router();

const AUDIO_DIR = path.resolve(process.cwd(), 'data', 'audio');
const ARTWORK_DIR = path.resolve(process.cwd(), 'data', 'artwork');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
if (!fs.existsSync(ARTWORK_DIR)) fs.mkdirSync(ARTWORK_DIR, { recursive: true });

// Multer storage for audio uploads
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AUDIO_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `track_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: audioStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max per audio file
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format (${ext}). Supported: MP3, WAV, M4A, AAC, FLAC, OGG.`));
    }
  }
});

// Middleware for authentication
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.user = payload;
  next();
}

export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Restricted area. Administrator / Owner privilege required.' });
  }
  next();
}

// ----------------- AUTHENTICATION ROUTES -----------------

// Register
router.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, displayName, inviteToken } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and display name are required.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists.' });
  }

  const usersCount = db.getUsers().length;
  let assignedRole: 'owner' | 'friend' = 'friend';
  let verifiedInvite: Invitation | undefined;

  // First user or owner email from metadata is owner
  if (usersCount === 0 || email.toLowerCase() === 'phoenixallyy@gmail.com') {
    assignedRole = 'owner';
  } else if (inviteToken) {
    verifiedInvite = db.findInvitationByToken(inviteToken);
    if (!verifiedInvite || verifiedInvite.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation token is invalid, expired, or already used.' });
    }
    if (new Date(verifiedInvite.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Invitation has expired. Please ask the owner for a new invite.' });
    }
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newUser: User = {
    id: userId,
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    displayName: displayName.trim(),
    role: assignedRole,
    avatarUrl: '',
    createdAt: new Date().toISOString()
  };

  db.addUser(newUser);

  // If invited, link assigned playlists
  if (verifiedInvite) {
    db.updateInvitation(verifiedInvite.id, {
      status: 'accepted',
      acceptedByUserId: userId
    });

    for (const plId of verifiedInvite.assignedPlaylistIds) {
      const pl = db.findPlaylistById(plId);
      if (pl && !pl.sharedWithUserIds.includes(userId)) {
        pl.sharedWithUserIds.push(userId);
        db.updatePlaylist(pl.id, { sharedWithUserIds: pl.sharedWithUserIds });
      }
    }
  }

  const token = createToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    displayName: newUser.displayName
  });

  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl
    },
    token
  });
});

// Dedicated Demo Owner Login
router.post('/auth/demo-owner', (_req: Request, res: Response) => {
  let owner = db.getUsers().find(u => u.role === 'owner');
  if (!owner) {
    owner = {
      id: 'usr_owner_main',
      email: 'owner@vibevault.io',
      passwordHash: hashPassword('owner1234'),
      displayName: 'VibeVault Owner',
      role: 'owner',
      avatarUrl: '',
      createdAt: new Date().toISOString()
    };
    db.addUser(owner);
  }

  const token = createToken({
    userId: owner.id,
    email: owner.email,
    role: owner.role,
    displayName: owner.displayName
  });

  res.json({
    user: {
      id: owner.id,
      email: owner.email,
      displayName: owner.displayName,
      role: owner.role,
      avatarUrl: owner.avatarUrl
    },
    token
  });
});

// Login
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  let user = db.findUserByEmail(cleanEmail);

  // If user is owner@vibevault.io and doesn't exist or has mismatched seed hash, ensure valid
  if (cleanEmail === 'owner@vibevault.io' && (!user || !verifyPassword(password, user.passwordHash))) {
    if (password === 'owner1234') {
      if (!user) {
        user = {
          id: 'usr_owner_main',
          email: 'owner@vibevault.io',
          passwordHash: hashPassword('owner1234'),
          displayName: 'VibeVault Owner',
          role: 'owner',
          avatarUrl: '',
          createdAt: new Date().toISOString()
        };
        db.addUser(user);
      } else {
        user.passwordHash = hashPassword('owner1234');
        db.updateUser(user.id, { passwordHash: user.passwordHash });
      }
    }
  }

  // If the owner from metadata (phoenixallyy@gmail.com) logs in for the first time, auto-provision
  if (cleanEmail === 'phoenixallyy@gmail.com' && !user) {
    user = {
      id: `usr_owner_${Date.now()}`,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      displayName: 'Vault Owner',
      role: 'owner',
      avatarUrl: '',
      createdAt: new Date().toISOString()
    };
    db.addUser(user);
  }

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email address or password. For demo access, use owner@vibevault.io / owner1234 or click "Owner Demo".' });
  }

  const token = createToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl
    },
    token
  });
});

// Get current user profile
router.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl
    }
  });
});

// Update Profile
router.put('/auth/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { displayName, avatarUrl } = req.body;
  const updates: Partial<User> = {};
  if (displayName) updates.displayName = String(displayName).trim();
  if (avatarUrl !== undefined) updates.avatarUrl = String(avatarUrl).trim();

  const updated = db.updateUser(req.user!.userId, updates);
  if (!updated) return res.status(404).json({ error: 'User not found.' });

  res.json({
    user: {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      role: updated.role,
      avatarUrl: updated.avatarUrl
    }
  });
});

// Password reset simulation
router.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = db.findUserByEmail(email);
  if (!user) {
    return res.json({ message: 'If this email exists, password reset instructions have been dispatched.' });
  }
  res.json({
    message: 'Password reset link sent. (For demonstration in private mode, you can log in with your credentials or update your password).'
  });
});

// ----------------- MUSIC LIBRARY & SONGS -----------------

// List Songs accessible to user
router.get('/songs', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const allSongs = db.getSongs();

  if (user.role === 'owner') {
    return res.json({ songs: allSongs });
  }

  // Listener / Friend: Only return songs that belong to at least one playlist shared with them
  const accessiblePlaylists = db.getPlaylists().filter(pl =>
    pl.isPublicToFriends || pl.sharedWithUserIds.includes(user.userId)
  );

  const accessibleTrackIds = new Set<string>();
  for (const pl of accessiblePlaylists) {
    for (const tid of pl.trackIds) {
      accessibleTrackIds.add(tid);
    }
  }

  const friendSongs = allSongs.filter(s => accessibleTrackIds.has(s.id));
  res.json({ songs: friendSongs });
});

// Upload song (Owner only)
router.post('/songs/upload', authenticate, requireOwner, upload.single('audio'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided.' });
  }

  const { title, artist, album, genre, duration, artworkUrl } = req.body;
  const filename = req.file.filename;
  const originalName = req.file.originalname;

  // Derive title from filename if not explicitly provided
  const parsedTitle = (title && title.trim()) || path.parse(originalName).name.replace(/[-_]/g, ' ');
  const parsedArtist = (artist && artist.trim()) || 'Unknown Artist';
  const parsedAlbum = (album && album.trim()) || 'Singles';
  const parsedGenre = (genre && genre.trim()) || 'Ambient';
  const parsedDuration = Number(duration) > 0 ? Number(duration) : 180; // Estimated default if not measured in client

  const newSong: Song = {
    id: `sng_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: parsedTitle,
    artist: parsedArtist,
    album: parsedAlbum,
    genre: parsedGenre,
    duration: parsedDuration,
    audioFileName: filename,
    originalFilename: originalName,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    artworkUrl: artworkUrl || '/src/assets/images/art_curated_vibes_1791621255690.jpg',
    uploaderId: req.user!.userId,
    createdAt: new Date().toISOString()
  };

  db.addSong(newSong);

  res.status(201).json({
    message: 'Song uploaded successfully',
    song: newSong
  });
});

// Update song details (Owner only)
router.put('/songs/:id', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { title, artist, album, genre, artworkUrl, duration } = req.body;
  const song = db.findSongById(req.params.id);
  if (!song) {
    return res.status(404).json({ error: 'Song not found.' });
  }

  const updates: Partial<Song> = {};
  if (title) updates.title = title.trim();
  if (artist) updates.artist = artist.trim();
  if (album) updates.album = album.trim();
  if (genre) updates.genre = genre.trim();
  if (artworkUrl) updates.artworkUrl = artworkUrl.trim();
  if (duration && Number(duration) > 0) updates.duration = Number(duration);

  const updated = db.updateSong(song.id, updates);
  res.json({ message: 'Song updated', song: updated });
});

// Delete song (Owner only)
router.delete('/songs/:id', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const song = db.findSongById(req.params.id);
  if (!song) {
    return res.status(404).json({ error: 'Song not found.' });
  }

  // Remove audio file from disk
  const filePath = path.join(AUDIO_DIR, song.audioFileName);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Could not delete audio file on disk:', e);
    }
  }

  db.deleteSong(song.id);
  res.json({ message: 'Song and references removed successfully.' });
});

// ----------------- PROTECTED AUDIO STREAMING -----------------

// Authorized Streaming with HTTP Range requests
router.get('/stream/:songId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { songId } = req.params;
  const song = db.findSongById(songId);

  if (!song) {
    return res.status(404).json({ error: 'Track not found.' });
  }

  // Authorization check:
  // Owner can stream anything.
  // Friends can only stream if the song is included in a playlist shared with them.
  if (req.user!.role !== 'owner') {
    const accessiblePlaylists = db.getPlaylists().filter(pl =>
      (pl.isPublicToFriends || pl.sharedWithUserIds.includes(req.user!.userId)) &&
      pl.trackIds.includes(song.id)
    );

    if (accessiblePlaylists.length === 0) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to stream this song.' });
    }
  }

  const filePath = path.join(AUDIO_DIR, song.audioFileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found on storage server.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Protect against download prompts; enforce inline playback
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Handle Range Header for smooth seeking (HTTP 206 Partial Content)
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
      return res.end();
    }

    const chunksize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': song.mimeType || 'audio/mpeg',
    });

    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': song.mimeType || 'audio/mpeg',
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// ----------------- PLAYLIST MANAGEMENT -----------------

// Get playlists
router.get('/playlists', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const allPlaylists = db.getPlaylists();

  if (user.role === 'owner') {
    return res.json({ playlists: allPlaylists });
  }

  // Listener / Friend: Only return playlists that are public or shared with them
  const accessible = allPlaylists.filter(pl =>
    pl.isPublicToFriends || pl.sharedWithUserIds.includes(user.userId)
  );

  res.json({ playlists: accessible });
});

// Get playlist by ID
router.get('/playlists/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const playlist = db.findPlaylistById(req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  const user = req.user!;
  if (user.role !== 'owner' && !playlist.isPublicToFriends && !playlist.sharedWithUserIds.includes(user.userId)) {
    return res.status(403).json({ error: 'Access denied to this playlist.' });
  }

  // Populate songs in order
  const allSongs = db.getSongs();
  const tracks = playlist.trackIds
    .map(tid => allSongs.find(s => s.id === tid))
    .filter((s): s is Song => Boolean(s));

  res.json({ playlist, tracks });
});

// Create Playlist (Owner only)
router.post('/playlists', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { name, description, artworkUrl, isPublicToFriends, sharedWithUserIds } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Playlist name is required.' });
  }

  const newPlaylist: Playlist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ownerId: req.user!.userId,
    name: name.trim(),
    description: description ? description.trim() : '',
    artworkUrl: artworkUrl || '/src/assets/images/art_curated_vibes_1791621255690.jpg',
    isPublicToFriends: Boolean(isPublicToFriends),
    sharedWithUserIds: Array.isArray(sharedWithUserIds) ? sharedWithUserIds : [],
    trackIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addPlaylist(newPlaylist);
  res.status(201).json({ message: 'Playlist created', playlist: newPlaylist });
});

// Update Playlist (Owner only)
router.put('/playlists/:id', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const playlist = db.findPlaylistById(req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  const { name, description, artworkUrl, isPublicToFriends, sharedWithUserIds } = req.body;
  const updates: Partial<Playlist> = {};

  if (name) updates.name = name.trim();
  if (description !== undefined) updates.description = description.trim();
  if (artworkUrl) updates.artworkUrl = artworkUrl.trim();
  if (isPublicToFriends !== undefined) updates.isPublicToFriends = Boolean(isPublicToFriends);
  if (Array.isArray(sharedWithUserIds)) updates.sharedWithUserIds = sharedWithUserIds;

  const updated = db.updatePlaylist(playlist.id, updates);
  res.json({ message: 'Playlist updated', playlist: updated });
});

// Delete Playlist (Owner only)
router.delete('/playlists/:id', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deletePlaylist(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Playlist not found.' });
  res.json({ message: 'Playlist deleted.' });
});

// Add track to playlist (Owner only)
router.post('/playlists/:id/tracks', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { songId } = req.body;
  const playlist = db.findPlaylistById(req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  const song = db.findSongById(songId);
  if (!song) return res.status(404).json({ error: 'Song not found.' });

  if (!playlist.trackIds.includes(songId)) {
    playlist.trackIds.push(songId);
    db.updatePlaylist(playlist.id, { trackIds: playlist.trackIds });
  }

  res.json({ message: 'Track added to playlist', trackIds: playlist.trackIds });
});

// Remove track from playlist (Owner only)
router.delete('/playlists/:id/tracks/:songId', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const playlist = db.findPlaylistById(req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  playlist.trackIds = playlist.trackIds.filter(tid => tid !== req.params.songId);
  db.updatePlaylist(playlist.id, { trackIds: playlist.trackIds });

  res.json({ message: 'Track removed from playlist', trackIds: playlist.trackIds });
});

// Reorder playlist tracks (Owner only)
router.put('/playlists/:id/tracks/reorder', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { trackIds } = req.body;
  if (!Array.isArray(trackIds)) return res.status(400).json({ error: 'Invalid track order array.' });

  const playlist = db.findPlaylistById(req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  db.updatePlaylist(playlist.id, { trackIds });
  res.json({ message: 'Playlist tracks reordered', trackIds });
});

// Duplicate playlist (Owner only)
router.post('/playlists/:id/duplicate', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const playlist = db.findPlaylistById(req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  const dup: Playlist = {
    ...playlist,
    id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${playlist.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addPlaylist(dup);
  res.status(201).json({ message: 'Playlist duplicated', playlist: dup });
});

// ----------------- FRIENDS & SHARING MANAGEMENT -----------------

// Get all invitations (Owner only)
router.get('/invitations', authenticate, requireOwner, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ invitations: db.getInvitations() });
});

// Create invitation (Owner only)
router.post('/invitations', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { email, assignedPlaylistIds, expirationDays = 7 } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid friend email address is required.' });
  }

  const token = generateRandomToken(24);
  const expiresAt = new Date(Date.now() + Number(expirationDays) * 24 * 3600 * 1000).toISOString();

  const invite: Invitation = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    token,
    email: email.trim().toLowerCase(),
    assignedPlaylistIds: Array.isArray(assignedPlaylistIds) ? assignedPlaylistIds : [],
    createdBy: req.user!.userId,
    expiresAt,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.addInvitation(invite);
  res.status(201).json({ message: 'Invitation generated', invitation: invite });
});

// Revoke invitation (Owner only)
router.delete('/invitations/:id', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const revoked = db.revokeInvitation(req.params.id);
  if (!revoked) return res.status(404).json({ error: 'Invitation not found.' });
  res.json({ message: 'Invitation revoked.' });
});

// Verify invitation token (Public)
router.get('/invitations/verify/:token', (req: Request, res: Response) => {
  const invite = db.findInvitationByToken(req.params.token);
  if (!invite) {
    return res.status(404).json({ error: 'Invitation link does not exist.' });
  }

  if (invite.status !== 'pending') {
    return res.status(400).json({ error: `This invitation is ${invite.status}.` });
  }

  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: 'This invitation has expired.' });
  }

  const playlists = db.getPlaylists()
    .filter(pl => invite.assignedPlaylistIds.includes(pl.id))
    .map(pl => ({ id: pl.id, name: pl.name, artworkUrl: pl.artworkUrl }));

  res.json({
    email: invite.email,
    expiresAt: invite.expiresAt,
    playlists
  });
});

// List all registered friends and their playlist permissions (Owner only)
router.get('/friends', authenticate, requireOwner, (_req: AuthenticatedRequest, res: Response) => {
  const friends = db.getUsers().filter(u => u.role === 'friend');
  const playlists = db.getPlaylists();

  const result = friends.map(friend => {
    const accessiblePlaylists = playlists.filter(pl =>
      pl.isPublicToFriends || pl.sharedWithUserIds.includes(friend.id)
    ).map(pl => ({ id: pl.id, name: pl.name }));

    return {
      id: friend.id,
      email: friend.email,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
      createdAt: friend.createdAt,
      accessiblePlaylists
    };
  });

  res.json({ friends: result });
});

// Update friend playlist permissions (Owner only)
router.put('/friends/:userId/permissions', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const { playlistIds } = req.body;
  const friendId = req.params.userId;
  const friend = db.findUserById(friendId);

  if (!friend || friend.role !== 'friend') {
    return res.status(404).json({ error: 'Friend user not found.' });
  }

  if (!Array.isArray(playlistIds)) {
    return res.status(400).json({ error: 'playlistIds array is required.' });
  }

  // Update sharedWithUserIds across all playlists
  const playlists = db.getPlaylists();
  for (const pl of playlists) {
    const shouldHave = playlistIds.includes(pl.id);
    const hasAlready = pl.sharedWithUserIds.includes(friendId);

    if (shouldHave && !hasAlready) {
      pl.sharedWithUserIds.push(friendId);
      db.updatePlaylist(pl.id, { sharedWithUserIds: pl.sharedWithUserIds });
    } else if (!shouldHave && hasAlready) {
      pl.sharedWithUserIds = pl.sharedWithUserIds.filter(id => id !== friendId);
      db.updatePlaylist(pl.id, { sharedWithUserIds: pl.sharedWithUserIds });
    }
  }

  res.json({ message: 'Friend permissions updated successfully.' });
});

// Revoke friend access completely (Owner only)
router.delete('/friends/:userId', authenticate, requireOwner, (req: AuthenticatedRequest, res: Response) => {
  const friend = db.findUserById(req.params.userId);
  if (!friend || friend.role === 'owner') {
    return res.status(400).json({ error: 'Cannot remove owner or non-existent user.' });
  }

  db.deleteUser(friend.id);
  res.json({ message: 'Friend access revoked and account deleted.' });
});

// ----------------- FAVORITES & LISTENING HISTORY -----------------

// Get favorites
router.get('/favorites', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const songIds = db.getFavorites(req.user!.userId);
  res.json({ favorites: songIds });
});

// Toggle favorite
router.post('/favorites/:songId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const added = db.toggleFavorite(req.user!.userId, req.params.songId);
  res.json({ added, songId: req.params.songId });
});

// Get history
router.get('/history', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const history = db.getHistory(req.user!.userId, 20);
  const songs = db.getSongs();
  const populated = history.map(item => ({
    ...item,
    song: songs.find(s => s.id === item.songId)
  })).filter(item => Boolean(item.song));

  res.json({ history: populated });
});

// Record play
router.post('/history/:songId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.recordPlay(req.user!.userId, req.params.songId);
  res.json({ success: true });
});

export default router;
