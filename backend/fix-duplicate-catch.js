const fs = require("fs");
let content = fs.readFileSync("src/routes/auth.ts", "utf8");

// Replace the problematic catch blocks
const problematic = `    return res.json({ message: "OTP verified", status: "pending_approval", token });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("verify-otp error:", err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }`;

// Replace with correct single catch block
const correct = `    return res.json({ message: "OTP verified", status: "pending_approval", token });
  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("verify-otp error:", err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }`;

const fixed = content.replace(problematic, correct);
fs.writeFileSync("src/routes/auth.ts", fixed);
console.log("Fixed duplicate catch blocks");
