## 🧪 Testing in VS Code - Quick Guide (Jest Runner Mode)

### **View & Run Tests Directly in Editor**

#### **1. Right-Click Context Menu** (Primary Method)
With `integration.test.ts` open:
- **Right-click** anywhere in the file
- Select:
  - **"Run Jest"** - Run all tests in file
  - **"Run Jest File"** - Same as above
  - **"Debug Jest"** - Debug with breakpoints

Or right-click on specific test:
- Click inside an `it()` or `describe()` block
- Right-click → **"Run Jest"** - Runs that test only

#### **2. CodeLens Buttons** ▶️
Look above each test:
```typescript
describe('Auth API', () => {  // ← You'll see "Run | Debug" here
  it('should register user', async () => {  // ← And here
    // test code
  });
});
```
- Click **Run** to execute
- Click **Debug** to debug with breakpoints

#### **3. Keyboard Shortcuts**
- **Command Palette**: `Ctrl+Shift+P` → "Jest Runner: Run"
- **Run Current Test**: Right-click → Run Jest
- **Debug Current Test**: Right-click → Debug Jest

---

### **Available Test Commands**

#### **Via Command Palette** (`Ctrl+Shift+P`)
- `Tasks: Run Task` → Choose:
  - 🧪 Jest: Run All Tests
  - 🔄 Jest: Watch Mode (auto-reruns on save)
  - 📄 Jest: Current File
  - 📊 Jest: Coverage Report
  - 🔗 Jest: Integration Tests
  - 🔐 Jest: Auth Tests

#### **Via Terminal**
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:cov            # With coverage
npm test -- integration.test.ts  # Specific file
```

---

### **Debug Tests with Breakpoints**

1. **Set Breakpoint**: Click left of line number (red dot appears)
2. **Right-click** in test file → **"Debug Jest"**
3. **Execution pauses** at breakpoint
4. **Inspect variables** in Debug sidebar (left)
5. **Step through** code with F10 (step over) or F11 (step into)

**Or use F5 Debugger:**
1. Press **F5** → Select:
   - `🔍 Jest: Debug Current File`
   - `🎯 Jest: Debug Integration Tests`
   - `✅ Jest: Debug Auth Tests`

---

### **Watch Mode (Best for Development)**

1. `Ctrl+Shift+P` → `Tasks: Run Task` → `🔄 Jest: Watch Mode`
2. Tests auto-run when you save files
3. Terminal shows live results
4. Press `a` to run all, `f` for failed, `q` to quit

---

### **Coverage Reports**

Run: `🧪 Jest: Coverage Report` task

View in browser:
```bash
cd backend
open coverage/lcov-report/index.html
```

---

### **Quick Reference**

| Action | Method |
|--------|--------|
| Run single test | Right-click test → "Run Jest" |
| Run whole file | Right-click anywhere → "Run Jest File" |
| Debug test | Right-click → "Debug Jest" |
| Run all tests | Task: `🧪 Jest: Run All Tests` |
| Watch mode | Task: `🔄 Jest: Watch Mode` |
| Coverage | Task: `📊 Jest: Coverage Report` |

---

### **Extension Used**
- **Jest Runner** by firsttris (`firsttris.vscode-jest-runner`)
- Native VS Code testing integration
- No deprecated features

---

### **Tips**
✅ **CodeLens**: See "Run | Debug" above each test  
✅ **Right-click**: Context menu for quick test runs  
✅ **Watch Mode**: Auto-runs tests on file save  
✅ **Breakpoints**: Click line number, then Debug Jest  
✅ **Terminal Output**: See results in integrated terminal  

Enjoy seamless testing! 🚀
