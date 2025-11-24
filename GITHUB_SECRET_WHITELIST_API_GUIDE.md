# GitHub Secret Scanning Whitelist via REST API

**Use Case:** Whitelist false-positive secrets when GitHub UI throws 500 errors.

**Repo:** `advancia-platform/modular-saas-platform`

---

## 🔑 Step 1: Create Personal Access Token (PAT)

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Configure token:
   - **Name:** `Secret Scanning Whitelist Token`
   - **Expiration:** 90 days (or custom)
   - **Scopes:** Check these boxes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `security_events` (Read and write security events)
4. Click **Generate token**
5. **Copy the token immediately** (you won't see it again)
6. Store securely (password manager or temporary secure note)

---

## 🔍 Step 2: List Secret Scanning Alerts

Run this command to see all alerts in your repository:

```bash
curl -H "Authorization: token YOUR_PAT_HERE" \
     -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/advancia-platform/modular-saas-platform/secret-scanning/alerts
```

**PowerShell equivalent:**

```powershell
$pat = "YOUR_PAT_HERE"
$headers = @{
    "Authorization" = "token $pat"
    "Accept" = "application/vnd.github+json"
}
Invoke-RestMethod -Uri "https://api.github.com/repos/advancia-platform/modular-saas-platform/secret-scanning/alerts" -Headers $headers | ConvertTo-Json -Depth 10
```

**Output includes:**

- `"number": 1234` — Alert ID (use this in Step 3)
- `"secret_type": "google_api_key"` — Type of secret detected
- `"state": "open"` — Current status
- `"locations": [...]` — Where the secret appears

**Example filtered output (just alert IDs):**

```bash
# Bash/curl
curl -H "Authorization: token YOUR_PAT" \
     -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/advancia-platform/modular-saas-platform/secret-scanning/alerts \
     | jq '.[].number'
```

```powershell
# PowerShell
Invoke-RestMethod -Uri "https://api.github.com/repos/advancia-platform/modular-saas-platform/secret-scanning/alerts" -Headers $headers | Select-Object -ExpandProperty number
```

---

## ✅ Step 3: Whitelist Secrets (Mark as False Positive)

For **each alert ID** from Step 2, run:

```bash
curl -X PATCH \
     -H "Authorization: token YOUR_PAT_HERE" \
     -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/advancia-platform/modular-saas-platform/secret-scanning/alerts/ALERT_ID \
     -d '{"state":"resolved","resolution":"false_positive"}'
```

**PowerShell equivalent:**

```powershell
$alertId = 1234  # Replace with actual alert ID
$body = @{
    state = "resolved"
    resolution = "false_positive"
} | ConvertTo-Json

Invoke-RestMethod -Method Patch `
    -Uri "https://api.github.com/repos/advancia-platform/modular-saas-platform/secret-scanning/alerts/$alertId" `
    -Headers $headers `
    -Body $body `
    -ContentType "application/json"
```

**Resolution Options:**

- `"false_positive"` — Not a real secret (use for test keys, examples)
- `"wont_fix"` — Real secret but intentional (use with caution)
- `"revoked"` — Secret has been rotated/invalidated
- `"used_in_tests"` — Explicitly for test/development data

---

## 🔄 Step 4: Verify Resolution

Re-list alerts to confirm they're resolved:

```bash
curl -H "Authorization: token YOUR_PAT" \
     -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/advancia-platform/modular-saas-platform/secret-scanning/alerts \
     | jq '.[] | select(.state == "resolved") | {number, resolution}'
```

**Expected output:**

```json
{
  "number": 1234,
  "resolution": "false_positive"
}
```

---

## 🚀 Automated Bulk Resolution Scripts

See companion files:

- **Bash:** `scripts/whitelist-secrets.sh`
- **PowerShell:** `scripts/whitelist-secrets.ps1`

These scripts:

1. Fetch all open alerts
2. Prompt you to confirm each one
3. Resolve as false positive
4. Display summary

---

## ⚠️ Security Notes

1. **Token Safety:**
   - Never commit PAT to git
   - Use environment variable: `export GITHUB_TOKEN=your_pat` (bash) or `$env:GITHUB_TOKEN="your_pat"` (PowerShell)
   - Revoke token after use if one-time operation

2. **False Positive Criteria:**
   - Only whitelist if:
     - ✅ Test/example data (not real credentials)
     - ✅ Public demo keys (already published)
     - ✅ Placeholder values (e.g., `YOUR_API_KEY_HERE`)
   - Never whitelist:
     - ❌ Real production secrets
     - ❌ Keys with actual access permissions
     - ❌ Secrets that could be exploited

3. **Audit Trail:**
   - All resolutions are logged in GitHub audit log
   - Reviewable via Security tab → Secret scanning → Closed alerts

---

## 📋 Common Alert IDs for This Repo

Based on current detection patterns, you may have alerts for:

- Google API keys in documentation examples
- Stripe test keys in `.env.example`
- JWT secret examples in setup guides
- Cryptomus test merchant IDs
- VAPID keys in sample configs

**Recommended Action:**

1. List all alerts (Step 2)
2. Verify each is truly a false positive
3. Bulk resolve using automation script
4. Re-push blocked branch

---

## 🔧 Troubleshooting

### "Bad credentials" Error

- Verify PAT has `repo` and `security_events` scopes
- Check token hasn't expired
- Ensure no extra spaces in Authorization header

### "Resource not accessible" Error

- Confirm you have admin access to the repository
- Verify repository name and owner are correct

### 500 Internal Server Error

- GitHub API issue (rare)
- Wait 5 minutes and retry
- Check GitHub status page: https://www.githubstatus.com

### Alert ID Not Found

- Alert may have been auto-resolved
- Re-list alerts to get current IDs

---

## 📚 References

- [GitHub Secret Scanning API Docs](https://docs.github.com/en/rest/secret-scanning)
- [Managing Alerts](https://docs.github.com/en/code-security/secret-scanning/managing-alerts-from-secret-scanning)
- [Push Protection](https://docs.github.com/en/code-security/secret-scanning/push-protection-for-repositories-and-organizations)

---

## ✅ Post-Whitelist Steps

After resolving alerts:

1. **Verify Push Protection Bypass:**

   ```bash
   git push origin chore/ci-auto-release-auto-label-decimal-fixes
   ```

2. **Monitor CI Pipeline:**
   - Check GitHub Actions for successful run
   - Verify Docker build completes
   - Confirm deployment steps execute

3. **Document Whitelisted Secrets:**
   - Add entries to `SECURITY.md` explaining why each is safe
   - Update `.env.example` with clear "EXAMPLE ONLY" comments

4. **Rotate Any Real Secrets:**
   - If any legitimate credentials were exposed, rotate immediately
   - Update in Render/Vercel/GitHub Secrets
   - Redeploy affected services

---

**Last Updated:** November 24, 2025  
**Maintainer:** DevOps Team  
**Related Docs:** `SECURITY.md`, `DEPLOYMENT_CHECKLIST.md`, `CI_CD_SETUP_SUMMARY.md`
