# PeerPoker

A peer-to-peer planning poker application for agile teams.

## Features

- 🔗 P2P connection - No central server stores your data
- 🎴 Planning poker voting with Fibonacci sequence
- 👥 Real-time participant synchronization
- 🎉 Automatic consensus detection
- 📋 One-click copy of agreed estimates

## Usage

1. Enter your name and click "Start Game"
2. Share your link with team members
3. Wait for everyone to join
4. Select your estimate from the cards
5. Click "Reveal Cards" when everyone has voted
6. Click "New Round" to start over

## Tech Stack

- SvelteKit 2.x
- PeerJS (WebRTC)
- Cloudflare Pages
- TypeScript

## Development

```bash
npm install
npm run dev
```

Signaling Server
This app requires a PeerJS signaling server. See peerpoker-signaling-server.

License
MIT