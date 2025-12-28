# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A real-time multiplayer Pictionary game built with Next.js 14, Socket.IO, and TypeScript. The architecture uses a single Socket.IO server (`server/`) for game state management and Next.js for the frontend, with both running as separate processes that communicate via WebSockets.

## Project Structure

```
pictionary/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with metadata, global styles
│   ├── page.tsx             # Home page (create/join room UI)
│   ├── room/[id]/page.tsx   # Game room page (main game UI)
│   ├── globals.css          # Global styles, Tailwind imports
│   └── favicon.ico          # Site icon
│
├── components/              # Reusable React components
│   ├── Canvas.tsx           # HTML5 drawing canvas (199 lines)
│   ├── Scoreboard.tsx       # Live player scores with badges
│   ├── GuessInput.tsx       # Guess submission input
│   ├── Timer.tsx            # Countdown timer with progress bar
│   ├── WordSelection.tsx    # Drawer word choice modal
│   └── CorrectGuessers.tsx  # Round-end guesser confirmation
│
├── lib/                     # Shared utilities
│   ├── socket.ts            # Socket.IO client singleton
│   └── store.ts             # Zustand state management
│
├── server/                  # Backend Socket.IO server
│   ├── index.ts             # Server entry point, event handlers (294 lines)
│   ├── RoomManager.ts       # Game state management class (233 lines)
│   └── words.ts             # Word database by difficulty
│
├── types/                   # TypeScript type definitions
│   └── index.ts             # Shared types (Room, Player, Events, etc.)
│
├── __tests__/               # Jest test suites
│   ├── backend/
│   │   ├── RoomManager.test.ts (40+ test cases)
│   │   └── words.test.ts       (5 test cases)
│   └── frontend/
│       ├── Canvas.test.tsx     (7 test cases)
│       ├── Timer.test.tsx      (7 test cases)
│       └── Scoreboard.test.tsx (rendering tests)
│
├── public/                  # Static assets (served by Next.js)
│
├── Configuration files
│   ├── package.json         # Dependencies and npm scripts
│   ├── tsconfig.json        # TypeScript config (frontend)
│   ├── tsconfig.server.json # TypeScript config (backend)
│   ├── jest.config.js       # Jest testing configuration
│   ├── tailwind.config.ts   # Tailwind CSS theme
│   ├── postcss.config.js    # PostCSS for Tailwind
│   ├── next.config.js       # Next.js configuration
│   ├── .eslintrc.json       # ESLint rules
│   ├── .prettierrc          # Prettier formatting rules
│   ├── .env                 # Environment variables (not in git)
│   ├── .gitignore           # Git ignore patterns
│   ├── Dockerfile           # Multi-stage Docker build
│   ├── docker-compose.yml   # Docker Compose setup
│   └── Makefile             # Development commands
│
└── Documentation
    ├── CLAUDE.md            # This file - comprehensive guide
    ├── README.md            # Project setup and overview
    ├── DEPLOYMENT.md        # Deployment instructions
    └── LICENSE              # MIT License
```

### Key File Responsibilities

| File | Lines | Purpose | Complexity |
|------|-------|---------|------------|
| `server/index.ts` | 294 | Socket.IO event handlers, timer management | Medium |
| `server/RoomManager.ts` | 233 | Game state, room lifecycle, scoring logic | High |
| `app/room/[id]/page.tsx` | 406 | Main game UI, 12+ socket listeners | Very High |
| `components/Canvas.tsx` | 199 | Drawing interface, stroke broadcasting | Medium |
| `types/index.ts` | 89 | Type definitions for entire app | Low |

## Commands

### Development
```bash
make dev              # Start both frontend (3000) and backend (3001)
make dev-frontend     # Next.js dev server only
make dev-backend      # Socket.IO server only
```

### Testing
```bash
make test             # Run all tests
make test-frontend    # Frontend tests only
make test-backend     # Backend tests only
make test-watch       # Watch mode
npm run test:coverage # Generate coverage report
```

### Code Quality
```bash
make format           # Format all code
make lint             # Lint all code
make lint-fix         # Auto-fix linting issues
make check            # Run format-check + lint + test
make pre-commit       # Pre-commit checks (format + lint-fix + test)
```

