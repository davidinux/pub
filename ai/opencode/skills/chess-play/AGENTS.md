# opencode Chess Protocol

The chess server runs at `http://localhost:8080` (REST API + Web UI) and `localhost:5000` (FICS telnet).

## Starting the Server

```bash
cd ~/chess_server && /tmp/chess_venv/bin/python chess_server.py
```

## How opencode Plays Chess

### When it's opencode's turn

The user will say "your move" or "play". opencode should:

1. **Read the game state:**
   ```bash
   curl -s http://localhost:8080/api/games/{game_id}
   ```
   Returns FEN, legal moves, PGN, board Unicode, timing.

2. **Think about the position** using chess knowledge:
   - Consider material balance, king safety, piece activity
   - Look at legal moves and evaluate candidates
   - Consider the current difficulty level (affects how accurately you play)
   - At low difficulty (1-3): make occasional suboptimal moves
   - At medium difficulty (4-6): play solid but don't calculate deeply
   - At high difficulty (7-10): play your best chess

3. **Submit the move:**
   ```bash
   curl -s -X POST http://localhost:8080/api/games/{game_id}/moves \
     -H "Content-Type: application/json" \
     -d '{"move": "e5", "player": "opencode"}'
   ```

4. **Tell the user** the move in chat: "I play e5"

### When the user asks for analysis

```bash
curl -s http://localhost:8080/api/games/{game_id}/analysis
```

Returns Stockfish evaluation: top 3 moves with scores and depth.

### When the user wants difficulty changed

```bash
# Change game difficulty (1-10):
curl -s -X PATCH http://localhost:8080/api/games/{game_id}/difficulty \
  -H "Content-Type: application/json" \
  -d '{"level": 7}'

# Change profile difficulty (affects new games):
curl -s -X PATCH http://localhost:8080/api/profile \
  -H "Content-Type: application/json" \
  -d '{"difficulty": 5}'
```

### When the user wants to pause the timer

```bash
curl -s -X PATCH http://localhost:8080/api/games/{game_id}/pause \
  -H "Content-Type: application/json" \
  -d '{"paused": true}'
```

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/games` | GET | List all games |
| `/api/games` | POST | Create new game |
| `/api/games/{id}` | GET | Get game state |
| `/api/games/{id}/moves` | POST | Make a move |
| `/api/games/{id}/resign` | POST | Resign |
| `/api/games/{id}/difficulty` | PATCH | Set difficulty |
| `/api/games/{id}/pause` | PATCH | Pause/resume timer |
| `/api/games/{id}/analysis` | GET | Stockfish analysis |
| `/api/games/{id}` | DELETE | Delete a game |
| `/api/games/{id}/export` | GET | Export PGN |
| `/api/games/{id}/ws` | WS | WebSocket live updates |
| `/api/profile` | GET | Get player profile |
| `/api/profile` | PATCH | Update profile |
| `/api/profile/reset` | POST | Reset stats |

## Game State JSON

```json
{
  "game_id": "20260528_123456",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "pgn": "1. e4 e5",
  "turn": "w",
  "turn_name": "guest-human",
  "moves": ["e4", "e5"],
  "timing": {"white": 45.2, "black": 30.1},
  "paused": false,
  "status": "playing",
  "difficulty": 5,
  "result": "*",
  "result_reason": "",
  "is_game_over": false,
  "legal_moves": ["Nf3", "Nc3", "d4", ...],
  "opencode_thinking": false
}
```

## Adaptive Difficulty

opencode adjusts difficulty based on the player's performance:
- 3 consecutive wins → difficulty +1 (with notification)
- 3 consecutive losses → difficulty -1 (with notification)
- Player can override anytime: "set difficulty to X"
- When adjusting, say: "Adjusting difficulty — increased/decreased to X/10"
