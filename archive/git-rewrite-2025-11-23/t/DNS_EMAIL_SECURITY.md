# Email Security DNS Configuration for advanciapayledger.com

## Overview

This guide sets up complete email authentication to secure email delivery from your Advancia Pay platform and prevent spoofing, phishing, and spam classification.

## DNS Records to Add

### 1. SPF Record (Sender Policy Framework)

**Prevents email spoofing by specifying authorized mail servers**

```dns
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com include:_spf.mx.cloudflare.net include:amazonses.com include:sendgrid.net include:_spf.resend.com ~all
TTL: 3600
```

**Explanation:**

-   `v=spf1` - SPF version 1
-   `include:_spf.google.com` - Allow Gmail SMTP (your backup)
-   `include:_spf.resend.com` - Allow Resend (your primary)
-   `~all` - Soft fail for unauthorized servers (recommended for testing)
-   Use `-all` for strict enforcement after testing

**Simplified for Resend + Gmail only:**

```dns
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com include:_spf.resend.com ~all
TTL: 3600
```

### 2. DKIM Record (DomainKeys Identified Mail)

**Cryptographically signs emails to prove they're from your domain**

#### For Resend

1. **Get your DKIM record from Resend dashboard:**
   -   Go to <https://resend.com/domains>
   -   Add domain: `advanciapayledger.com`
   -   Copy the DKIM record shown

2. **Add to DNS:**

```dns
Type: TXT
Name: resend._domainkey
Value: [Value provided by Resend - looks like "v=DKIM1; k=rsa; p=MIGfMA0GCS..."]
TTL: 3600
```

#### For Gmail (backup)

1. **Enable DKIM in Google Workspace:**
   -   Admin console → Apps → Google Workspace → Gmail
   -   Authenticate email → Generate new record

2. **Add to DNS:**

```dns
Type: TXT
Name: google._domainkey
Value: [Value from Google Admin Console]
TTL: 3600
```

### 3. DMARC Record (Domain-based Message Authentication)

**Tells receiving servers what to do with failed authentication**

```dns
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@advanciapayledger.com; ruf=mailto:dmarc@advanciapayledger.com; fo=1; adkim=s; aspf=s; pct=100
TTL: 3600
```

**Explanation:**

-   `v=DMARC1` - DMARC version 1
-   `p=quarantine` - Quarantine emails that fail (use `p=none` for monitoring only, `p=reject` for strict)
-   `rua=mailto:dmarc@advanciapayledger.com` - Aggregate reports (daily summaries)
-   `ruf=mailto:dmarc@advanciapayledger.com` - Forensic reports (individual failures)
-   `fo=1` - Generate report if any check fails
-   `adkim=s` - Strict DKIM alignment
-   `aspf=s` - Strict SPF alignment
-   `pct=100` - Apply policy to 100% of emails

**Recommended progression:**

1. Start with: `v=DMARC1; p=none; rua=mailto:dmarc@advanciapayledger.com` (monitoring)
2. After 2 weeks: `p=quarantine` (quarantine suspicious)
3. After 4 weeks: `p=reject` (reject all failures)

### 4. MX Records (Mail Exchange)

**Required if you want to RECEIVE emails at advanciapayledger.com**

#### Option A: Cloudflare Email Routing (FREE - Recommended)

```dns
Type: MX
Name: @
Value: isaac.mx.cloudflare.net
Priority: 1
TTL: Auto

Type: MX
Name: @
Value: linda.mx.cloudflare.net
Priority: 2
TTL: Auto

Type: TXT
Name: @
Value: v=spf1 include:_spf.mx.cloudflare.net ~all
```

#### Option B: ImprovMX (FREE)

```dns
Type: MX
Name: @
Value: mx1.improvmx.com
Priority: 10
TTL: 3600

Type: MX
Name: @
Value: mx2.improvmx.com
Priority: 20
TTL: 3600
```

#### Option C: Google Workspace (PAID - $6/user/month)

```dns
Type: MX
Name: @
Value: ASPMX.L.GOOGLE.COM
Priority: 1

Type: MX
Name: @
Value: ALT1.ASPMX.L.GOOGLE.COM
Priority: 5
# ... (additional MX records from Google)
```

### 5. Additional Security Records

#### BIMI (Brand Indicators for Message Identification)

**Display your logo in supported email clients**

```dns
Type: TXT
Name: default._bimi
Value: v=BIMI1; l=https://advanciapayledger.com/logo.svg
TTL: 3600
```

#### MTA-STS (Mail Transfer Agent Strict Transport Security)

**Enforce TLS encryption for email delivery**

```dns
Type: TXT
Name: _mta-sts
Value: v=STSv1; id=20251110
TTL: 3600

Type: CNAME
Name: mta-sts
Value: your-hosting-provider.com
TTL: 3600
```

