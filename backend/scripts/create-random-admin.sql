-- Random Admin Account Creation
-- Email: admin_5925@advancia.com
-- Password: Admin5542!
-- Password Hash: $2a$10$nvYUwWk5Cxw3MPm5xBUV2e612MGyTAkMPcsEW6GlICvXq4SrHdVwi

INSERT INTO "User" (
  id,
  email,
  username,
  "passwordHash",
  role,
  verified,
  "emailVerified",
  active,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'admin_5925@advancia.com',
  'admin_5925',
  '$2a$10$nvYUwWk5Cxw3MPm5xBUV2e612MGyTAkMPcsEW6GlICvXq4SrHdVwi',
  'ADMIN',
  true,
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  role = 'ADMIN',
  verified = true,
  "emailVerified" = true,
  active = true,
  "updatedAt" = NOW();