### Build & Production
```bash
make build            # Build both Next.js and compile TypeScript server
npm run build         # Same as make build
make run              # Run production build
```

### Docker
```bash
make docker-build     # Build Docker image
make docker-up        # Start with docker-compose
make docker-down      # Stop containers
make docker-logs      # View logs
```

## Architecture

### State Management Flow

**Client State (Zustand)**: `lib/store.ts`
- Minimal local state: `room`, `playerId`, `playerName`
- Source of truth is always the server
- State updates via Socket.IO events only
- Clean `reset()` function for logout/cleanup

**Server State (In-Memory)**: `server/RoomManager.ts`
- Single source of truth for all game state
- Uses `Map<roomId, Room>` for O(1) room lookups
- Uses `Map<playerId, roomId>` for player-to-room reverse mapping
- Manages rooms, players, turn order, scores, canvas strokes
- **CONSTRAINT**: No database - all state is in-memory (lost on restart)
- **DESIGN DECISION**: Stateless deployment model prioritizes simplicity over persistence

**State Sync Pattern**:
1. Client emits event (e.g., `guess:submit`)
2. Server validates and updates state in `RoomManager`
3. Server emits update events to all clients in room
4. Clients update local Zustand store from socket events

**Socket Client Singleton** (`lib/socket.ts`):
- Lazy initialization via `getSocket()` function
- Auto-connect disabled (manual connect in components)
- `disconnectSocket()` for cleanup on unmount
- **DESIGN DECISION**: Manual connection control prevents unnecessary socket connections on pages that don't need real-time updates

### Socket.IO Event Architecture

**Type Safety**: All socket events are strictly typed via `types/index.ts`:
- `ServerToClientEvents` - server → client events
- `ClientToServerEvents` - client → server events
- Used generically: `Socket<ClientToServerEvents, ServerToClientEvents>`
- **CONSTRAINT**: All event payloads must match type definitions exactly

**Complete Event Catalog** (11 client → server events):
1. `room:create` - Create new room with name and type (public/private)
2. `room:join` - Join existing room by ID with player name
3. `room:leave` - Leave current room (triggers cleanup)
4. `rooms:fetch` - Request list of public rooms
5. `game:start` - Host starts game (validates 2+ players)
6. `game:word-select` - Drawer selects word from 3 choices
7. `game:stop-timer` - Drawer manually ends round early
8. `drawing:stroke` - Broadcast drawing stroke to room
9. `drawing:clear` - Clear entire canvas
10. `guess:submit` - Submit word guess (case-insensitive validation)
11. `disconnect` - Socket.IO built-in, handled for cleanup

**Server → Client Events**:
- `room:created`, `room:joined`, `room:updated`, `room:left`
- `rooms:list` - Public rooms broadcast to ALL clients (not just requestor)
- `game:word-selection` - Only sent to current drawer
- `game:round-start`, `game:round-end`, `game:end`
- `timer:tick` - Emitted every 1 second during drawing state
- `drawing:stroke`, `drawing:clear` - Broadcast to all except sender
- `guess:result`, `guess:correct` - Individual feedback to guesser
- `error` - Error messages (e.g., room not found, game already started)

**Broadcasting Patterns**:
- `io.to(roomId).emit()` - All clients in room (including sender)
- `socket.to(roomId).emit()` - All clients in room EXCEPT sender
- `socket.emit()` - Only the client who triggered event
- `io.emit()` - All connected clients (used for public room updates)

**CORS Configuration** (`server/index.ts`):
- Origin: `http://localhost:3000` in development
- Methods: `["GET", "POST"]`
- **CONSTRAINT**: Update CORS origin for production deployment

### Game State Machine

States defined in `types/index.ts` as `GameState`:

1. **`waiting`** - Lobby, waiting for host to start
2. **`word-selection`** - Current drawer chooses word (only drawer sees choices)
3. **`drawing`** - Round in progress, timer running
4. **`round-end`** - Drawer selects correct guessers, scores awarded
5. **`game-end`** - All players have drawn, winner announced

