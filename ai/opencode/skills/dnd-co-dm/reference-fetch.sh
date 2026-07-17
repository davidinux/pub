#!/usr/bin/env bash
# Fetches D&D 5e SRD reference data from the community API (dnd5eapi.co)
# Caches results in <skill_dir>/reference/ for offline use.
# Run without args to update; pass --force to re-download everything.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
REF_DIR="$SKILL_DIR/reference"
BASE_URL="https://www.dnd5eapi.co/api"
MAX_AGE_DAYS=30
FORCE=false

if [ "${1:-}" = "--force" ]; then
  FORCE=true
fi

mkdir -p "$REF_DIR"/{monsters,spells,equipment}

needs_update() {
  local file="$1"
  if [ "$FORCE" = true ]; then
    return 0
  fi
  if [ ! -f "$file" ]; then
    return 0
  fi
  local age=$(( ($(date +%s) - $(stat -c %Y "$file")) / 86400 ))
  [ "$age" -gt "$MAX_AGE_DAYS" ]
}

fetch_list() {
  local category="$1"
  local outfile="$REF_DIR/${category}/_index.json"
  if needs_update "$outfile"; then
    echo "  Fetching $category list..."
    curl -sL "$BASE_URL/$category" | python3 -m json.tool > "$outfile" 2>/dev/null || \
      curl -sL "$BASE_URL/$category" > "$outfile"
    echo "    Saved $outfile"
  else
    echo "  $category list is current (last fetch: $(stat -c '%y' "$outfile" 2>/dev/null | cut -d. -f1))"
  fi
}

fetch_details() {
  local category="$1"
  local index_file="$REF_DIR/${category}/_index.json"
  local dest_dir="$REF_DIR/$category"

  if [ ! -f "$index_file" ]; then
    echo "  No index for $category — skipping details"
    return
  fi

  local count=0
  local total
  total=$(python3 -c "
import json
with open('$index_file') as f:
    data = json.load(f)
print(len(data.get('results', [])))
" 2>/dev/null || echo "0")

  echo "  Fetching $total $category details..."

  for index in $(python3 -c "
import json
with open('$index_file') as f:
    data = json.load(f)
for r in data.get('results', []):
    print(r['index'])
" 2>/dev/null); do
    local detail_file="$dest_dir/${index}.json"
    if needs_update "$detail_file"; then
      curl -sL "$BASE_URL/$category/$index" > "$detail_file" 2>/dev/null
      count=$((count + 1))
    fi
  done

  if [ "$count" -gt 0 ]; then
    echo "    Fetched/updated $count $category"
  else
    echo "    All $category details are current"
  fi
}

echo "D&D 5e SRD Reference Fetcher"
echo "============================="
echo "Skill dir: $SKILL_DIR"
echo "Reference: $REF_DIR"
echo ""

# Conditions (small, always fetch fully)
echo "[1/5] Conditions..."
fetch_list "conditions"
# conditions don't have sub-details beyond the list entries

# Equipment categories
echo "[2/5] Equipment..."
fetch_list "equipment"
# Equipment list is enough for the AI to reference

# Equipment categories (armor, weapons, adventuring gear)
echo "[3/5] Equipment categories..."
fetch_list "equipment-categories"

# Spells (list only — full details fetched on demand)
echo "[4/5] Spells..."
fetch_list "spells"

# Monsters (list only — full details fetched on demand)
echo "[5/5] Monsters..."
fetch_list "monsters"

echo ""
echo "Done. Reference data in: $REF_DIR"
echo ""
echo "To force a full refresh: $0 --force"
