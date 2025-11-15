# 🧹 Git Cleanup & Optimization Guide

Complete guide for cleaning up your Advancia repository, removing junk files, and re-enabling full Git features in VS Code.

---

## 🎯 Why Clean Your Repo?

### Problems This Fixes

- ❌ "Too many active changes" warnings in VS Code
- ❌ Git features disabled due to large changesets
- ❌ Slow git operations (status, diff, commit)
- ❌ Bloated repository size
- ❌ Logs and build artifacts tracked in Git
- ❌ Secrets accidentally committed

### Benefits After Cleanup

- ✅ Fast git operations
- ✅ Full VS Code Git integration re-enabled
- ✅ Smaller repository size (faster clones)
- ✅ Clean history without junk files
- ✅ Better collaboration (teammates clone faster)
- ✅ CI/CD works reliably

---

## 🚀 Quick Start

### Option 1: Automated Cleanup Script (Recommended)

```bash
# Run the cleanup script
bash cleanup-git.sh
```

This script will:

1. Check repo size before cleanup
2. Apply `.gitignore` rules
3. Remove ignored files from Git tracking
4. Run garbage collection
5. Show size reduction
6. Optionally push changes

### Option 2: Manual Cleanup

```bash
# 1. Apply .gitignore
git rm -r --cached .
git add .
git commit -m "chore: apply .gitignore cleanup"

# 2. Clean up history
git reflog expire --expire=now --all
git gc --prune=now

# 3. Aggressive cleanup (optional)
git gc --aggressive --prune=now

# 4. Push changes
git push origin main
```

---

## 📋 Step-by-Step Manual Process

### Step 1: Verify Current State

```bash
# Check current status
git status

# Count files
git status --porcelain | wc -l

# Check repo size
git count-objects -vH
```

**Expected Issues:**

- Thousands of untracked files (node_modules, logs, build artifacts)
- Large repo size (>100 MB for small projects)
- VS Code Git features disabled

---

### Step 2: Create/Update `.gitignore`

The repository includes a comprehensive `.gitignore` file that covers:

- Node.js dependencies (`node_modules/`)
- Build outputs (`dist/`, `build/`, `.next/`)
- Logs (`*.log`, `logs/`, `backend-watchdog.log`)
- Environment files (`.env`, `.env.local`)
- PM2 runtime (`.pm2/`, `dump.pm2`)
- Status page data (`status.json`)
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)

**Verify `.gitignore` exists:**

```bash
cat .gitignore | head -20
```

---

### Step 3: Remove Ignored Files from Git Tracking

```bash
# Show what will be removed
git ls-files -i --exclude-standard

# Remove cached files (but keep them locally)
git rm -r --cached .

# Re-add everything (respecting .gitignore)
git add .

# Check what changed
git status

# Commit the cleanup
git commit -m "chore: enforce .gitignore - remove ignored files"
```

**What This Does:**

- Removes files from Git that are now in `.gitignore`
- Keeps files on your local disk
- Updates Git index to respect new rules

---

### Step 4: Clean Git History

```bash
# Expire old reflog entries
git reflog expire --expire=now --all

# Verify reflog is cleaned
git reflog show --all | wc -l
```

**What This Does:**

- Removes old references to deleted/changed files
- Prepares repo for garbage collection

---

### Step 5: Run Garbage Collection

```bash
# Basic garbage collection
git gc --prune=now

# Check size reduction
git count-objects -vH

# Aggressive garbage collection (optional)
git gc --aggressive --prune=now
```

**Aggressive GC Comparison:**

- **Basic GC**: Fast (1-2 min), moderate cleanup
- **Aggressive GC**: Slow (10-30 min), maximum cleanup

**When to Use Aggressive GC:**

- First-time cleanup
- Repo size >500 MB
- Before major release
- Quarterly maintenance

---

### Step 6: Verify Cleanup Success

```bash
# Check repo size
git count-objects -vH

# Check active changes
git status --porcelain | wc -l

# Verify no ignored files tracked
git ls-files -i --exclude-standard | wc -l
```

**Success Indicators:**

- Repo size reduced by 30-70%
- Active changes <100 files
- No ignored files in tracking
- VS Code Git features work again

---

### Step 7: Push Changes

```bash
# Push cleanup commit
git push origin main

# If history was rewritten (force push)
git push --force origin main
```

**⚠️ Warning:** Force pushing rewrites remote history. Only do this if:

- You're the only developer
- Or team is aware and synced
- Or on a personal branch

---

## 🤖 Automated Cleanup with GitHub Actions

The repository includes `.github/workflows/repo-cleanup.yml` that automatically:

### When It Runs

- **On push to main** (when `.gitignore` changes)
- **Weekly schedule** (Sunday at 3 AM UTC)
- **Manual trigger** (workflow_dispatch)

### What It Does

1. Checks repo size before cleanup
2. Enforces `.gitignore` rules
3. Removes ignored files from tracking
4. Expires reflog entries
5. Runs garbage collection
6. Measures size reduction
7. Pushes cleanup commit (if needed)
8. Creates summary report

