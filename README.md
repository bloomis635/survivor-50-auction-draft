# Survivor 50 Auction Draft

A real-time, multiplayer web application for conducting live auction drafts of Survivor contestants. Built with Next.js, Socket.IO, and Prisma.

## Features

- **Multi-player Support**: Multiple players can join from different devices
- **Real-time Auction**: Live bidding with server-authoritative timer
- **Host Controls**: Host can manage contestants, settings, and auction flow
- **Budget Management**: Track player budgets and roster assignments
- **State Persistence**: Draft state persists across page refreshes
- **Mobile Friendly**: Responsive design works on phones and tablets

## How It Works

### Creating a Draft

1. Visit the home page
2. Click "Create New Draft Room"
3. Share the room code or URL with players
4. You'll be the host with admin controls

### Joining a Draft

1. Get the room code from your host
2. Enter the code on the home page and click "Join Room"
3. Enter your name to join the lobby

### Setting Up (Host)

In the lobby, the host can:

- **Contestants Pre-Loaded**: All 24 Survivor 50 contestants are automatically loaded when you create a room! Complete with photos and bios.
  - You can add more contestants with "+ Add Contestant" if desired
  - You can delete contestants you don't want to include in the draft
- **Configure Settings**:
  - Starting Budget: Amount each player starts with (default: $100)
  - Minimum Bid Increment: Minimum amount bids must increase (default: $1)
  - Auction Timer: Seconds for each auction (default: 30)
- **Start Draft**: Once contestants are added and players have joined, click "Start Draft"

### Running the Auction (Host)

1. Select an available contestant from the list
2. Click "Nominate Selected Contestant"
3. Click "Start Auction" to begin the timer
4. Players can now place bids
5. When the timer reaches zero, the highest bidder wins
6. Repeat for remaining contestants

### Bidding (Players)

- Use quick bid buttons (+$1, +$5, +$10) for fast bidding
- Enter a custom amount and click "Bid" for specific bids
- Your remaining budget is displayed at the top
- You can only bid amounts you can afford
- Bids must be at least the current bid + minimum increment

### Draft Complete

- When all contestants are drafted, the results screen shows:
  - Each player's roster and spending
  - Complete draft order
  - Export option to copy results as text

## Technical Details

### Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **Socket.IO** for real-time WebSocket communication
- **Prisma** with SQLite for persistence
- **Tailwind CSS** for styling

### Architecture

- Server-authoritative state management
- All game rules enforced on the server
- Atomic updates prevent race conditions
- Client-side state is read-only
- WebSocket broadcasts for instant updates

### Data Persistence

The app uses SQLite (via Prisma) to persist:
- Room configurations
- Player information
- Contestant data
- Auction state

State survives:
- Server restarts
- Player disconnections
- Page refreshes

Players reconnect automatically using localStorage tokens.

## Installation

### Prerequisites

- Node.js 18 or higher
- npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize the database:
   ```bash
   npx prisma migrate dev --name init
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

### Production Build

```bash
npm run build
npm start
```

## Deployment

### Recommended Platforms

- **Railway**: Easy deployment with persistent storage
- **Render**: Free tier available with SQLite support
- **Fly.io**: Global edge deployment

### Environment Variables

No environment variables required for basic operation. The app uses:
- SQLite database at `prisma/dev.db`
- Port 3000 (configurable via `PORT` env var)

### Deployment Steps

1. Push your code to GitHub
2. Connect your repo to Railway/Render/Fly
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Ensure persistent storage is enabled for the `prisma/` directory

### Important Notes

- The SQLite database file must persist between deployments
- Configure volume/disk storage on your hosting platform
- For Railway: Add a volume mounted to `/app/prisma`
- For Render: Use a persistent disk
- For high-traffic production, consider PostgreSQL instead of SQLite

## Development

### Project Structure

```
├── app/
│   ├── api/rooms/create/    # Room creation API
│   ├── room/[roomId]/       # Room page
│   └── page.tsx             # Home page
├── components/
│   ├── Lobby.tsx            # Lobby UI
│   ├── Auction.tsx          # Auction UI
│   └── Results.tsx          # Results UI
├── lib/
│   ├── types.ts             # TypeScript types
│   ├── prisma.ts            # Prisma client
│   ├── room-manager.ts      # Room state management
│   └── socket-handler.ts    # Socket.IO event handlers
├── prisma/
│   └── schema.prisma        # Database schema
└── server.ts                # Custom Next.js server with Socket.IO
```

### Key Design Decisions

1. **Server Authority**: All game logic runs on the server. Clients are "dumb terminals" that display state and send actions.

2. **Single Source of Truth**: The server maintains one canonical room state, stored in SQLite and cached in memory.

3. **Race Condition Handling**: Bid validation happens server-side with timestamp checks to prevent late bids.

4. **Reconnection**: Players store their ID in localStorage. On disconnect/refresh, they reconnect with the same ID to restore their session.

5. **Timer Implementation**: Server runs the timer and broadcasts updates. endTime is authoritative to prevent client clock issues.

## Troubleshooting

### Players Can't Join

- Verify the room code is correct (6 characters, case-insensitive)
- Check that the server is running
- Try refreshing the page

### Bids Not Going Through

- Ensure the auction is running (timer is active)
- Check that your bid meets the minimum (current bid + increment)
- Verify you have sufficient budget
- Watch for "Auction has ended" message if timer expired

### State Not Persisting

- Ensure the database file has write permissions
- Check that Prisma migrations have run
- Verify SQLite is working: `npx prisma studio`

### Socket Connection Issues

- Check browser console for connection errors
- Verify no firewall is blocking WebSocket connections
- Ensure server is running on the expected port

## Future Enhancements

Potential features for future versions:

- User authentication and saved drafts
- Multiple draft formats (snake draft, salary cap)
- Trade functionality during draft
- Draft history and analytics
- Admin panel for managing multiple rooms
- Undo last auction (host control)
- Pause/resume timer (host control)
- Chat between players
- Auction bid history log
- Draft timer presets (15s, 30s, 60s, 90s)
- Bulk contestant import from CSV/JSON

## License

MIT

## Contributing

This is an MVP built for Survivor 50. Feel free to fork and adapt for your own draft needs!