**State Transitions**:
- `waiting` → `word-selection` (host starts game)
- `word-selection` → `drawing` (drawer selects word)
- `drawing` → `round-end` (timer expires or drawer stops)
- `round-end` → `word-selection` (next player's turn)
- `round-end` → `game-end` (all players have drawn)

### Turn Management

**Turn Order**:
- Randomized at game start in `RoomManager.startGame()`
- Stored in `room.turnOrder[]` (array of player IDs)
- `room.currentTurnIndex` tracks position
- Each player draws exactly once per game

**Round Flow**:
1. Server sets `currentDrawer` from `turnOrder[currentTurnIndex]`
2. Drawer receives `game:word-selection` event with 3 word choices (one per difficulty)
3. Drawer selects word, server starts 60-second timer (`setInterval` with 1s tick)
4. Guessers submit guesses, server validates (case-insensitive via `toLowerCase()`)
5. Server stores list of players who guessed correctly (auto-detection)
6. Drawer stops timer manually OR timer expires automatically
7. Drawer shown list of correct guessers, can override/confirm selections
8. Server awards points via `endRound()`, increments `currentTurnIndex`
9. **5-second pause** with scores displayed, then auto-advance
10. Repeat from step 1 or end game if `currentTurnIndex >= turnOrder.length`

**Critical Constraints**:
- **Timer Management**: Server-side only, `timer:tick` event broadcasts countdown
- **Guess Validation**: Server stores correct guessers but drawer has final say
- **Auto-Advance**: 5-second timeout after round-end before next round
- **Word Selection**: `getRandomWords()` guarantees one easy, one medium, one hard
- **No Reconnection**: Players who disconnect mid-round cannot rejoin (socket ID changes)

### Canvas Synchronization

**Drawing Data**: Canvas strokes stored in `room.canvas[]`
- Each stroke: `{ color, width, points: [{x, y}] }` where x, y are normalized 0-1 coordinates
- Server stores all strokes in `RoomManager` (unlimited history per round)
- New players receive full canvas history on join via `room:joined` event
- **DESIGN DECISION**: Normalized coordinates allow canvas to resize without distortion

**Broadcast Pattern**:
1. Drawer draws on Canvas component (HTML5 Canvas API, 800x600px)
2. Local rendering happens immediately for responsive UX
3. `drawing:stroke` emitted to server **on mouseUp** (complete stroke, not per-pixel)
4. Server adds to `room.canvas[]` via `addStroke()`
5. Server broadcasts stroke to all other clients in room (excludes sender)
6. Clients render stroke on their canvas using same drawing function

**Canvas Component Details** (`components/Canvas.tsx`):
- 10 color options (black, red, blue, green, yellow, orange, purple, pink, brown, white)
- 5 stroke widths (2, 4, 8, 16, 24)
- Color/width pickers only visible when `canDraw={true}` (drawer only)
- Touch support via `touchAction: "none"` CSS property
- Cursor changes: `crosshair` when enabled, `not-allowed` when disabled
- **CONSTRAINT**: Mobile drawing may have latency due to stroke batching on mouseUp

**Clear Canvas**:
- Drawer only: emits `drawing:clear`
- Server clears `room.canvas = []`
- Broadcasts `drawing:clear` to all clients
- **DESIGN DECISION**: No undo feature - clear is all-or-nothing

### Scoring System

**Points by Difficulty** (`server/words.ts`):
- Easy: 10 points
- Medium: 50 points
- Hard: 100 points

**Award Logic** (`RoomManager.endRound()`):
- Drawer gets word points IF at least one guesser selected
- Each selected guesser gets same points as word difficulty
- Scores persist in `room.scores` object keyed by player ID
- No negative scoring

### Component Architecture

**Page Components**:

**`app/page.tsx`** - Home page (create/join room UI)
- 4 view states: `home`, `create`, `join`, `public`
- Manages socket connection/disconnection on mount/unmount
- Listens to: `room:created`, `room:joined`, `rooms:list`, `error`
- Auto-navigates to `/room/[id]` on successful room creation/join
- **DESIGN DECISION**: Public rooms list updates in real-time for all clients

**`app/room/[id]/page.tsx`** - Game room (main game UI, 406 lines)
- Complex component with 12+ socket event listeners
- Manages local state for: word choices, current word, timer, correct guessers, guess results
- 5 distinct UI states based on `room.gameState`:
  1. **waiting**: Lobby with player list, host sees "Start Game" button
  2. **word-selection**: Drawer sees WordSelection modal with 3 difficulty cards
  3. **drawing**: Canvas (drawer) or GuessInput (guessers), live timer, scoreboard
  4. **round-end**: Word revealed, scores updated, 5s countdown to next round
  5. **game-end**: Final leaderboard with winner highlighted, "Play Again" button
- "Copy Invite Link" button for private rooms
- **ISSUE**: No rejoin logic if player refreshes page - must re-enter name
- **COMPLEXITY**: This is the most complex component (406 lines) - consider splitting

**Key Components** (`components/`):

**`Canvas.tsx`** (199 lines)
- HTML5 canvas with drawing tools
- Props: `roomId`, `canDraw`, `strokes`
- Emits: `drawing:stroke`, `drawing:clear`
- Local rendering on mouse move, broadcast on mouse up
- Touch-enabled with `touchAction: "none"`

**`Scoreboard.tsx`**
- Displays players sorted by score (descending)
- Highlights: current player (green border), host (crown icon), current drawer (palette icon)
- Disconnected players shown as grayed out
- **DESIGN DECISION**: Shows disconnected players until they leave, not immediate removal

**`GuessInput.tsx`**
- Text input for submitting guesses
- Displays message history (previous guesses with feedback)
- Shows "Correct!" or "Incorrect" after each guess
- Disabled when not in drawing state
- **QUIRK**: Message history clears on state change (intentional for clean UI)

**`Timer.tsx`**
- Countdown display with progress bar
- Red color + pulse animation when ≤10 seconds
- Progress bar fills from right to left
- Synced via `timer:tick` events (server-authoritative)

**`WordSelection.tsx`**
- Modal with 3 difficulty cards: Easy (green), Medium (yellow), Hard (red)
- Each card shows word and point value (10/50/100)
- Blocks UI until word selected (no escape/cancel)
- **CONSTRAINT**: Drawer MUST choose a word to proceed

**`CorrectGuessers.tsx`**
- Modal shown to drawer at end of round
- Checkbox list of all players who submitted guesses
- Pre-checked with auto-detected correct guesses
- Drawer can override (check/uncheck) before confirming
- **CODE ISSUE**: React import at line 81-82 (end of file) instead of top - unusual but functional

**Shared Utilities**:
- `lib/socket.ts` - Socket client singleton with typed events
- `lib/store.ts` - Zustand store for local game state

## Environment Variables

Required in `.env`:
```bash
PORT=3001                                    # Socket.IO server port
NODE_ENV=development                         # Environment
NEXT_PUBLIC_SERVER_URL=http://localhost:3001 # Frontend → backend connection
```

**Production**: Update `NEXT_PUBLIC_SERVER_URL` to your deployed server URL.

## Testing Strategy

**Test Infrastructure**:
- **Framework**: Jest 29.7.0 with ts-jest for TypeScript support
- **Frontend**: React Testing Library + jsdom environment
- **Backend**: Pure unit tests, no mocks required
- **Module Aliasing**: `@/*` paths work in tests via jest.config.js
- **Coverage**: Collection configured for src/, server/, components/, lib/, types/

**Test Files** (5 total, all passing):

1. **`__tests__/backend/RoomManager.test.ts`** (40+ test cases)
   - Room lifecycle: create, join, leave, delete empty rooms
   - Host management: reassignment when host leaves, first player becomes host
   - Game validation: cannot start with <2 players, validates room exists
   - Word selection and guess validation (case-insensitive)
   - Scoring logic: drawer + correct guessers get points
   - Public/private room filtering
   - **COVERAGE**: Core game logic is well-tested

2. **`__tests__/backend/words.test.ts`** (5 test cases)
   - Validates `getRandomWords()` returns exactly 3 words
   - Confirms difficulty distribution (1 easy, 1 medium, 1 hard)
   - Point value mapping (10/50/100)
   - Word randomization (different words each call)
   - **KNOWN ISSUE**: Does not test for duplicate words in list

3. **`__tests__/frontend/Canvas.test.tsx`** (7 test cases)
   - Canvas rendering with correct dimensions (800x600)
   - Tool visibility: color/width selectors only shown when `canDraw={true}`
   - Clear button functionality
   - Cursor states: `crosshair` when enabled, `not-allowed` when disabled
   - **COVERAGE**: UI states, not drawing logic (complex to test)

4. **`__tests__/frontend/Timer.test.tsx`** (7 test cases)
   - Display formatting (MM:SS)
   - Low time styling: red color + pulse animation at ≤10s
   - Progress bar percentage calculation
   - Color transitions based on time remaining
   - **COVERAGE**: Visual states, not timer logic (server-driven)

5. **`__tests__/frontend/Scoreboard.test.tsx`**
   - Player rendering and sorting by score
   - Badge display (host, current drawer)
   - **COVERAGE**: Basic rendering, not all edge cases

**Test Gaps** (areas without coverage):
- Socket.IO integration tests (client ↔ server communication)
- `app/page.tsx` and `app/room/[id]/page.tsx` (complex UI logic)
- `GuessInput.tsx`, `WordSelection.tsx`, `CorrectGuessers.tsx` components
- `lib/socket.ts` and `lib/store.ts` utilities
- End-to-end multiplayer scenarios

**Running Tests**:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
make test-frontend    # Frontend only
make test-backend     # Backend only
```

### Python/Playwright Testing

**IMPORTANT**: This environment uses `uv` for Python package management. Always use `uv run python` instead of `python` or `python3`:

```bash
# Correct
uv run python test_script.py

# Incorrect
python test_script.py
python3 test_script.py
```

For Playwright-based E2E testing with automatic server management:
```bash
uv run python /path/to/with_server.py \
  --server "npm run dev:client" --port 3000 \
  --server "npm run dev:server" --port 3001 \
  -- uv run python your_test.py
```

## Development Workflow

1. **Start both servers**: `make dev` (or `npm run dev`)
   - Frontend on http://localhost:3000
   - Socket.IO server on http://localhost:3001

2. **Test in browser**:
   - Open multiple windows to simulate multiplayer
   - Use incognito/different browsers for separate sessions

3. **Run tests in watch mode**: `make test-watch` (in separate terminal)

4. **Before committing**: `make pre-commit` (format + lint-fix + test)

## Build & Deployment

**Build Process**:
- `npm run build` compiles both Next.js (`next build`) and TypeScript server (`tsc --project tsconfig.server.json`)
- Outputs: `.next/` (frontend) and `dist/server/` (backend)

**Production Start**:
- `npm start` runs both `next start` and `node dist/server/index.js` concurrently
- Requires prior build step

**Docker**:
- Multi-stage Dockerfile for optimized production image
- Exposes ports 3000 (frontend) and 3001 (backend)
- Use `docker-compose.yml` for easy deployment

## Dependencies

**Core Runtime** (package.json):
- **Next.js 14.2.0**: React framework with App Router, Server Components
- **React 18.3.0**: UI library
- **Socket.IO 4.7.0**: WebSocket server with room support
- **Socket.IO-Client 4.7.0**: Client-side WebSocket connection
- **Zustand 4.5.0**: Lightweight state management (3.5KB, no boilerplate)
- **UUID 9.0.1**: v4 UUID generation for private room IDs
- **Tailwind CSS 3.4.1**: Utility-first CSS framework

**Development Dependencies**:
- **TypeScript 5.3.3**: Type safety across frontend and backend
- **Jest 29.7.0** + **ts-jest**: Testing framework
- **@testing-library/react**: Component testing utilities
- **ESLint 8.x** + **Prettier**: Code quality and formatting
- **Concurrently 8.2.0**: Run multiple npm scripts simultaneously
- **tsx 4.7.0**: TypeScript execution for server development

**Design Decision Rationale**:
- **Zustand over Redux**: Minimal boilerplate, perfect for small state surface
- **Socket.IO over WebSockets**: Built-in room support, automatic reconnection, fallback transports
- **No database**: Simplifies deployment, state is ephemeral by design
- **Tailwind CSS**: Rapid UI development, consistent design system

## Key Implementation Notes

### Constraints & Limitations

- **No Authentication**: Players identified by socket ID only, no persistence
  - Socket ID changes on reconnect → player loses identity
  - No user accounts, profiles, or login system

- **In-Memory State**: All game state lost on server restart (no database)
  - Rooms, scores, canvas data all ephemeral
  - **TRADE-OFF**: Simplicity vs. persistence (chose simplicity)

- **No Reconnection Logic**: Players who disconnect cannot rejoin with same identity
  - Socket ID changes on reconnect
  - Would need session tokens or cookies to implement

- **Private Rooms**: Use UUID v4 for unguessable room IDs (128-bit random)
  - No password protection, only obscurity
  - Share link = full access

- **Public Rooms**: Listed via `rooms:fetch` event, anyone can join
  - Real-time updates broadcast to ALL connected clients (not just requestors)
  - No pagination - all public rooms returned in single array

- **Max Players**: 15 per room (hardcoded in `RoomManager.joinRoom()`)
  - Could be made configurable per room
  - UI may break with >15 players (scoreboard not tested at scale)

- **Round Duration**: 60 seconds (hardcoded in `RoomManager.selectWord()`)
  - Timer is server-authoritative (prevents client-side cheating)
  - Could be made configurable per room or difficulty level

- **Word Database**: Static list in `server/words.ts`, categorized by difficulty
  - 30 easy, 28 medium, 20 hard words
  - **KNOWN ISSUE**: "lighthouse" appears twice in medium difficulty
  - No API or external word source
  - Words are fixed at build time (no dynamic updates)

### Design Decisions

- **Server-Authoritative**: All game logic (timer, scoring, validation) runs on server
  - Prevents cheating via client manipulation
  - Trade-off: Requires server to be running

- **Drawer Has Final Say**: Auto-detected correct guesses can be overridden by drawer
  - Allows for edge cases, typos, or alternative spellings
  - Trust model: drawer is honest arbiter

- **Stroke Batching**: Canvas strokes emitted on mouseUp, not per-pixel
  - Reduces network traffic significantly
  - Trade-off: Slightly less real-time than continuous streaming

- **No Undo**: Canvas clear is all-or-nothing, no stroke-level undo
  - Simplifies implementation
  - Matches physical drawing constraints

- **Auto-Advance Rounds**: 5-second pause after round-end, then automatic next round
  - Keeps game moving, prevents waiting for inattentive players
  - Alternative considered: host approval (more control, slower pace)

- **Public Room Broadcasts**: `rooms:list` sent to ALL clients on any change
  - Real-time updates for better UX
  - Trade-off: More bandwidth, but acceptable for small player counts

## Known Issues & Future Improvements

### Code Quality Issues

1. **`components/CorrectGuessers.tsx`**:
   - React import is at line 81-82 (end of file) instead of top
   - Functional but violates convention
   - **FIX**: Move `import React from 'react'` to line 1

2. **Duplicate Words** (`server/words.ts`):
   - "lighthouse" appears twice in `mediumWords` array
   - Reduces word pool diversity
   - **FIX**: Remove duplicate, add new unique word

3. **No Test Coverage** for:
   - Socket.IO integration (server ↔ client)
   - Page components (`app/page.tsx`, `app/room/[id]/page.tsx`)
   - Three UI components (GuessInput, WordSelection, CorrectGuessers)
   - Utilities (`lib/socket.ts`, `lib/store.ts`)
   - **IMPROVEMENT**: Add integration tests with socket mocking

### Architectural Limitations

1. **No Reconnection Support**:
   - Page refresh = new socket ID = new player identity
   - Players kicked out of games if connection drops
   - **IMPROVEMENT**: Implement session tokens (localStorage + cookie)

2. **Room Page Complexity** (406 lines):
   - `app/room/[id]/page.tsx` is too large
   - Manages 12+ socket listeners + local state
   - **REFACTOR**: Extract hooks (`useGameSocket`, `useGameState`)

3. **No Player Timeout**:
   - Disconnected players remain in room until explicit leave
   - Can block game if drawer disconnects mid-round
   - **IMPROVEMENT**: Auto-remove after 30s disconnect

4. **Canvas Stroke Limit**:
   - Unlimited strokes stored in `room.canvas[]`
   - Could cause memory issues with long games or spamming
   - **IMPROVEMENT**: Limit to N strokes or clear on round start

5. **No Input Validation**:
   - Player names, room names not sanitized
   - Potential for XSS if names rendered unsafely
   - **SECURITY**: Validate/sanitize all user inputs

### Feature Gaps

1. **No Chat System**: Players can't communicate (intentional for now)
2. **No Spectator Mode**: All players must draw
3. **No Round Skip**: Stuck if drawer AFK (timer must expire)
4. **No Difficulty Selection**: Host can't choose word difficulty preference
5. **No Custom Word Lists**: Fixed word database
6. **No Game History**: No record of past games or stats

### Performance Considerations

1. **Public Room Scaling**:
   - `rooms:list` broadcasts to ALL clients on every change
   - Could overwhelm server with 1000+ concurrent users
   - **IMPROVEMENT**: Implement pagination or polling

2. **Canvas Rendering**:
   - Re-renders entire stroke array on each update
   - Could lag with complex drawings (100+ strokes)
   - **OPTIMIZATION**: Only render new strokes, use offscreen canvas

3. **Mobile Performance**:
   - Touch events may have latency due to mouseUp batching
   - No mobile-specific optimizations
   - **IMPROVEMENT**: Detect device, adjust batching strategy

## Configuration Details

### TypeScript Configuration

**`tsconfig.json`** (Frontend):
- Target: ES2017
- Module: ESNext
- Strict mode: enabled
- Path aliases: `@/*` → `./*`
- Excludes: `server/`, `dist/`, `node_modules/`

**`tsconfig.server.json`** (Backend):
- Target: ES2020
- Module: CommonJS
- Output: `dist/server/`
- Includes: `server/**/*`, `types/**/*`
- Strict mode: enabled

### ESLint Rules

**Enforced**:
- Next.js core web vitals
- TypeScript strict mode
- Prefer const over let, no var
- No unused variables (except prefixed with `_`)

**Allowed**:
- Console statements in `server/**/*` files only
- Any type usage (minimized but not banned)

### Tailwind Theme

**Custom Primary Color** (Sky Blue):
- 50: #f0f9ff
- 500: #0ea5e9 (main brand color)
- 900: #0c4a6e

**Content Sources**:
- `./pages/**/*.{js,ts,jsx,tsx,mdx}`
- `./components/**/*.{js,ts,jsx,tsx,mdx}`
- `./app/**/*.{js,ts,jsx,tsx,mdx}`

## Troubleshooting

### Common Issues

**Port conflicts**: Kill existing processes on 3000/3001:
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Module errors after pull**:
```bash
rm -rf node_modules package-lock.json
npm install
```
Or use Make:
```bash
make clean-all
make setup
```

**Socket connection refused**:
- Ensure backend server is running on port 3001
- Check `NEXT_PUBLIC_SERVER_URL` in `.env`
- Verify CORS origin matches frontend URL

**Canvas not syncing**:
- Check browser console for socket errors
- Verify player is in `drawing` state
- Confirm drawer has `canDraw={true}` prop

**Timer not starting**:
- Word must be selected first
- Check server logs for `setInterval` errors
- Verify room is in `drawing` state

**Players can't rejoin**:
- Socket ID changes on reconnect (expected behavior)
- Must create new player identity
- No workaround without session management

### Docker Issues

**Build failures**:
```bash
make docker-clean
make docker-build
```

**Container won't start**:
```bash
docker-compose down -v  # Remove volumes
make docker-up
```

**View logs**:
```bash
make docker-logs
# Or specific service:
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Development Tips

1. **Test multiplayer locally**: Open 2+ browser windows (incognito for separate sessions)
2. **Debug socket events**: Use browser DevTools → Network → WS tab
3. **Hot reload issues**: Restart both servers with `make dev`
4. **Type errors**: Run `npm run type-check` (checks both frontend and server)
5. **Lint before commit**: Use `make pre-commit` for full check

## RoomManager API Reference

The `RoomManager` class (`server/RoomManager.ts`) is the core of game state management. All methods are synchronous and validate inputs before updating state.

### Room Management

```typescript
createRoom(hostId: string, roomName: string, isPublic: boolean): Room
```
- Creates new room with UUID v4 ID
- Sets hostId as first player and host
- Initializes empty players array, scores, canvas
- Returns complete Room object

```typescript
joinRoom(roomId: string, playerId: string, playerName: string): Room | null
```
- Adds player to room if space available (max 15)
- Returns null if room not found or full
- Player starts with score 0, isHost: false

```typescript
leaveRoom(playerId: string): void
```
- Removes player from their current room
- Reassigns host to first remaining player if host leaves
- Deletes room if empty
- Cleans up playerRoomMap

```typescript
getRoom(roomId: string): Room | null
```
- Returns room by ID or null if not found

```typescript
getPublicRooms(): Room[]
```
- Returns array of rooms where `type === 'public'`
- Used for public room listing

### Game Flow

```typescript
startGame(roomId: string): void
```
- Validates room exists and has 2+ players
- Randomizes turn order using `shuffle()`
- Sets gameState to 'word-selection'
- Sets currentDrawer to first player in turn order

```typescript
selectWord(roomId: string, word: Word): void
```
- Sets room.currentWord
- Changes gameState to 'drawing'
- Initializes timeRemaining to 60 seconds
- **Note**: Does NOT start timer (server/index.ts handles timer interval)

```typescript
submitGuess(roomId: string, playerId: string, guess: string): boolean
```
- Case-insensitive comparison: `guess.toLowerCase() === currentWord.text.toLowerCase()`
- Returns true if correct, false if incorrect
- Adds playerId to internal correctGuesses array (not exposed in Room type)

```typescript
endRound(roomId: string, correctPlayerIds: string[]): void
```
- Awards points to drawer IF correctPlayerIds.length > 0
- Awards points to each player in correctPlayerIds array
- Points = currentWord.points (10/50/100 based on difficulty)
- Changes gameState to 'round-end'
- Clears timeRemaining and currentWord

```typescript
nextRound(roomId: string): void
```
- Increments currentTurnIndex
- If currentTurnIndex >= turnOrder.length:
  - Sets gameState to 'game-end'
- Else:
  - Sets currentDrawer to next player in turn order
  - Changes gameState to 'word-selection'
  - Clears canvas (room.canvas = [])

```typescript
getWinner(roomId: string): { playerId: string; score: number } | null
```
- Finds player with highest score in room.scores
- Returns { playerId, score } or null if no scores

### Canvas Operations

```typescript
addStroke(roomId: string, stroke: DrawingStroke): void
```
- Appends stroke to room.canvas array
- No validation or limits on stroke count

```typescript
clearCanvas(roomId: string): void
```
- Sets room.canvas = []
- Removes all drawing history

### Internal State

**Private Maps**:
- `rooms: Map<string, Room>` - Room storage
- `playerRoomMap: Map<string, string>` - Player ID → Room ID lookup

**Internal Methods**:
- `shuffle<T>(array: T[]): T[]` - Fisher-Yates shuffle for turn order
- Auto-cleanup happens in `leaveRoom()` when last player exits

### Usage Example

```typescript
const roomManager = new RoomManager();

// Create and join
const room = roomManager.createRoom('socket1', 'My Room', true);
roomManager.joinRoom(room.id, 'socket2', 'Player 2');

// Start game
roomManager.startGame(room.id);
// Server sends word choices to drawer...

// Drawer selects word
const word = { text: 'cat', difficulty: 'easy', points: 10 };
roomManager.selectWord(room.id, word);
// Server starts timer interval...

// Players guess
const isCorrect = roomManager.submitGuess(room.id, 'socket2', 'CAT'); // true

// End round
roomManager.endRound(room.id, ['socket2']); // Awards points

// Next round or end game
roomManager.nextRound(room.id);
```

### Critical Behaviors

1. **Host Reassignment**: Automatic when host leaves (first remaining player)
2. **Room Cleanup**: Automatic deletion when last player leaves
3. **Turn Order**: Randomized once at game start, never re-shuffled
4. **Score Persistence**: Scores persist across rounds until game ends
5. **Canvas History**: Cleared on `nextRound()`, not on `endRound()`
6. **No Validation**: Player names, room names not sanitized (security concern)