## Complete DNS Configuration Example

Here's the full set of DNS records for advanciapayledger.com:

```dns
# Email Authentication
TXT  @                     v=spf1 include:_spf.google.com include:_spf.resend.com ~all                  3600
TXT  resend._domainkey     [Get from Resend dashboard]                                                  3600
TXT  _dmarc                v=DMARC1; p=quarantine; rua=mailto:dmarc@advanciapayledger.com; pct=100     3600

# Email Receiving (Cloudflare Email Routing)
MX   @                     isaac.mx.cloudflare.net                                                      1
MX   @                     linda.mx.cloudflare.net                                                      2
TXT  @                     v=spf1 include:_spf.mx.cloudflare.net include:_spf.resend.com ~all          3600

# Website (Vercel)
A    @                     76.76.21.21                                                                  3600
CNAME www                  cname.vercel-dns.com                                                         3600

# API Backend (Render)
CNAME api                  advancia-backend-upnrf.onrender.com                                          3600

# Security Headers
TXT  @                     google-site-verification=[Your verification code]                            3600
```

## Setup Instructions by DNS Provider

### Cloudflare

1. Log in to Cloudflare dashboard
2. Select domain: advanciapayledger.com
3. Go to DNS → Records
4. Click "Add record"
5. Add each record from the table above
6. Enable Email Routing (free):
   -   Email → Email Routing → Get Started
   -   Create destination: <your-personal@email.com>
   -   Create route: admin@ → <your-personal@email.com>

### Namecheap

1. Log in to Namecheap account
2. Domain List → Manage → Advanced DNS
3. Add New Record
4. For TXT records, paste the full value
5. For MX records, ensure priority is set correctly

### GoDaddy

1. Log in to GoDaddy
2. My Products → DNS
3. Add → Select record type
4. Note: GoDaddy may require quotes around TXT values

### Google Domains

1. Log in to Google Domains
2. Manage → DNS
3. Custom records → Manage custom records
4. Add each record type

## Verification Steps

### 1. Check SPF Record

```bash
# Using dig
dig TXT advanciapayledger.com +short

# Using nslookup
nslookup -type=TXT advanciapayledger.com

# Online tool
# Visit: https://mxtoolbox.com/spf.aspx
```

**Expected output:**

```
"v=spf1 include:_spf.google.com include:_spf.resend.com ~all"
```

### 2. Check DKIM Record

```bash
dig TXT resend._domainkey.advanciapayledger.com +short
```

### 3. Check DMARC Record

```bash
dig TXT _dmarc.advanciapayledger.com +short
```

**Expected output:**

```
"v=DMARC1; p=quarantine; rua=mailto:dmarc@advanciapayledger.com"
```

### 4. Check MX Records

```bash
dig MX advanciapayledger.com +short
```

### 5. Test Email Authentication

```bash
# Send test email using your API
curl -X POST https://advancia-backend-upnrf.onrender.com/api/test/email/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "your-personal@gmail.com"}'

# Check received email headers in Gmail:
# 1. Open the email
# 2. Click "Show original"
# 3. Look for:
#    - SPF: PASS
#    - DKIM: PASS
#    - DMARC: PASS
```

### 6. Use Online Testing Tools

#### Email Authentication Test

-   **Mail Tester**: <https://www.mail-tester.com>

  1. Send test email to the address shown
  2. Get a score /10 (aim for 10/10)

#### DNS Record Verification

-   **MXToolbox**: <https://mxtoolbox.com/SuperTool.aspx>
    -   Test SPF: `SPF:advanciapayledger.com`
    -   Test DMARC: `DMARC:advanciapayledger.com`
    -   Test DKIM: `DKIM:resend:advanciapayledger.com`

#### DMARC Analysis

-   **DMARC Analyzer**: <https://www.dmarcanalyzer.com>
-   **Postmark DMARC**: <https://dmarc.postmarkapp.com>

## Email Forwarding Setup

### Cloudflare Email Routing (Recommended - FREE)

1. **Enable Email Routing**
   -   Cloudflare Dashboard → Email → Email Routing
   -   Click "Get Started"
   -   Add your destination email (e.g., <your-personal@gmail.com>)

2. **Create Email Routes**

   ```
   admin@advanciapayledger.com → your-personal@gmail.com
   support@advanciapayledger.com → your-personal@gmail.com
   noreply@advanciapayledger.com → (catch-all, discard)
   info@advanciapayledger.com → your-personal@gmail.com
   dmarc@advanciapayledger.com → your-personal@gmail.com
   ```

3. **Enable Catch-All** (optional)
   -   Route all unmatched emails to your personal inbox
   -   Or discard them to prevent spam

