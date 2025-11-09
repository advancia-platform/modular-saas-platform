-- Seed Admin Wallet Addresses for Crypto Payment System
-- Run this after setting up the database

-- Insert or Update Admin Settings with wallet addresses
INSERT INTO admin_settings (
    id,
    "btcAddress",
    "ethAddress",
    "usdtAddress",
    "ltcAddress",
    "processingFeePercent",
    "minPurchaseAmount",
    "createdAt",
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'bc1q00nxy6hha3az922a6hjckxue7geax4jw3n283k',  -- Your BTC address
    '0x2b80613e3569d0ba85BFc9375B20096D72Bad1A8',  -- Your ETH address (also works for USDT ERC-20)
    '0x2b80613e3569d0ba85BFc9375B20096D72Bad1A8',  -- Same as ETH (USDT uses ERC-20)
    NULL,  -- Add LTC address here if you have one
    2.5,   -- 2.5% processing fee
    10.0,  -- $10 minimum purchase
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    "btcAddress" = EXCLUDED."btcAddress",
    "ethAddress" = EXCLUDED."ethAddress",
    "usdtAddress" = EXCLUDED."usdtAddress",
    "ltcAddress" = EXCLUDED."ltcAddress",
    "updatedAt" = NOW();

-- Note: If you want to add XRP and XLM support, you'll need to:
-- 1. Update the schema to add xrpAddress and xlmAddress fields
-- 2. Add XRP and XLM to the crypto types in the frontend
-- 3. Add XRP/XLM price endpoints to Binance API calls
-- 4. Update the TokenWallet model to support XRP/XLM balances

-- Your provided addresses for future expansion:
-- XRP: rs2birCXZiaBzQFaq4rx34yhSz7qaHAH8u
-- XLM: GADCJCRK3ACDGSDPJAOSAUEJPA56O2LTTDBZQKQRKERQUTA7RS5XGVSL
