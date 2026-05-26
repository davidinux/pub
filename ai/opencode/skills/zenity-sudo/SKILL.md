---
name: zenity-sudo
description: Secure sudo elevation using zenity GUI password prompt — passwords never enter the AI session
compatibility: opencode
---

## What this skill does

Provides a secure way to run commands with sudo where the password flows directly
from the user's GUI (zenity dialog) to sudo's stdin via a pipe — the AI agent
never sees, stores, or logs the password.

## Files

- `<skill_dir>/zenity-sudo.sh` — the helper script

## How to use

### Local sudo commands

Always use the helper script instead of inlining the password:

```
<skill_dir>/zenity-sudo.sh <command>
```

Examples:

```
<skill_dir>/zenity-sudo.sh apt update
<skill_dir>/zenity-sudo.sh systemctl restart nginx
```

**Never** do any of these (they leak the password into the AI session):

- `echo "<password>" | sudo -S <command>`
- `sudo -S <command>` with password in the same bash call
- Storing the password in a variable, file, or environment

### SSH sudo commands (remote hosts)

When using `ssh-system_ssh_exec`, set `sudo: true` but **omit** the
`sudo_password` parameter entirely:

```
ssh_exec(sudo: true)
# do NOT pass sudo_password
```

The SSH system tool already prompts for the password locally via zenity/kdialog
when `sudo: true` is set without `sudo_password`. The password is captured on
your local machine and piped through the SSH connection to `sudo -S` on the
remote host. No DISPLAY forwarding is needed.

### Pre-caching credentials (batch use)

If running multiple sudo commands in sequence, pre-cache credentials once to
avoid repeated zenity prompts:

```
<skill_dir>/zenity-sudo.sh -v
```

This runs `sudo -v`, which updates the cached credential timestamp. Subsequent
sudo commands within the timeout (~5 minutes) won't prompt.

## Security contract

| Threat | Mitigation |
|--------|------------|
| Password in model context | Model only sees the script path and command — password flows through zenity → pipe → sudo |
| Password on disk | Never written |
| Password in process memory | Cleared with `unset PASSWORD` after command completes |
| Cancel / empty password | Script exits immediately with error, no fallback |
| SSH password leak | `sudo_password` parameter is never passed; the SSH tool handles the prompt locally |

## When to use

Any time sudo elevation is needed locally or via SSH. If the command does not
need root, don't use this skill.
