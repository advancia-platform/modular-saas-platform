# PIA VPN Security Configuration for Advancia Pay Ledger

## Recommended PIA Settings for Fintech Development

### 1. Protocol Settings

- **Protocol**: WireGuard (fastest) or OpenVPN (most compatible)
- **Encryption**: AES-256-GCM
- **Handshake**: RSA-4096

### 2. Kill Switch Configuration

Enable these in PIA Settings:

- ✅ **VPN Kill Switch** - Blocks internet if VPN disconnects
- ✅ **Advanced Kill Switch** - Blocks traffic even before VPN connects

### 3. Split Tunneling (Recommended)

Configure these apps to **BYPASS VPN** (for speed):

```
- Ollama (local AI - no internet needed)
- Docker Desktop (local containers)
- VS Code (unless accessing remote repos)
- Prisma Studio (local database GUI)
```

Configure these to **ALWAYS USE VPN**:

```
- Web browsers (Chrome, Firefox, Edge)
- Git (when pushing to GitHub)
- npm/yarn (package downloads)
- SSH clients
- API testing tools (Postman, Insomnia)
```

### 4. Recommended Server Locations

| Use Case                     | Recommended Region              |
| ---------------------------- | ------------------------------- |
| **Development**              | Nearest server (lowest latency) |
| **Testing geo-restrictions** | US, UK, EU servers              |
| **Accessing production**     | Same region as your servers     |
| **GitHub/npm access**        | US servers (most CDN endpoints) |

### 5. DNS Settings

- ✅ Use PIA DNS (prevents DNS leaks)
- ✅ Enable MACE (blocks ads/trackers/malware)

## Environment-Specific Configuration

### Development (.env.development)

```bash
# No VPN-specific settings needed
# Use split tunneling to bypass VPN for local services
```

### Production Access

```bash
# Always connect VPN before accessing:
# - Production database
# - Admin dashboards
# - Payment provider dashboards (Stripe, Cryptomus)
# - Cloud consoles (Render, Vercel, Cloudflare)
```

## Port Forwarding (If Needed)

For webhook testing with ngrok/localtunnel:

1. Enable **Port Forwarding** in PIA settings
2. Note the forwarded port
3. Configure your webhook URL accordingly

## Security Checklist

- [ ] Kill switch enabled
- [ ] DNS leak protection enabled
- [ ] MACE enabled (ad/malware blocking)
- [ ] Auto-connect on startup
- [ ] Split tunneling configured
- [ ] Using WireGuard protocol

## Troubleshooting

### Slow npm/GitHub access?

→ Try US West or US East servers

### Webhook callbacks failing?

→ Check if split tunneling is bypassing the callback port

### Database connection timeout?

→ Add database IP to split tunnel bypass list

### Stripe webhook verification failing?

→ Ensure consistent IP during development sessions
