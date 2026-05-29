#!/usr/bin/env python3
"""
opencode Chess Server
REST API + Web UI + FICS telnet protocol.

Usage:
    python3 chess_server.py
"""

import asyncio
import json
import os
import random
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import chess
import chess.pgn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn

DATA_DIR = Path.home() / ".opencode_chess"
GAMES_DIR = DATA_DIR / "games"
PROFILE_FILE = DATA_DIR / "profile.json"
FICS_PORT = 5000
REST_PORT = 8080

# ── Storage ──────────────────────────────────────────────────────

def load_profile():
    if PROFILE_FILE.exists():
        return json.loads(PROFILE_FILE.read_text())
    return {
        "difficulty": 5,
        "rating": 1200,
        "games_played": 0,
        "wins": 0,
        "losses": 0,
        "draws": 0,
        "recent_results": [],
        "streak_wins": 0,
        "streak_losses": 0,
        "accuracy_history": [],
    }

def save_profile(profile):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PROFILE_FILE.write_text(json.dumps(profile, indent=2))

def game_path(game_id):
    return GAMES_DIR / game_id / "game.json"

def load_game(game_id):
    p = game_path(game_id)
    if p.exists():
        return ChessGame.from_dict(json.loads(p.read_text()))
    return None

def save_game(game):
    d = GAMES_DIR / game.game_id
    d.mkdir(parents=True, exist_ok=True)
    (d / "game.json").write_text(json.dumps(game.to_dict(), indent=2))

def list_games():
    if not GAMES_DIR.exists():
        return []
    games = []
    for d in sorted(GAMES_DIR.iterdir()):
        if d.is_dir():
            p = d / "game.json"
            if p.exists():
                g = json.loads(p.read_text())
                games.append(g)
    return sorted(games, key=lambda g: g.get("created_at", ""), reverse=True)

def export_pgn(game):
    exporter = chess.pgn.StringExporter(headers=True, variations=False, comments=False)
    return game.board.accept(exporter) if hasattr(game, 'board') else ""

# ── Game Class ───────────────────────────────────────────────────

