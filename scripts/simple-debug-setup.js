#!/usr/bin/env node

/**
 * Simple No-Config Debug Setup
 * Minimal setup that always works
 */

const fs = require("fs");
const path = require("path");

const workspaceRoot = process.cwd();

console.log("⚡ Simple No-Config Debug Setup");
console.log(`📁 Workspace: ${workspaceRoot}`);

/**
 * Create minimal debug configuration
 */
function createMinimalDebugConfig() {
  const configPath = path.join(
    workspaceRoot,
    ".vscode",
    "smart-debug-config.json",
  );

  const config = {
    timestamp: new Date().toISOString(),
    workspace: workspaceRoot,
    features: {
      backend: fs.existsSync(
        path.join(workspaceRoot, "backend", "src", "index.ts"),
      ),
      frontend: fs.existsSync(
        path.join(workspaceRoot, "frontend", "package.json"),
      ),
      tests: fs.existsSync(
        path.join(workspaceRoot, "backend", "jest.config.js"),
      ),
    },
    ports: {
      backend: 4000,
      frontend: 3000,
      backendDebug: 9229,
      frontendDebug: 9230,
    },
    ready: true,
  };

  // Ensure .vscode directory exists
  const vscodePath = path.join(workspaceRoot, ".vscode");
  if (!fs.existsSync(vscodePath)) {
    fs.mkdirSync(vscodePath, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("✅ Debug configuration created");

  return config;
}

/**
 * Display usage instructions
 */
function showUsage() {
  console.log("\n🚀 No-Config Debugging is Ready!");
  console.log("\n📋 Available Methods:");
  console.log("   1. VS Code: Press F5 → Select debug configuration");
  console.log("   2. Command Line: npm run debug [backend|frontend|test]");
  console.log("   3. PowerShell: .\\scripts\\debug.ps1 [target]");

  console.log("\n💡 Quick Examples:");
  console.log("   npm run debug              # Auto-detect what to debug");
  console.log("   npm run debug:backend      # Debug Express server");
  console.log("   npm run debug:frontend     # Debug Next.js app");
  console.log("   npm run debug:test         # Debug Jest tests");

  console.log("\n🔗 Chrome DevTools:");
  console.log("   1. Open Chrome → go to chrome://inspect");
  console.log('   2. Click "Open dedicated DevTools for Node"');
  console.log("   3. DevTools will connect automatically");

  console.log("\n✨ Pro Tips:");
  console.log("   • Set breakpoints by clicking left of line numbers");
  console.log("   • Use Ctrl+C to stop debug sessions");
  console.log("   • Debug sessions auto-restart when files change");
}

// Main execution
try {
  const config = createMinimalDebugConfig();

  console.log("\n📊 Detected Features:");
  Object.entries(config.features).forEach(([feature, enabled]) => {
    console.log(`   ${enabled ? "✅" : "❌"} ${feature}`);
  });

  showUsage();
} catch (error) {
  console.error("❌ Setup failed:", error.message);
  console.log("\n🛠️ Manual Setup:");
  console.log("   1. Ensure you're in the project root directory");
  console.log("   2. Check that .vscode/ directory is writable");
  console.log('   3. Try: mkdir .vscode && echo "{}" > .vscode/settings.json');
}
