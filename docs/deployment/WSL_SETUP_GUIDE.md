# 🚀 MOVE PROJECT TO WSL - Complete Setup Guide

**Date:** October 19, 2025  
**OS:** Windows with WSL2 (Ubuntu-24.04)  
**Project:** -modular-saas-platform  
**Status:** Ready to migrate

---

## 📋 Prerequisites Check

### ✅ What You Have
- Windows with PowerShell
- WSL2 with Ubuntu-24.04 (Running)
- Docker Desktop (Running)
- Git configured (already working)
- Node.js capable environment

### ⏭️ What We'll Do
1. Copy project to WSL home directory
2. Install Node.js & npm in WSL
3. Configure Git in WSL
4. Set up SSH keys for GitHub
5. Update VS Code to use WSL
6. Test everything works

---

## 📁 Step 1: Copy Project to WSL

### Option A: Copy via PowerShell (Fastest)

```powershell
# From your Windows PowerShell, run:
$wslPath = "\\wsl$\Ubuntu-24.04\home\$env:USERNAME\projects"

# Create projects folder if it doesn't exist
wsl mkdir -p ~/projects

# Copy the entire project
Copy-Item -Path "C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform" `
          -Destination $wslPath `
          -Recurse -Force

# Verify copy
wsl ls -lah ~/projects/-modular-saas-platform
```

### Option B: Copy via WSL Commands

```bash
# Open WSL terminal and run:
mkdir -p ~/projects
cd ~/projects

# Clone from GitHub instead (cleaner)
git clone https://github.com/pdtribe181-prog/-modular-saas-platform.git
cd -modular-saas-platform
```

**Recommendation:** Use Option B (clone from GitHub) - cleaner and ensures you have latest code

---

## 🔧 Step 2: Install Node.js in WSL

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version    # Should be v18.x.x
npm --version     # Should be 9.x.x or higher

# Install additional tools
sudo apt install -y build-essential git curl wget
```

---

## 🔐 Step 3: Configure Git in WSL

```bash
# Set Git config
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global core.editor "nano"

# Verify
git config --global --list
```

---

## 🔑 Step 4: Set Up SSH Keys for GitHub

### Generate SSH Key

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# When prompted:
# Enter file: /home/your_username/.ssh/id_ed25519
# Passphrase: (use something secure or leave empty for now)

# Verify key was created
ls -la ~/.ssh/
```

### Add SSH Key to GitHub

```bash
# Copy the public key
cat ~/.ssh/id_ed25519.pub

# Then:
# 1. Go to: https://github.com/settings/keys
# 2. Click "New SSH key"
# 3. Title: "WSL Ubuntu Desktop"
# 4. Paste the key
# 5. Click "Add SSH key"
```

### Test SSH Connection

```bash
ssh -T git@github.com
# Should output: "Hi pdtribe181-prog! You've successfully authenticated..."
```

---

## 📂 Step 5: Clone Project in WSL

```bash
# Navigate to projects folder
cd ~/projects

# Clone your repository
git clone git@github.com:pdtribe181-prog/-modular-saas-platform.git

# Navigate into project
cd -modular-saas-platform

# Verify it's the correct branch
git status
```

---

## 🔨 Step 6: Install Project Dependencies

```bash
# Install backend dependencies
cd backend
npm ci
npm run build

# Check for errors
echo "Backend build: $?"

# Return to root
cd ..

# Install frontend dependencies
cd frontend
npm ci
npm run build

# Check for errors
echo "Frontend build: $?"

# Return to root
cd ..
```

---

## 🖥️ Step 7: Configure VS Code for WSL

### Option A: Direct WSL Connection

```bash
# Open VS Code and install "Remote - WSL" extension
# 1. Press Ctrl+Shift+X (Extensions)
# 2. Search for "Remote - WSL"
# 3. Click "Install"
# 4. Reload VS Code

# Then open your project in WSL:
code ~/projects/-modular-saas-platform
```

### Option B: From WSL Terminal

```bash
# From WSL terminal in your project:
cd ~/projects/-modular-saas-platform
code .

# This automatically opens in WSL mode
```

### Verify WSL Connection in VS Code

```
Look at bottom-left corner of VS Code:
✅ Should show: "WSL: Ubuntu-24.04"
✅ Should show: "Ubuntu-24.04" in green

If it shows "Windows", click and select "WSL: Ubuntu-24.04"
```

---

## 🧪 Step 8: Test Everything Works

```bash
# Navigate to project
cd ~/projects/-modular-saas-platform

# Test backend
cd backend
npm run build
npm test 2>&1 | head -20

# Test frontend
cd ../frontend
npm run build
npm test 2>&1 | head -20

# Return to root
cd ..

# Check git
git log --oneline -5
git status
```

---

## 🔄 Step 9: Update Git Configuration

```bash
# Configure git to work with both Windows and WSL
git config --global core.autocrlf input

# Set default branch
git config --global init.defaultBranch main

# Enable SSH
git config --global core.sshCommand ssh

# Verify
git config --global --list
```

---

## 📝 Step 10: Create WSL Development Environment File

Create `~/.wsl_env` to keep settings:

```bash
cat > ~/.wsl_env << 'EOF'
# WSL Development Environment

# Project Path
export PROJECT_ROOT=$HOME/projects/-modular-saas-platform

# Node paths
export NODE_PATH=/usr/local/lib/node_modules

# Aliases for convenience
alias project='cd $PROJECT_ROOT'
alias backend='cd $PROJECT_ROOT/backend'
alias frontend='cd $PROJECT_ROOT/frontend'
alias startdev='cd $PROJECT_ROOT && npm run dev'

# Git shortcuts
alias gitlog='git log --oneline -10'
alias gitstatus='git status'
alias gitpush='git push origin main'

# npm shortcuts
alias install-all='cd backend && npm ci && cd ../frontend && npm ci && cd ..'
alias build-all='cd backend && npm run build && cd ../frontend && npm run build && cd ..'

echo "✅ WSL Environment loaded"
EOF

# Add to bashrc
echo "source ~/.wsl_env" >> ~/.bashrc

# Reload
source ~/.bashrc
```

