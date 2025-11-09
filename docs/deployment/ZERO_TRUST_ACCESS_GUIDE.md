# Cloudflare Zero Trust Access - Advancia Pay Setup Guide

## Overview
Cloudflare Access protects admin surfaces behind Zero Trust policies without VPN or app code changes. This guide covers safe rollout for Advancia Pay.

## Architecture

### Public (no Access):
- Frontend: https://advanciapayledger.com
- API: https://api.advanciapayledger.com
- Webhooks: /api/payments/webhook, /api/twilio/*

### Protected (Access-gated):
- Admin UI: https://admin.advanciapayledger.com (or /admin/* path-based)
- Admin API: https://admin-api.advanciapayledger.com (optional)
- Staging: https://staging.advanciapayledger.com

## Initial Setup (Cloudflare Dashboard)

### 1) Enable Zero Trust
- Cloudflare Dashboard → Zero Trust → Get Started
- Choose team domain: `advancia-pay` (or similar)
- Add identity provider:
  - Zero Trust → Settings → Authentication → Add
  - Recommended: Google Workspace, Azure AD, or GitHub
  - Configure OAuth callback and save

### 2) Create Access Application (Admin UI)
- Zero Trust → Access → Applications → Add application → Self-hosted
- Settings:
  - **Name**: Advancia Admin UI
  - **Domain**: admin.advanciapayledger.com
  - **Session Duration**: 12 hours
  - **Enable Binding Cookie**: Yes
  - **Enable CORS**: Yes (if admin calls API)
  - **Enable App Launcher**: Yes (optional)

### 3) Add Access Policy
- **Policy Name**: Admin Team
- **Action**: Allow
- **Include**:
  - Emails ending in: @advanciapayledger.com
  - OR: Specific email list
  - OR: Identity Provider Group (if using Google Workspace/Azure groups)
- **Require** (optional but recommended):
  - Country: allowed list (e.g., US, NG, etc.)
  - Device Posture: Managed device (if enrolled)
- **Session Duration**: 8-12 hours

### 4) Add Bypass Rules (Critical)
Add these as separate policies with Action: Bypass for essential flows:

#### A) OPTIONS Preflight (CORS)
- **Policy Name**: Bypass CORS Preflight
- **Action**: Bypass
- **Include**: Everyone
- **Require**: 
  - Selector: HTTP Method
  - Value: OPTIONS

#### B) Health Checks
- **Policy Name**: Bypass Health
- **Action**: Bypass
- **Include**: Everyone
- **Require**:
  - Selector: Path
  - Value: /health

#### C) WebSocket Upgrade
- **Policy Name**: Bypass WebSocket
- **Action**: Bypass
- **Include**: Everyone
- **Require**:
  - Selector: Request Header
  - Name: Upgrade
  - Value: websocket

#### D) Webhook Endpoints (if admin host includes webhooks - avoid this)
- **Policy Name**: Bypass Webhooks
- **Action**: Bypass
- **Include**: Everyone
- **Require**:
  - Selector: Path
  - Value: /api/payments/webhook (add more paths as needed)

**Best Practice**: Don't host webhooks on admin subdomain; keep them on public api.advanciapayledger.com

## DNS Configuration

Create CNAME for admin subdomain:
- Type: CNAME
- Name: admin
- Target: advancia-frontend.onrender.com (or your Render frontend service)
- Proxy: ON (orange cloud)

Or, if using path-based (/admin):
- No DNS change needed; Access policy scopes by path

## Service Tokens (for automation/CI)

### Create Service Token
- Zero Trust → Access → Service Auth → Service Tokens → Create
- Name: CI Deployment Token
- Copy Client ID and Secret (store in GitHub Secrets or vault)

### Use in API calls
```bash
curl -H "CF-Access-Client-Id: <client_id>" \
     -H "CF-Access-Client-Secret:     Zero Trust → Access → Applications → Add an application → Self-hosted
    
    Application Configuration:
    - Name: Advancia Admin UI
    - Session Duration: 12 hours
    - Application domain: admin.advanciapayledger.com
    
    Policy:
    - Policy name: Admin Team Only
    - Action: Allow
    - Include: Emails ending in @advanciapayledger.com<client_secret>" \
     https://admin.advanciapayledger.com/api/admin/deploy
```

## Backend JWT Validation (Optional)

If you want the backend to verify Access identity:

### Install dependencies (backend):
```bash
cd backend
npm install jose
```

### Middleware (backend/src/middleware/accessJWT.ts):
See `backend/src/middleware/accessJWT.ts` (created separately)

### Usage in routes:
```typescript
import { validateAccessJWT } from '../middleware/accessJWT';

// Admin route
router.get('/admin/users', validateAccessJWT, allowRoles(['ADMIN']), async (req, res) => {
  // req.accessIdentity contains { email, sub, aud }
  res.json({ users: await getUsers() });
});
```

## Testing Checklist

- [ ] Admin logs in via identity provider (Google/Azure/GitHub)
- [ ] Session cookie persists for configured duration
- [ ] OPTIONS preflight bypasses challenge
- [ ] Health endpoint /health bypasses challenge
- [ ] WebSocket connection succeeds (if admin uses Socket.IO)
- [ ] Public frontend (advanciapayledger.com) remains open
- [ ] Webhooks still receive POST from Stripe/Twilio
- [ ] Service token works for CI/automation

## Common Issues & Fixes

### Issue: CORS errors on admin UI
**Fix**: 
- Enable CORS on Access application settings
- Ensure OPTIONS bypass policy is active
- Check browser console for Cf-Access-* headers

### Issue: WebSocket fails to connect
**Fix**:
- Add bypass policy for Upgrade: websocket header
- Verify Access supports WSS (it does by default)

### Issue: Session expires too quickly
**Fix**:
- Increase session duration in Access app settings
- Enable "Remember me" in identity provider if available

### Issue: Webhook POST blocked by Access
**Fix**:
- Add bypass policy for webhook paths
- Better: move webhooks to non-protected host (api.advanciapayledger.com)

### Issue: Backend doesn't see Access identity
**Fix**:
- Read header: Cf-Access-Jwt-Assertion
- Validate using jose and team JWKS URL
- Or trust simpler header: Cf-Access-Authenticated-User-Email

## Rollout Plan (Production)

### Week 1: Setup & Test
- Create admin.advanciapayledger.com subdomain
- Enable Access with policy: email ends with @advanciapayledger.com
- Add bypass policies (OPTIONS, health, websocket)
- Test with 2-3 admin users

### Week 2: Expand & Harden
- Add country/device posture requirements
- Create service token for CI
- Add backend JWT validation middleware (optional)
- Monitor Access logs in Zero Trust dashboard

### Week 3: Production
- Roll out to full admin team
- Document login/troubleshooting steps for team
- Set up alerts for failed auth attempts
- Rotate service tokens quarterly

## Security Best Practices

1. **Don't protect public surfaces**: Keep main app and API public
2. **Separate admin subdomain**: Cleaner than path-based rules
3. **Add device posture**: Require managed devices for sensitive admin ops
4. **Monitor logs**: Zero Trust → Logs → Access shows all auth events
5. **Rotate service tokens**: Quarterly or after personnel changes
6. **Use groups**: Identity provider groups are easier to manage than email lists
7. **Session timeout**: Balance convenience vs. security (8-12 hours typical)

## References

- Cloudflare Zero Trust Docs: https://developers.cloudflare.com/cloudflare-one/
- Access JWT Validation: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
- Service Tokens: https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/

## Support Contacts

- Internal: DevOps team (access-support@advanciapayledger.com)
- Cloudflare: Via dashboard support or community forums
