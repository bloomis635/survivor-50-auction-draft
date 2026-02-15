# 🏝️ START HERE - Survivor 50 Auction Draft

Welcome! You have a fully functional multiplayer auction draft app. This guide will get you running in under 5 minutes.

## ⚡ Quick Start (Copy & Paste)

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm run dev
```

That's it! Open http://localhost:3000 and start drafting! 🎉

## 🎯 Your First Draft (5 Minutes)

### Step 1: Create a Room
1. Open http://localhost:3000
2. Click **"Create New Draft Room"**
3. You'll see a 6-character room code like `ABC123`

### Step 2: Contestants Auto-Loaded!
**Good news!** All 24 Survivor 50 contestants with photos and bios are **automatically loaded** when you create a room!

No import needed - they're already there! 🔥

### Step 3: Test with Multiple Players
- Open the same URL in an incognito window or different browser
- Join with the room code
- Enter a different name
- Watch real-time updates! ⚡

### Step 4: Start the Draft
1. As host, click **"Start Draft"**
2. Select a contestant
3. Click **"Nominate Selected Contestant"**
4. Click **"Start Auction"**
5. Place bids from different browsers
6. Watch the timer count down!

## 📚 Documentation Index

Choose your path:

### 🚀 Just Want to Use It?
- **[QUICKSTART.md](./QUICKSTART.md)** - Detailed 5-minute setup guide
- **[survivor50_cast.json](./survivor50_cast.json)** - All 24 contestants pre-loaded

### 🔧 Want to Understand How It Works?
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Visual system diagrams
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete feature list
- **[README.md](./README.md)** - Full documentation

### 🧪 Want to Test It?
- **[TESTING.md](./TESTING.md)** - Manual testing checklist

### 🚀 Ready to Deploy?
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Railway, Render, Fly.io guides

## 🎮 What You Can Do

This is a fully functional MVP with:
- ✅ **Real-time multiplayer** - Players join from any device
- ✅ **Live auctions** - Server-authoritative 30-second timer
- ✅ **Budget tracking** - Each player starts with $100
- ✅ **Automatic winner assignment** - Highest bid wins at timer end
- ✅ **State persistence** - Refresh without losing data
- ✅ **Reconnection** - Players can disconnect and rejoin
- ✅ **24 Survivor contestants** - Pre-loaded with photos and bios

## 🏗️ Tech Stack

- **Next.js 15** - React framework with App Router
- **Socket.IO** - Real-time WebSocket communication
- **Prisma + SQLite** - Database with type-safe ORM
- **TypeScript** - Full type safety
- **Tailwind CSS** - Responsive, mobile-friendly UI

## 📁 Project Structure

```
survivor-auction-draft/
├── START_HERE.md          ← You are here!
├── QUICKSTART.md          ← 5-minute guide
├── README.md              ← Full docs
├── DEPLOYMENT.md          ← Deploy to production
├── TESTING.md             ← Test checklist
├── ARCHITECTURE.md        ← System diagrams
├── PROJECT_SUMMARY.md     ← Feature list
│
├── app/                   ← Next.js pages
│   ├── page.tsx          ← Home (create/join room)
│   ├── room/[roomId]/    ← Room page (lobby + auction)
│   └── api/              ← HTTP endpoints
│
├── components/            ← React components
│   ├── Lobby.tsx         ← Pre-draft lobby
│   ├── Auction.tsx       ← Live auction UI
│   └── Results.tsx       ← Final results
│
├── lib/                   ← Server logic
│   ├── types.ts          ← TypeScript interfaces
│   ├── room-manager.ts   ← Game state management
│   ├── socket-handler.ts ← Real-time events
│   └── prisma.ts         ← Database client
│
├── prisma/                ← Database
│   ├── schema.prisma     ← Data model
│   └── dev.db            ← SQLite database
│
├── scripts/               ← Utilities
│   └── import-cast.ts    ← Bulk import contestants
│
├── survivor50_cast.json   ← 24 contestants data
└── server.ts              ← Custom server (Next.js + Socket.IO)
```

## 🎬 What Happens in a Draft?

```
1. HOST creates room → Gets 6-char code
2. PLAYERS join → Enter code and name
3. HOST adds contestants → Or use import script
4. HOST starts draft → Phase: AUCTION
5. HOST nominates contestant
6. HOST starts auction → 30-second timer begins
7. PLAYERS bid → Real-time updates
8. TIMER expires → Highest bidder wins
9. Repeat steps 5-8 until all contestants drafted
10. Phase: COMPLETE → View results
```

## 🔥 Pro Tips

1. **Use the Import Script**: Don't add 24 contestants manually!
   ```bash
   npm run import:cast ROOM_CODE ADMIN_KEY
   ```

2. **Test Locally First**: Open 3+ browser windows to simulate multiplayer

3. **Mobile Works Great**: Share the URL - players can join from phones

4. **Budget Strategies**:
   - Start with $100
   - Try different settings ($200 budget, $5 increments)
   - Watch players get strategic as budgets run low!

5. **Deployment is Easy**: Railway or Render, 5 minutes, see DEPLOYMENT.md

## 🐛 Something Not Working?

### Server won't start?
```bash
npm install
npx prisma generate
npm run dev
```

### Can't import contestants?
- Make sure server is running
- Verify room code and admin key are correct
- Check you're in the project directory

### Bids not updating?
- Check browser console for errors
- Verify WebSocket connection (Network tab)
- Try refreshing both browsers

### More help?
- Check [TESTING.md](./TESTING.md) for detailed troubleshooting
- Review [README.md](./README.md) for full documentation

## 🚀 Next Steps

Choose your adventure:

**Ready to draft right now?**
→ Follow the Quick Start above (5 minutes)

**Want to customize?**
→ Edit settings in the lobby (budget, timer, increment)

**Ready for production?**
→ See [DEPLOYMENT.md](./DEPLOYMENT.md) (10 minutes)

**Want to understand the code?**
→ Read [ARCHITECTURE.md](./ARCHITECTURE.md)

## 📊 The Survivor 50 Cast

Your app comes pre-loaded with all 24 contestants:

**Legends**: Cirie Fields, Ozzy Lusth, Coach Wade, Stephenie LaGrossa, Colby Donaldson

**Recent Winners**: Savannah Louie (S49), Kyle Fraser (S48), Dee Valladares (S45)

**Fan Favorites**: Christian Hubicki, Rick Devens, Genevieve Mushaluk, Aubry Bracco

**Challenge Beasts**: Jonathan Young, Colby Donaldson

**Strategic Players**: Charlie Davis, Mike White, Chrissy Hofbeck

All with photos and bios ready to draft! 🏆

## 🎉 Have Fun!

You've got everything you need to run an awesome Survivor auction draft. Whether it's with friends, family, or your fantasy league - have a blast!

Questions? Check the docs. Bugs? They're features. 😄

**Now go create that room and start drafting!** 🔥🏝️

---

Built with ❤️ using Next.js, Socket.IO, and TypeScript

**Server running?** http://localhost:3000
**Need help?** Check README.md or QUICKSTART.md
**Ready to deploy?** See DEPLOYMENT.md
