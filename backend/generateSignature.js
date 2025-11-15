// generateSignature.js
import crypto from "crypto";

// Replace with your Cryptomus API key
const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || "test_api_key";

// Example payload (same as webhook body)
const payload = {
  order_id: "order_12345",
  amount: "10.00",
  currency: "USDT",
  status: "paid",
  transaction_id: "txn_test_67890",
  network: "TRC20",
  created_at: "2025-11-15T00:05:00Z",
};

// Convert payload to JSON string
const jsonPayload = JSON.stringify(payload);

// Generate HMAC SHA256 signature
const signature = crypto
  .createHmac("sha256", CRYPTOMUS_API_KEY)
  .update(jsonPayload)
  .digest("hex");

console.log("Payload:", jsonPayload);
console.log("Signature:", signature);
