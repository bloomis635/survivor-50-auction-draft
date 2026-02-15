# Quick Start Guide

Get your Survivor 50 Draft running in 5 minutes!

## Step 1: Install & Start (30 seconds)

```bash
npm install
npm run dev
```

Server will start at http://localhost:3000

## Step 2: Create a Room (30 seconds)

1. Open http://localhost:3000
2. Click "Create New Draft Room"
3. You'll get a 6-character room code (e.g., `XYZ123`)
4. Copy the room URL to share with players

## Step 3: Contestants Already Loaded! (0 seconds)

**Good news!** All 24 Survivor 50 contestants with photos and bios are **automatically loaded** when you create a room!

You'll see them in the lobby:
- Jenna Lewis-Dougherty
- Colby Donaldson
- Stephenie LaGrossa Kendrick
- Cirie Fields
- Ozzy Lusth
- And 19 more!

**Optional**: You can add more contestants with "+ Add Contestant" or delete any you don't want in the draft.

## Step 4: Invite Players (30 seconds)

Share the room code or URL with your friends:
- Text/Email: "Join at http://localhost:3000 with code XYZ123"
- They enter their name and join the lobby
- You'll see them appear in real-time

## Step 5: Configure Settings (30 seconds)

Adjust these in the lobby (or use defaults):
- **Starting Budget**: $100 (total each player can spend)
- **Min Increment**: $1 (minimum bid increase)
- **Timer**: 30 seconds (auction countdown)

Click "Update Settings" to save.

## Step 6: Start the Draft! (2+ minutes)

1. Click "Start Draft" when ready
2. **Host actions:**
   - Select a contestant from the available list
   - Click "Nominate Selected Contestant"
   - Click "Start Auction" to begin timer
3. **Players bid:**
   - Use quick buttons (+$1, +$5, +$10)
   - Or enter custom amount and click "Bid"
4. When timer hits 0, highest bidder wins!
5. Repeat until all contestants are drafted

## Tips

### For Hosts
- Start with popular contestants to generate excitement
- Watch the timer - it's server-authoritative
- Budget remaining shows in real-time
- Can't undo a completed auction (by design for MVP)

### For Players
- Your budget is shown at the top
- You can't bid more than you have
- Bids must be at least current bid + increment
- Be ready - auctions move fast!

### Recommended Settings
- **Quick Draft (15-20 min)**: $100 budget, $1 increment, 15s timer
- **Standard Draft (30-45 min)**: $100 budget, $1 increment, 30s timer
- **Strategic Draft (60+ min)**: $200 budget, $5 increment, 45s timer

## Troubleshooting

**Room not found?**
- Make sure code is correct (case-insensitive)
- Verify server is running

**Can't place bid?**
- Check you have enough budget
- Ensure bid is at least minimum (shown in placeholder)
- Timer might have expired - wait for next auction

**Import script fails?**
- Verify room code is correct
- Check admin key (must be exact match)
- Ensure server is running

**Players disconnected?**
- They can refresh and rejoin with same name
- Their budget and roster will be preserved

## What's Included

The project comes with:
- **24 Survivor 50 Contestants**: Full cast with photos and bios
- **Complete Data**: Names, ages, backgrounds, season history
- **Official Photos**: All image URLs from TVGuide.com

Notable contestants include:
- Legends: Cirie Fields, Ozzy Lusth, Coach Wade, Stephenie LaGrossa
- Winners: Savannah Louie (S49), Dee Valladares (S45), Kyle Fraser (S48)
- Fan Favorites: Christian Hubicki, Rick Devens, Genevieve Mushaluk
- Challenge Beasts: Jonathan Young, Colby Donaldson
- Strategic Players: Aubry Bracco, Charlie Davis

## Next Steps

Once your draft is complete:
1. Results screen shows final rosters
2. Click "Copy Results" to export as text
3. Share with your league!

Have fun drafting! 🔥🏝️
