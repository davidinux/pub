# mcp-ssh-system

A Model Context Protocol (MCP) server that wraps the system `ssh` command for remote execution, file transfer, and interactive shell sessions.

Unlike SSH MCP servers that implement SSH in JavaScript (which **cannot** use FIDO/U2F hardware keys, `ssh-agent`, `ProxyJump`, or `~/.ssh/config`), this server delegates to the system `ssh` binary — everything your OpenSSH client supports, this server supports.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Host machine (runs opencode serve / MCP client)     │
│                                                      │
│  opencode.json                                       │
│    └── mcp.ssh-system ──┬── ssh_configure            │
│                          ├── ssh_list_hosts           │
│                          ├── ssh_exec                │
│                          ├── ssh_upload              │
│                          ├── ssh_download            │
│                          ├── ssh_session_start       │
│                          ├── ssh_session_send        │
│                          ├── ssh_session_read        │
│                          └── ssh_session_close       │
│                                │                     │
│                         system ssh / scp             │
│                          (ControlMaster)             │
│                                │                     │
│                    ┌───────────┴───────────┐         │
│                    ▼                       ▼         │
│              ~/.ssh/config           user@ip:port    │
│              (snapx, ovhcloud,     (ad-hoc hosts)    │
│               github, etc)                            │
└──────────────────────────────────────────────────────┘
```

Because it uses system `ssh`, every connection inherits:
- Your `~/.ssh/config` (Host aliases, `IdentityFile`, `User`, `Port`, `ProxyJump`, etc.)
- `ssh-agent` with FIDO/U2F hardware keys (Yubico, etc.)
- `ProxyJump` / bastion host configurations
- `Match` directives and conditional blocks
- SSH certificate authentication

## Session Configuration

On first use in a session, call `ssh_configure` to set defaults. All subsequent tool calls can omit `host` — the configured default is used automatically.

```
ssh_configure(default_host="snapx", persist_timeout=300)
ssh_exec(command="df -h")              ← uses snapx
ssh_exec(host="ovhcloud", command="df") ← explicit override
```

## Persistent Connections (SSH Multiplexing)

All SSH and SCP commands use OpenSSH's **ControlMaster** multiplexing:

- The **first** connection to a host authenticates (Yubico touch, password, etc.)
- **Subsequent** connections to the same host reuse the established control socket — **no re-authentication needed**
- The connection stays alive for the configured idle timeout

```
First  ssh_exec(host="snapx", command="...")  →  Yubico touch
Second ssh_exec(host="snapx", command="...")  →  instant (reuses socket)
Third  ssh_exec(host="snapx", command="...")  →  instant
```

Control sockets are stored in `/tmp/mcp-ssh-ctl/`. Each host:user:port combination gets its own socket.

Set the persist timeout via `ssh_configure` (per-session) or `SSH_PERSIST_TIMEOUT` env var (global, default 300s):

```bash
SSH_PERSIST_TIMEOUT=600 opencode serve   # 10 min idle
SSH_PERSIST_TIMEOUT=0 opencode serve     # disable (auth each time)
```

## Prerequisites

- **Node.js 18+** — tested on 20.x and 22.x
- **OpenSSH client** — `ssh` and `scp` must be in `PATH`
- **SSH access** — to the target hosts you want to manage
- **Zenity** (optional) — for interactive sudo password prompts

## Installation

### Local (recommended for OpenCode users)

```bash
git clone <this-repo> /path/to/mcp-ssh-system
cd /path/to/mcp-ssh-system
npm install
```

## Configuration

### OpenCode

Add to your `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "ssh-system": {
      "type": "local",
      "command": ["node", "/path/to/mcp-ssh-system/index.js"],
      "enabled": true,
      "timeout": 30000
    }
  }
}
```

Restart `opencode serve`, then verify:

```bash
opencode mcp list
# → ssh-system  connected
```

### Claude Desktop / VS Code / Cursor / Continue

```json
{
  "mcpServers": {
    "ssh-system": {
      "command": "node",
      "args": ["/path/to/mcp-ssh-system/index.js"]
    }
  }
}
```

## Tools

### `ssh_configure`

Set default SSH configuration for the session. Call this first so subsequent tools can omit the `host` parameter.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `default_host` | string | no | Default SSH host for subsequent commands |
| `persist_timeout` | number | no | SSH ControlMaster idle timeout in seconds (default: 300) |

Returns the current config after applying changes.

```
ssh_configure(default_host="snapx", persist_timeout=600)
→ { default_host: "snapx", persist_timeout: 600 }
```

### `ssh_list_hosts`

List known SSH hosts from `~/.ssh/config`.

```
→ { "hosts": ["snapx", "ovhcloud", "github.com", "gitlab.com"] }
```

### `ssh_exec`

Execute a command on a remote host via SSH. Uses `default_host` from `ssh_configure` if `host` is omitted.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `host` | string | no | SSH alias or `user@host` (optional if configured) |
| `command` | string | yes | Shell command to execute |
| `timeout` | number | no | Timeout in ms (default: 30000) |
| `sudo` | boolean | no | Run via sudo; prompts for password via zenity |
| `sudo_password` | string | no | Password for remote sudo (bypasses zenity prompt) |

On success: returns raw stdout text. On failure: returns stderr with `isError: true`.

```
ssh_exec(command="uname -a")
→ Linux snapx 6.8.0-... #1 SMP ... x86_64 GNU/Linux