class ChessGame:
    def __init__(self, game_id=None, difficulty=5):
        self.game_id = game_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        self.board = chess.Board()
        self.difficulty = difficulty
        self.moves = []
        self.timestamps = []
        self.white_player = "guest-human"
        self.black_player = "opencode"
        self.status = "waiting"  # waiting | playing | paused | over
        self.paused = False
        self.pause_start = None
        self.total_pause_time = 0
        self.timing = {"white": 0.0, "black": 0.0}
        self.last_move_time = time.time()
        self.result = "*"
        self.result_reason = ""
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.updated_at = self.created_at
        self.opencode_thinking = False
        self.analysis_requested = False

    @property
    def turn(self):
        return "w" if self.board.turn == chess.WHITE else "b"

    @property
    def turn_name(self):
        return self.white_player if self.board.turn == chess.WHITE else self.black_player

    def make_move(self, move_str, player=None):
        if self.status == "over":
            return False, "Game is over"
        self._update_clock()
        try:
            move = self.board.parse_san(move_str)
        except ValueError:
            try:
                move = chess.Move.from_uci(move_str)
                if move not in self.board.legal_moves:
                    return False, f"Illegal move: {move_str}"
            except ValueError:
                return False, f"Invalid move: {move_str}"
        san = self.board.san(move)
        self.board.push(move)
        self.moves.append(san)
        self.timestamps.append({
            "time": datetime.now(timezone.utc).isoformat(),
            "player": player or self.turn_name,
            "clock": dict(self.timing),
        })
        self.updated_at = datetime.now(timezone.utc).isoformat()
        self.last_move_time = time.time()
        if self.board.is_game_over():
            self.status = "over"
            self._set_result()
            self.opencode_thinking = False
        else:
            self.status = "playing"
            whose_turn = self.black_player if self.board.turn == chess.BLACK else self.white_player
            self.opencode_thinking = (whose_turn == "opencode")
        return True, san

    def _set_result(self):
        if self.board.is_checkmate():
            winner = "black" if self.board.turn == chess.WHITE else "white"
            self.result = "0-1" if winner == "black" else "1-0"
            self.result_reason = f"Checkmate — {winner} wins"
        elif self.board.is_stalemate():
            self.result = "½-½"
            self.result_reason = "Stalemate"
        elif self.board.is_insufficient_material():
            self.result = "½-½"
            self.result_reason = "Insufficient material"
        elif self.board.is_seventyfive_moves():
            self.result = "½-½"
            self.result_reason = "75-move rule"
        elif self.board.is_fivefold_repetition():
            self.result = "½-½"
            self.result_reason = "Fivefold repetition"
        else:
            self.result = "½-½"
            self.result_reason = "Draw"

    def _update_clock(self):
        if self.paused:
            return
        now = time.time()
        side = "white" if self.board.turn == chess.WHITE else "black"
        elapsed = now - self.last_move_time
        self.timing[side] += elapsed
        self.last_move_time = now

    def set_paused(self, paused):
        if paused == self.paused:
            return
        if paused:
            self._update_clock()
            self.pause_start = time.time()
        else:
            if self.pause_start:
                self.total_pause_time += time.time() - self.pause_start
            self.last_move_time = time.time()
        self.paused = paused

    def current_clock(self):
        if self.paused:
            return dict(self.timing)
        now = time.time()
        side = "white" if self.board.turn == chess.WHITE else "black"
        t = dict(self.timing)
        t[side] += now - self.last_move_time
        return t

    def resign(self, player):
        if self.status == "over":
            return False, "Game already over"
        self._update_clock()
        self.status = "over"
        if player == self.white_player:
            self.result = "0-1"
            self.result_reason = f"{self.white_player} resigned"
        else:
            self.result = "1-0"
            self.result_reason = f"{self.black_player} resigned"
        self.updated_at = datetime.now(timezone.utc).isoformat()
        return True, self.result_reason

    def to_dict(self):
        return {
            "game_id": self.game_id,
            "fen": self.board.fen(),
            "pgn": str(self.board),
            "turn": self.turn,
            "turn_name": self.turn_name,
            "moves": self.moves,
            "timestamps": self.timestamps,
            "timing": self.current_clock(),
            "paused": self.paused,
            "status": self.status,
            "difficulty": self.difficulty,
            "white_player": self.white_player,
            "black_player": self.black_player,
            "result": self.result,
            "result_reason": self.result_reason,
            "is_game_over": self.board.is_game_over(),
            "legal_moves": [self.board.san(m) for m in self.board.legal_moves],
            "opencode_thinking": self.opencode_thinking,
            "analysis_requested": self.analysis_requested,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data):
        g = cls(game_id=data["game_id"], difficulty=data.get("difficulty", 5))
        g.board = chess.Board(data["fen"]) if "fen" in data and data["fen"] != chess.STARTING_FEN else chess.Board()
        g.moves = data.get("moves", [])
        g.timestamps = data.get("timestamps", [])
        g.timing = data.get("timing", {"white": 0.0, "black": 0.0})
        g.paused = data.get("paused", False)
        g.total_pause_time = data.get("total_pause_time", 0)
        g.status = data.get("status", "waiting")
        g.white_player = data.get("white_player", "guest-human")
        g.black_player = data.get("black_player", "opencode")
        g.result = data.get("result", "*")
        g.result_reason = data.get("result_reason", "")
        g.created_at = data.get("created_at", "")
        g.updated_at = data.get("updated_at", "")
        g.opencode_thinking = data.get("opencode_thinking", False)
        g.analysis_requested = data.get("analysis_requested", False)
        g.last_move_time = time.time()
        return g

# ── Profile / Difficulty ─────────────────────────────────────────

def adjust_difficulty(profile, game_result):
    if game_result == "1-0":
        profile["wins"] += 1
        profile["recent_results"].append("W")
        profile["streak_wins"] += 1
        profile["streak_losses"] = 0
    elif game_result == "0-1":
        profile["losses"] += 1
        profile["recent_results"].append("L")
        profile["streak_losses"] += 1
        profile["streak_wins"] = 0
    else:
        profile["draws"] += 1
        profile["recent_results"].append("D")
        profile["streak_wins"] = 0
        profile["streak_losses"] = 0
    profile["recent_results"] = profile["recent_results"][-10:]
    profile["games_played"] += 1

    old_diff = profile["difficulty"]
    if profile["streak_wins"] >= 3:
        profile["difficulty"] = min(10, profile["difficulty"] + 1)
    elif profile["streak_losses"] >= 3:
        profile["difficulty"] = max(1, profile["difficulty"] - 1)
    return old_diff != profile["difficulty"]

