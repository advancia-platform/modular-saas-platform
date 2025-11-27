# 🚨 Docker Desktop Troubleshooting Guide

## Current Issue

Docker Desktop is installed but the Linux engine is not running properly.
Error: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

## 🔧 Quick Fix Options

### Option 1: Restart Docker Desktop (Recommended)

```powershell
# 1. Close Docker Desktop completely
Get-Process "*Docker*" | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Wait 10 seconds
Start-Sleep -Seconds 10

# 3. Start Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# 4. Wait for startup (60-120 seconds)
Write-Host "Waiting for Docker Desktop to start..."
do {
    Start-Sleep -Seconds 10
    try {
        docker info | Out-Null
        $dockerRunning = $true
    }
    catch {
        $dockerRunning = $false
        Write-Host "Still starting..."
    }
} while (-not $dockerRunning)

Write-Host "✅ Docker Desktop is ready!"
```

### Option 2: Reset Docker Desktop

If Option 1 doesn't work:

1. Open Docker Desktop
2. Go to Settings → Troubleshoot
3. Click "Reset to factory defaults"
4. Restart your computer
5. Start Docker Desktop again

### Option 3: Alternative - Local Development (No Docker)

If Docker continues to have issues, you can run the AI DevOps Agent locally:

```powershell
# Install Python dependencies
cd src/reasoning-engine
pip install -r requirements.txt

# Install Node.js dependencies
cd ../execution-engine
npm install

# Start reasoning engine (Python Flask)
cd ../reasoning-engine
python app.py

# In new terminal: Start execution engine (Node.js)
cd ../execution-engine
npm start
```

## 🧪 Test Commands After Fix

```powershell
# Verify Docker is working
docker --version
docker info

# Test our AI system
.\start-windows.ps1

# Run the demo
.\demo-load-test.ps1
```

## 📋 Common Docker Desktop Issues

### WSL 2 Backend Issues

If you see WSL-related errors:

```powershell
# Enable WSL 2
wsl --install

# Update WSL
wsl --update

# Set WSL 2 as default
wsl --set-default-version 2
```

### Hyper-V Issues

If Hyper-V is the problem:

1. Open "Turn Windows features on or off"
2. Enable "Hyper-V" and "Windows Subsystem for Linux"
3. Restart computer

### Memory Issues

Docker Desktop needs at least 4GB RAM:

1. Open Docker Desktop
2. Settings → Resources → Memory
3. Increase to 4GB or more

## 🏆 Success Indicators

When working properly, you should see:

- Docker whale icon in system tray (blue, not red)
- `docker --version` returns version info
- `docker info` shows server information
- No error messages about pipes or engines

---

## ⚡ Quick Start After Fix

Once Docker is working:

```powershell
.\start-windows.ps1              # Start all services
.\demo-load-test.ps1            # Run comprehensive demo
```

Your AI DevOps Agent will be available at:

- Reasoning Engine: <http://localhost:5000>
- Execution Engine: <http://localhost:3000>
- Monitoring Dashboard: <http://localhost:3001>
