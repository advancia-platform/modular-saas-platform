# Cloudflare Zero Trust - Firewall Bypass Expressions

Use these expressions in Cloudflare Firewall Rules (or WAF custom rules) to bypass Access challenges for essential traffic.

## How to Add Rules

### Via Dashboard:
1. Cloudflare Dashboard → Security → WAF → Create rule
2. Rule name: (from below)
3. Expression: (copy from below)
4. Action: **Skip** → Access (for bypass rules)
5. Deploy

### Via API:
See Cloudflare Firewall Rules API docs: https://developers.cloudflare.com/firewall/api/cf-firewall-rules/

---

## Rule 1: Bypass CORS Preflight (OPTIONS)

**Name**: Access Bypass - CORS Preflight  
**Action**: Skip → Access  
**Expression**:
```
(http.request.method eq "OPTIONS" and http.host eq "admin.advanciapayledger.com")
```

**Why**: CORS preflight checks don't carry credentials; Access would block them.

---

## Rule 2: Bypass Health Checks

**Name**: Access Bypass - Health Endpoint  
**Action**: Skip → Access  
**Expression**:
```
(http.request.uri.path eq "/health" or http.request.uri.path eq "/api/health")
```

**Why**: Monitoring tools (Uptime Robot, Render health checks) can't authenticate.

---

## Rule 3: Bypass WebSocket Upgrade

**Name**: Access Bypass - WebSocket  
**Action**: Skip → Access  
**Expression**:
```
(http.request.headers["upgrade"][0] eq "websocket")
```

**Why**: WebSocket handshake happens before auth; Access blocks Socket.IO connections.

---

## Rule 4: Bypass Webhook Endpoints

**Name**: Access Bypass - Webhooks  
**Action**: Skip → Access  
**Expression**:
```
(http.request.uri.path in {"/api/payments/webhook" "/api/twilio/sms-callback" "/api/twilio/voice-callback"})
```

**Why**: Stripe/Twilio POST to webhooks without auth; Access would block them.

**Best Practice**: Avoid hosting webhooks on admin subdomain; keep them on api.advanciapayledger.com (not behind Access).

---

## Rule 5: Bypass Next.js Static Assets

**Name**: Access Bypass - Next.js Static  
**Action**: Skip → Access  
**Expression**:
```
(http.request.uri.path contains "/_next/static/")
```

**Why**: Static JS/CSS bundles don't need authentication; Access blocks them on first load.

---

## Rule 6: Bypass NextAuth Callbacks

**Name**: Access Bypass - NextAuth  
**Action**: Skip → Access  
**Expression**:
```
(http.request.uri.path contains "/api/auth/callback" or http.request.uri.path contains "/api/auth/signin")
```

**Why**: NextAuth redirects include query params that Access might interfere with.

---

## Rule 7: Allow Verified Bots (Optional)

**Name**: Access Bypass - Verified Bots  
**Action**: Skip → Access  
**Expression**:
```
(cf.client.bot and http.host eq "admin.advanciapayledger.com")
```

**Why**: Search engines, social media crawlers (if you want admin indexed—probably not).

**Recommendation**: Skip this rule for admin surfaces; don't expose admin to search engines.

---

## Rule 8: Admin IP Allowlist (Optional)

**Name**: Access Bypass - Office IPs  
**Action**: Skip → Access  
**Expression**:
```
(ip.src in $office_ips and http.host eq "admin.advanciapayledger.com")
```

**Prerequisites**:
1. Create IP List: Cloudflare Dashboard → Account Home → Configurations → Lists → Create IP List
2. Name: `office_ips`
3. Add IPs: 203.0.113.5, 198.51.100.10, etc.
4. Use `$office_ips` in expression

**Why**: Bypass Access for trusted office/VPN IPs; reduces friction for internal team.

---

## Rule 9: Bypass API Key Routes (CI/Automation)

**Name**: Access Bypass - API Keys  
**Action**: Skip → Access  
**Expression**:
```
(http.request.headers["x-api-key"][0] ne "" and http.host eq "admin-api.advanciapayledger.com")
```

**Why**: CI/automation uses API keys instead of Access service tokens; allow them through.

**Security**: Validate `x-api-key` in backend middleware (don't rely on this bypass alone).

---

## Complete Firewall Rule Order

Deploy rules in this order (Cloudflare evaluates top to bottom):

1. **Bypass CORS Preflight** (Skip Access)
2. **Bypass Health Checks** (Skip Access)
3. **Bypass WebSocket Upgrade** (Skip Access)
4. **Bypass Webhooks** (Skip Access)
5. **Bypass Next.js Static** (Skip Access)
6. **Bypass NextAuth Callbacks** (Skip Access)
7. **Admin IP Allowlist** (Skip Access, optional)
8. **Bypass API Key Routes** (Skip Access, optional)
9. **Access Policy - Admin Team** (Allow)

---

## Testing After Deployment

1. **OPTIONS test**:
   ```bash
   curl -X OPTIONS https://admin.advanciapayledger.com/api/admin/users \
        -H "Origin: https://advanciapayledger.com" -v
   # Should return 204/200 without Access challenge
   ```

2. **Health test**:
   ```bash
   curl https://admin.advanciapayledger.com/health -v
   # Should return 200 {"status":"healthy"} without Access challenge
   ```

3. **WebSocket test**:
   - Open browser DevTools → Network → WS
   - Visit admin UI, check Socket.IO connection succeeds
   - No 403/401 on WebSocket handshake

4. **Webhook test** (use Stripe CLI):
   ```bash
   stripe trigger payment_intent.succeeded --forward-to https://admin.advanciapayledger.com/api/payments/webhook
   # Should deliver successfully (but don't host webhooks on admin in prod!)
   ```

---

## Notes

- **Skip vs. Bypass**: In new Cloudflare WAF, use "Skip" with "Access" selected. Legacy Firewall Rules called this "Bypass".
- **Expression Builder**: Cloudflare Dashboard has visual builder; paste expressions directly or use GUI.
- **Access Policies**: These firewall rules bypass Access entirely. For partial challenges (e.g., lower security for health checks), use Access bypass policies inside Zero Trust dashboard instead.
- **Maintenance**: When adding new webhook routes or static paths, update bypass expressions.

---

## References

- Cloudflare WAF Custom Rules: https://developers.cloudflare.com/waf/custom-rules/
- Cloudflare Expressions: https://developers.cloudflare.com/ruleset-engine/rules-language/expressions/
- Access + Firewall Interaction: https://developers.cloudflare.com/cloudflare-one/policies/access/