### View Cleanup Reports

```
GitHub → Actions → Repository Hygiene & Cleanup → Latest Run
```

---

## 🐛 Troubleshooting

### Issue: "Too many active changes" in VS Code

**Cause:** Git tracking thousands of files that should be ignored

**Solution:**

```bash
# Apply .gitignore
git rm -r --cached .
git add .
git commit -m "chore: apply .gitignore"

# Restart VS Code
```

---

### Issue: VS Code Git features still disabled

**Cause:** VS Code cache not refreshed

**Solution:**

```bash
# 1. Close all VS Code windows
# 2. Clear VS Code cache
rm -rf ~/.vscode/extensions/vscode.git-*
rm -rf ~/.config/Code/User/workspaceStorage/*

# 3. Restart VS Code
# 4. Reload window: Ctrl+Shift+P → "Reload Window"
```

---

### Issue: Repo size didn't reduce

**Cause:** Aggressive GC needed or large files in history

**Solution:**

```bash
# Run aggressive GC
git gc --aggressive --prune=now

# Find large files
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
  | sed -n 's/^blob //p' \
  | sort -nrk2 \
  | head -20

# Remove large files from history (if needed)
git filter-repo --path-glob '**/large-file.zip' --invert-paths
```

---

### Issue: Can't push after cleanup

**Cause:** Local history diverged from remote

**Solution:**

```bash
# Check divergence
git log origin/main..HEAD

# Option 1: Force push (if you own the repo)
git push --force origin main

# Option 2: Pull and merge
git pull --rebase origin main
git push origin main
```

---

### Issue: Ignored files keep coming back

**Cause:** `.gitignore` not committed or wrong patterns

**Solution:**

```bash
# Verify .gitignore is committed
git ls-files .gitignore

# Test patterns
git check-ignore -v backend/logs/err.log

# Re-apply rules
git rm -r --cached .
git add .
git commit -m "chore: re-apply .gitignore"
```

---

## 📊 Monitoring Repo Health

### Check Repo Size

```bash
# Detailed statistics
git count-objects -vH

# Quick size check
du -sh .git
```

**Healthy Ranges:**

- **Small project** (<10k lines): <10 MB
- **Medium project** (10k-50k lines): 10-50 MB
- **Large project** (>50k lines): 50-200 MB

---

### Check Active Changes

```bash
# Count untracked files
git status --porcelain | grep "^??" | wc -l

# Count modified files
git status --porcelain | grep "^ M" | wc -l

# Show file types
git status --porcelain | awk '{print $2}' | sed 's/.*\.//' | sort | uniq -c
```

**Healthy Thresholds:**

- Untracked: <20 files (add to `.gitignore` if more)
- Modified: <50 files (commit frequently)

---

### Check Ignored Files

```bash
# List ignored files in Git
git ls-files -i --exclude-standard

# Count ignored files
git ls-files -i --exclude-standard | wc -l

# Should be 0 after cleanup
```

---

## ✅ Best Practices

### Daily

- ✅ Commit source code frequently
- ✅ Don't commit logs, builds, or node_modules
- ✅ Keep `.env` files out of Git
- ✅ Review `git status` before committing

### Weekly

- ✅ Check repo size: `git count-objects -vH`
- ✅ Verify `.gitignore` is working
- ✅ Clean local branches: `git branch -d <branch>`

### Monthly

- ✅ Run `git gc --prune=now`
- ✅ Audit `.gitignore` for new patterns
- ✅ Check GitHub Actions cleanup logs

### Quarterly

- ✅ Run aggressive GC: `git gc --aggressive --prune=now`
- ✅ Review and remove old branches
- ✅ Audit large files in history
- ✅ Update `.gitignore` for new dependencies

---

## 🔒 Security Checklist

Before pushing cleanup changes:

- [ ] No secrets in `.env` (use `.env.example` instead)
- [ ] No API keys in code (use environment variables)
- [ ] No credentials in config files
- [ ] No SSH keys or certificates committed
- [ ] No database dumps or backups in repo
- [ ] Verify with: `git log --all --source --full-history --patch -- '**/*.env'`

---

## 📚 Related Documentation

- [.gitignore](./.gitignore) - Repository ignore rules
- [cleanup-git.sh](./cleanup-git.sh) - Automated cleanup script
- [.github/workflows/repo-cleanup.yml](./.github/workflows/repo-cleanup.yml) - Automated GitHub Actions
- [.github/workflows/deploy-droplet.yml](./.github/workflows/deploy-droplet.yml) - Deployment workflow

---

## 🆘 Emergency Recovery

If cleanup breaks something:

```bash
# 1. Check reflog (history of HEAD changes)
git reflog

# 2. Reset to previous state
git reset --hard HEAD@{1}

# 3. Verify everything works
npm install
npm test

# 4. Try cleanup again with caution
```

---

**Last Updated:** 2024-11-14  
**Maintenance Frequency:** Run cleanup script quarterly or when repo >200 MB
