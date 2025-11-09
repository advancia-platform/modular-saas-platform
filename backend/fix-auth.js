const fs = require("fs");
const path = "src/routes/auth.ts";

// Read the file
let content = fs.readFileSync(path, "utf8");

// Find the corrupted section
const corruptedStart = content.indexOf(
  'console.error("verify-otp error:", err);\\s*return res.status(500).json({ error: "Failed to verify OTP" });\\s*}\\s*}\\);\\s*\\n\\s*// POST /api/auth/forgot-password'
);
const corruptedEnd = content.indexOf(
  "// POST /api/auth/test-email",
  corruptedStart
);

if (corruptedStart !== -1 && corruptedEnd !== -1) {
  const beforeCorrupted = content.substring(0, corruptedStart);
  const afterCorrupted = content.substring(corruptedEnd);

  const correctCode = `  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("verify-otp error:", err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", otpLimiter, async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body || {});

    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = generateResetToken();
    const key = \`reset:\${user.id}\`;

    const redis = getRedis();
    const ttlSeconds = 60 * 60; // 1 hour
    const maxAttemptsWindow = 10 * 60; // 10 minutes
    const maxRequestsPerWindow = 3;
    const countKey = \`reset:cnt:\${email}\`;
    const lockKey = \`reset:lock:\${email}\`;

    // Fallback in-memory store when Redis not configured
    const mem: any =
      (global as any).__resetMem ||
      ((global as any).__resetMem = new Map<string, any>());

    if (redis) {
      const locked = await redis.get(lockKey);
      if (locked)
        return res.status(429).json({ error: "Too many attempts. Try later." });
      const cnt = await redis.incr(countKey);
      if (cnt === 1) await redis.expire(countKey, maxAttemptsWindow);
      if (cnt > maxRequestsPerWindow) {
        await redis.set(lockKey, "1", "EX", 30 * 60); // 30 min lockout
        return res
          .status(429)
          .json({ error: "Too many password reset requests. Try again later." });
      }
      await redis.setex(key, ttlSeconds, resetToken);
    } else {
      const now = Date.now();
      const entry = mem.get(key) || { count: 0, windowStart: now };
      if (now - entry.windowStart > maxAttemptsWindow * 1000) {
        entry.count = 0;
        entry.windowStart = now;
      }
      entry.count += 1;
      if (entry.count > maxRequestsPerWindow) {
        return res
          .status(429)
          .json({ error: "Too many password reset requests. Try again later." });
      }
      mem.set(key, { ...entry, token: resetToken, exp: now + ttlSeconds * 1000 });
    }

    // Send reset email
    const resetLink = \`http://localhost:3000/auth/reset-password?token=\${resetToken}\`;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const transporter = nodemailer.createTransporter({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset your Advancia password",
        html: \`<p>Hi \${user.firstName || 'there'},</p><p>You requested a password reset for your Advancia account.</p><p>Click the link below to reset your password:</p><p><a href=\"\${resetLink}\">Reset Password</a></p><p>This link will expire in 1 hour.</p><p>If you didn't request this reset, please ignore this email.</p><p>Best,<br>The Advancia Team</p>\`,
      });
    } else {
      console.log(\`[DEV] Password reset for \${email}: \${resetLink}\`);
    }

    return res.json({ message: "Password reset email sent" });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("forgot-password error:", err);
    return res.status(500).json({ error: "Failed to send reset email" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body || {});

    const redis = getRedis();
    const mem: any =
      (global as any).__resetMem ||
      ((global as any).__resetMem = new Map<string, any>());

    let userId: string | null = null;
    let storedToken: string | null = null;

    if (redis) {
      // Find the user ID by scanning all reset:* keys
      const keys = await redis.keys("reset:*");
      for (const key of keys) {
        if (key.startsWith("reset:") && !key.includes(":cnt:") && !key.includes(":lock:")) {
          const stored = await redis.get(key);
          if (stored === token) {
            userId = key.replace("reset:", "");
            storedToken = stored;
            break;
          }
        }
      }
    } else {
      // Check in-memory store
      for (const [key, entry] of mem.entries()) {
        if (key.startsWith("reset:") && entry.token === token && entry.exp > Date.now()) {
          userId = key.replace("reset:", "");
          storedToken = entry.token;
          break;
        }
      }
    }

    if (!userId || !storedToken) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Clean up the token
    if (redis) {
      await redis.del(\`reset:\${userId}\`);
    } else {
      mem.delete(\`reset:\${userId}\`);
    }

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("reset-password error:", err);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

// POST /api/auth/test-email`;

  const newContent = beforeCorrupted + correctCode + afterCorrupted;
  fs.writeFileSync(path, newContent);
  console.log("Fixed corrupted password reset code");
} else {
  console.log("Could not find corrupted section");
}
