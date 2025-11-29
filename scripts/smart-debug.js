#!/usr/bin/env node

/**
 * Smart Debug Auto-Detection Script
 * Automatically detects what to debug based on the currently open file
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const workspaceRoot = process.env.VSCODE_WORKSPACE_ROOT || process.cwd();
const activeFile = process.env.VSCODE_ACTIVE_FILE || '';

console.log('🚀 Smart Debug Auto-Detection');
console.log(`Workspace: ${workspaceRoot}`);
console.log(`Active File: ${activeFile}`);

/**
 * Determine what to debug based on the active file
 */
function detectDebugTarget() {
  if (!activeFile) {
    console.log('📄 No active file detected, defaulting to backend server...');
    return { type: 'backend', reason: 'No active file' };
  }

  const relativePath = path.relative(workspaceRoot, activeFile);
  const fileName = path.basename(activeFile);
  const fileExt = path.extname(activeFile);
  const dirName = path.dirname(relativePath);

  console.log(`📁 Analyzing: ${relativePath}`);

  // Test file detection
  if (fileName.includes('.test.') || fileName.includes('.spec.')) {
    return { 
      type: 'test', 
      file: fileName,
      testPattern: path.basename(fileName, fileExt),
      reason: 'Test file detected' 
    };
  }

  // Frontend files
  if (dirName.startsWith('frontend') || 
      fileName.includes('component') || 
      fileName.includes('page') ||
      fileExt === '.tsx' ||
      fileExt === '.jsx') {
    return { type: 'frontend', reason: 'Frontend file detected' };
  }

  // Backend API routes
  if (dirName.includes('routes') || dirName.includes('api')) {
    return { 
      type: 'backend', 
      route: relativePath,
      reason: 'API route detected' 
    };
  }

  // Backend service files
  if (dirName.includes('backend') || dirName.includes('services') || dirName.includes('middleware')) {
    return { 
      type: 'backend', 
      service: relativePath,
      reason: 'Backend service detected' 
    };
  }

  // Database/Prisma files
  if (fileName.includes('prisma') || fileName.includes('schema') || dirName.includes('prisma')) {
    return { 
      type: 'database', 
      schema: relativePath,
      reason: 'Database schema detected' 
    };
  }

  // Default to backend
  return { 
    type: 'backend', 
    reason: 'Default fallback' 
  };
}

/**
 * Execute the appropriate debug command
 */
function startDebugging(target) {
  console.log(`🎯 Debug Target: ${target.type} (${target.reason})`);

  switch (target.type) {
    case 'test':
      return startTestDebugging(target);
    case 'frontend':
      return startFrontendDebugging(target);
    case 'backend':
      return startBackendDebugging(target);
    case 'database':
      return startDatabaseDebugging(target);
    default:
      console.error(`❌ Unknown debug target: ${target.type}`);
      process.exit(1);
  }
}

function startTestDebugging(target) {
  console.log(`🧪 Starting test debugging for: ${target.testPattern}`);
  
  const jestPath = path.join(workspaceRoot, 'backend', 'node_modules', '.bin', 'jest');
  const args = [
    target.testPattern,
    '--runInBand',
    '--no-cache',
    '--verbose',
    '--inspect-brk=9229'
  ];

  const jest = spawn('node', ['--inspect-brk=9229', jestPath, ...args.slice(0, -1)], {
    cwd: path.join(workspaceRoot, 'backend'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });

  jest.on('close', (code) => {
    console.log(`Test debugging finished with code ${code}`);
  });

  return jest;
}

function startFrontendDebugging(target) {
  console.log(`🎨 Starting frontend debugging...`);
  
  // Check if backend is running
  checkBackendStatus().then(backendRunning => {
    if (!backendRunning) {
      console.log('⚠️  Backend not detected, starting backend first...');
      startBackendDebugging({ type: 'backend', background: true });
      setTimeout(() => startNextDebugging(), 3000);
    } else {
      startNextDebugging();
    }
  });
}

function startNextDebugging() {
  const nextPath = path.join(workspaceRoot, 'frontend', 'node_modules', 'next', 'dist', 'bin', 'next');
  
  const next = spawn('node', ['--inspect=9230', nextPath, 'dev'], {
    cwd: path.join(workspaceRoot, 'frontend'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      NEXT_PUBLIC_API_URL: 'http://localhost:4000',
      NEXTAUTH_URL: 'http://localhost:3000'
    }
  });

  next.on('close', (code) => {
    console.log(`Frontend debugging finished with code ${code}`);
  });

  return next;
}

function startBackendDebugging(target) {
  console.log(`⚡ Starting backend debugging...`);
  
  const isBackground = target.background || false;
  const indexPath = path.join(workspaceRoot, 'backend', 'src', 'index.ts');
  
  const backend = spawn('node', [
    '--inspect=9229',
    '--loader', 'tsx',
    indexPath
  ], {
    cwd: path.join(workspaceRoot, 'backend'),
    stdio: isBackground ? 'pipe' : 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DEBUG: 'app:*'
    }
  });

  if (!isBackground) {
    backend.on('close', (code) => {
      console.log(`Backend debugging finished with code ${code}`);
    });
  }

  return backend;
}

function startDatabaseDebugging(target) {
  console.log(`🗄️ Starting database debugging (Prisma Studio)...`);
  
  const prismaPath = path.join(workspaceRoot, 'backend', 'node_modules', '.bin', 'prisma');
  
  const prisma = spawn('node', [prismaPath, 'studio'], {
    cwd: path.join(workspaceRoot, 'backend'),
    stdio: 'inherit',
    env: {
      ...process.env
    }
  });

  prisma.on('close', (code) => {
    console.log(`Database debugging finished with code ${code}`);
  });

  return prisma;
}

/**
 * Check if backend is already running
 */
async function checkBackendStatus() {
  try {
    const response = await fetch('http://localhost:4000/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping debug session...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating debug session...');
  process.exit(0);
});

// Main execution
async function main() {
  console.log('🔍 Analyzing current workspace context...');
  
  const debugTarget = detectDebugTarget();
  const debugProcess = startDebugging(debugTarget);
  
  console.log('✅ Debug session started!');
  console.log('💡 Tip: Set breakpoints in VS Code and they will be hit automatically');
  console.log('📱 Press Ctrl+C to stop debugging');
}

main().catch(console.error);