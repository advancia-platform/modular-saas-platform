# Cloudflare DNS Records Checklist for advanciapayledger.com

## 📋 DNS Records to Check/Add in Cloudflare

### 1. Current Website/API Records (Verify These Exist)

```dns
# Frontend (Vercel)
Type: A
Name: @
Value: 76.76.21.21
Proxy: ✅ Proxied (orange cloud)
TTL: Auto

Type: CNAME
Name: www
Value: cname.vercel-dns.com
Proxy: ✅ Proxied (orange cloud)
TTL: Auto

# Backend API (Render)
Type: CNAME
Name: api
Value: advancia-backend-upnrf.onrender.com
Proxy: ⚠️ DNS Only (grey cloud) - IMPORTANT for SSL
TTL: Auto
```

### 2. Email Authentication Records (ADD THESE)

#### SPF Record
```dns
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com include:_spf.resend.com ~all
TTL: Auto
```

**What it does:** Authorizes Gmail and Resend to send emails on behalf of your domain

#### DKIM Record (Get from Resend Dashboard)
```dns
Type: TXT
Name: resend._domainkey
Value: [Copy from Resend dashboard after adding domain]
TTL: Auto
```

**Steps to get value:**
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: advanciapayledger.com
4. Copy the DKIM TXT record value shown
5. Paste into Cloudflare

#### DMARC Record
```dns
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@advanciapayledger.com; pct=100
TTL: Auto
```

**What it does:** Tells receivers what to do with emails that fail SPF/DKIM checks
- `p=none` = Monitor only (recommended to start)
- After 2 weeks, change to `p=quarantine`
- After 1 month with good metrics, change to `p=reject`

### 3. Email Receiving (Cloudflare Email Routing - FREE)

#### MX Records
```dns
Type: MX
Name: @
Mail server: isaac.mx.cloudflare.net
Priority: 1
TTL: Auto

Type: MX
Name: @
Mail server: linda.mx.cloudflare.net
Priority: 2
TTL: Auto

Type: MX
Name: @
Mail server: amir.mx.cloudflare.net
Priority: 3
TTL: Auto
```

#### SPF for Email Routing (REPLACE existing SPF if using Cloudflare Email Routing)
```dns
Type: TXT
Name: @
Value: v=spf1 include:_spf.mx.cloudflare.net include:_spf.resend.com ~all
TTL: Auto
```

### 4. Optional: Enhanced Email Security

#### BIMI (Brand Logo in Emails)
```dns
Type: TXT
Name: default._bimi
Value: v=BIMI1; l=https://advanciapayledger.com/logo.svg
TTL: Auto
```

#### MTA-STS (Enforce TLS for Email)
```dns
Type: TXT
Name: _mta-sts
Value: v=STSv1; id=20251110
TTL: Auto
```

---

## 🔍 How to Check in Cloudflare Dashboard

### Step 1: Access DNS Settings
1. Go to https://dash.cloudflare.com
2. Select domain: **advanciapayledger.com**
3. Click **DNS** in left sidebar
4. Click **Records** tab

### Step 2: Check Existing Records
Look for these record types:
- **A Record** (@) - Should point to Vercel IP or show proxied
- **CNAME** (www) - Should point to Vercel
- **CNAME** (api) - Should point to Render (DNS only!)
- **TXT** (@) - Check if SPF exists
- **TXT** (_dmarc) - Check if DMARC exists
- **TXT** (resend._domainkey) - Check if DKIM exists
- **MX** (@) - Check if email receiving is configured

### Step 3: Verify Proxy Status
⚠️ **CRITICAL:** API subdomain must be **DNS Only** (grey cloud)

```
✅ CORRECT:
api.advanciapayledger.com → advancia-backend-upnrf.onrender.com [DNS Only]

❌ WRONG:
api.advanciapayledger.com → advancia-backend-upnrf.onrender.com [Proxied]
```

**Why:** Render needs to issue its own SSL certificate. Proxying breaks this.

---

## ✅ Quick Verification Commands

After adding DNS records, verify propagation:

```bash
# Check SPF
dig TXT advanciapayledger.com +short

# Check DKIM
dig TXT resend._domainkey.advanciapayledger.com +short

# Check DMARC
dig TXT _dmarc.advanciapayledger.com +short

# Check MX records
dig MX advanciapayledger.com +short

# Check API points to Render
dig api.advanciapayledger.com +short
```

**Online Tools:**
- **DNS Checker**: https://www.whatsmydns.net
- **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
- **Cloudflare DNS Checker**: https://1.1.1.1/dns/

---

## 🎯 Priority Order

### Must Do Now (Email Won't Work Without):
1. ✅ Add SPF record
2. ✅ Add domain to Resend
3. ✅ Add DKIM record (from Resend)
4. ✅ Add DMARC record (p=none)
5. ✅ Update RESEND_API_KEY in Render

### Should Do Soon (Email Receiving):
6. ⏳ Enable Cloudflare Email Routing
7. ⏳ Set up email forwarding rules
8. ⏳ Create aliases (admin@, support@, noreply@)

### Nice to Have (Enhanced Security):
9. 📝 Add BIMI record (requires verified logo)
10. 📝 Add MTA-STS (requires hosting policy file)

---

## 🚨 Common Issues

### Issue: "DNS records not found"
**Solution:** Wait 5-15 minutes for Cloudflare propagation

### Issue: "DKIM validation failed in Resend"
**Solution:** 
1. Check DKIM record name is exactly: `resend._domainkey`
2. Ensure no extra spaces in value
3. Wait 15-30 minutes for DNS propagation

### Issue: "API subdomain SSL error"
**Solution:** Make sure api.advanciapayledger.com is **DNS Only** (grey cloud)

### Issue: "Emails going to spam"
**Solution:**
1. Verify all 3 records pass: SPF, DKIM, DMARC
2. Test at https://www.mail-tester.com
3. Check sender reputation
4. Ensure unsubscribe link in emails

---

## 📞 Need Help?

**Cloudflare Support:**
- Community: https://community.cloudflare.com
- Docs: https://developers.cloudflare.com/dns

**Resend Support:**
- Docs: https://resend.com/docs
- Support: https://resend.com/support

**DNS Verification:**
- Use: https://toolbox.googleapps.com/apps/dig/
- Or: `dig` command in terminal

---

## 📝 Current Configuration Status

Based on your setup:

| Record Type | Name | Status | Value |
|-------------|------|--------|-------|
| A | @ | ✅ Check | Should point to Vercel |
| CNAME | www | ✅ Check | cname.vercel-dns.com |
| CNAME | api | ⚠️ Verify | advancia-backend-upnrf.onrender.com (DNS Only!) |
| TXT (SPF) | @ | ❌ Add | v=spf1 include:_spf.resend.com ~all |
| TXT (DKIM) | resend._domainkey | ❌ Add | [Get from Resend] |
| TXT (DMARC) | _dmarc | ❌ Add | v=DMARC1; p=none; rua=mailto:dmarc@... |
| MX | @ | ❓ Optional | For receiving emails |

**Next Step:** Log into Cloudflare and add the missing TXT records for email authentication.
