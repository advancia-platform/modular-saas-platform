# No-Config Debugging Setup

🚀 **Zero-configuration debugging** for your modular SaaS platform. Just press F5 or run a simple command!

## ✨ Features

- **Smart Auto-Detection**: Automatically detects what to debug based on your current file
- **One-Click Debugging**: Press F5 and go - no configuration needed
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Multi-Target Support**: Backend, Frontend, Tests, and Database
- **Environment Auto-Setup**: Automatically installs dependencies and sets up environment

## 🎯 Quick Start

### Option 1: VS Code (Recommended)

1. **Open any file** in your project
2. **Press F5** or click the debug icon
3. **Select "🚀 Smart Debug (Auto-Detect)"**
4. **Done!** Debug session starts automatically

### Option 2: Command Line

```bash
# Auto-detect what to debug
npm run debug

# Debug specific components
npm run debug:backend    # Debug backend server
npm run debug:frontend   # Debug Next.js frontend
npm run debug:test       # Debug Jest tests
```

### Option 3: PowerShell (Windows)

```powershell
# Auto-detect what to debug
.\scripts\debug.ps1

# Debug specific components
.\scripts\debug.ps1 backend
.\scripts\debug.ps1 frontend
.\scripts\debug.ps1 test
```

## 🔍 Auto-Detection Logic

The smart debugger automatically detects what you want to debug:

| Current File/Context              | Debug Target     | Reason               |
| --------------------------------- | ---------------- | -------------------- |
| `*.test.ts` or `*.spec.js`        | Jest Tests       | Test file detected   |
| Frontend files (`*.tsx`, `*.jsx`) | Next.js Frontend | Frontend component   |
| Backend routes/services           | Express Backend  | Backend service      |
| Prisma schema files               | Database Tools   | Database schema      |
| **Default fallback**              | Backend Server   | Most common scenario |

## 🛠️ Available Debug Configurations

### In VS Code Debug Panel (Ctrl+Shift+D):

#### Quick Access (No Config Needed)

- **🚀 Smart Debug (Auto-Detect)** - Automatically picks the right debug target
- **⚡ One-Click Backend Debug** - Instant backend debugging
- **🧪 One-Click Test Debug** - Debug currently open test file
- **🎨 One-Click Frontend Debug** - Next.js debugging with hot reload

#### Specialized Configurations

- **🔧 Backend: Debug (TS via tsx)** - Full TypeScript backend debugging
- **⚡ Debug Frontend (Next.js)** - Advanced Next.js debugging
- **🐘 Prisma Studio** - Visual database management
- **🤖 Run RPA Worker** - Debug automation workflows

## 📋 Debug URLs & Ports

| Service       | Debug Port | Chrome DevTools URL       |
| ------------- | ---------- | ------------------------- |
| Backend       | 9229       | chrome://inspect → target |
| Frontend      | 9230       | chrome://inspect → target |
| Jest Tests    | 9229       | chrome://inspect → target |
| Prisma Studio | 5555       | http://localhost:5555     |

## 🔧 Environment Auto-Setup

The debug system automatically:

✅ **Installs missing dependencies**  
✅ **Creates .env files from templates**  
✅ **Starts Docker services if needed**  
✅ **Generates Prisma client**  
✅ **Configures debug ports**

## 💡 Pro Tips

### Chrome DevTools Integration

1. Open Chrome and navigate to `chrome://inspect`
2. Click "Open dedicated DevTools for Node"
3. DevTools will automatically connect when debug sessions start

### VS Code Integration

- **Set breakpoints** by clicking in the gutter (left of line numbers)
- **Conditional breakpoints** - right-click breakpoint → Edit Breakpoint
- **Logpoints** - right-click gutter → Add Logpoint (like console.log but no code changes)

### Keyboard Shortcuts

- **F5** - Start debugging
- **Ctrl+Shift+F5** - Restart debug session
- **Shift+F5** - Stop debugging
- **F10** - Step over
- **F11** - Step into
- **Shift+F11** - Step out

## 🎮 Usage Examples

### Debug a Specific Test

```bash
# Open auth.test.ts in VS Code
# Press F5 → Select "🧪 One-Click Test Debug"
# Breakpoints in test files will be hit automatically
```

### Debug API Endpoint

```bash
# Open any route file like routes/auth.ts
# Press F5 → Select "⚡ One-Click Backend Debug"
# Set breakpoints in your route handlers
# Make API calls to trigger breakpoints
```

### Debug Frontend Component

```bash
# Open any React component (.tsx file)
# Press F5 → Select "🎨 One-Click Frontend Debug"
# Next.js will start with debug attached
# Set breakpoints in component code
```

### Full-Stack Debugging

```bash
# Terminal 1: Start backend debug
npm run debug:backend

# Terminal 2: Start frontend debug
npm run debug:frontend

# Now debug both simultaneously!
```

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Kill processes on debug ports
npx kill-port 9229 9230
```

### Missing Dependencies

```bash
# Run setup manually
npm run debug:setup
```

### Environment Issues

```bash
# Check environment setup
node scripts/smart-debug-setup.js
```

### Docker Services Not Starting

```bash
# Manual Docker start
docker-compose up -d
```

## 📁 File Structure

```
scripts/
├── smart-debug.js          # Main auto-detection logic
├── smart-debug-setup.js    # Environment preparation
├── debug.js                # Simple CLI debug tool
└── debug.ps1               # PowerShell debug tool

.vscode/
├── launch.json             # Debug configurations
├── tasks.json              # Pre-launch tasks
└── settings.json           # Enhanced debug settings
```

## 🔄 Integration with Existing Tools

### Works With

- ✅ **Jest** - Test debugging with breakpoints
- ✅ **Prisma** - Database debugging and queries
- ✅ **Next.js** - Frontend debugging with hot reload
- ✅ **Express** - Backend API debugging
- ✅ **TypeScript** - Full TS debugging support
- ✅ **Docker** - Automatic container management

### Compatible Editors

- ✅ **VS Code** (Full support)
- ✅ **Chrome DevTools** (Manual attachment)
- ✅ **WebStorm** (Node.js debug configuration)

## 📊 Performance Notes

- **Memory Usage**: Debug sessions use ~50-100MB additional RAM
- **Startup Time**: Auto-detection adds ~2-3 seconds to debug startup
- **Hot Reload**: Frontend debugging maintains Next.js hot reload
- **Test Performance**: Tests run in `--runInBand` mode for debugging

---

## 🤝 Contributing

To improve the debugging experience:

1. **Add new auto-detection patterns** in `scripts/smart-debug.js`
2. **Create specialized debug configurations** in `.vscode/launch.json`
3. **Enhance environment setup** in `scripts/smart-debug-setup.js`

## 📝 License

This debugging setup is part of the modular SaaS platform and follows the same license.
