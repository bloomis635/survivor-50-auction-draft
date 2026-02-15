# Deployment Guide

Deploy your Survivor Auction Draft to production so players can access it from anywhere!

## Prerequisites

- A GitHub account (to host your code)
- Chosen hosting platform account (Railway, Render, or Fly.io recommended)

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Survivor 50 Auction Draft"
git branch -M main
git remote add origin https://github.com/yourusername/survivor-draft.git
git push -u origin main
```

## Deployment Options

### Option A: Railway (Recommended - Easiest)

Railway provides simple deployment with persistent storage.

1. **Sign up** at https://railway.app
2. **New Project** → Deploy from GitHub repo
3. **Select your repo**
4. **Add a Volume**:
   - Go to Settings → Volumes
   - Add volume mounted to `/app/prisma`
   - This ensures database persists
5. **Configure**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Port: 3000 (auto-detected)
6. **Deploy!**

Railway will give you a URL like `https://survivor-draft.up.railway.app`

**Cost**: Free tier available, then ~$5/month with usage

### Option B: Render

Render offers a generous free tier with persistent disks.

1. **Sign up** at https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Configure**:
   - Name: `survivor-draft`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free (or Starter for better performance)
4. **Add a Disk**:
   - Go to Disk settings
   - Add disk at `/app/prisma`
   - Size: 1GB is plenty
5. **Deploy!**

URL: `https://survivor-draft.onrender.com`

**Cost**: Free tier available (with sleep after inactivity), Starter $7/month

**Note**: Free tier sleeps after 15 min of inactivity - first request will be slow.

### Option C: Fly.io

Fly.io provides edge deployment with persistent volumes.

1. **Install Fly CLI**:
   ```bash
   brew install flyctl  # macOS
   # or
   curl -L https://fly.io/install.sh | sh  # Linux/WSL
   ```

2. **Login**:
   ```bash
   flyctl auth login
   ```

3. **Create fly.toml** in your project root:
   ```toml
   app = "survivor-draft"
   primary_region = "sjc"

   [build]
     builder = "paketobuildpacks/builder:base"

   [env]
     PORT = "8080"

   [[services]]
     internal_port = 8080
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443

   [mounts]
     source = "data"
     destination = "/app/prisma"
   ```

4. **Create app**:
   ```bash
   flyctl launch --no-deploy
   ```

5. **Create volume**:
   ```bash
   flyctl volumes create data --size 1
   ```

6. **Deploy**:
   ```bash
   flyctl deploy
   ```

URL: `https://survivor-draft.fly.dev`

**Cost**: Free tier available, ~$2-5/month with volume

## Environment Variables

No environment variables are required for basic operation!

Optional variables:
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: Custom database URL (defaults to `file:./dev.db`)

## Database Considerations

### SQLite (Default - Recommended for MVP)

**Pros:**
- Zero configuration
- Fast for small-medium loads
- Perfect for single-server deployment
- Included by default

**Cons:**
- Single server only (no horizontal scaling)
- Requires persistent disk/volume
- Not suitable for high traffic (100+ concurrent users)

**When to use:** MVP, small groups (< 50 players), single draft room at a time

### PostgreSQL (For Production Scale)

Switch to PostgreSQL if you need:
- Multiple concurrent draft rooms
- High availability
- Horizontal scaling
- 100+ simultaneous players

**Migration steps:**

1. **Update `prisma/schema.prisma`**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Get a PostgreSQL database**:
   - Railway: Comes with Postgres addon
   - Render: Add PostgreSQL service
   - Fly.io: `flyctl postgres create`
   - Supabase: Free tier available

3. **Set DATABASE_URL**:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   ```

4. **Migrate**:
   ```bash
   npx prisma migrate deploy
   ```

## Post-Deployment Checklist

- [ ] App loads at your URL
- [ ] Can create a room
- [ ] Can join a room
- [ ] WebSocket connection works (real-time updates)
- [ ] Database persists after redeploy
- [ ] Import script works (if needed)

## Testing WebSockets

Some hosting platforms have WebSocket quirks:

```javascript
// In browser console:
const socket = io('https://your-app.com');
socket.on('connect', () => console.log('Connected!'));
socket.on('error', (err) => console.error('Error:', err));
```

If WebSocket fails:
- Check platform firewall/proxy settings
- Ensure platform supports WebSockets (most do)
- Try enabling WebSocket fallbacks in `server.ts`

## Scaling Tips

### Single Server (1-50 players)
- Default SQLite works great
- Railway/Render free tier sufficient
- No changes needed

### Medium Scale (50-200 players)
- Switch to PostgreSQL
- Use Railway Starter or Render Pro
- Add Redis for session storage (optional)

### Large Scale (200+ players)
- PostgreSQL with connection pooling
- Multiple server instances behind load balancer
- Redis for session state
- CDN for static assets

## Monitoring

### Check Server Health

```bash
# Railway
railway logs

# Render
# View in dashboard

# Fly.io
flyctl logs
```

### Monitor Active Connections

Add to your server:
```typescript
// In server.ts
io.on('connection', (socket) => {
  console.log(`Connected: ${io.engine.clientsCount} clients`);
});
```

## Backup Strategy

### Automatic Backups (Recommended)

1. **Railway**: Enable automatic volume snapshots in settings
2. **Render**: Disk backups included with paid plans
3. **Fly.io**: Create periodic snapshots:
   ```bash
   flyctl volumes snapshots create data
   ```

### Manual Backup

```bash
# Download database
scp user@host:/app/prisma/dev.db ./backup.db

# Or via script
curl https://your-app.com/api/backup > backup.json  # If you add backup endpoint
```

## Security Notes

- Room codes are 6 characters (case-insensitive) = 36^6 = ~2 billion combinations
- Admin keys are 32 characters = cryptographically secure
- No passwords required for MVP
- WebSocket connections are per-session
- State is server-authoritative (clients can't cheat)

**For production:**
- Add rate limiting on room creation
- Implement room expiration (auto-delete old rooms)
- Add CORS restrictions
- Use environment-based admin keys
- Enable HTTPS (most platforms do this automatically)

## Cost Summary

| Platform | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| Railway | No | $5/mo | Simple deployment |
| Render | Yes (with sleep) | $7/mo | Free testing |
| Fly.io | Yes (limited) | $2-5/mo | Edge deployment |

**Recommendation**: Start with Render free tier for testing, upgrade to Railway for production.

## Troubleshooting

### App crashes on startup
- Check logs for errors
- Verify `npm run build` works locally
- Ensure volume is mounted correctly

### Database resets after deploy
- Volume/disk not configured
- Wrong mount path
- Check platform-specific persistence docs

### WebSocket not connecting
- Check platform WebSocket support
- Verify no proxy blocking
- Try HTTP polling fallback

### Slow cold starts (Render free tier)
- Upgrade to Starter plan ($7/mo)
- Or accept 30s first-load delay
- App stays awake during active use

## Support

Need help?
- Check platform docs (Railway/Render/Fly)
- Review Next.js deployment docs
- Check Socket.IO deployment guides
- Open an issue on GitHub

Happy deploying! 🚀
