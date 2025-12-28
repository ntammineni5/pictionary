# Deployment Guide

This guide covers various deployment options for the Pictionary multiplayer game.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Cloud VPS Deployment](#cloud-vps-deployment)
4. [Vercel + Railway](#vercel--railway)
5. [Production Checklist](#production-checklist)

## Local Development

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development servers
npm run dev
```

Access the app at `http://localhost:3000`

## Docker Deployment

### Using Docker Compose (Recommended)

**Development:**
```bash
docker-compose up
```

**Production:**
```bash
docker-compose up -d
```

### Manual Docker Build

```bash
# Build image
docker build -t pictionary:latest .

# Run container
docker run -d \
  --name pictionary \
  -p 3000:3000 \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SERVER_URL=http://your-domain.com:3001 \
  pictionary:latest
```

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Rebuild
docker-compose up --build -d
```

## Cloud VPS Deployment

### DigitalOcean Droplet

1. **Create Droplet:**
   - Ubuntu 22.04 LTS
   - Minimum: 1GB RAM, 1 vCPU
   - Recommended: 2GB RAM, 2 vCPU

2. **Install Docker:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER
```

3. **Deploy Application:**
```bash
# Clone repository
git clone <your-repo-url>
cd pictionary

# Set environment variables
nano .env
# Update NEXT_PUBLIC_SERVER_URL to your domain

# Start application
docker-compose up -d
```

4. **Setup Nginx (Optional but Recommended):**
```bash
sudo apt install nginx -y

# Create nginx config
sudo nano /etc/nginx/sites-available/pictionary
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pictionary /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### AWS EC2

Similar to DigitalOcean but:
1. Create EC2 instance (t3.small or larger)
2. Configure Security Groups:
   - Port 22 (SSH)
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 3000 (Next.js)
   - Port 3001 (Socket.IO)
3. Follow same Docker deployment steps

## Vercel + Railway

Split deployment: Frontend on Vercel, Backend on Railway

### Frontend (Vercel)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables:
     ```
     NEXT_PUBLIC_SERVER_URL=https://your-railway-app.railway.app
     ```
   - Deploy

### Backend (Railway)

1. **Create New Project:**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo

2. **Configure Build:**
   - Build Command: `npm run build`
   - Start Command: `npm run start:server`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3001
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```

4. **Get Railway URL:**
   - Copy the generated Railway URL
   - Update Vercel's `NEXT_PUBLIC_SERVER_URL` to this URL

## Production Checklist

### Before Deployment

- [ ] Update `.env` with production URLs
- [ ] Test locally with production build (`npm run build && npm start`)
- [ ] Verify all environment variables are set
- [ ] Test WebSocket connections
- [ ] Check CORS configuration
- [ ] Review security settings

### Environment Variables

**Required:**
```env
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_SERVER_URL=https://your-server-url.com
```

**Optional:**
```env
CLIENT_URL=https://your-client-url.com
```

### Performance Optimization

1. **Enable Gzip Compression:**
```javascript
// In server/index.ts
import compression from 'compression';
app.use(compression());
```

2. **Configure Socket.IO for Production:**
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});
```

3. **Setup Monitoring:**
   - Use PM2 for process management
   - Setup error tracking (Sentry, etc.)
   - Configure logging

### Security Hardening

1. **Helmet.js (if using Express):**
```bash
npm install helmet
```

2. **Rate Limiting:**
```bash
npm install express-rate-limit
```

3. **Input Validation:**
   - Already implemented in RoomManager
   - Review and enhance as needed

### Scaling Considerations

For high traffic:

1. **Use Redis for state management:**
```bash
npm install redis socket.io-redis
```

2. **Load Balancer:**
   - Use Nginx or cloud load balancer
   - Enable sticky sessions for Socket.IO

3. **Multiple Instances:**
   - Use PM2 cluster mode
   - Configure Socket.IO Redis adapter

### Monitoring

**PM2 Setup:**
```bash
npm install -g pm2

# Start application
pm2 start npm --name "pictionary" -- start

# Monitor
pm2 monit

# View logs
pm2 logs pictionary

# Auto-restart on crashes
pm2 startup
pm2 save
```

**Health Checks:**
```javascript
// Add to server/index.ts
httpServer.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', rooms: roomManager.getPublicRooms().length });
});
```

## Troubleshooting

### WebSocket Connection Issues

1. **Check CORS settings** in `server/index.ts`
2. **Verify environment variables** are correct
3. **Check firewall rules** allow WebSocket connections
4. **Enable WebSocket** in reverse proxy (Nginx, Cloudflare, etc.)

### Build Failures

```bash
# Clear caches
rm -rf node_modules .next dist
npm install
npm run build
```

### Port Conflicts

```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001

# Kill processes if needed
kill -9 <PID>
```

## Backup & Recovery

### Database (if adding persistence)

```bash
# No database in v1 - all state is in-memory
# For persistence, add Redis backup strategy
```

### Application State

Currently using in-memory state:
- State is lost on restart
- For persistence, implement Redis or database storage

## Cost Estimates

### DigitalOcean
- Basic Droplet (2GB RAM): $12/month
- SSL: Free (Let's Encrypt)

### Vercel + Railway
- Vercel (Hobby): Free
- Railway (Basic): $5-10/month

### AWS
- t3.small: ~$15/month
- Data transfer: Variable

## Support

For deployment issues, check:
1. Application logs: `docker-compose logs -f`
2. Server logs: `pm2 logs`
3. Network connectivity: `curl -v http://localhost:3001/socket.io/`

---

Happy deploying!
