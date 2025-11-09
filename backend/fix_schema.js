const fs = require("fs");
let content = fs.readFileSync("src/routes/auth.ts", "utf8");

// Replace the broken part
const broken = `  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});`;

const fixed = `const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});`;

content = content.replace(broken, fixed);
fs.writeFileSync("src/routes/auth.ts", content);
console.log("Fixed the broken schema declaration");
