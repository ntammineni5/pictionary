# Command Reference

Quick reference guide for all available commands in the Pictionary project.

## Table of Contents

- [Makefile Commands](#makefile-commands)
- [NPM Scripts](#npm-scripts)
- [Quick Workflows](#quick-workflows)

## Makefile Commands

For detailed documentation, see [MAKEFILE.md](./MAKEFILE.md).

### Setup & Installation

```bash
make help              # Show all available commands
make setup             # Initial project setup
make install           # Install dependencies
```

### Development

```bash
make dev               # Start both frontend and backend
make dev-frontend      # Start frontend only
make dev-backend       # Start backend only
```

### Code Quality

```bash
make format            # Format all code
make format-check      # Check code formatting
make lint              # Lint all code
make lint-fix          # Fix linting issues
make check             # Run format-check + lint + test
```

### Testing

```bash
make test              # Run all tests
make test-frontend     # Run frontend tests
make test-backend      # Run backend tests
make test-watch        # Run tests in watch mode
make test-coverage     # Run tests with coverage
```

### Build & Run

```bash
make build             # Build both frontend and backend
make build-frontend    # Build frontend only
make build-backend     # Build backend only
make run               # Run production build
make run-frontend      # Run frontend production
make run-backend       # Run backend production
```

### Docker

```bash
make docker-build      # Build Docker image
make docker-up         # Start with Docker Compose
make docker-down       # Stop Docker Compose
make docker-logs       # View Docker logs
make docker-clean      # Clean Docker resources
```

### Utility

```bash
make clean             # Clean build artifacts
make clean-all         # Clean everything including node_modules
make ci                # Run CI pipeline
make pre-commit        # Pre-commit checks
```

## NPM Scripts

### Development

```bash
npm run dev            # Start both servers
npm run dev:client     # Start Next.js dev server
npm run dev:server     # Start Socket.IO dev server
```

### Build

```bash
npm run build          # Build for production
```

### Production

```bash
npm start              # Start production servers
npm run start:client   # Start Next.js production
npm run start:server   # Start Socket.IO production
```

### Code Quality

```bash
# Linting
npm run lint           # Lint all code
npm run lint:frontend  # Lint frontend code
npm run lint:backend   # Lint backend code
npm run lint:fix       # Fix linting issues

# Formatting
npm run format         # Format all code
npm run format:frontend # Format frontend code
npm run format:backend  # Format backend code
npm run format:check    # Check code formatting
```

### Testing

```bash
npm test               # Run all tests
npm run test:frontend  # Run frontend tests
npm run test:backend   # Run backend tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage
```

## Quick Workflows

### First Time Setup

**With Make:**
```bash
make setup
make dev
```

**Without Make:**
```bash
npm install
cp .env.example .env
npm run dev
```

### Daily Development

```bash
# Start development
make dev

# In another terminal - run tests in watch mode
make test-watch
```

### Before Committing

```bash
# Format and fix issues
make pre-commit

# Or manually
make format
make lint-fix
make test
```

### Prepare for Deployment

```bash
# Check everything
make check

# Build
make build

# Test production build locally
make run
```

### Docker Development

```bash
# Build and start
make docker-build
make docker-up

# Check logs
make docker-logs

# Stop
make docker-down
```

### When Things Break

```bash
# Clean everything and start fresh
make clean-all
make setup
make dev
```

### CI/CD Pipeline

```bash
# Full CI pipeline
make ci

# Or step by step
make format-check
make lint
make test
make build
```

## Environment-Specific Commands

### Development

```bash
NODE_ENV=development make dev
```

### Production

```bash
NODE_ENV=production make build
NODE_ENV=production make run
```

### Testing

```bash
NODE_ENV=test make test
```

## Docker Commands

### Basic

```bash
# Using Make
make docker-up
make docker-down
make docker-logs

# Using Docker Compose directly
docker-compose up -d
docker-compose down
docker-compose logs -f
```

### Advanced

```bash
# Rebuild and restart
docker-compose up --build -d

# View running containers
docker-compose ps

# Execute commands in container
docker-compose exec pictionary sh

# Clean up everything
make docker-clean
```

## Port Management

If ports are in use:

```bash
# Find and kill processes on default ports
lsof -ti:3000 | xargs kill -9  # Next.js
lsof -ti:3001 | xargs kill -9  # Socket.IO

# Or use different ports
PORT=3002 NEXT_PUBLIC_SERVER_URL=http://localhost:3002 make dev
```

## Parallel Commands

Run multiple commands in separate terminals:

```bash
# Terminal 1: Development servers
make dev

# Terminal 2: Tests in watch mode
make test-watch

# Terminal 3: Check formatting on save
watch -n 2 make format-check
```

## Common Errors & Solutions

### Port Already in Use

```bash
make clean
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
make dev
```

### Module Not Found

```bash
make clean-all
make install
make dev
```

### Build Errors

```bash
make clean
rm -rf node_modules package-lock.json
npm install
make build
```

### Docker Issues

```bash
make docker-clean
make docker-build
make docker-up
```

## IDE Integration

### VS Code Tasks

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dev",
      "type": "shell",
      "command": "make dev"
    },
    {
      "label": "Test",
      "type": "shell",
      "command": "make test"
    },
    {
      "label": "Format",
      "type": "shell",
      "command": "make format"
    }
  ]
}
```

### Git Hooks

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
make pre-commit
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Performance Tips

1. **Use watch mode** for tests during development
2. **Run checks in parallel** in CI/CD
3. **Use Docker for production testing** to match deployment environment
4. **Clean regularly** to avoid stale builds

## Help & Documentation

- `make help` - Show all Makefile commands
- [MAKEFILE.md](./MAKEFILE.md) - Detailed Makefile documentation
- [README.md](./README.md) - Project overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guides
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide

---

For questions or issues, please check the documentation or open an issue on GitHub.
