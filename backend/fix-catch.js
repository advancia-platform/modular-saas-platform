const fs = require("fs");
const content = fs.readFileSync("src/routes/auth.ts", "utf8");
// Remove the duplicate catch block
const fixed = content.replace(
  `  } catch (err) {
    if ((err as any)?.name === "ZodError") {
      return res.status(400).json({ error: (err as any).issues });
    }
  } catch (err) {`,
  `  } catch (err) {`
);
fs.writeFileSync("src/routes/auth.ts", fixed);
console.log("Removed duplicate catch block");
