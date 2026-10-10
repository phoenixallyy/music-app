# VibeVault — Private Music Streaming Web App

VibeVault is a private personal music streaming web application inspired by the fluid usability of Spotify, Apple Music, and YouTube Music. It offers secure audio uploads, lossless streaming with HTTP 206 range requests, custom playlist sequencing, friend invitation management with expiring tokens, and anti-ripping download prevention.

---

## 1. Key Features

- **Personal Music Library & Uploads (Owner Only)**:
  - Drag-and-drop audio file uploader supporting MP3, WAV, M4A, FLAC, AAC, and OGG.
  - Automatic duration calculation and metadata tag editing (Title, Artist, Album, Genre, Artwork).
  - Storage usage calculation and deletion safety warnings when tracks are used in playlists.
- **Custom Playlists**:
  - Create, reorder, duplicate, and delete playlists with bespoke artwork and descriptions.
  - Granular visibility control: "Public to Friends" or "Private to Owner".
  - Add or remove tracks without deleting the underlying master audio files.
- **Friends & Circles Sharing**:
  - Generate secure, time-expiring invitation links with pre-assigned playlist permissions.
  - Friend listener accounts can stream authorized sets but cannot upload, edit, or delete tracks.
  - Owner can inspect registered friends, modify playlist permissions, or revoke friend access at any time.
- **Protected Audio Streaming & Download Prevention**:
  - Files are stored in private server storage with no permanent public URLs.
  - Dedicated `/api/stream/:songId` endpoint validates tokenized sessions and user permissions before serving bytes.
  - Full **HTTP 206 Partial Content** range request support for smooth scrubbing and seeking.
  - Browser download controls, context menus, and direct file download links are disabled.
- **Global Persistent Player**:
  - Persistent bottom audio dock with expandable full-screen immersive view.
  - Scrubber with elapsed and remaining timestamps, repeat (off / all / one), shuffle, volume/mute, and queue drawer.
  - Uninterrupted audio playback across page navigation.

---

## 2. Security & Role-Based Access Control (RBAC)

| Capability | Owner / Admin | Friend / Listener |
| :--- | :---: | :---: |
| Upload audio masters | Yes | No |
| Edit & delete library tracks | Yes | No |
| Create, edit & delete playlists | Yes | No |
| Invite friends & revoke access | Yes | No |
| Stream authorized tracks | Yes | Yes (shared sets only) |
| Search & explore shared music | Yes | Yes |
| Favorite / Like songs | Yes | Yes |
| Direct download audio file | No | No |

---

## 3. Architecture & File Structure

```
├── data/
│   ├── audio/              # Private storage directory for audio master files
│   ├── artwork/            # Private artwork storage
│   └── db.json             # Persistent database store
├── server/
│   ├── audioGenerator.ts   # Synthesizer generating initial playable seed audio
│   ├── auth.ts             # HMAC-SHA256 token signing and PBKDF2 password hashing
│   ├── db.ts               # Database layer with queries and relational operations
│   └── routes.ts           # REST API endpoints for auth, library, streaming, playlists, invites
├── src/
│   ├── assets/images/      # High-fidelity visual assets and album artwork
│   ├── components/         # GlobalPlayer, Navbar, Sidebar, SongRow, PlaylistCard, Modals
│   ├── context/            # AuthContext, PlayerContext
│   ├── pages/              # LandingPage, HomePage, ExplorePage, LibraryPage, PlaylistPage, FriendsPage
│   ├── services/api.ts     # Client fetch wrapper with Authorization Bearer injection
│   └── types/index.ts      # Shared TypeScript data models
├── firebase-blueprint.json # Formal intermediate representation schema
├── firestore.rules         # Hardened Zero-Trust Firestore security rules
└── server.ts               # Express server mounted with Vite middleware on port 3000
```

---

## 4. Default Credentials & Quick Testing

- **Owner Account**:
  - Email: `owner@vibevault.io`
  - Password: `owner1234`
  - *(Alternatively, clicking "Owner Demo" in the top bar instantly authenticates you as the administrator)*
- **Friend Account**:
  - Navigate to **Vault Controls > Friends & Sharing** as the owner.
  - Click **Invite New Friend**, select playlists to grant, and click **Generate Invite**.
  - Open the generated link in a new incognito window to experience the listener role.

---

## 5. Deployment Options

### Option A: Full-Stack Node.js / Docker
1. Install dependencies: `npm install`
2. Build client: `npm run build`
3. Launch server: `npm start` (Runs Express serving `/dist` and `/api` on port 3000)

### Option B: Firebase Hosting & Cloud Functions
1. Deploy rules: Run `firebase deploy --only firestore:rules` using the included `firestore.rules`.
2. Connect Firebase Auth and Cloud Storage for private bucket streaming via signed URLs or Cloud Function range streaming.
