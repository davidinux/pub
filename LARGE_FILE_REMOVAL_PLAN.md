# Plan to Remove Large Files from Git History

## Problem Analysis
The GitHub push failed because the repository contains large files:
- `tags.temp` (219.64 MB)  
- `tags` (369.11 MB)

These files are still in Git history and exceed GitHub's 100MB limit.

## Solution Approach
Remove these files completely from Git history using `git filter-branch` or `BFG Repo-Cleaner`. 

## Detailed Steps to Execute (User Action Required)

### Step 1: Backup Current Repository
```bash
# Create backup before making changes
cp -r /home/davidinux/github/davidinux/pub/conferences/hdc26 /home/davidinux/github/davidinux/pub/conferences/hdc26_backup
```

### Step 2: Remove Large Files from History Using BFG Repo-Cleaner (Recommended)
```bash
# Install BFG if not already installed
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/

# Navigate to repository
cd /home/davidinux/github/davidinux/pub/conferences/hdc26

# Remove large files from history
java -jar bfg.jar --delete-files "tags" --delete-files "tags.temp" .

# Clean up and repack
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

### Step 3: Alternative Method Using git filter-branch (If BFG not available)
```bash
cd /home/davidinux/github/davidinux/pub/conferences/hdc26

# Remove files from all history
git filter-branch --force --tree-filter 'rm -f tags tags.temp tags.lock' --prune-empty --tag-name-filter cat -- --all

# Clean up
rm -rf .git/refs/original/ && git reflog expire --expire=now --all && git gc --aggressive --prune=now
```

### Step 4: Force Push to Remote
```bash
# Force push the cleaned history (WARNING: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

## Important Notes
1. **This will rewrite Git history** - All previous commit hashes will change
2. **Team members will need to re-clone** the repository after this change
3. **Backup first** - Always backup before rewriting history
4. **After cleaning, the repository size should be under 5MB**

## Verification After Cleanup
```bash
# Verify files are gone
git log --oneline --all | grep -E "tags|large" | head -5
git ls-files | grep -E "tags"
du -sh .git/objects/
```

## Prevention Going Forward
1. Ensure `.gitignore` properly excludes large files
2. Regularly audit repository for large files
3. Use Git LFS for large binary assets if needed
4. Add pre-push hooks to prevent large file pushes

## Alternative: If You Want to Keep the Files
If you need the files for some reason, use Git LFS:
```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "tags*"
git add .gitattributes

# Commit the .gitattributes file
git add .gitattributes
```