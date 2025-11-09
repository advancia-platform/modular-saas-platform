Secure secrets (AES-256-GCM)

This repo includes scripts to securely encrypt and decrypt your local `.env` for sharing or CI.

What’s included
- backend/scripts/secrets/encrypt-env.ts: AES-256-GCM encryption with scrypt key derivation
- backend/scripts/secrets/decrypt-env.ts: Decrypts the bundle back to `.env`
- Encrypt-Env-AES.ps1 / Decrypt-Env-AES.ps1: Windows-friendly wrappers

Usage (local)
- Encrypt:
  - VS Code task: Encrypt Env (AES)
  - or PowerShell: `pwsh -NoProfile -File ./Encrypt-Env-AES.ps1`
  - or Node: `SECRETS_PASSPHRASE=... npx tsx backend/scripts/secrets/encrypt-env.ts --in backend/.env --out backend/.env.enc.json`
- Decrypt:
  - VS Code task: Decrypt Env (AES)
  - or PowerShell: `pwsh -NoProfile -File ./Decrypt-Env-AES.ps1`
  - or Node: `SECRETS_PASSPHRASE=... npx tsx backend/scripts/secrets/decrypt-env.ts --in backend/.env.enc.json --out backend/.env`

CI usage
- Add `SECRETS_PASSPHRASE` as a GitHub Actions secret
- Commit `backend/.env.enc.json` if you want CI to use the encrypted bundle (optional)
- The `validate-and-deploy.yml` will decrypt automatically when `SECRETS_PASSPHRASE` and bundle are present; else it falls back to individual `secrets.*`

Notes
- Never commit your plaintext `.env`
- The encrypted bundle is ignored by default (`backend/.env.enc.json`). If you want CI to use it, unignore intentionally and use PR review.
- AES-256-GCM offers confidentiality + integrity; scrypt slows brute-force. Choose a strong passphrase and rotate periodically.
