const fs = require("fs");
let content = fs.readFileSync("src/routes/auth.ts", "utf8");

// Remove lines 851-920 which contain the problematic Prisma-based password reset
const lines = content.split("\n");
const before = lines.slice(0, 850).join("\n");
const after = lines.slice(920).join("\n");

const fixed =
  before +
  "\n\n// Password reset routes removed - use Redis-based implementation\n\n" +
  after;

fs.writeFileSync("src/routes/auth.ts", fixed);
console.log("✅ Removed problematic password reset routes (lines 851-920)");