ssh_exec(command="apt update", sudo=true)
→ [zenity dialog pops up] → user enters sudo password → command runs
```

### `ssh_upload`

Upload a local file or directory to a remote host via SCP. Uses `default_host` if `host` is omitted.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `host` | string | no | SSH alias or `user@host` (optional if configured) |
| `local_path` | string | yes | Absolute path to local file/directory |
| `remote_path` | string | yes | Destination path on remote host |
| `recursive` | boolean | no | Copy directories recursively (`scp -r`) |

### `ssh_download`

Download a file or directory from a remote host via SCP. Uses `default_host` if `host` is omitted.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `host` | string | no | SSH alias or `user@host` (optional if configured) |
| `remote_path` | string | yes | Path on remote host |
| `local_path` | string | yes | Destination path locally |
| `recursive` | boolean | no | Copy directories recursively (`scp -r`) |

### `ssh_session_start`

Start a persistent interactive SSH session. Uses `default_host` if `host` is omitted.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `host` | string | no | SSH alias or `user@host` (optional if configured) |

The session uses `ssh -tt` for PTY allocation, giving you an interactive shell environment that preserves `cwd`, environment variables, and running processes. Returns a `session_id` for use with the session tools below.

### `ssh_session_send`

Send input to an active session.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | yes | Session ID from `ssh_session_start` |
| `input` | string | yes | Text to send |
| `press_enter` | boolean | no | Append newline (default: true) |

### `ssh_session_read`

Read accumulated output since the last read from an active session.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | yes | Session ID from `ssh_session_start` |

Returns raw output text. Appends `[Session ended]` if the session has closed.

### `ssh_session_close`

Close an active SSH session and release resources.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | yes | Session ID from `ssh_session_start` |

## Usage Examples

### Session setup

```
→ ssh_configure(default_host="snapx", persist_timeout=600)
  ← { default_host: "snapx", persist_timeout: 600 }

→ ssh_exec(command="df -h")
  ← Filesystem      Size  Used Avail Use% Mounted on
     /dev/sda1       234G   45G  189G  20% /

→ ssh_exec(command="apt update", sudo=true)
  ← [zenity prompts for sudo password]
  ← Hit:1 http://archive.ubuntu.com noble InRelease
     ...
```

### Ad-hoc host (no config needed)

```
ssh_exec(host="ubuntu@192.168.1.100:2222", command="df -h")
```

### Full interactive session

```
1. ssh_session_start(host="snapx")
   → Session started: abc-123\nHost: snapx

2. ssh_session_send(session_id="abc-123", input="cd /var/log && tail -f syslog")

3. ssh_session_read(session_id="abc-123")
   → May 21 10:00:00 snapx kernel: ...
     May 21 10:00:01 snapx sshd[1234]: ...

4. ssh_session_close(session_id="abc-123")
   → Session closed: abc-123
```

### File transfer

```
ssh_upload(host="snapx", local_path="/tmp/config.yaml", remote_path="/etc/app/config.yaml")
→ OK

ssh_download(host="snapx", remote_path="/var/log/app.log", local_path="/tmp/app.log")
→ OK
```

## How It Works

1. `ssh_configure` stores defaults in memory for the session duration
2. `ssh_exec` spawns `ssh <host> -- <command>` as a child process, captures stdout/stderr/exit code
3. `ssh_upload`/`ssh_download` delegate to `scp` which uses the same SSH authentication
4. `ssh_session_*` uses `ssh -tt` for PTY allocation with a rolling 1MB output buffer per session
5. All SSH authentication is handled by the system `ssh` — your `~/.ssh/config`, `ssh-agent`, hardware keys, and `ProxyJump` all work naturally
6. **ControlMaster multiplexing** keeps connections alive, avoiding re-authentication between commands
7. **sudo support**: when `sudo: true` is passed without a password, zenity shows a password dialog; the password is piped to `sudo -S` on the remote host

## Security

- **No SSH credentials stored in the server** — authentication is handled entirely by the system `ssh` client and `ssh-agent`
- **No persistent config file** — session configuration lives in memory only
- **No network listener** — the server uses stdio transport (not HTTP), so it's not exposed to the network
- **Command injection protection** — the `--` separator ensures the command is not interpreted as SSH arguments
- **Timeout protection** — all operations have configurable timeouts with forced termination via SIGTERM/SIGKILL
- **Session isolation** — each session is isolated in its own process, with a rolling buffer capped at 1MB
- **Zenity sudo dialog** — sudo password is captured via a native GUI dialog, never exposed to the LLM context

## Development

```bash
git clone <this-repo>
cd mcp-ssh-system
npm install

# Test manually via JSON-RPC over stdio
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node index.js

# Test configure + exec flow
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"ssh_configure","arguments":{"default_host":"snapx"}}}' | node index.js
```

## License

MIT