# ── FICS Protocol Handler ────────────────────────────────────────

fics_clients = {}  # writer -> {"username": ..., "game_id": ...}

PIECE_MAP = {
    'P': 'P', 'N': 'N', 'B': 'B', 'R': 'R', 'Q': 'Q', 'K': 'K',
    'p': 'p', 'n': 'n', 'b': 'b', 'r': 'r', 'q': 'q', 'k': 'k',
}

def board_to_fics_style12(board, game, username):
    ranks = []
    for r in range(7, -1, -1):
        rank_str = ""
        empty = 0
        for f in range(8):
            p = board.piece_at(chess.square(f, r))
            if p:
                if empty:
                    rank_str += str(empty)
                    empty = 0
                rank_str += p.symbol()
            else:
                empty += 1
        if empty:
            rank_str += str(empty)
        ranks.append(rank_str)
    placement = " ".join(ranks)
    side = "W" if board.turn == chess.WHITE else "B"
    ep = "-1" if board.ep_square is None else str(board.ep_square)
    wk = "1" if board.has_kingside_castling_rights(chess.WHITE) else "0"
    wq = "1" if board.has_queenside_castling_rights(chess.WHITE) else "0"
    bk = "1" if board.has_kingside_castling_rights(chess.BLACK) else "0"
    bq = "1" if board.has_queenside_castling_rights(chess.BLACK) else "0"
    hmvc = str(board.halfmove_clock)
    game_num = int(game.game_id[-4:], 16) if len(game.game_id) >= 4 else 1
    wname = game.white_player
    bname = game.black_player
    relation = "1"
    init_time = "600"
    inc = "0"
    clock = game.current_clock()
    wtime_ms = str(int(clock["white"] * 1000))
    btime_ms = str(int(clock["black"] * 1000))
    move_num = str((len(game.moves) // 2) + 1)
    lastmove = game.moves[-1] if game.moves else "none"
    return f"<12> {placement} {side} {ep} {wk} {wq} {bk} {bq} {hmvc} {game_num} {wname} {bname} {relation} {init_time} {inc} 0 0 {wtime_ms} {btime_ms} {move_num} 0 0 {lastmove} 0"

class FICSProtocol:
    def __init__(self, game_manager):
        self.gm = game_manager
        self.clients = {}

    async def start(self):
        server = await asyncio.start_server(self.handle_client, "0.0.0.0", FICS_PORT)
        addr = server.sockets[0].getsockname()
        print(f"FICS telnet listening on {addr[0]}:{addr[1]}")
        async with server:
            await server.serve_forever()

    async def handle_client(self, reader, writer):
        peername = writer.get_extra_info("peername")
        addr = f"{peername[0]}:{peername[1]}"
        print(f"[FICS] New connection from {addr}")
        username = None
        state = "login"
        self.clients[writer] = {"username": "", "game_id": None, "state": state}
        writer.write(f"Welcome to opencode Chess Server (FICS-compatible)\r\n\r\n".encode())
        writer.write(f"Login as guest or type 'register <username>' (no password needed locally)\r\n".encode())
        writer.write(f"login: ".encode())
        await writer.drain()
        try:
            while True:
                raw = await reader.readline()
                if not raw:
                    print(f"[FICS] {username} disconnected")
                    break
                line = raw.decode().strip()
                if not line:
                    continue
                if state == "login":
                    parts = line.split()
                    cmd = parts[0].lower() if parts else ""
                    args = parts[1:]
                    if cmd == "register" and args:
                        username = args[0]
                        writer.write(f"Registered as {args[0]}\r\n".encode())
                    elif cmd == "login" and args:
                        username = args[0]
                        writer.write(f"Login accepted.\r\n".encode())
                    else:
                        import string
                        username = "Guest" + "".join(random.choices(string.ascii_letters, k=6))
                        writer.write(f"You are now logged in as \"{username}\"\r\n\r\n".encode())
                    state = "session_start"
                    self.clients[writer]["state"] = "session_start"
                    self.clients[writer]["username"] = username
                    writer.write(f"\r\nPress return to enter the server as \"{username}\":\r\n".encode())
                    writer.write(f"\r\n**** Starting FICS session as {username} ****\r\n".encode())
                    writer.write(b"Type 'help' for help.\r\n\r\n")
                    writer.write(b"fics% ")
                    await writer.drain()
                    print(f"[FICS] {username} <- login ok session start / fics%")
                elif state == "session_start":
                    if not line:
                        writer.write(b"fics% ")
                        await writer.drain()
                        continue
                    print(f"[FICS] {username} -> {line[:80]}")
                    response = await self.process_command(username, line, writer)
                    if response is not None:
                        writer.write(response.encode())
                        print(f"[FICS] {username} <- {response.strip()[:80]}")
                    writer.write(b"fics% ")
                    await writer.drain()
                    if line.lower() == "quit":
                        break
                else:
                    writer.write(b"fics% ")
                    await writer.drain()
        except (ConnectionResetError, asyncio.IncompleteReadError):
            pass
        finally:
            self.clients.pop(writer, None)
            try:
                writer.close()
            except:
                pass

    async def process_command(self, username, line, writer):
        parts = line.split()
        cmd = parts[0].lower() if parts else ""
        args = parts[1:]

        if cmd == "quit":
            return None
        elif cmd == "help":
            return self.cmd_help()
        elif cmd == "who":
            return self.cmd_who(writer)
        elif cmd == "games":
            return self.cmd_games()
        elif cmd in ("style",):
            if args and args[0] == "12":
                self.clients[writer]["state"] = "playing"
            return "Style 12 is now in effect.\r\n"
        elif cmd == "board":
            return self.cmd_board(writer)
        elif cmd == "move":
            return self.cmd_move(writer, args)
        elif cmd == "resign":
            return self.cmd_resign(writer, args)
        elif cmd == "match":
            return self.cmd_match(writer, args)
        elif cmd == "accept":
            return self.cmd_accept(writer, args)
        elif cmd == "decline":
            return self.cmd_decline(writer, args)
        elif cmd in ("register", "login", "guest"):
            if cmd == "register" and args:
                self.clients[writer]["username"] = args[0]
                return f"Registered as {args[0]}\r\n"
            elif cmd == "login" and args:
                self.clients[writer]["username"] = args[0]
                return f"Logged in as {args[0]}\r\n"
            else:
                self.clients[writer]["username"] = username
                return f"Logged in as {username}\r\n"
        elif cmd == "iset":
            return ""
        elif cmd == "set":
            return ""
        elif cmd == "showlist":
            return ""
        elif cmd == "date":
            import datetime
            now = datetime.datetime.utcnow()
            return now.strftime("%A %B %d, %Y  %H:%M:%S UTC\r\n")
        elif cmd == "sought":
            return "No games being sought.\r\n"
        elif cmd == "tell":
            return f"Tell not fully implemented\r\n"
        elif cmd in ("", "\n", "\r\n"):
            return ""
        elif cmd.startswith(("+", "-")) and len(cmd) >= 2:
            return ""
        elif cmd == "alias":
            return ""
        elif cmd.startswith("$"):
            sub = cmd[1:] if len(cmd) > 1 else ""
            if sub == "style" and args and args[0] == "12":
                self.clients[writer]["state"] = "playing"
                game = self.gm.get_game(self.clients[writer].get("game_id"))
                if game:
                    return board_to_fics_style12(game.board, game, self.clients[writer].get("username", "guest")) + "\r\n"
                return "Style 12 is now in effect.\r\n"
            if sub in ("set", "iset", "style"):
                return ""
            return ""
        else:
            return f"Unknown command: {cmd}\r\n"

    def cmd_help(self):
        h = [
            "Available commands:",
            "  who              - List online players",
            "  games            - List active games",
            "  board            - Show current board (style 12)",
            "  style 12         - Enable structured output",
            "  move <move>      - Make a move (e2e4, e4, Nf3, etc.)",
            "  match <player> [time] - Challenge a player",
            "  accept           - Accept a challenge",
            "  decline          - Decline a challenge",
            "  resign           - Resign current game",
            "  tell <p> <msg>   - Send message to player",
            "  help             - Show this help",
            "  quit             - Disconnect",
            "",
        ]
        return "\r\n".join(h) + "\r\n"

    def cmd_who(self, writer):
        my_name = self.clients.get(writer, {}).get("username", "unknown")
        others = [c["username"] for w, c in self.clients.items() if w != writer]
        lines = ["Players online:"]
        lines.append(f"  {my_name} (you)")
        for o in others:
            lines.append(f"  {o}")
        lines.append("")
        return "\r\n".join(lines) + "\r\n"

    def cmd_games(self):
        games = list_games()
        if not games:
            return "No active games.\r\n"
        lines = ["Active games:"]
        for g in games:
            lines.append(f"  {g['game_id']}: {g['white_player']} vs {g['black_player']} [{g['status']}]")
        lines.append("")
        return "\r\n".join(lines) + "\r\n"

    def cmd_board(self, writer):
        client = self.clients.get(writer, {})
        game = self.gm.get_game(client.get("game_id"))
        if not game:
            return "No active game. Use 'match' to start one.\r\n"
        username = client.get("username", "guest")
        return board_to_fics_style12(game.board, game, username) + "\r\n"

    def cmd_move(self, writer, args):
        client = self.clients.get(writer, {})
        game = self.gm.get_game(client.get("game_id"))
        if not game:
            return "No active game.\r\n"
        if game.status == "over":
            return f"Game over: {game.result_reason}\r\n"
        if not args:
            return "Specify a move: move e2e4\r\n"
        move_str = args[0]
        username = client.get("username", "guest")
        success, result = game.make_move(move_str, player=username)
        if success:
            save_game(game)
            return board_to_fics_style12(game.board, game, username) + "\r\n"
        else:
            return f"Illegal move: {result}\r\n"

    def cmd_resign(self, writer, args):
        client = self.clients.get(writer, {})
        game = self.gm.get_game(client.get("game_id"))
        if not game:
            return "No active game.\r\n"
        username = client.get("username", "guest")
        success, msg = game.resign(username)
        if success:
            save_game(game)
            self.gm.on_game_over(game)
            return f"{msg}\r\n"
        return f"{msg}\r\n"

    def cmd_match(self, writer, args):
        client = self.clients.get(writer, {})
        username = client.get("username", "guest")
        if not args:
            return "Usage: match <player> [time_minutes]\r\n"
        target = args[0].lower()
        if target == "opencode":
            game = self.gm.create_game()
            game.white_player = username
            game.black_player = "opencode"
            game.status = "playing"
            client["game_id"] = game.game_id
            save_game(game)
            return f"Game started! opencode plays black. Game ID: {game.game_id}\r\n"
        return f"Player '{target}' not found. Try 'match opencode'.\r\n"

    def cmd_accept(self, writer, args):
        client = self.clients.get(writer, {})
        username = client.get("username", "guest")
        challenge = self.gm.get_challenge_for(username)
        if not challenge:
            return "No pending challenges.\r\n"
        game = challenge["game"]
        game.status = "playing"
        client["game_id"] = game.game_id
        self.gm.remove_challenge(challenge)
        save_game(game)
        return f"Game {game.game_id} started! You play {'white' if game.white_player == username else 'black'}.\r\n"

    def cmd_decline(self, writer, args):
        username = self.clients.get(writer, {}).get("username", "guest")
        challenge = self.gm.get_challenge_for(username)
        if not challenge:
            return "No pending challenges.\r\n"
        self.gm.remove_challenge(challenge)
        return "Challenge declined.\r\n"

# ── Game Manager ─────────────────────────────────────────────────

class GameManager:
    def __init__(self):
        self.games = {}
        self.challenges = []
        self.websockets = {}

    def create_game(self, difficulty=None):
        profile = load_profile()
        diff = difficulty if difficulty is not None else profile["difficulty"]
        game = ChessGame(difficulty=diff)
        self.games[game.game_id] = game
        save_game(game)
        return game

    def get_game(self, game_id):
        if game_id is None:
            return None
        if game_id not in self.games:
            g = load_game(game_id)
            if g:
                self.games[game_id] = g
        return self.games.get(game_id)

    def add_challenge(self, challenger, target, game):
        self.challenges.append({"challenger": challenger, "target": target, "game": game})

    def get_challenge_for(self, username):
        for c in self.challenges:
            if c["target"].lower() == username.lower():
                return c
        return None

    def remove_challenge(self, challenge):
        if challenge in self.challenges:
            self.challenges.remove(challenge)

    def on_game_over(self, game):
        profile = load_profile()
        if game.result == "1-0":
            adjusted = adjust_difficulty(profile, "1-0")
        elif game.result == "0-1":
            adjusted = adjust_difficulty(profile, "0-1")
        else:
            adjust_difficulty(profile, "½-½")
            adjusted = False
        save_profile(profile)
        changed = adjust_difficulty(profile, game.result)
        if changed:
            direction = "increased" if profile["difficulty"] > game.difficulty else "decreased"
            print(f"Difficulty {direction} to {profile['difficulty']} based on recent results")

    async def notify_ws(self, game_id, data):
        if game_id in self.websockets:
            dead = []
            for ws in self.websockets[game_id]:
                try:
                    await ws.send_json(data)
                except:
                    dead.append(ws)
            for ws in dead:
                self.websockets[game_id].discard(ws)

# ── REST API ─────────────────────────────────────────────────────

gm = GameManager()
app = FastAPI(title="opencode Chess")
templates = Jinja2Templates(directory=str(Path(__file__).parent / "webui"))
templates.env.filters["tojson"] = lambda obj: json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")

static_dir = Path(__file__).parent / "webui" / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    games = list_games()
    profile = load_profile()
    return templates.TemplateResponse(request, "index.html", {
        "games": games, "profile": profile
    })

@app.get("/game/{game_id}", response_class=HTMLResponse)
async def game_page(request: Request, game_id: str):
    game = gm.get_game(game_id)
    if not game:
        return HTMLResponse("Game not found", status_code=404)
    profile = load_profile()
    return templates.TemplateResponse(request, "game.html", {
        "game": game.to_dict(), "profile": profile
    })

@app.get("/api/games")
async def api_list_games():
    return list_games()

@app.post("/api/games")
async def api_create_game(data: dict = {}):
    difficulty = data.get("difficulty")
    game = gm.create_game(difficulty=difficulty)
    return game.to_dict()

@app.get("/api/games/{game_id}")
async def api_get_game(game_id: str):
    game = gm.get_game(game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    return game.to_dict()

@app.post("/api/games/{game_id}/moves")
async def api_make_move(game_id: str, data: dict):
    game = gm.get_game(game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    if game.status == "over":
        raise HTTPException(400, f"Game over: {game.result_reason}")
    move_str = data.get("move", "")
    player = data.get("player", "unknown")
    success, result = game.make_move(move_str, player=player)
    if not success:
        raise HTTPException(400, result)
    save_game(game)
    state = game.to_dict()
    await gm.notify_ws(game_id, state)
    if game.status == "over":
        gm.on_game_over(game)
    return state

@app.post("/api/games/{game_id}/resign")
async def api_resign(game_id: str, data: dict = {}):
    game = gm.get_game(game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    player = data.get("player", game.white_player)
    success, msg = game.resign(player)
    if not success:
        raise HTTPException(400, msg)
    save_game(game)
    gm.on_game_over(game)
    state = game.to_dict()
    await gm.notify_ws(game_id, state)
    return state

@app.patch("/api/games/{game_id}/difficulty")
async def api_set_difficulty(game_id: str, data: dict):
    game = gm.get_game(game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    level = data.get("level", 5)
    game.difficulty = max(1, min(10, level))
    save_game(game)
    return {"difficulty": game.difficulty}

@app.patch("/api/games/{game_id}/pause")
async def api_toggle_pause(game_id: str, data: dict):
    game = gm.get_game(game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    paused = data.get("paused", not game.paused)
    game.set_paused(paused)
    save_game(game)
    state = game.to_dict()
    await gm.notify_ws(game_id, state)
    return state

@app.delete("/api/games/{game_id}")
async def api_delete_game(game_id: str):
    game = gm.get_game(game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    gm.games.pop(game_id, None)
    import shutil
    d = GAMES_DIR / game_id
    if d.exists():
        shutil.rmtree(d)
    return {"deleted": game_id}

@app.get("/api/games/{game_id}/export")
async def api_export_pgn(game_id: str):
    game = gm.get_game(game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    return JSONResponse(
        content={"pgn": str(game.board)},
        headers={"Content-Type": "application/json"}
    )

@app.get("/api/profile")
async def api_get_profile():
    return load_profile()

@app.patch("/api/profile")
async def api_update_profile(data: dict):
    profile = load_profile()
    if "difficulty" in data:
        profile["difficulty"] = max(1, min(10, data["difficulty"]))
    save_profile(profile)
    return profile

@app.post("/api/profile/reset")
async def api_reset_profile():
    profile = {
        "difficulty": 5, "rating": 1200, "games_played": 0,
        "wins": 0, "losses": 0, "draws": 0,
        "recent_results": [], "streak_wins": 0, "streak_losses": 0,
        "accuracy_history": [],
    }
    save_profile(profile)
    return profile

sf_engine = None

def get_stockfish():
    global sf_engine
    if sf_engine is None:
        try:
            sf_engine = chess.engine.SimpleEngine.popen_uci("/usr/games/stockfish")
        except FileNotFoundError:
            return None
    return sf_engine

@app.get("/api/games/{game_id}/analysis")
async def api_analysis(game_id: str):
    game = gm.get_game(game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    engine = get_stockfish()
    if not engine:
        raise HTTPException(503, "Stockfish not installed")
    try:
        limit = chess.engine.Limit(time=1.0)
        result = engine.analyse(game.board, limit, multipv=3)
        top_lines = []
        for r in result[:3]:
            score = r["score"].pov(chess.WHITE)
            cp = score.score() if isinstance(score, chess.engine.Cp) else None
            mate = score.mate() if isinstance(score, chess.engine.Mate) else None
            b = game.board.copy()
            pv = []
            for m in r.get("pv", [])[:8]:
                try:
                    if m in b.legal_moves:
                        pv.append(b.san(m))
                        b.push(m)
                    else:
                        pv.append(m.uci())
                        break
                except ValueError:
                    pv.append(m.uci())
                    break
            top_lines.append({
                "score_cp": cp,
                "mate_in": mate,
                "depth": r.get("depth", 0),
                "pv": pv,
            })
        return {
            "fen": game.board.fen(),
            "turn": game.turn,
            "analysis": top_lines,
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.websocket("/api/games/{game_id}/ws")
async def game_websocket(websocket: WebSocket, game_id: str):
    await websocket.accept()
    if game_id not in gm.websockets:
        gm.websockets[game_id] = set()
    gm.websockets[game_id].add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            game = gm.get_game(game_id)
            if game:
                state = game.to_dict()
                await websocket.send_json(state)
    except WebSocketDisconnect:
        pass
    finally:
        gm.websockets[game_id].discard(websocket)
        if not gm.websockets[game_id]:
            del gm.websockets[game_id]

# ── Main ─────────────────────────────────────────────────────────

async def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    profile = load_profile()
    print(f"opencode Chess Server")
    print(f"  Web UI + REST: http://localhost:{REST_PORT}")
    print(f"  FICS telnet:   localhost:{FICS_PORT}")
    print(f"  Data:          {DATA_DIR}")
    print(f"  Difficulty:    {profile['difficulty']}/10")
    fics = FICSProtocol(gm)
    config = uvicorn.Config(app, host="0.0.0.0", port=REST_PORT, log_level="warning")
    server = uvicorn.Server(config)
    await asyncio.gather(
        fics.start(),
        server.serve(),
    )

def run():
    asyncio.run(main())

if __name__ == "__main__":
    run()
