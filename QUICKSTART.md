# Quick Start Guide

Get your Pictionary game up and running in 5 minutes!

## Option 1: Automated Setup (Recommended)

```bash
# Complete project setup (creates .env and installs dependencies)
make setup

# Start development servers
make dev
```

Open `http://localhost:3000` and start playing!

## Option 2: Setup Script

```bash
# Run the setup script
./scripts/setup.sh

# Start development servers
make dev
```

## Option 3: Docker (One Command)

```bash
make docker-up
```

Access at `http://localhost:3000`

## First Game

1. **Enter your name** on the home page
2. **Click "Create Room"**
3. **Choose Public or Private**
4. **Share the link** with a friend (or open another browser tab)
5. **Click "Start Game"** when you have 2+ players
6. **Choose a word** when it's your turn
7. **Draw** and let others guess!

## What's Included

✅ Real-time multiplayer gameplay
✅ Public and private rooms
✅ Live drawing canvas with colors and brush sizes
✅ Automated scoring system
✅ Timer and turn management
✅ Beautiful responsive UI
✅ Docker deployment ready
✅ Production-ready configuration

## Project Structure

```
pictionary/
├── app/              # Next.js pages
├── components/       # React components
├── server/           # Socket.IO backend
├── lib/              # Utilities
├── types/            # TypeScript definitions
└── scripts/          # Deployment scripts
```

## Available Commands

```bash
# Development
make dev              # Start both client and server
make dev-frontend     # Start Next.js only
make dev-backend      # Start Socket.IO only

# Production
make build            # Build for production
make run              # Build and start production servers

# Testing
make test             # Run all tests
make test-watch       # Run tests in watch mode
make test-coverage    # Generate coverage report

# Code Quality
make format           # Format all code
make lint             # Lint all code
make lint-fix         # Fix linting issues
make check            # Run format-check + lint + test
make pre-commit       # Pre-commit checks (format + lint-fix + test)

# Docker
make docker-up        # Start with Docker Compose
make docker-down      # Stop Docker containers
make docker-logs      # View Docker logs
make docker-clean     # Clean Docker resources

# Utilities
make setup            # Initial setup (creates .env + installs deps)
make clean            # Clean build artifacts
make clean-all        # Clean everything including node_modules
make help             # Show all available commands
./scripts/deploy.sh   # Production deployment
```

## Environment Configuration

Edit `.env` to customize:

```env
# Server port
PORT=3001

# Server URL (update for production)
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

## Troubleshooting

**Port already in use?**
```bash
# Kill processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Dependencies issues?**
```bash
make clean-all
make install
```

**Build errors?**
```bash
make clean
make build
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides:
- Docker deployment
- Cloud VPS (DigitalOcean, AWS, etc.)
- Vercel + Railway split deployment
- Kubernetes

## Need Help?

- Check [README.md](./README.md) for full documentation
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment options
- Open an issue on GitHub

## Next Steps

1. ✅ Get the app running with `make dev`
2. 🧪 Run tests with `make test` or `make test-watch`
3. 📝 Customize word lists in `server/words.ts`
4. 🎨 Customize colors in `tailwind.config.ts`
5. ✨ Format and lint your code with `make format` and `make lint`
6. 🚀 Deploy to production (see DEPLOYMENT.md)

**Pro Tips:**
- Run `make help` to see all available commands
- Use `make pre-commit` before committing to ensure code quality
- Use `make check` to run all quality checks at once

Happy gaming! 🎨🎮
