const fs = require("fs");
let content = fs.readFileSync("src/routes/auth.ts", "utf8");
const oldText = `  } catch (err) {
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
const newText = `  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
    console.error("verify-otp error:", err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }`;
content = content.replace(oldText, newText);
fs.writeFileSync("src/routes/auth.ts", content);
console.log("Fixed duplicate catch blocks in auth.ts");