---

## 🎯 Quick Start Commands for WSL

After setup, you can use these in any WSL terminal:

```bash
# Navigate to project
project
# or
cd ~/projects/-modular-saas-platform

# Go to backend
backend

# Go to frontend  
frontend

# Install all dependencies
install-all

# Build all
build-all

# Start development
startdev

# Check git
gitlog
gitstatus
```

---

## 🔍 Troubleshooting WSL Setup

### Issue: WSL is slow
```bash
# Solution: Ensure project is IN WSL, not on Windows disk
# ✅ Good: ~/projects/-modular-saas-platform
# ❌ Bad: /mnt/c/Users/.../project

# Check your location
pwd
# Should show: /home/username/...
```

### Issue: npm commands slow
```bash
# Solution: Move to WSL filesystem
cd ~/projects/-modular-saas-platform

# Don't do this:
# cd /mnt/c/Users/.../project (very slow)
```

### Issue: Git permission denied
```bash
# Solution: Set correct SSH permissions
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Test again
ssh -T git@github.com
```

### Issue: VS Code can't find files
```bash
# Solution: Close VS Code, then from WSL terminal:
code ~/projects/-modular-saas-platform

# Don't open from File menu - open from terminal
```

### Issue: Node/npm not found
```bash
# Solution: Verify installation
which node
which npm
node --version

# If not found, reinstall:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 🚀 Complete Setup Script

Save this as `setup-wsl.sh` and run it:

```bash
#!/bin/bash

echo "🚀 Starting WSL Setup..."

# Update packages
echo "📦 Updating packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "📥 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs build-essential git curl wget

# Create projects directory
echo "📁 Creating projects directory..."
mkdir -p ~/projects
cd ~/projects

# Clone project
echo "⬇️ Cloning project from GitHub..."
git clone git@github.com:pdtribe181-prog/-modular-saas-platform.git
cd -modular-saas-platform

# Install dependencies
echo "📚 Installing dependencies..."
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..

# Build
echo "🔨 Building project..."
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

# Create WSL env file
echo "⚙️ Creating environment file..."
cat > ~/.wsl_env << 'EOF'
export PROJECT_ROOT=$HOME/projects/-modular-saas-platform
alias project='cd $PROJECT_ROOT'
alias backend='cd $PROJECT_ROOT/backend'
alias frontend='cd $PROJECT_ROOT/frontend'
echo "✅ WSL Environment loaded"
EOF

echo "source ~/.wsl_env" >> ~/.bashrc

# Verify
echo "✅ Setup complete! Running verification..."
node --version
npm --version
git status

echo "🎉 WSL Setup Complete!"
echo "📍 Your project is at: ~/projects/-modular-saas-platform"
echo "💡 Run 'project' to navigate there anytime"
```

---

## ✅ Verification Checklist

After setup, verify everything:

```bash
# ✅ Check Node.js
node --version        # Should be v18.x.x

# ✅ Check npm
npm --version         # Should be 9.x.x+

# ✅ Check Git
git --version         # Should be 2.x.x

# ✅ Check SSH
ssh -T git@github.com # Should authenticate successfully

# ✅ Check project location
cd ~/projects/-modular-saas-platform
pwd                   # Should show: /home/username/projects/...
git status            # Should show: On branch main

# ✅ Check builds
cd backend && npm run build # Should succeed
cd ../frontend && npm run build # Should succeed

# ✅ Check VS Code
code .                # Should open in WSL mode
```

---

## 🎯 Final Steps

### 1. Update Git Remote (if needed)
```bash
cd ~/projects/-modular-saas-platform

# Verify remote is correct
git remote -v

# Should show:
# origin  git@github.com:pdtribe181-prog/-modular-saas-platform.git

# If using HTTPS, switch to SSH:
git remote set-url origin git@github.com:pdtribe181-prog/-modular-saas-platform.git
```

### 2. Sync Latest Changes
```bash
git fetch origin
git pull origin main
```

### 3. Create Development Branch (optional)
```bash
git checkout -b development
```

---

## 📊 WSL vs Windows Comparison

| Feature | Windows | WSL2 |
|---------|---------|------|
| npm speed | Medium | ✅ Fast |
| Git speed | Medium | ✅ Fast |
| File operations | Medium | ✅ Fast |
| Terminal | CMD/PowerShell | ✅ Bash |
| Docker | Separate install | ✅ Native |
| Linux tools | ❌ No | ✅ Yes |
| Production-like | ❌ No | ✅ Yes |
| Development experience | Medium | ✅ Excellent |

**Recommendation:** Use WSL for development, Windows for general use

---

## 🔗 Useful Links

- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [VS Code WSL Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl)
- [GitHub SSH Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Node.js Installation](https://nodejs.org/en/download/package-manager/)

---

## 🎊 You're Ready!

After following this guide:
- ✅ Project is in WSL
- ✅ All tools installed
- ✅ Git configured with SSH
- ✅ VS Code set up for WSL
- ✅ Ready to develop!

**Next Steps:**
1. Run setup script or follow steps manually
2. Verify everything works
3. Continue with Step 2 deployment (DNS & SSL)
4. Or start feature development

---

**Questions?** Check troubleshooting section or ask for help! 🚀
