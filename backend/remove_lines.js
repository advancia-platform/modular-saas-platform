const fs = require("fs");
let content = fs.readFileSync("src/routes/auth.ts", "utf8");
const lines = content.split("\n");
// Remove lines 601-604 (0-based: 600-603)
lines.splice(600, 4);
content = lines.join("\n");
fs.writeFileSync("src/routes/auth.ts", content);
console.log("Removed lines 601-604 from auth.ts");
