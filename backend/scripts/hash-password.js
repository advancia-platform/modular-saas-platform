const bcrypt = require("bcryptjs");

const password = process.argv[2] || "Admin123!";

bcrypt.hash(password, 10).then((hash) => {
  console.log("\n🔐 Password Hash Generated:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(hash);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `\n📋 Copy this hash and paste it into Prisma Studio's passwordHash field\n`,
  );
});