4. **Verify Setup**
   -   Send test email to <admin@advanciapayledger.com>
   -   Check it arrives at your destination email

## Security Best Practices

### 1. Email Rate Limiting

Implement in backend (see implementation below):

-   10 emails per hour per user
-   100 emails per day per IP address
-   1,000 emails per day total

### 2. Content Security

-   Sanitize all HTML in emails (prevent XSS)
-   Validate email addresses before sending
-   Block disposable email domains
-   Implement CAPTCHA for signup forms

### 3. Monitoring

-   Track email delivery rates
-   Monitor bounce rates (<5% is good)
-   Watch complaint rates (<0.1% is critical)
-   Set up alerts for unusual patterns

### 4. List Management

-   Implement unsubscribe links (required by law)
-   Honor unsubscribe requests immediately
-   Remove hard bounces automatically
-   Segment users by engagement

### 5. Testing

-   Test all email templates in multiple clients
-   Check spam scores before production
-   Monitor blacklist status regularly
-   Test recovery flows (password reset, etc.)

## DMARC Report Analysis

After setting up DMARC, you'll receive daily reports at <dmarc@advanciapayledger.com>.

### Reading DMARC Reports

Reports are XML format. Use tools:

-   **Postmark DMARC Digests**: <https://dmarc.postmarkapp.com>
-   **DMARC Analyzer**: <https://www.dmarcanalyzer.com>
-   **dmarcian**: <https://dmarcian.com>

### Key Metrics to Watch

-   **DMARC Pass Rate**: Should be >95%
-   **SPF Alignment**: Should be 100%
-   **DKIM Alignment**: Should be 100%
-   **Sources**: Verify all are legitimate

### Common Issues

1. **SPF Fails**: Update SPF record to include all mail servers
2. **DKIM Fails**: Verify DKIM record matches Resend dashboard
3. **Unknown Sources**: Investigate unauthorized mail servers
4. **Alignment Fails**: Check domain configuration

## Troubleshooting

### Emails Going to Spam

**Check:**

1. SPF/DKIM/DMARC all passing
2. Email content not triggering spam filters
3. Sender reputation (use MXToolbox blacklist check)
4. Unsubscribe link present
5. From address matches sending domain

**Solutions:**

-   Warm up your domain (start with low volume)
-   Use consistent From name and address
-   Maintain list hygiene (remove bounces)
-   Monitor engagement (opens, clicks)

### DNS Propagation Issues

**Check propagation:**

```bash
# Use Google DNS
dig @8.8.8.8 TXT advanciapayledger.com

# Use Cloudflare DNS
dig @1.1.1.1 TXT advanciapayledger.com

# Online tool
# Visit: https://www.whatsmydns.net
```

**Timeline:**

-   5-15 minutes: Fast DNS providers (Cloudflare)
-   1-4 hours: Most providers
-   24-48 hours: Maximum (rare)

### Resend Domain Verification Failing

**Common causes:**

1. DKIM record not added correctly
2. DNS not propagated yet
3. TXT record has extra quotes or spaces
4. Wrong subdomain (should be resend.\_domainkey)

**Fix:**

```bash
# Verify DKIM record
dig TXT resend._domainkey.advanciapayledger.com +short

# Should return something like:
# "v=DKIM1; k=rsa; p=MIGfMA0GCSqGS..."

# If empty, check:
1. DNS record was added correctly
2. Wait 15-30 minutes for propagation
3. Try verifying again in Resend dashboard
```

## Next Steps

1. ✅ Add DNS records to your domain registrar
2. ✅ Verify domain in Resend dashboard
3. ✅ Set up email forwarding (Cloudflare recommended)
4. ✅ Test email delivery with test endpoints
5. ✅ Monitor DMARC reports for 2 weeks
6. ✅ Adjust DMARC policy from `p=none` to `p=quarantine`
7. ✅ After 4 weeks, consider `p=reject` for maximum security

## Resources

-   **Resend Docs**: <https://resend.com/docs/dashboard/domains/introduction>
-   **DMARC Guide**: <https://dmarc.org/overview/>
-   **SPF Guide**: <http://www.open-spf.org/Introduction/>
-   **DKIM Guide**: <http://dkim.org/>
-   **Cloudflare Email**: <https://developers.cloudflare.com/email-routing/>
-   **Mail Tester**: <https://www.mail-tester.com>
-   **MXToolbox**: <https://mxtoolbox.com>

## Support

For issues with:

-   **DNS**: Contact your domain registrar support
-   **Resend**: <https://resend.com/support>
-   **Cloudflare**: <https://support.cloudflare.com>
-   **Platform**: Check backend logs in Render dashboard
