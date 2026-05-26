#!/usr/bin/env bash
set -euo pipefail

if ! command -v zenity &>/dev/null; then
    echo "Error: zenity is not installed. Install with: sudo apt install zenity" >&2
    exit 1
fi

PASSWORD=$(zenity --password --title="Sudo Required" 2>/dev/null)
if [ -z "$PASSWORD" ]; then
    echo "Sudo cancelled by user." >&2
    exit 1
fi

echo "$PASSWORD" | sudo -S "$@"
RC=$?
unset PASSWORD
exit $RC
