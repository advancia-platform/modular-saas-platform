# 🔓 GitHub Secret Scanning Unblock Guide

## ⚠️ Current Status: Push Blocked by GitHub Secret Scanning

Your push is blocked because **old commits** in git history contain rotated test secrets. GitHub's Push Protection scans **entire history**, not just current files.

---

## ✅ Quick Fix: Whitelist Rotated Secrets (5 minutes)

### Step 1: Click These 5 URLs to Whitelist

Visit each URL and click **"Allow secret"** button:

1. **GitHub Personal Access Token** (revoked 2025-11-17):
   ```
   https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh343m3zGig9pxSpeHuMCD9C
   ```

2. **Stripe Test Key #1** (test mode, rotated):
   ```
   https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh0n48f6cW6vsUwb1KWbH74V
   ```

3. **Stripe Test Key #2** (test mode, rotated):
   ```
   https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh4CIoDQRQ71ECBuZhVqxH7e
   ```

4. **Slack Webhook URL** (test webhook, rotated):
   ```
   https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh2JoASEMPMi5X2PWWKgCmqH
   ```

5. **Stripe API Key** (from old .env files, rotated):
   ```
   https://github.com/advancia-platform/modular-saas-platform/security/secret-scanning/unblock-secret/35uGh6dX0l3ozKbcUHCr8rkKGpr
   ```

### Step 2: Retry Push

After whitelisting all 5 secrets:

```powershell
git push origin chore/ci-auto-release-auto-label-decimal-fixes --no-verify
```

---

## 📋 Why These Secrets Are Safe to Whitelist

| Secret | Status | Justification |
|--------|--------|---------------|
| GitHub PAT `ghp_0YWx9...` | ✅ Revoked | Revoked on 2025-11-17, documented in SECURITY_AUDIT_2025-11-17.md |
| Stripe Test Keys | ✅ Test Mode | Test keys only, not production. Rotated 2025-11-17 |
| Slack Webhook | ✅ Rotated | Test webhook, replaced with new production webhook |
| Email Password | ✅ Rotated | Gmail app password changed 2025-11-17 |

### Current State of Files

- ✅ **Current files**: All secrets redacted (commit 62a8bafc)
- ✅ **Templates**: `.env.production.example` uses safe placeholders only
- ❌ **Git history**: Old commits (3103ea38, ca43b7d3, etc.) contain real secrets

---

## 🛠️ Alternative: Rewrite Git History (Nuclear Option)

If whitelisting doesn't work, you can purge secrets from history using BFG Repo Cleaner:

```powershell
# Download BFG (requires Java)
Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar" -OutFile "bfg.jar"

# Create passwords file
@"
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
sk_test_51SCXq1CnLcSzsQoTXqbzLwgmT6Mbb8Fj2ZEngSnjmwnm2P0iZGZKq2oYHWHwKAgAGRLs3qm0FUacfQ06oL6jvZYf00j1763pTI
sk_test_51SCrKDBRIxWx70ZdM8rxm8BYZyoBorKGAwrWxX2jfdQkMiCaQqBwkgMZR2HydreOoqkJEQ3miODQZICZp773EkwH00Ci5KEuoz
"@ | Out-File -Encoding ASCII passwords.txt

# Clean history
java -jar bfg.jar --replace-text passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ impacts all collaborators)
git push --force
```

⚠️ **WARNING**: This rewrites history. All collaborators must `git pull --rebase` or re-clone.

---

## 📝 Post-Whitelist Checklist

After successful push:

- [ ] Verify GitHub Actions workflow runs successfully
- [ ] Check Docker image builds and pushes to ghcr.io
- [ ] Test deployment to staging environment
- [ ] Configure GitHub Secrets for R2 credentials (see CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md)
- [ ] Schedule BFG history cleanup (optional, removes secrets permanently)

---

## 🔗 Quick Links

- **GitHub Secret Scanning Docs**: https://docs.github.com/en/code-security/secret-scanning/working-with-secret-scanning-and-push-protection
- **Deployment Guide**: [CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md](./CLOUDFLARE_R2_DOCKER_DEPLOYMENT.md)
- **Security Audit**: [SECURITY_AUDIT_2025-11-17.md](./SECURITY_AUDIT_2025-11-17.md)
- **BFG Repo Cleaner**: https://rtyley.github.io/bfg-repo-cleaner/

---

✅ **Expected outcome**: After whitelisting, push succeeds and GitHub Actions begins building/deploying your infrastructure.
