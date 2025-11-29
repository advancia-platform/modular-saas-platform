A  backend/prisma/schema.prisma.backup-20251129-140556
M  backend/src/index.ts
D  pnpm-lock.yaml
D  pnpm-workspace.yaml

=== CURRENT BRANCH ===
main

=== RECENT COMMITS ===
32669c66 (HEAD -> main, tag: v0.0.4) security: remove hardcoded credentials from documentatio:
32669c66 (HEAD -> main, tag: v0.0.4) security: remove hardcoded credentials from documentation
02bb4232 chore: update CHANGELOG.md with release v0.0.2 [skip ci]
de2f597a (tag: v0.0.3) feat: coPattern not found  (press RETUR
...skipping...
G.md with release v0.0.2 [skip ci]
de2f597a (tag: v0.0.3) feat: co
TURN: No such file or directory
...skipping...
G.md with release v0.0.2 [skip ci]
de2f597a (tag: v0.0.3) feat: comprehensive platform update with R2 standardization, VPN security guide, Cloudflare email worker, and admin features
Pattern not found  (press RETUR

mucha@DESKTOP-H7T9NPM:/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform$
mucha@DESKTOP-H7T9NPM:/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform$ cd "/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform/backend" && npx eslint --fix src/routes/gitops.ts && echo "✅ Linting fixed"
cd "/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform" && git add -A && git commit -m "feat: standardize status enums, enable shell integration

- Added 20 comprehensive enum types for type-safe status fields
- Migrated 26+ models to use enums: PaymentStatus, TransactionStatus, etc.
- Enabled shell integration in VS Code for better command detection
- Fixed ESLint quote violations in gitops.ts
- Removed pnpm lock files (standardized to npm)
- Added enum indexes for improved query performance" && echo "✅ Committed successfully"
cd "/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform" && git push origin main
cd "/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform" && git status && echo "" && echo "=== Last commit ===" && git log --oneline -1
cd "/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform" && git config credential.helper store && echo "Credential helper configured"
ssh-keygen -t ed25519 -C "muchaeljohn739337@gmail.com" -f ~/.ssh/id_ed25519 -N "" && echo "✅ SSH key generated"
cat ~/.ssh/id_ed25519.pub && echo "" && echo "👆 Copy this SSH key and add it to: https://github.com/settings/keys"
eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519 && echo " ✅ SSH key added to agent"
cd "/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform" && git remote set-url origin git@github.com:advancia-platform/modular-saas-platform.git && git remote -v && echo "✅ Remote changed to SSH"
echo "=== YOUR SSH PUBLIC KEY ===" && cat ~/.ssh/id_ed25519.pub && echo "" && echo "=== NEXT STEPS ===" && echo "1. Copy the key above (starts with 'ssh-ed25519')" && echo "2. Go to: https://github.com/settings/keys" && echo "3. Click 'New SSH key'" && echo "4. Paste the key and save"
ssh -T git@github.com 2>&1 | head -5 && echo "" && echo "If you see 'successfully authenticated', you're ready to push!"
cat ~/.ssh/id_ed25519.pub
echo "=== COPY THIS ENTIRE LINE ===" && cat ~/.ssh/id_ed25519.pub && echo "=== END OF KEY ==="-- CreateTable: crypto_wallet_keys
CREATE TABLE IF NOT EXISTS crypto_wallet_keys (
    wallet_id VARCHAR(36) PRIMARY KEY,
    encrypted_private_key TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMP,
    CONSTRAINT fk_wallet_keys_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES crypto_wallets(id)
        ON DELETE CASCADE
);

-- CreateTable: crypto_wallet_history
CREATE TABLE IF NOT EXISTS crypto_wallet_history (
    id SERIAL PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    old_address VARCHAR(100) NOT NULL,
    rotation_reason TEXT,
    rotated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_wallet_history_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES crypto_wallets(id)
        ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS idx_wallet_history_wallet_id ON crypto_wallet_history(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_history_rotated_at ON crypto_wallet_history(rotated_at);

-- Add comments
COMMENT ON TABLE crypto_wallet_keys IS 'Stores encrypted private keys for custodial wallets. CRITICAL SECURITY: Never expose these keys.';
COMMENT ON TABLE crypto_wallet_history IS 'Audit log for wallet address rotations (privacy & security).';
