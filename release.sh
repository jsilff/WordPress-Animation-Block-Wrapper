#!/usr/bin/env bash
#
# release.sh — publish AniLibrary to the WordPress.org SVN repository.
#
# One-command release. Reads version info from your plugin files, syncs the
# runtime files into SVN trunk, creates a frozen tag, pushes directory assets,
# and commits — all in one pass.
#
# Usage:
#   ./release.sh              # do the full release and commit
#   ./release.sh --dry-run    # stage everything locally, show svn status, skip commit
#   ./release.sh --yes        # commit without the y/N confirmation prompt
#
# Configuration (optional, via environment):
#   SVN_USERNAME  your WordPress.org username (the account that owns the plugin)
#   SVN_DIR       where to keep the SVN working copy (default: ~/anilibrary-svn)
#
# First run: SVN will prompt for your SVN-specific password and offer to save it.
# Once credentials are cached, subsequent runs are fully non-interactive.

set -euo pipefail

# --- config -----------------------------------------------------------------
SLUG="anilibrary"
SVN_URL="https://plugins.svn.wordpress.org/${SLUG}/"
SVN_DIR="${SVN_DIR:-$HOME/${SLUG}-svn}"
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSETS_SOURCE="$PLUGIN_DIR/.wordpress-org/assets"
DRY_RUN=0
YES=0

# --- helpers ----------------------------------------------------------------
c_ok()    { printf '\033[32m✔ %s\033[0m\n' "$*"; }
c_step()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
c_warn()  { printf '\033[33m⚠ %s\033[0m\n' "$*"; }
c_err()   { printf '\033[31m✖ %s\033[0m\n' "$*" >&2; }
die()     { c_err "$*"; exit 1; }

svn_args=()
if [[ -n "${SVN_USERNAME:-}" ]]; then
  svn_args+=(--username "$SVN_USERNAME")
fi

# svn_rm_missing <dir> — record deletion for any files SVN already tracked but
# that rsync removed from the working tree.
svn_rm_missing() {
  local dir="$1" f
  svn status "$dir" 2>/dev/null | sed -n 's/^![[:space:]]\+//p' | while IFS= read -r f; do
    [[ -n "$f" ]] && svn rm "$f" >/dev/null
  done
}

# build rsync --exclude args straight from .distignore (single source of truth)
rsync_excludes=()
while IFS= read -r line; do
  [[ -z "$line" || "$line" == \#* ]] && continue
  rsync_excludes+=(--exclude "$line")
done < "$PLUGIN_DIR/.distignore"

# --- arg parsing ------------------------------------------------------------
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --yes|-y) YES=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"; exit 0 ;;
    *) die "Unknown argument: $arg" ;;
  esac
done

# --- 1. read & verify version ----------------------------------------------
c_step "Verifying version numbers"
extract_ver() { grep -m1 -oE '[0-9]+\.[0-9]+\.[0-9]+' "$1" | head -1; }
VERSION="$(sed -n 's/^[[:space:]]*\*[[:space:]]*Version:[[:space:]]*//p' "$PLUGIN_DIR/animation-wrapper.php" | extract_ver -)"
STABLE="$(sed -n 's/^Stable tag:[[:space:]]*//p' "$PLUGIN_DIR/readme.txt" | extract_ver -)"
BLOCKVER="$(sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$PLUGIN_DIR/block.json" | extract_ver -)"

[[ -n "$VERSION" ]]  || die "Could not read Version from animation-wrapper.php"
[[ -n "$STABLE" ]]   || die "Could not read Stable tag from readme.txt"
[[ -n "$BLOCKVER" ]] || die "Could not read version from block.json"
[[ "$VERSION" == "$STABLE" ]] || die "Version ($VERSION) != Stable tag ($STABLE) in readme.txt"
[[ "$VERSION" == "$BLOCKVER" ]] || die "Plugin Version ($VERSION) != block.json version ($BLOCKVER)"
c_ok "Version $VERSION is consistent across plugin header, block.json, and readme.txt"

# --- 2. obtain / refresh SVN working copy ----------------------------------
c_step "Preparing SVN working copy at $SVN_DIR"
if [[ -d "$SVN_DIR/.svn" ]]; then
  svn up ${svn_args[@]+"${svn_args[@]}"} "$SVN_DIR" >/dev/null
  c_ok "Updated existing working copy"
else
  rm -rf "$SVN_DIR"
  svn co ${svn_args[@]+"${svn_args[@]}"} "$SVN_URL" "$SVN_DIR" >/dev/null
  c_ok "Checked out fresh working copy"
fi

TRUNK="$SVN_DIR/trunk"
TAG="$SVN_DIR/tags/$VERSION"
ASSETS="$SVN_DIR/assets"
mkdir -p "$TRUNK" "$ASSETS"

# --- 3. sync trunk from the project ----------------------------------------
c_step "Syncing plugin files into trunk/ (runtime only)"
rsync -am --delete --exclude='.svn/' "${rsync_excludes[@]}" "$PLUGIN_DIR/" "$TRUNK/"
svn add --force "$TRUNK" >/dev/null
svn_rm_missing "$TRUNK"
c_ok "trunk/ now mirrors the shipped file set"

# --- 4. create / replace the release tag -----------------------------------
c_step "Creating tag $VERSION"
if [[ -d "$TAG" ]]; then
  svn revert -R "$TAG" >/dev/null 2>&1 || true
  svn rm --force "$TAG" >/dev/null 2>&1 || true
  c_warn "Removed pre-existing tags/$VERSION (re-release)"
fi
svn cp "$TRUNK" "$TAG" >/dev/null
c_ok "trunk/ copied to tags/$VERSION"

# --- 5. sync directory assets ----------------------------------------------
c_step "Syncing directory assets into assets/"
if [[ ! -d "$ASSETS_SOURCE" ]]; then
  die "Asset source not found: $ASSETS_SOURCE"
fi
rsync -am --delete --exclude='.svn/' "$ASSETS_SOURCE/" "$ASSETS/"
svn add --force "$ASSETS" >/dev/null
svn_rm_missing "$ASSETS"
c_ok "assets/ synced (banners, icons, screenshot)"

# --- 6. review & commit ----------------------------------------------------
c_step "SVN change summary"
svn status "$SVN_DIR" | sed 's/^/  /'

if [[ "$DRY_RUN" -eq 1 ]]; then
  c_warn "Dry run — staged locally, NOT committed. Re-run without --dry-run to publish."
  exit 0
fi

if [[ "$YES" -eq 0 ]]; then
  echo
  read -r -p "Commit this release as $VERSION? [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { c_warn "Aborted — nothing was committed."; exit 0; }
fi

c_step "Committing to WordPress.org"
svn ci ${svn_args[@]+"${svn_args[@]}"} "$SVN_DIR" -m "Release $VERSION"
c_ok "Committed."

# --- 7. verification links --------------------------------------------------
c_step "Live URLs (may take a few minutes to refresh)"
printf '  Plugin page:   https://wordpress.org/plugins/%s/\n' "$SLUG"
printf '  SVN browser:   https://plugins.svn.wordpress.org/%s/\n' "$SLUG"
printf '  Tag:           https://plugins.svn.wordpress.org/%s/tags/%s/\n' "$SLUG" "$VERSION"
printf '  Assets:        https://plugins.svn.wordpress.org/%s/assets/\n' "$SLUG"
c_ok "Release $VERSION published."
