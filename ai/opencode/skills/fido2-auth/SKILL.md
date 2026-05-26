---
name: fido2-auth
description: Run commands that require FIDO2/YubiKey user presence verification — prompts you to touch your security key when needed
compatibility: opencode
---

## What this skill does

SSH operations using FIDO2 keys (`sk-ssh-ed25519@openssh.com`,
`sk-ecdsa-sha2-nistp256@openssh.com`) block waiting for you to physically
touch your security key. This skill wraps such commands with a helper
that detects when the command is waiting and displays a dialog asking
you to touch your key.

## Files

- `<skill_dir>/fido2-auth.sh` — the helper script

## How to use

### Local commands

Always use the helper script when running any command that may require
FIDO2 key authentication:

```
<skill_dir>/fido2-auth.sh <command>
```

**Examples:**

```
<skill_dir>/fido2-auth.sh git push origin main
<skill_dir>/fido2-auth.sh git fetch origin
<skill_dir>/fido2-auth.sh ssh user@host
<skill_dir>/fido2-auth.sh scp file user@host:/path
<skill_dir>/fido2-auth.sh rsync -avz ./ user@host:/path
```

**Never** run these commands directly outside the wrapper — the AI
agent may timeout waiting for your key touch.

### Remote SSH commands

When using `ssh-system_ssh_exec` for a command that may trigger FIDO2
auth, include a note in the `description` parameter so you know to have
your key ready:

```
ssh_exec(
  description: "git push (may need FIDO2 key touch)"
  command: "git push origin main"
)
```

The wrapper script (`fido2-auth.sh`) is not available on the remote
host, so the agent cannot wrap the remote-side command. Have your
security key ready before the agent connects.

### Pre-caching (optional)

If you know you'll run multiple FIDO2-authenticated commands and don't
want repeated dialogs, touch your key once before starting.

## How it works

1. The script forks your command, capturing stdout+stderr to a temp file
2. It polls every 0.5s for 3 seconds
3. If the command finishes within that window → no dialog, output returned
4. If still running → zenity dialog appears asking you to touch your key
5. After touch, command completes, output is returned
6. The AI agent never sees the key touch — it only sees the command output

### Edge cases

- **No zenity available**: Falls back to a stderr message
- **User closes dialog**: Command continues running, dialog can be re-shown
- **Fast commands**: ~0.5s overhead, no dialog

## When to use

Any time you run an SSH-based command that uses a FIDO2 security key.
Common cases:

- `git push` / `git fetch` / `git pull` / `git clone` over SSH
- Direct `ssh` to a remote host
- `scp` / `rsync` over SSH

## Security contract

| Concern | Mitigation |
|---------|------------|
| Key touch in AI session | Touch goes through zenity → local FIDO middleware → key. Never seen by the AI. |
| Command output | Captured and returned to the AI — same as running directly |
| Temp file | Created with `mktemp`, cleaned up on exit via trap |
