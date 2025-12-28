
# Pictionary-Style Multiplayer Drawing Game

**Product Requirements Document (PRD)**

## 1. Overview

### 1.1 Product Summary

Build a real-time, multiplayer Pictionary-style web game where users can create or join rooms, draw words on a shared canvas, and earn points based on word difficulty and correct guesses. The game supports **Public** and **Private** rooms, real-time drawing, timed rounds, and a live scoreboard.

### 1.2 Goals

* Enable fast, frictionless multiplayer gameplay (no accounts required)
* Support real-time drawing and guessing
* Provide fair, deterministic scoring
* Allow private gameplay via shareable links
* Be scalable to many concurrent rooms

### 1.3 Non-Goals (v1)

* Persistent user accounts or authentication
* Voice or video chat
* AI-generated drawings or guesses
* Mobile native apps (web only)

---

## 2. User Personas

### 2.1 Casual Player

* Joins via shared link
* Enters a display name
* Plays a few rounds with friends

### 2.2 Host / Room Creator

* Creates a public or private room
* Starts the game
* Moderates rounds (optional future)

---

## 3. Room Types

### 3.1 Public Rooms

* Discoverable in the app lobby
* Anyone can join
* Visible room metadata:

  * Room name
  * Current players
  * Game status (waiting / in-game)

### 3.2 Private Rooms

* **Not discoverable**
* Accessible only via shared link
* Anyone with the link can join by entering a name
* No login required

---

## 4. User Flow

### 4.1 Entry

1. User lands on homepage
2. Chooses:

   * Join Public Room
   * Create Room
   * Join via Private Link

### 4.2 Create Room

* Inputs:

  * Room name
  * Room type (Public / Private)
* System generates:

  * Unique room ID
  * Shareable room URL (for private rooms)

### 4.3 Join Room

* User enters:

  * Display name (required)
* Joins waiting lobby
* Sees list of players in room

---

## 5. Game Lifecycle

### 5.1 Lobby State

* All players visible
* Waiting for host to start game
* Minimum players: configurable (default: 2)

### 5.2 Turn Order

* Players are ordered randomly at game start
* Each player gets one drawing turn per round
* Order loops until game end

---

## 6. Round Mechanics

### 6.1 Word Selection

When a player’s turn starts:

* System presents **3 words**
* Each word has:

  * Difficulty ranking
  * Associated point value

#### Difficulty & Points

| Difficulty | Points |
| ---------- | ------ |
| Easy       | 10     |
| Medium     | 50     |
| Hard       | 100    |

(Points increment in steps of 10 internally; only 10–100 allowed.)

### 6.2 Word Selection Rules

* Player selects **one** word
* Selected word is:

  * Visible only to the drawing player
  * Hidden from all other players

---

## 7. Drawing Phase

### 7.1 Canvas

* Shared real-time drawing canvas
* Only the active player can draw
* Others see strokes in real time

### 7.2 Canvas Features (v1)

* Freehand drawing
* Color picker
* Eraser
* Clear canvas (host or drawing player only)

---

## 8. Guessing Phase

### 8.1 Guess Input

* Non-drawing players can type guesses
* Guess input is hidden from other players (except system validation)

### 8.2 Correct Guess Detection

* System validates guesses against the selected word
* Case-insensitive
* Ignore leading/trailing spaces

### 8.3 First Correct Guess

* When at least one player guesses correctly:

  * Drawing player is notified
  * Timer continues until drawing player stops it

---

## 9. Timer Control

### 9.1 Round Timer

* Each drawing round has a countdown timer (default: 60 seconds)

### 9.2 Stop Timer Action

* Drawing player can:

  * Stop the timer manually
  * Select the player(s) who guessed correctly

---

## 10. Scoring System

### 10.1 Drawing Player Score

* Receives **full word points** if at least one correct guess occurred

### 10.2 Guessing Player Score

* Players selected as correct guessers receive:

  * Same point value as word difficulty

### 10.3 Scoring Rules

* Points are awarded **once per round**
* No negative scoring
* No partial credit

### 10.4 Score Calculation Integrity

* Scoreboard must:

  * Be deterministic
  * Prevent duplicate scoring
  * Persist scores across rounds in the same game

---

## 11. Scoreboard / Dashboard

### 11.1 Live Dashboard

* Visible to all players
* Displays:

  * Player name
  * Total points
  * Current rank

### 11.2 Update Behavior

* Updates immediately after each round
* Sorted by highest score

---

## 12. Game End Conditions

* Game ends when:

  * All players have completed their drawing turn (1 full cycle)
  * OR host manually ends game

### 12.1 End Game View

* Final rankings
* Winner highlight
* Option to:

  * Restart game
  * Start new round
  * Leave room

---

## 13. Functional Requirements

### 13.1 Real-Time

* WebSocket or equivalent for:

  * Drawing strokes
  * Guess validation
  * Score updates
  * Timer sync

### 13.2 State Management

* Server is source of truth for:

  * Room state
  * Player list
  * Turn order
  * Scores

---

## 14. Non-Functional Requirements

### 14.1 Performance

* Canvas updates <100ms latency
* Support 10–15 players per room

### 14.2 Reliability

* Graceful handling of:

  * Player disconnects
  * Rejoins via same link
* Host reassignment if host disconnects

### 14.3 Security

* Private rooms not indexable
* Room IDs must be unguessable
* Input sanitization for guesses and names

---

## 15. Tech Assumptions (Recommended, Not Prescriptive)

### Frontend

* React / Next.js
* HTML5 Canvas

### Backend

* Node.js or Python
* WebSockets (Socket.IO / WS)

### Data

* In-memory state (Redis or equivalent)
* No persistent DB required for v1

---

## 16. Open Questions / Future Enhancements

* Multiple rounds with cumulative scoring
* Custom word packs
* Spectator mode
* Mobile-friendly canvas
* AI moderation / word generation

---

## 17. Success Metrics

* Time to start game < 30 seconds
* Zero account friction
* No score inconsistencies
* Stable real-time drawing under load

---