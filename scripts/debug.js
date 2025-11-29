#!/usr/bin/env node

/**
 * Simple No-Config Debug CLI
 * Usage: npm run debug [backend|frontend|test|auto]
 */

const { spawn } = require("child_process");
const path = require("path");

const command = process.argv[2] || "auto";
const workspaceRoot = process.cwd();

console.log("🚀 No-Config Debug CLI");
console.log(`Command: ${command}`);

function debugBackend() {
  console.log("⚡ Starting backend debug mode...");
  console.log("🔗 Debug URL: chrome://inspect");
  console.log("📍 Debugger listening on: 127.0.0.1:9229");

  const child = spawn(
    "node",
    ["--inspect=9229", "--loader", "tsx", "src/index.ts"],
    {
      cwd: path.join(workspaceRoot, "backend"),
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "development",
        DEBUG: "app:*",
      },
    },
  );

  child.on("close", (code) => {
    console.log(`Backend debug finished with code ${code}`);
  });

  return child;
}

function debugFrontend() {
  console.log("🎨 Starting frontend debug mode...");
  console.log("🔗 Debug URL: chrome://inspect");
  console.log("📍 Debugger listening on: 127.0.0.1:9230");

  const child = spawn(
    "node",
    ["--inspect=9230", "node_modules/next/dist/bin/next", "dev"],
    {
      cwd: path.join(workspaceRoot, "frontend"),
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "development",
        NEXT_PUBLIC_API_URL: "http://localhost:4000",
        NEXTAUTH_URL: "http://localhost:3000",
      },
    },
  );

  child.on("close", (code) => {
    console.log(`Frontend debug finished with code ${code}`);
  });

  return child;
}

function debugTest() {
  console.log("🧪 Starting test debug mode...");
  console.log("🔗 Debug URL: chrome://inspect");
  console.log("📍 Debugger listening on: 127.0.0.1:9229");

  const child = spawn(
    "node",
    [
      "--inspect-brk=9229",
      "node_modules/.bin/jest",
      "--runInBand",
      "--no-cache",
    ],
    {
      cwd: path.join(workspaceRoot, "backend"),
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    },
  );

  child.on("close", (code) => {
    console.log(`Test debug finished with code ${code}`);
  });

  return child;
}

function debugAuto() {
  console.log("🔍 Auto-detecting debug target...");

  // Simple auto-detection based on current directory or common patterns
  const cwd = process.cwd();

  if (
    cwd.includes("frontend") ||
    process.argv.some((arg) => arg.includes(".tsx") || arg.includes(".jsx"))
  ) {
    return debugFrontend();
  } else if (
    cwd.includes("test") ||
    process.argv.some((arg) => arg.includes(".test.") || arg.includes(".spec."))
  ) {
    return debugTest();
  } else {
    return debugBackend();
  }
}

// Handle graceful shutdown
function setupGracefulShutdown(child) {
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping debug session...");
    if (child) {
      child.kill("SIGTERM");
    }
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Terminating debug session...");
    if (child) {
      child.kill("SIGTERM");
    }
    process.exit(0);
  });
}

// Main execution
let debugProcess;

switch (command) {
  case "backend":
  case "back":
  case "be":
    debugProcess = debugBackend();
    break;
  case "frontend":
  case "front":
  case "fe":
    debugProcess = debugFrontend();
    break;
  case "test":
  case "tests":
    debugProcess = debugTest();
    break;
  case "auto":
  default:
    debugProcess = debugAuto();
    break;
}

if (debugProcess) {
  setupGracefulShutdown(debugProcess);

  console.log("\n💡 Debug Tips:");
  console.log("   • Open Chrome and go to chrome://inspect");
  console.log('   • Click "Open dedicated DevTools for Node"');
  console.log("   • Set breakpoints in your code");
  console.log("   • Press Ctrl+C to stop debugging");
}
