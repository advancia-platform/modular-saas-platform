# Cloudflare Infrastructure Checklist

## DNS Configuration

### Required DNS Records

```
Type    Name                Value                           TTL     Proxy
A       @                   <backend-ip>                    Auto    Yes
A       www                 <backend-ip>                    Auto    Yes
CNAME   api                 <backend-domain>                Auto    Yes
TXT     @                   v=spf1 include:_spf.mx.cloudflare.net ~all
TXT     _dmarc              v=DMARC1; p=quarantine; rua=mailto:postmaster@yourdomain.com
CNAME   _domainkey          <resend-domainkey>              Auto    No
```

### Email Authentication (for Resend)

1. **SPF Record**: Add TXT record for @ with SPF value from Resend
2. **DKIM Record**: Add CNAME for domain key from Resend dashboard
3. **DMARC Record**: Add TXT for _dmarc with policy
4. **Verify in Resend Dashboard**: Check all records are green

## TLS/SSL Configuration

### SSL/TLS Settings

- **SSL Mode**: Full (Strict) - Most secure
- **Minimum TLS Version**: 1.2
- **TLS 1.3**: Enabled
- **Automatic HTTPS Rewrites**: On
- **Always Use HTTPS**: On
- **Opportunistic Encryption**: On

### Edge Certificates

- **Universal SSL**: Active (free)
- **Certificate Status**: Active
- **Validity**: Auto-renewed by Cloudflare
- **Edge Certificate**: Covers yourdomain.com, *.yourdomain.com

### Origin Certificates

1. Generate Origin Certificate in Cloudflare dashboard
2. Download certificate and private key
3. Install on backend server (Render/Railway)
4. Configure backend to use certificate

## R2 Bucket Configuration

### Create R2 Bucket

```bash
# Via Cloudflare dashboard:
# 1. Navigate to R2 -> Create bucket
# 2. Name: advancia-backups (or your choice)
# 3. Location: Automatic (nearest to users)
```

### Bucket Settings

- **Name**: `advancia-backups`
- **Location**: Automatic
- **Storage Class**: Standard
- **Public Access**: Off (default, recommended)
- **CORS**: Configure for your domain

### CORS Configuration

```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://api.yourdomain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Generate R2 API Token

1. Go to R2 -> Manage R2 API Tokens
2. Create API Token with:
   - **Permissions**: Edit (for uploads/deletes)
   - **Bucket**: advancia-backups
   - **TTL**: Never expire (or set appropriate)
3. Save credentials:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

### Environment Variables

```bash
# Backend .env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=advancia-backups
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

## Resend Email Integration

### Domain Verification

1. **Add Domain** in Resend dashboard
2. **Add DNS Records** from Resend to Cloudflare:
   - SPF: `v=spf1 include:spf.resend.com ~all`
   - DKIM: CNAME provided by Resend
   - DMARC: `v=DMARC1; p=none;`
3. **Verify** all records are detected (may take 24-48 hours)
4. **Get API Key** from Resend dashboard

### Resend Environment Variables

```bash
# Backend .env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
APP_URL=https://yourdomain.com
```

### Test Email Sending

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>Hello from Resend + Cloudflare!</p>'
});
```

## Cloudflare WAF Rules

### Recommended Rules

1. **Rate Limiting**:
   - Path: `/api/auth/*`
   - Limit: 10 requests per minute per IP
   - Action: Block

2. **Bot Protection**:
   - Challenge known bots
   - Block bad bots

3. **DDoS Protection**:
   - Enable automatic DDoS protection
   - Set sensitivity to High

4. **Geo-blocking** (optional):
   - Block countries not in your target market

## CDN and Caching

### Page Rules

```
# API endpoints - No cache
Pattern: api.yourdomain.com/*
Settings:
  - Cache Level: Bypass
  - Security Level: Medium

# Static assets - Cache everything
Pattern: yourdomain.com/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 month
```

### Cache Settings

- **Caching Level**: Standard
- **Browser Cache TTL**: Respect Existing Headers
- **Always Online**: On
- **Development Mode**: Off (in production)

## Security Checklist

- [ ] SSL/TLS set to Full (Strict)
- [ ] Always Use HTTPS enabled
- [ ] HSTS enabled with preload
- [ ] Origin certificate installed on backend
- [ ] WAF rules configured
- [ ] Rate limiting active
- [ ] Bot protection enabled
- [ ] Email authentication (SPF, DKIM, DMARC) verified
- [ ] R2 bucket created with restricted access
- [ ] R2 API tokens secured in environment variables
- [ ] CORS configured for R2 bucket
- [ ] Resend domain verified
- [ ] Test email sent successfully

## Monitoring

### Cloudflare Analytics

- Monitor traffic patterns
- Check for blocked requests
- Review bot traffic
- Track cache hit ratio

### R2 Usage

- Monitor storage usage
- Track API requests
- Review bandwidth costs
- Set up billing alerts

### Email Deliverability

- Monitor bounce rates in Resend
- Check spam complaints
- Review DMARC reports
- Track open/click rates (if needed)

## Testing Commands

### DNS Verification

```bash
# Check DNS propagation
nslookup yourdomain.com
dig yourdomain.com

# Check SPF record
dig TXT yourdomain.com

# Check DKIM record
dig TXT _domainkey.yourdomain.com
```

### SSL Verification

```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check SSL grade
curl -I https://yourdomain.com
```

### R2 Bucket Access

```bash
# Test upload (using AWS CLI)
aws s3 cp test.txt s3://advancia-backups/ \
  --endpoint-url=https://<account-id>.r2.cloudflarestorage.com \
  --profile=r2

# List files
aws s3 ls s3://advancia-backups/ \
  --endpoint-url=https://<account-id>.r2.cloudflarestorage.com \
  --profile=r2
```

### Email Sending Test

```bash
# Via backend API
curl -X POST http://localhost:4000/api/email/send-verification \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Production Deployment Steps

1. **Configure Cloudflare DNS**
   - Add all required DNS records
   - Verify propagation

2. **Setup SSL/TLS**
   - Generate origin certificate
   - Install on backend server
   - Set SSL mode to Full (Strict)

3. **Create R2 Bucket**
   - Create bucket with appropriate name
   - Configure CORS
   - Generate API tokens
   - Add env vars to backend

4. **Configure Resend**
   - Add domain to Resend
   - Add DNS records to Cloudflare
   - Verify domain
   - Test email sending

5. **Enable Security Features**
   - Configure WAF rules
   - Enable rate limiting
   - Set up bot protection

6. **Test Everything**
   - DNS resolution
   - SSL certificate validity
   - R2 bucket access
   - Email delivery
   - API endpoints

## Cost Estimates

### Cloudflare (Free Plan)

- DNS: Free
- SSL/TLS: Free (Universal SSL)
- CDN: Free (50GB/month)
- DDoS Protection: Free (basic)
- WAF: Limited on free plan

### Cloudflare R2

- Storage: $0.015/GB/month
- Class A Operations: $4.50/million (writes)
- Class B Operations: $0.36/million (reads)
- No egress fees (major advantage over S3)

### Resend

- Free tier: 100 emails/day
- Pro: $20/month (50,000 emails)
- Custom domain included

## Support Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/
- **R2 Documentation**: https://developers.cloudflare.com/r2/
- **Resend Docs**: https://resend.com/docs
- **Community Forum**: https://community.cloudflare.com/
