#!/usr/bin/env bash
# Fetches D&D 5e SRD reference data from the community API (dnd5eapi.co)
# Caches full details in <skill_dir>/reference/ for offline use.
#
# Usage:
#   reference-fetch.sh         # API data (monsters, spells, etc.)
#   reference-fetch.sh --books # Free rulebook PDFs + markdown
#   reference-fetch.sh --all   # Both
#   reference-fetch.sh --force # Force re-download
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
REF_DIR="$SKILL_DIR/reference"
BOOKS_DIR="$REF_DIR/books"
BASE_URL="https://www.dnd5eapi.co/api"
MAX_AGE_DAYS=30
FORCE=false
MODE="api"

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    --books) MODE="books" ;;
    --all) MODE="all" ;;
  esac
done

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

fetch_books() {
  local books_fetched=0
  local src_dir="$BOOKS_DIR/sources"

  mkdir -p "$BOOKS_DIR"

  echo ""
  echo "--- Free Rulebook Downloads ---"

  # SRD 5.2.1 (2024/2025 rules) — official PDF
  local srd521_url="https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf"
  local srd521_file="$BOOKS_DIR/SRD_CC_v5.2.1.pdf"
  if needs_update "$srd521_file"; then
    echo "  [1/4] SRD 5.2.1 (2024 rules) PDF..."
    curl -sL "$srd521_url" -o "$srd521_file.tmp" && mv "$srd521_file.tmp" "$srd521_file"
    echo "        Saved: $(du -h "$srd521_file" | cut -f1)"
    books_fetched=$((books_fetched + 1))
  else
    echo "  [1/4] SRD 5.2.1 PDF is current ($(du -h "$srd521_file" | cut -f1))"
  fi

  # SRD 5.1 (2014 rules) — official PDF
  local srd51_url="https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf"
  local srd51_file="$BOOKS_DIR/SRD_CC_v5.1.pdf"
  if needs_update "$srd51_file"; then
    echo "  [2/4] SRD 5.1 (2014 rules) PDF..."
    curl -sL "$srd51_url" -o "$srd51_file.tmp" && mv "$srd51_file.tmp" "$srd51_file"
    echo "        Saved: $(du -h "$srd51_file" | cut -f1)"
    books_fetched=$((books_fetched + 1))
  else
    echo "  [2/4] SRD 5.1 PDF is current ($(du -h "$srd51_file" | cut -f1))"
  fi

  # SRD 5.2.1 Markdown (AI-friendly, searchable format)
  local md_dir="$BOOKS_DIR/srd-5.2.1-markdown"
  if [ ! -d "$md_dir" ] || [ "$FORCE" = true ]; then
    echo "  [3/4] SRD 5.2.1 Markdown (from GitHub)..."
    if command -v git &>/dev/null; then
      if [ -d "$md_dir" ]; then
        (cd "$md_dir" && git pull --ff-only 2>/dev/null) || \
          (rm -rf "$md_dir" && git clone --depth 1 \
            https://github.com/downfallx/dnd-5e-srd-markdown.git "$md_dir")
      else
        git clone --depth 1 \
          https://github.com/downfallx/dnd-5e-srd-markdown.git "$md_dir"
      fi
      local md_files
      md_files=$(find "$md_dir" -name '*.md' 2>/dev/null | wc -l)
      echo "        $md_files markdown files"
      books_fetched=$((books_fetched + 1))
    else
      echo "        Skipped (git not installed). URL for manual clone:"
      echo "        https://github.com/downfallx/dnd-5e-srd-markdown"
    fi
  else
    local md_files
    md_files=$(find "$md_dir" -name '*.md' 2>/dev/null | wc -l)
    echo "  [3/4] SRD 5.2.1 Markdown is current ($md_files files)"
  fi

  # Write manifest
  local manifest="$BOOKS_DIR/_manifest.json"
  cat > "$manifest" <<- EOMANIFEST
{
  "description": "Freely available D&D reference books for offline use.",
  "license": "Creative Commons Attribution 4.0 International (CC-BY-4.0)",
  "srd_5.2.1_pdf": {
    "url": "$srd521_url",
    "file": "SRD_CC_v5.2.1.pdf",
    "ruleset": "2024",
    "note": "Official SRD for 2024/2025 ruleset"
  },
  "srd_5.1_pdf": {
    "url": "$srd51_url",
    "file": "SRD_CC_v5.1.pdf",
    "ruleset": "2014",
    "note": "Official SRD for 2014 ruleset"
  },
  "srd_5.2.1_markdown": {
    "source": "https://github.com/downfallx/dnd-5e-srd-markdown",
    "directory": "srd-5.2.1-markdown",
    "ruleset": "2024",
    "note": "Community-converted SRD in markdown — AI-friendly, grep-able"
  }
}
EOMANIFEST
  echo "  [4/4] Manifest written to _manifest.json"
  books_fetched=$((books_fetched + 1))

  echo ""
  echo "--- Summary ---"
  echo "  Books directory: $BOOKS_DIR"
  echo "  Files:"
  for f in "$BOOKS_DIR"/*.pdf "$BOOKS_DIR/_manifest.json"; do
    if [ -f "$f" ]; then
      echo "    $(basename "$f") ($(du -h "$f" | cut -f1))"
    fi
  done
  if [ -d "$md_dir" ]; then
    echo "    srd-5.2.1-markdown/ (directory with $(find "$md_dir" -name '*.md' | wc -l) files)"
  fi
}

# ---- Main ----
echo "============================================"
echo " D&D 5e SRD Reference Data Fetcher"
echo "============================================"
echo " Skill:  $SKILL_DIR"
echo " Output: $REF_DIR"
echo " Mode:   $MODE"
echo " Force:  $FORCE"
echo " Max age: $MAX_AGE_DAYS days"
echo "============================================"

if [ "$MODE" = "books" ]; then
  fetch_books
  echo ""
  echo "Done. To also fetch API data (monsters, spells, etc.): $0"
  exit 0
fi

if [ "$MODE" = "api" ] || [ "$MODE" = "all" ]; then
  echo ""
  total_cats=${#CATEGORIES[@]}
  for i in "${!CATEGORIES[@]}"; do
    cat="${CATEGORIES[$i]}"
    echo "[$((i+1))/$total_cats] $cat..."
    if [ "$cat" = "conditions" ] || [ "$cat" = "damage-types" ] || \
       [ "$cat" = "magic-schools" ] || [ "$cat" = "skills" ]; then
      fetch_index "$cat"
    else
      fetch_index "$cat"
      fetch_details "$cat"
    fi
  done

  echo ""
  echo "--- API Data Summary ---"
  for cat in "${CATEGORIES[@]}"; do
    count=$(find "$REF_DIR/$cat" -name '*.json' ! -name '_index.json' 2>/dev/null | wc -l)
    echo "   $cat/  ($count entries)"
  done
fi

if [ "$MODE" = "all" ]; then
  echo ""
  fetch_books
fi

echo ""
echo "============================================"
echo " Done."
echo "============================================"
echo ""
echo "  Books:  $0 --books"
echo "  Force:  $0 --force"
