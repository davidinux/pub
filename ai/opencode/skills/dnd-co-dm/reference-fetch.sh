#!/usr/bin/env bash
# Fetches D&D 5e SRD reference data from the community API (dnd5eapi.co)
# Caches full details in <skill_dir>/reference/ for offline use.
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

# All categories to fetch with full details
CATEGORIES=(
  "conditions"
  "damage-types"
  "magic-schools"
  "skills"
  "proficiencies"
  "languages"
  "classes"
  "races"
  "monsters"
  "spells"
  "equipment"
)

mkdir -p "$REF_DIR"

needs_update() {
  local file="$1"
  if [ "$FORCE" = true ]; then return 0; fi
  if [ ! -f "$file" ]; then return 0; fi
  local age=$(( ($(date +%s) - $(stat -c %Y "$file")) / 86400 ))
  [ "$age" -gt "$MAX_AGE_DAYS" ]
}

fetch_index() {
  local category="$1"
  local outdir="$REF_DIR/$category"
  mkdir -p "$outdir"
  local outfile="$outdir/_index.json"
  if needs_update "$outfile"; then
    echo "    Fetching $category index..."
    curl -sL "$BASE_URL/$category" -o "$outfile"
    local count
    count=$(python3 -c "
import json
with open('$outfile') as f:
    data = json.load(f)
print(len(data.get('results', [])))
" 2>/dev/null || echo "0")
    echo "      $count entries indexed"
  else
    echo "    $category index is current"
  fi
}

fetch_details() {
  local category="$1"
  local index_file="$REF_DIR/${category}/_index.json"
  local dest_dir="$REF_DIR/$category"

  if [ ! -f "$index_file" ]; then
    echo "    No index for $category — skipping"
    return
  fi

  # Get total count and indices
  local indices
  indices=$(python3 -c "
import json
with open('$index_file') as f:
    data = json.load(f)
for r in data.get('results', []):
    print(r['index'])
" 2>/dev/null) || true

  if [ -z "$indices" ]; then
    echo "    No details to fetch"
    return
  fi

  local total=0
  local updated=0
  while IFS= read -r index; do
    total=$((total + 1))
  done <<< "$indices"

  if [ "$total" -eq 0 ]; then
    echo "    No entries found in index"
    return
  fi

  local count=0
  echo "    Fetching $total $category details..."

  while IFS= read -r index; do
    count=$((count + 1))
    local detail_file="$dest_dir/${index}.json"
    if needs_update "$detail_file"; then
      curl -sL "$BASE_URL/$category/$index" -o "$detail_file"
      updated=$((updated + 1))
    fi
    # Rate limiting: 5 requests per second
    if [ $((count % 5)) -eq 0 ] && [ "$count" -lt "$total" ]; then
      sleep 0.2
    fi
  done <<< "$indices"

  if [ "$updated" -gt 0 ]; then
    echo "      Fetched/updated $updated of $total"
  else
    echo "      All $total are current"
  fi
}

echo "============================================"
echo " D&D 5e SRD Reference Data Fetcher"
echo "============================================"
echo " Skill:  $SKILL_DIR"
echo " Output: $REF_DIR"
echo " Force:  $FORCE"
echo " Max age: $MAX_AGE_DAYS days"
echo "============================================"
echo ""

total_cats=${#CATEGORIES[@]}
for i in "${!CATEGORIES[@]}"; do
  cat="${CATEGORIES[$i]}"
  echo "[$((i+1))/$total_cats] $cat..."
  if [ "$cat" = "conditions" ] || [ "$cat" = "damage-types" ] || \
     [ "$cat" = "magic-schools" ] || [ "$cat" = "skills" ]; then
    # Small categories: index only (list data is enough)
    fetch_index "$cat"
  else
    # Full categories: index + all details
    fetch_index "$cat"
    fetch_details "$cat"
  fi
done

echo ""
echo "============================================"
echo " Done. Reference data in:"
echo "   $REF_DIR"
echo "============================================"
echo ""
echo " What was downloaded:"
for cat in "${CATEGORIES[@]}"; do
  count=$(find "$REF_DIR/$cat" -name '*.json' ! -name '_index.json' 2>/dev/null | wc -l)
  echo "   $cat/  ($count entries)"
done
echo ""
echo " To force a full refresh: $0 --force"
