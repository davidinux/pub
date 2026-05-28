---
name: chess-play
description: Play chess against opencode with a web UI (chessboard.js), FICS telnet protocol, adaptive difficulty, and optional Stockfish analysis
compatibility: opencode
---

## What it does

Starts a local chess server that lets the user play against opencode.

The server provides:
- **Web UI** at `http://localhost:8080` — drag-and-drop chessboard in browser
- **REST API** at `http://localhost:8080/api/` — opencode uses this to play
- **FICS telnet** at `localhost:5000` — for pychess, xboard, gnome-chess

opencode is both the opponent (makes moves) and the coach (analyzes positions, adjusts difficulty, explains strategies).

## Setup

```bash
# One-time setup:
python3 -m venv /tmp/chess_venv
/tmp/chess_venv/bin/pip install fastapi uvicorn chess jinja2

# Optional (for on-demand analysis):
sudo apt install stockfish
```

## Start the server

```bash
/tmp/chess_venv/bin/python ~/.agents/skills/chess-play/chess_server.py
```

## How to start or resume a game

When the user asks to play chess, opencode should:

1. Start the server (if not already running)
2. Check for existing unfinished games:
   ```bash
   curl -s http://localhost:8080/api/games
   ```
3. If there are saved games with status `playing`, list them and ask the user which to resume
4. If starting a new game:
   ```bash
   curl -s -X POST http://localhost:8080/api/games \
     -H "Content-Type: application/json" \
     -d '{"difficulty": <current_difficulty>}'
   ```
5. Provide the user with a **clickable link** to the game:
   ```
   http://localhost:8080/game/{game_id}
   ```
   The user can click this (or Ctrl+click) to open the chessboard in their browser.

## How opencode plays (per-turn)

When it's opencode's turn (the user says "your move" or "play"):

### 1. Read the current game state

Find the active game:
```bash
curl -s http://localhost:8080/api/games
```
Look for the game with `status: "playing"` and `opencode_thinking: true`.

Or use a known game_id:
```bash
curl -s http://localhost:8080/api/games/{game_id}
```

### 2. Think about the position

The response includes:
- `fen` — FEN string of the position
- `legal_moves` — list of legal SAN moves
- `board_unicode` — visual board representation (included in future)
- `difficulty` — current difficulty level (1-10)

Consider the difficulty:
- **Level 1-3** (Beginner): make occasional positional mistakes, miss simple tactics
- **Level 4-6** (Club): play solid but don't calculate deeply
- **Level 7-9** (Strong): calculate carefully, play good moves
- **Level 10** (Expert): play your best chess

### 3. Submit the move

```bash
curl -s -X POST http://localhost:8080/api/games/{game_id}/moves \
  -H "Content-Type: application/json" \
  -d '{"move": "e5", "player": "opencode"}'
```

### 4. Notify the user

In chat: "I play e5" (just the move — no explanation unless asked).

## Interaction flow

```
User: "play chess"
opencode: starts server → creates game → provides link:
  "http://localhost:8080/game/20260528_123456"
  "I'll play black. Make your first move!"

User: [makes move e4 in browser]
  → board updates, shows "opencode is thinking..."

User in chat: "your move"
opencode: reads state → thinks → plays e5 → says "e5"
  → board updates in browser

User in chat: "why e5?"
opencode: explains reasoning, positional ideas

User in chat: "what does Stockfish say?"
opencode: runs analysis endpoint, compares with its own choice
```

## Game management

### List all games
```bash
curl -s http://localhost:8080/api/games
```

### Resume a saved game
Provide the user with a link:
```
http://localhost:8080/game/{game_id}
```

### Export PGN
```bash
curl -s http://localhost:8080/api/games/{game_id}/export
```

## Analysis (optional, user-initiated)

```bash
curl -s http://localhost:8080/api/games/{game_id}/analysis
```
Returns top 3 Stockfish lines with scores, depths, and principal variations.

## Difficulty adjustment

### Adaptive (automatic, after game ends)
- 3 consecutive wins → difficulty +1
- 3 consecutive losses → difficulty -1
- Notify the user: "Adjusting difficulty — increasing to 6/10"

### Manual (user-initiated, any time)
```bash
curl -s -X PATCH http://localhost:8080/api/games/{game_id}/difficulty \
  -H "Content-Type: application/json" \
  -d '{"level": 4}'
```

### Check current profile
```bash
curl -s http://localhost:8080/api/profile
```
Returns: difficulty, rating, games played, W/L/D, streak, accuracy history.

## Timer and pause

```bash
# Pause:
curl -s -X PATCH http://localhost:8080/api/games/{game_id}/pause \
  -H "Content-Type: application/json" \
  -d '{"paused": true}'

# Resume:
curl -s -X PATCH http://localhost:8080/api/games/{game_id}/pause \
  -H "Content-Type: application/json" \
  -d '{"paused": false}'
```

## FICS protocol

The server also speaks FICS telnet on port 5000. Users can connect with:
- pychess → FICS connection → `localhost:5000`
- xboard → `localhost:5000`
- gnome-chess → `localhost:5000`

Supported commands: `style 12`, `move`, `board`, `who`, `games`, `match`, `accept`, `resign`, `help`, `quit`.

## REST API Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/games` | List all games |
| POST | `/api/games` | Create new game |
| GET | `/api/games/{id}` | Get game state |
| POST | `/api/games/{id}/moves` | Make a move `{"move": "e5", "player": "opencode"}` |
| POST | `/api/games/{id}/resign` | Resign |
| PATCH | `/api/games/{id}/difficulty` | Set difficulty `{"level": 5}` |
| DELETE | `/api/games/{id}` | Delete a game |
| PATCH | `/api/games/{id}/pause` | Pause/resume timer |
| GET | `/api/games/{id}/analysis` | Stockfish analysis |
| GET | `/api/games/{id}/export` | Export PGN |
| WS | `/api/games/{id}/ws` | WebSocket live updates |
| GET | `/api/profile` | Get player profile |
| PATCH | `/api/profile` | Update profile |
| POST | `/api/profile/reset` | Reset all stats |
