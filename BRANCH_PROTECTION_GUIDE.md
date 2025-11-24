# 🔒 Branch Protection Setup Guide

**Last Updated:** November 17, 2025  
**Status:** Ready for Implementation

---

## 🎯 Quick Start

### Option 1: Automated Setup (Recommended)

1. **Create GitHub Personal Access Token (PAT)**
   -   Go to: <https://github.com/settings/tokens>
   -   Click "Generate new token (classic)"
   -   Name: `Branch Protection Token`
   -   Select scopes:
   -   ✅ `repo` (Full control of private repositories)
   -   ✅ `admin:repo_hook` (Full control of repository hooks)
   -   Click "Generate token"
   -   **Copy the token** (you won't see it again!)

2. **Add Token to Repository Secrets**
   -   Go to: `Repository Settings → Secrets and variables → Actions`
   -   Click "New repository secret"
   -   Name: `GH_ADMIN_PAT`
   -   Value: Paste your PAT
   -   Click "Add secret"

3. **Run the Workflow**

   ```
   Go to: Actions → Setup Branch Protection → Run workflow

   Select options:
   - Branch: main
   - Protection level: standard

   Click "Run workflow"
   ```

### Option 2: Manual Setup

Go to: `Repository Settings → Branches → Add branch protection rule`

Configure as shown in [Manual Configuration](#manual-configuration-steps) below.

---

## 📊 Protection Levels

### Minimal Protection

-   ❌ No required status checks
-   ❌ No PR reviews required
-   ✅ Prevent branch deletion
-   ⚠️ Force push allowed (use with caution)

**Use case:** Development branches, personal projects

### Standard Protection (Recommended)

-   ✅ Require status checks to pass:
    -   `build` - Backend/Frontend build
    -   `type-lint` - TypeScript type checking
    -   `CI (pnpm checks)` - Code quality checks
-   ✅ Require 1 pull request review
-   ✅ Dismiss stale reviews on new push
-   ✅ Require conversation resolution
-   ❌ No force pushes
-   ✅ Prevent branch deletion

**Use case:** Production repositories, team projects

### Strict Protection

-   ✅ Require status checks to pass:
    -   `build`, `type-lint`, `CI (pnpm checks)`
    -   `backend`, `frontend` - Full test suites
-   ✅ Require 2 pull request reviews
-   ✅ Require code owner approval
-   ✅ Require approval of most recent push
-   ✅ Enforce for administrators
-   ✅ Require linear history (no merge commits)
-   ✅ Require conversation resolution
-   ❌ No force pushes
-   ✅ Prevent branch deletion

**Use case:** Critical production systems, regulated environments

---

## 🔧 Manual Configuration Steps

### Branches to Protect

This guide covers protection rules for:

-   ✅ **`main`** - Production branch (strictest rules)
-   ✅ **`staging`** - Integration/QA branch (moderate rules)
-   ℹ️ **`feature/*`** - Feature branches (no protection needed)

---

### Step 1: Access Branch Protection Settings

1. Navigate to your repository
2. Click **Settings** (top right)
3. Click **Branches** (left sidebar)
4. Click **Add branch protection rule**

### Step 2: Configure Branch Pattern

For **main branch** (production):

```text
Branch name pattern: main
```

For **staging branch** (integration/QA):

```text
Branch name pattern: staging
```

**Note:** Configure each branch separately with appropriate rules below.

---

## 🔒 Protection Rules for `main` Branch

### Step 3: Enable Protection Rules (Main Branch)

#### ✅ Require Pull Request Before Merging

-   [x] **Require a pull request before merging**
    -   [x] Require approvals: **1** (standard) or **2** (strict)
    -   [x] Dismiss stale pull request approvals when new commits are pushed
    -   [x] Require review from Code Owners (if CODEOWNERS file exists)
    -   [x] Require approval of the most recent reviewable push (strict only)
    -   [ ] Require conversation resolution before merging

#### ✅ Require Status Checks Before Merging

-   [x] **Require status checks to pass before merging**
    -   [x] Require branches to be up to date before merging

**Status checks to require:** (Click "Search for status checks")

```
build
type-lint
CI (pnpm checks)
backend
frontend
Integration Tests (optional)
```

#### ✅ Additional Rules

-   [x] **Require conversation resolution before merging**
-   [ ] **Require signed commits** (optional, requires GPG setup)
-   [x] **Require linear history** (strict only)
-   [ ] **Require deployments to succeed** (if using GitHub Deployments)

#### 🛡️ Enforcement Settings

-   [ ] **Do not allow bypassing the above settings**
    -   Check this for strict enforcement (even admins must follow rules)
    -   Leave unchecked for flexibility during emergencies

#### 🚫 Restrict Who Can Push

-   [ ] **Restrict who can push to matching branches**
    -   Leave unchecked for open collaboration
    -   Check and add specific users/teams for restricted repositories

#### 📝 Additional Options

-   [ ] **Allow force pushes** - ❌ **Do NOT enable for main branch**
-   [ ] **Allow deletions** - ❌ **Do NOT enable for main branch**

### Step 4: Save Changes

Click **Create** or **Save changes**

---

## 🟡 Protection Rules for `staging` Branch

Repeat Step 1-2 above with branch pattern: `staging`

### Step 3: Enable Protection Rules (Staging Branch)

#### ✅ Require Pull Request Before Merging

-   [x] **Require a pull request before merging**
    -   [x] Require approvals: **1** (less strict than main)
    -   [x] Dismiss stale pull request approvals when new commits are pushed
    -   [ ] Require review from Code Owners (optional)
    -   [ ] Require approval of the most recent reviewable push

#### ✅ Require Status Checks Before Merging

-   [x] **Require status checks to pass before merging**
    -   [x] Require branches to be up to date before merging

**Status checks to require:**

```text
build
type-lint
CI (pnpm checks)
```

#### ✅ Additional Rules

-   [x] **Require conversation resolution before merging**
-   [ ] **Require signed commits** (optional)
-   [ ] **Require linear history** (optional for staging)

#### 🛡️ Enforcement Settings

-   [ ] **Do not allow bypassing the above settings**
    -   Leave unchecked for staging (allow force pushes for resets if needed)

#### 🚫 Restrict Who Can Push

-   [ ] **Restrict who can push to matching branches**
    -   Leave unchecked for open collaboration

#### 📝 Additional Options

-   [x] **Allow force pushes** - ✅ **Enable for staging only** (for integration resets)
-   [ ] **Allow deletions** - ❌ **Do NOT enable**

### Step 4: Save Changes

Click **Create** or **Save changes**

---

## 🔍 Verify Protection is Active

### Via GitHub UI

1. Go to repository main page
2. Look for shield icon next to branch name
3. Should show: `🛡️ Protected`

### Via Command Line

```bash
# Install GitHub CLI
gh auth login

# Check branch protection
gh api repos/:owner/:repo/branches/main/protection | jq
```

### Via Workflow

Run the verification script:

```bash
curl -H "Authorization: token YOUR_PAT" \
  https://api.github.com/repos/OWNER/REPO/branches/main/protection | jq
```

---

## 🚀 Testing Branch Protection

### Test 1: Direct Push to Main (Should Fail)

```bash
# Try to push directly to main
git checkout main
echo "test" >> README.md
git add README.md
git commit -m "Test direct push"
git push origin main

# Expected result: ❌ Push rejected
# Error: "Protected branch update failed"
```

### Test 2: Create Pull Request (Should Work)

```bash
# Create feature branch
git checkout -b test/branch-protection
echo "test" >> README.md
git add README.md
git commit -m "Test via PR"
git push origin test/branch-protection

# Create PR via GitHub UI or CLI
gh pr create --title "Test Branch Protection" --body "Testing PR workflow"

# Expected result: ✅ PR created successfully
```

### Test 3: Merge Without Approval (Should Fail)

```bash
# Try to merge your own PR without approval
gh pr merge YOUR_PR_NUMBER

# Expected result: ❌ Merge blocked
# Error: "Required approvals not met"
```

### Test 4: Merge With Approval (Should Work)

```bash
# Have another user approve the PR
# Then merge
gh pr merge YOUR_PR_NUMBER --auto --squash

# Expected result: ✅ Merged successfully
```

---

## 🎭 Bypass Protection (Emergency Only)

### Scenario: Critical Hotfix Needed Immediately

#### Option 1: Temporarily Disable Protection (Admins Only)

1. Go to `Settings → Branches`
2. Edit the protection rule
3. Uncheck "Do not allow bypassing"
4. Push your hotfix
5. **Immediately re-enable protection**

#### Option 2: Use Admin Override

If "Enforce for administrators" is disabled:

1. Admins can push directly
2. Use with extreme caution
3. Document in commit message: `[EMERGENCY HOTFIX] Reason`

#### Option 3: Fast-Track PR

1. Create PR as normal
2. Request emergency review
3. Merge immediately after approval
4. Post-merge review if needed

### 🚨 Emergency Bypass Checklist

-   [ ] Document reason for bypass
-   [ ] Notify team in Slack/Discord/Email
-   [ ] Create incident ticket
-   [ ] Re-enable protection immediately after
-   [ ] Schedule post-mortem review
-   [ ] Update deployment docs if needed

---

## 📋 CODEOWNERS File (Optional)

Create `.github/CODEOWNERS` to require specific people to review certain files:

```bash
# .github/CODEOWNERS

# Default owners for everything
* @your-github-username

# Backend code requires backend team review
/backend/** @backend-team @tech-lead

# Frontend code requires frontend team review
/frontend/** @frontend-team @ui-lead

# DevOps files require DevOps review
/.github/workflows/** @devops-team
/docker-compose*.yml @devops-team
/Dockerfile @devops-team

# Database migrations require DBA review
/backend/prisma/migrations/** @database-admin @tech-lead

# Security-sensitive files require security team
/backend/src/middleware/auth.ts @security-team
/backend/src/routes/auth.ts @security-team
/.env.example @security-team

# Documentation requires tech writer review
/docs/** @tech-writer @product-manager
/*.md @tech-writer
```

---

## 🔄 Status Checks Configuration

### Required Status Checks

These CI workflows must pass before merging:

1. **`build`** - From `.github/workflows/ci.yml`
   -   Builds backend and frontend
   -   Verifies no compilation errors

2. **`type-lint`** - From `.github/workflows/ci-pnpm.yml`
   -   TypeScript type checking
   -   ESLint code quality

3. **`CI (pnpm checks)`** - From `.github/workflows/ci-pnpm.yml`
   -   Comprehensive linting
   -   Type checking across workspace

4. **`backend`** (optional) - From `.github/workflows/ci.yml`
   -   Backend unit tests
   -   Integration tests

5. **`frontend`** (optional) - From `.github/workflows/ci.yml`
   -   Frontend component tests
   -   E2E tests

### Update Required Checks

To modify which checks are required:

```bash
# Via workflow
Run: Actions → Setup Branch Protection → Run workflow
Enter: "build,type-lint,CI (pnpm checks),backend,frontend"

# Or via API
curl -X PUT \
  -H "Authorization: token YOUR_PAT" \
  https://api.github.com/repos/OWNER/REPO/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": ["build", "type-lint", "CI (pnpm checks)"]
    }
  }'
```

---

## 🐛 Troubleshooting

### Problem: "Required status checks not found"

**Solution:**

1. Run workflows at least once to register checks
2. Push a commit to trigger CI
3. Wait for checks to complete
4. Then add them to required checks

### Problem: "Cannot push to protected branch"

**Solution:**

-   ✅ **Correct:** Create a feature branch and PR
-   ❌ **Incorrect:** Trying to push directly to main

```bash
# Correct workflow
git checkout -b feature/my-feature
git push origin feature/my-feature
# Create PR via GitHub UI
```

### Problem: "You need admin access to modify protection"

**Solution:**

1. Ensure you have admin rights to the repository
2. Check that your PAT has `repo` and `admin:repo_hook` scopes
3. Regenerate PAT if needed

### Problem: "Status check never appears"

**Solution:**

1. Check workflow file syntax:

   ```yaml
   jobs:
     build: # This becomes status check "build"
       name: Build Frontend & Backend
   ```

2. Ensure workflow runs on PR events:

   ```yaml
   on:
     pull_request:
       branches: [main]
   ```

3. Push a test commit to trigger the workflow

### Problem: "Cannot merge: head branch is out of date"

**Solution:**

```bash
# Update your branch with latest main
git checkout your-branch
git fetch origin
git rebase origin/main
git push --force-with-lease origin your-branch
```

---

## 📊 Monitoring and Maintenance

### Weekly Checks

-   [ ] Review failed PRs and blocked merges
-   [ ] Update required status checks if workflows change
-   [ ] Verify all team members can create PRs successfully

### Monthly Reviews

-   [ ] Audit bypass/override incidents
-   [ ] Review and update CODEOWNERS
-   [ ] Check for outdated status checks
-   [ ] Verify protection rules match security policy

### Quarterly Tasks

-   [ ] Rotate GitHub PAT used for automation
-   [ ] Review branch protection effectiveness
-   [ ] Update protection rules based on incidents
-   [ ] Train new team members on PR workflow

---

## 📚 Additional Resources

-   **GitHub Docs:** <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches>
-   **Branch Protection API:** <https://docs.github.com/en/rest/branches/branch-protection>
-   **CODEOWNERS Syntax:** <https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners>
-   **Status Checks:** <https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks>

---

## 🎯 Quick Commands Reference

```bash
# Check current protection
gh api repos/:owner/:repo/branches/main/protection

# List all protected branches
gh api repos/:owner/:repo/branches --jq '.[] | select(.protected == true) | .name'

# Create PR
gh pr create --title "Title" --body "Description"

# Request review
gh pr review PR_NUMBER --approve

# Merge PR
gh pr merge PR_NUMBER --squash

# Check PR status
gh pr status

# View required checks
gh pr checks PR_NUMBER
```

---

**Maintained By:** DevOps Team  
**Last Review:** November 17, 2025  
**Next Review:** February 17, 2026
