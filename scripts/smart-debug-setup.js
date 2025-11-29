#!/usr/bin/env node

/**
 * Smart Debug Setup Script
 * Prepares the environment for smart debugging
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);
const workspaceRoot = process.cwd();

console.log("🔧 Setting up smart debug environment...");

/**
 * Ensure required dependencies are installed
 */
async function checkDependencies() {
  const backendPath = path.join(workspaceRoot, "backend");
  const frontendPath = path.join(workspaceRoot, "frontend");

  // Check if node_modules exist
  const backendNodeModules = path.join(backendPath, "node_modules");
  const frontendNodeModules = path.join(frontendPath, "node_modules");

  if (!fs.existsSync(backendNodeModules)) {
    console.log("📦 Installing backend dependencies...");
    try {
      await execAsync("npm install", { cwd: backendPath });
      console.log("✅ Backend dependencies installed");
    } catch (error) {
      console.error(
        "❌ Failed to install backend dependencies:",
        error.message,
      );
    }
  }

  if (!fs.existsSync(frontendNodeModules)) {
    console.log("📦 Installing frontend dependencies...");
    try {
      await execAsync("npm install", { cwd: frontendPath });
      console.log("✅ Frontend dependencies installed");
    } catch (error) {
      console.error(
        "❌ Failed to install frontend dependencies:",
        error.message,
      );
    }
  }
}

/**
 * Setup environment files
 */
async function setupEnvironment() {
  const backendEnvPath = path.join(workspaceRoot, "backend", ".env");
  const backendEnvExamplePath = path.join(
    workspaceRoot,
    "backend",
    ".env.example",
  );

  // Create .env from .env.example if it doesn't exist
  if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendEnvExamplePath)) {
    console.log("⚙️ Creating .env file from template...");
    try {
      fs.copyFileSync(backendEnvExamplePath, backendEnvPath);
      console.log("✅ Environment file created");
    } catch (error) {
      console.error("❌ Failed to create environment file:", error.message);
    }
  }
}

/**
 * Check if Docker services are needed and running
 */
async function checkDockerServices() {
  try {
    // Check if docker-compose.yml exists
    const dockerComposePath = path.join(workspaceRoot, "docker-compose.yml");
    if (fs.existsSync(dockerComposePath)) {
      console.log("🐳 Checking Docker services...");

      // Try to ping PostgreSQL
      try {
        await execAsync("docker-compose ps postgres", { cwd: workspaceRoot });
        console.log("✅ Docker services are running");
      } catch (error) {
        console.log("⚠️  Starting Docker services...");
        try {
          await execAsync("docker-compose up -d", { cwd: workspaceRoot });
          console.log("✅ Docker services started");
        } catch (startError) {
          console.error(
            "❌ Failed to start Docker services:",
            startError.message,
          );
        }
      }
    }
  } catch (error) {
    console.log("ℹ️  Docker not available or not needed");
  }
}

/**
 * Generate Prisma client if needed
 */
async function setupPrisma() {
  const prismaSchemaPath = path.join(
    workspaceRoot,
    "backend",
    "prisma",
    "schema.prisma",
  );
  const prismaClientPath = path.join(
    workspaceRoot,
    "backend",
    "node_modules",
    ".prisma",
    "client",
  );

  if (fs.existsSync(prismaSchemaPath) && !fs.existsSync(prismaClientPath)) {
    console.log("🗄️ Generating Prisma client...");
    try {
      await execAsync("npx prisma generate", {
        cwd: path.join(workspaceRoot, "backend"),
      });
      console.log("✅ Prisma client generated");
    } catch (error) {
      console.error("❌ Failed to generate Prisma client:", error.message);
    }
  }
}

/**
 * Create debug configuration based on detected environment
 */
async function createDebugConfig() {
  const configPath = path.join(
    workspaceRoot,
    ".vscode",
    "smart-debug-config.json",
  );

  const config = {
    timestamp: new Date().toISOString(),
    workspace: workspaceRoot,
    features: {
      backend: fs.existsSync(path.join(workspaceRoot, "backend")),
      frontend: fs.existsSync(path.join(workspaceRoot, "frontend")),
      prisma: fs.existsSync(
        path.join(workspaceRoot, "backend", "prisma", "schema.prisma"),
      ),
      docker: fs.existsSync(path.join(workspaceRoot, "docker-compose.yml")),
      tests: fs.existsSync(
        path.join(workspaceRoot, "backend", "jest.config.js"),
      ),
    },
    ports: {
      backend: 4000,
      frontend: 3000,
      backendDebug: 9229,
      frontendDebug: 9230,
      prismaStudio: 5555,
    },
    paths: {
      backendEntry: "backend/src/index.ts",
      frontendEntry: "frontend",
      tests: "backend/**/*.test.ts",
    },
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("✅ Debug configuration created");

  return config;
}

/**
 * Main setup function
 */
async function main() {
  try {
    console.log(`🏠 Workspace: ${workspaceRoot}`);

    // Run setup steps
    await checkDependencies();
    await setupEnvironment();
    await checkDockerServices();
    await setupPrisma();

    const config = await createDebugConfig();

    console.log("✨ Smart debug environment ready!");
    console.log("\n📋 Available features:");
    Object.entries(config.features).forEach(([feature, enabled]) => {
      console.log(`   ${enabled ? "✅" : "❌"} ${feature}`);
    });

    console.log("\n🚀 You can now use:");
    console.log("   • F5 → Smart Debug (Auto-Detect)");
    console.log("   • Ctrl+Shift+P → Debug: Select and Start Debugging");
    console.log("   • One-click debug configurations in the debug panel");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

main();
