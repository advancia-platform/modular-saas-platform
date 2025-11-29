# WSL Development Environment Guide

## Overview

This workspace is now configured to use **Windows Subsystem for Linux (WSL)** as the default development environment. This provides better performance, native Linux tooling, and consistency with production environments.

## 🚀 Quick Start

### 1. Initial WSL Setup

```bash
# Run the automated setup script
wsl bash -c "cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform && ./scripts/setup-wsl.sh"
```

Or use VS Code task: `Ctrl+Shift+P` → `Tasks: Run Task` → `🐧 Setup WSL Environment`

### 2. Development Commands

**VS Code Tasks (Recommended):**

- `🚀 WSL: Start Backend Dev` - Start backend server
- `🌐 WSL: Start Frontend Dev` - Start frontend server
- `🐳 WSL: Start Docker Services` - Start PostgreSQL & Redis
- `🗄️ WSL: Prisma Generate` - Generate Prisma client
- `🗄️ WSL: Prisma Migrate Dev` - Run database migrations

**Manual Commands:**

```bash
# Open WSL terminal in project directory
wsl bash -c "cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform"

# Start all development servers
./scripts/wsl/dev.sh

# Build everything
./scripts/wsl/build.sh
```

## 📁 WSL File System

**Windows Path:** `C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform`  
**WSL Path:** `/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform`

Files are shared between Windows and WSL, but **npm operations run faster in WSL**.

## 🔧 VS Code Configuration

### Terminal Configuration

- **Default Terminal:** Ubuntu (WSL)
- **PowerShell:** Available as secondary option
- **Auto-switch:** Opens WSL terminal by default

### ESLint Configuration

- **Runtime:** WSL Node.js (`/usr/bin/node`)
- **Working Directories:** `backend`, `frontend`
- **Better Performance:** ESLint runs in WSL for faster linting

### File Watching

- **Cross-platform:** Works between Windows files and WSL processes
- **Hot Reload:** Backend and frontend auto-reload on file changes

## 🐳 Docker Integration

Docker runs inside WSL for better performance:

```bash
# In WSL terminal
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs -f            # View logs
```

## 📦 Package Management

**All npm commands run in WSL:**

```bash
# Install dependencies
wsl bash -c "cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform/backend && npm install"

# Or use VS Code task: 📦 WSL: Install Dependencies
```

## 🗄️ Database Operations

**Prisma commands run in WSL:**

```bash
# Generate client
wsl bash -c "cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform/backend && npx prisma generate"

# Run migrations
wsl bash -c "cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform/backend && npx prisma migrate dev"

# Open Prisma Studio
wsl bash -c "cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform/backend && npx prisma studio"
```

## 🚨 Important Notes

### Performance

- ✅ **Faster:** npm install, builds, tests run faster in WSL
- ✅ **Native:** Linux tooling works as expected
- ✅ **Consistent:** Same environment as production

### File System

- ✅ **Shared:** Edit files in Windows, run commands in WSL
- ⚠️ **Permissions:** Some file operations may require `sudo`
- ⚠️ **Case Sensitivity:** WSL is case-sensitive, Windows is not

### Environment Variables

- ✅ **Isolated:** WSL environment variables separate from Windows
- ✅ **Secure:** `.env` files work normally in WSL
- ✅ **Cross-platform:** Environment setup works in both environments

## 🛠️ Troubleshooting

### WSL Not Starting

```bash
# Restart WSL
wsl --shutdown
wsl

# Check WSL status
wsl --list --verbose
```

### Node.js Issues

```bash
# Reinstall Node.js in WSL
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Permission Issues

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/lib/node_modules
```

### Docker Issues

```bash
# Restart Docker
sudo service docker restart

# Add user to docker group (requires WSL restart)
sudo usermod -aG docker $USER
```

## 🎯 Benefits of WSL Setup

| Feature       | Windows            | WSL        | Benefit                          |
| ------------- | ------------------ | ---------- | -------------------------------- |
| npm install   | Slow               | Fast       | 3-5x faster package installation |
| File watching | Sometimes broken   | Native     | Reliable hot reload              |
| Shell scripts | Limited            | Full bash  | Run any Linux script             |
| Docker        | Via Docker Desktop | Native     | Better performance               |
| Build times   | Slower             | Faster     | Native toolchain                 |
| Environment   | Windows-specific   | Linux-like | Production consistency           |

## 🔄 Switching Between Environments

**To Windows PowerShell:**

- `Ctrl+Shift+P` → `Terminal: Create New Terminal` → Select PowerShell

**Back to WSL:**

- `Ctrl+Shift+P` → `Terminal: Create New Terminal` → Select Ubuntu (WSL)

**Default is now WSL** - new terminals open in WSL automatically.

## 📋 Available Tasks

| Task                          | Description          | Shortcut               |
| ----------------------------- | -------------------- | ---------------------- |
| 🐧 Setup WSL Environment      | Install dependencies | `Ctrl+Shift+P` → Tasks |
| 🚀 WSL: Start Backend Dev     | Backend dev server   | Background task        |
| 🌐 WSL: Start Frontend Dev    | Frontend dev server  | Background task        |
| 🐳 WSL: Start Docker Services | PostgreSQL + Redis   | Run once               |
| 🗄️ WSL: Prisma Generate       | Generate client      | After schema changes   |
| 🗄️ WSL: Prisma Migrate Dev    | Run migrations       | Database setup         |
| 🧪 WSL: Run Tests             | All tests            | Test runner            |
| 🔧 WSL: ESLint Fix            | Fix linting          | Code cleanup           |

Your development environment is now optimized for Linux-based development while maintaining Windows file system integration! 🎉
