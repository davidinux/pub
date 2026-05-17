# Repository Cleanup Guide

## Current Situation
- Total repository size: 824MB 
- This is because the working directory includes large node_modules/ directory
- The node_modules directory is correctly ignored by .gitignore
- Only 43 files are actually tracked by Git
- No node_modules files are actually committed to Git

## Recommended Solution: Clean Working Directory

1. **Remove node_modules from working directory** (since it's already ignored by .gitignore)
   ```bash
   rm -rf node_modules/
   ```

2. **Ensure proper .gitignore settings** (already correct)
   ```
   # Slidev build output
   dist
   *.zip
   *.tar.gz
   *.tar.bz2
   *.tar.xz

   # Node dependencies
   node_modules/

   # IDE
   .vscode/
   .idea/

   # OS
   .DS_Store
   Thumbs.db

   # Editors
   *~
   *.backup
   *.orig
   ```

3. **Clean up any accidental large file tracking**
   ```bash
   git rm -r --cached node_modules 2>/dev/null || true
   ```

## Alternative: Exclude node_modules from Git entirely

If the user is having issues with git pushing, they should:
1. Make sure node_modules is in .gitignore (it is)
2. Remove any cached references to node_modules in git
3. Ensure they're not committing the node_modules directory

## For Future Development:
1. **Always run `npm install`** to restore dependencies locally
2. **Never commit node_modules to Git**
3. **Use .gitignore properly**
4. **Consider using Git LFS** for large binary assets if needed

## Verification Commands:
```bash
# Check that node_modules is not tracked
git ls-files | grep node_modules

# Check repository size  
du -sh .

# Check what files are actually tracked
git ls-files | wc -l
```