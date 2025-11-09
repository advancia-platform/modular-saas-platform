const fs = require("fs");
let content = fs.readFileSync("src/routes/auth.ts", "utf8");

// Remove the duplicate schema declarations (second set)
const duplicateBlock = `const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Valid email required' }),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});
`;

content = content.replace(duplicateBlock, "");
console.log("Removed duplicate schema declarations");

fs.writeFileSync("src/routes/auth.ts", content);
console.log("Saved changes");
