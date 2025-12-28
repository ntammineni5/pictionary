# Pictionary - Multiplayer Drawing Game

A real-time multiplayer Pictionary-style web game built with Next.js, Socket.IO, and TypeScript. Draw, guess, and compete with friends in public or private rooms!

## Features

- **Real-time Multiplayer**: Play with 2-15 players simultaneously
- **Public & Private Rooms**: Create discoverable public rooms or private invite-only rooms
- **Live Drawing Canvas**: HTML5 Canvas with multiple colors and brush sizes
- **Smart Scoring System**: Points based on word difficulty (Easy: 10, Medium: 50, Hard: 100)
- **Turn-based Gameplay**: Automated turn rotation with word selection
- **Live Scoreboard**: Real-time score updates and rankings
- **Timer System**: Synchronized countdown timer across all clients
- **Guess Validation**: Instant feedback on correct/incorrect guesses
- **Responsive UI**: Modern, beautiful interface built with Tailwind CSS
- **No Authentication Required**: Frictionless gameplay - just enter your name and play!

## Tech Stack

**Frontend:**
- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Zustand (State Management)

**Backend:**
- Node.js
- Socket.IO Server
- TypeScript
- In-memory state management

**Deployment:**
- Docker & Docker Compose
- Multi-stage builds for optimal image size

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- make (optional, but recommended)

### Quick Start with Makefile (Recommended)

```bash
# Initial setup
make setup

# Start development
make dev

# Open browser at http://localhost:3000
```

### Manual Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start development servers:**
```bash
npm run dev
```

This will start:
- Next.js client on `http://localhost:3000`
- Socket.IO server on `http://localhost:3001`

3. **Open your browser:**
Navigate to `http://localhost:3000`

### Docker Deployment

#### Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

#### Using Docker directly

```bash
# Build the image
docker build -t pictionary .

# Run the container
docker run -d -p 3000:3000 -p 3001:3001 \
  -e NEXT_PUBLIC_SERVER_URL=http://localhost:3001 \
  pictionary
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Client Configuration
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

### Production Environment

For production deployment, update `NEXT_PUBLIC_SERVER_URL` to your server's URL:

```env
NEXT_PUBLIC_SERVER_URL=https://your-domain.com:3001
```

## Project Structure

```
pictionary/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page (room creation/joining)
│   ├── room/[id]/page.tsx # Game room page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Canvas.tsx         # Drawing canvas
│   ├── Scoreboard.tsx     # Player scoreboard
│   ├── GuessInput.tsx     # Guess submission
│   ├── WordSelection.tsx  # Word choice modal
│   ├── Timer.tsx          # Round timer
│   └── CorrectGuessers.tsx # Guesser selection
├── server/                # Backend server
│   ├── index.ts           # Socket.IO server
│   ├── RoomManager.ts     # Room state management
│   └── words.ts           # Word database
├── lib/                   # Utilities
│   ├── socket.ts          # Socket client
│   └── store.ts           # Zustand store
├── types/                 # TypeScript types
│   └── index.ts           # Shared types
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose config
└── package.json           # Dependencies
```

## How to Play

### Creating a Room

1. Enter your name on the home page
2. Click "Create Room"
3. Enter a room name
4. Choose room type:
   - **Public**: Anyone can see and join
   - **Private**: Only accessible via invite link
5. Share the room link with friends (for private rooms)

### Joining a Room

**Public Room:**
1. Enter your name
2. Click "Join Public Room"
3. Select a room from the list

**Private Room:**
1. Get the invite link from a friend
2. Enter your name
3. You'll automatically join the room

### Gameplay

1. **Waiting Lobby**: Wait for at least 2 players, then the host starts the game
2. **Word Selection**: When it's your turn, choose from 3 words (easy, medium, or hard)
3. **Drawing Phase**:
   - Drawer: Draw the word on the canvas (60 seconds)
   - Guessers: Type guesses in the input box
4. **Correct Guesses**:
   - Guessers get instant feedback
   - Drawer sees who guessed correctly
   - Drawer can stop the timer and select correct guessers
5. **Scoring**:
   - Drawer gets full points if anyone guesses correctly
   - Correct guessers get same points as the word difficulty
6. **Next Round**: Game automatically advances to the next player
7. **Game End**: After everyone has drawn once, winner is announced!

## Game Rules

### Scoring

| Difficulty | Points |
|-----------|--------|
| Easy      | 10     |
| Medium    | 50     |
| Hard      | 100    |

- Drawer earns points if at least one player guesses correctly
- Guessers selected by drawer earn the same points
- No negative scoring or partial credit

### Turn Order

- Random shuffle at game start
- Each player draws exactly once per game
- Order loops until all players have drawn

### Timer

- 60 seconds per round (configurable)
- Drawer can stop timer manually after correct guess
- Auto-advances to next round when timer expires

## Deployment Options

### Deploy to Vercel (Frontend) + Separate Server

1. Deploy Next.js to Vercel
2. Deploy Socket.IO server separately (Railway, Render, DigitalOcean, etc.)
3. Update `NEXT_PUBLIC_SERVER_URL` to point to your server

### Deploy to Cloud VPS (All-in-one)

Using Docker Compose on any VPS:

```bash
# Clone repository
git clone <your-repo>
cd pictionary

# Set environment variables
nano .env

# Start with Docker Compose
docker-compose up -d
```

### Deploy to Kubernetes

Use the Dockerfile as a base for creating Kubernetes deployments.

## Performance Considerations

- **Canvas Updates**: < 100ms latency for real-time drawing
- **Room Capacity**: Supports 10-15 players per room
- **Concurrent Rooms**: In-memory state scales to hundreds of concurrent rooms
- **WebSocket Connections**: Efficient Socket.IO event handling

## Security Features

- Private room IDs use UUID v4 (unguessable)
- Input sanitization for names and guesses
- No persistent storage of sensitive data
- CORS configuration for production

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- Mobile touch support for canvas
- Custom word packs
- Multiple rounds with cumulative scoring
- Spectator mode
- AI moderation
- Chat functionality
- Voice chat integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning or building your own games!

## Support

For issues or questions, please open an issue on GitHub.

---

Built with by following the PRD specifications for a real-time multiplayer Pictionary game.

Enjoy drawing and guessing!
