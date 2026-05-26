#!/usr/bin/env bash
set -euo pipefail

GRACE=3
OUTFILE=$(mktemp)
trap 'rm -f "$OUTFILE"' EXIT

"$@" >"$OUTFILE" 2>&1 &
PID=$!

for i in $(seq 1 $((GRACE * 2))); do
    if ! kill -0 "$PID" 2>/dev/null; then
        wait "$PID"
        RC=$?
        cat "$OUTFILE"
        exit $RC
    fi
    sleep 0.5
done

if command -v zenity &>/dev/null; then
    zenity --notification --text="🔑 FIDO2 authentication required — touch your security key" 2>/dev/null || true
    zenity --info --title="FIDO2 Authentication" \
        --text="Touch your security key now to authenticate.\n\nThe command is waiting for your key." \
        --ok-label="Done" 2>/dev/null || true
else
    echo "Command still running — if this requires FIDO2 auth, touch your security key now." >&2
fi

wait "$PID"
RC=$?
cat "$OUTFILE"
exit $RC
