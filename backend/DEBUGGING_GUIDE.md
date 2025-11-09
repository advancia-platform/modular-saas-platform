# Backend Testing & Debugging Guide

## 🎯 Quick Start

You now have **6 Jest debug configurations** and **2 VS Code extensions** installed for comprehensive test debugging.

## 📦 Installed Extensions

1. **Jest** (`orta.vscode-jest`) - Already installed
   - Automatic test discovery and running
   - Shows test results inline in editor
   - Green/red indicators next to tests

2. **Jest Runner** (`firsttris.vscode-jest-runner`) - Just installed
   - Right-click context menu: "Run Jest" or "Debug Jest"
   - Individual test debugging from editor
   - No need to use debug panel for quick test runs

## 🐛 Debug Configurations Available

### Quick Access

Press **F5** or **Ctrl+Shift+D** to open the Debug panel, then select:

### 1. 🧪 Jest: Debug All Tests

- **Use when**: Running entire test suite
- **Command**: `npm test -- --runInBand --no-cache`
- **Serial execution**: Prevents database conflicts
- **Best for**: Comprehensive testing

### 2. 🔍 Jest: Debug Current File

- **Use when**: Debugging the currently open test file
- **Auto-targets**: `${fileBasename}` (e.g., `auth.test.ts`)
- **Best for**: Focused file debugging
- **Tip**: Open a test file, press F5, select this config

### 3. 🎯 Jest: Debug Integration Tests

- **Use when**: Specifically debugging `integration.test.ts`
- **Verbose mode**: Shows detailed output
- **Best for**: API endpoint testing

### 4. ✅ Jest: Debug Auth Tests

- **Use when**: Specifically debugging `auth.test.ts`
- **Best for**: Authentication flow debugging

### 5. 🧬 Jest: Debug with Coverage

- **Use when**: Need to see code coverage metrics
- **Generates**: Coverage reports in `coverage/` directory
- **Best for**: Identifying untested code

### 6. ⚡ Jest: Debug Single Test

- **Use when**: Debugging one specific test by name
- **Interactive**: Prompts for file name and test pattern
- **Example pattern**: `"should register a new user"`
- **Best for**: Laser-focused debugging

## 🚀 How to Debug Tests

### Method 1: Using Debug Panel (Breakpoints)

```
1. Open a test file (e.g., backend/tests/integration.test.ts)
2. Click in the gutter (left of line numbers) to set breakpoints
3. Press F5 or click "Run and Debug"
4. Select "🔍 Jest: Debug Current File"
5. Execution pauses at breakpoints
6. Use Debug Toolbar:
   - Continue (F5)
   - Step Over (F10)
   - Step Into (F11)
   - Step Out (Shift+F11)
7. Inspect variables in Debug sidebar
```

### Method 2: Using Jest Runner (Context Menu)

```
1. Open a test file
2. Right-click on:
   - `describe()` block → runs all tests in that suite
   - `it()` or `test()` → runs single test
3. Select:
   - "Run Jest" → normal execution
   - "Debug Jest" → debug with breakpoints
4. View output in Terminal/Debug Console
```

### Method 3: Using `debugger` Keyword

```typescript
it("should register a new user", async () => {
  debugger; // Execution will pause here

  const res = await request(app).post("/api/auth/register").send(testUser);

  debugger; // And here when reached
  expect(res.status).toBe(201);
});
```

## 🔍 Debugging Integration Tests

### Current Test Structure

```typescript
backend/tests/
├── integration.test.ts    ← Main API integration tests
├── auth.test.ts          ← Authentication tests (8/8 passing)
├── health.test.ts        ← Health checks (2/2 passing)
├── smoke.test.ts         ← Smoke tests (5/5 passing)
├── setup.ts              ← Global test configuration
├── globalSetup.ts        ← Database setup before all tests
└── globalTeardown.ts     ← Database cleanup after all tests
```

### Debug Workflow for Integration Tests

```bash
# 1. Set breakpoints in integration.test.ts
#    - Line where test fails
#    - Before API request
#    - After response received

# 2. Launch debug configuration
#    F5 → "🎯 Jest: Debug Integration Tests"

# 3. When paused, inspect:
#    - res.status (should be 200/201)
#    - res.body (API response data)
#    - testUserId (generated user ID)
#    - adminToken (JWT token)

# 4. Check database state in Debug Console:
await prisma.user.findUnique({ where: { id: testUserId } })

# 5. Step through code to find issue
```

## 🛠️ Debug Console Tips

### Run Commands During Debugging

When paused at a breakpoint, use the Debug Console to execute code:

```typescript
// Check user in database
await prisma.user.findUnique({ where: { email: "test@example.com" } });

// Verify token payload
const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);

// Inspect response
console.log(JSON.stringify(res.body, null, 2));

// Check environment
process.env.NODE_ENV;
process.env.TEST_DATABASE_URL;

// Count records
await prisma.user.count();
```

## 📊 Common Debugging Scenarios

### Scenario 1: Test Fails with 403 Forbidden

```typescript
// Set breakpoint here:
const res = await request(app)
  .get("/api/admin/users")
  .set("Authorization", `Bearer ${adminToken}`); // Check token format

// Debug Console:
console.log("Token:", adminToken);
const decoded = jwt.verify(adminToken, process.env.JWT_SECRET!);
console.log("Decoded:", decoded); // Should have: userId, email, role
```

### Scenario 2: Test Fails with 404 Not Found

```typescript
// Verify route path is correct:
const res = await request(app).get("/api/transactions/user/123"); // Not /api/transactions/123

// Debug Console - check route exists:
console.log(
  "Routes:",
  app._router.stack.map((r) => r.route?.path)
);
```

### Scenario 3: Database State Issues

```typescript
// Set breakpoint before database assertion
const user = await prisma.user.findUnique({
  where: { id: testUserId },
});

// Debug Console:
console.log("User:", user);
console.log("Approved:", user?.approved);
console.log("Active:", user?.active);

// Check related records:
const profile = await prisma.userProfile.findUnique({
  where: { userId: testUserId },
});
console.log("Profile:", profile);
```

### Scenario 4: Response Structure Mismatch

```typescript
// Set breakpoint after request:
const res = await request(app).get("/api/admin/users");

// Debug Console:
console.log("Status:", res.status);
console.log("Body type:", typeof res.body);
console.log("Is array:", Array.isArray(res.body));
console.log("Keys:", Object.keys(res.body)); // Check for 'items', 'total', etc.

// Flexible handling:
const users = res.body.items || res.body;
```

## 🎨 VS Code Tips

### Logpoints (Non-Breaking Breakpoints)

```
1. Right-click in gutter → "Add Logpoint"
2. Enter expression: `User ID: {testUserId}, Status: {res.status}`
3. Continues execution but logs to Debug Console
4. No need to modify code with console.log()
```

### Conditional Breakpoints

```
1. Right-click existing breakpoint → "Edit Breakpoint"
2. Add condition: `res.status !== 200`
3. Only pauses when condition is true
4. Great for loops or multiple requests
```

### Watch Expressions

```
1. In Debug sidebar, click "+" under WATCH
2. Add expressions to monitor:
   - testUserId
   - res.status
   - res.body.error
3. Updates automatically as you step through code
```

## 📝 Best Practices

### 1. Start Small

- Debug one test at a time
- Use "Debug Single Test" for focused debugging
- Right-click specific `it()` block with Jest Runner

### 2. Use Comprehensive Logging

- Tests already have debug logging on failures
- Check console output first before debugging
- Look for "❌ Test failed:" messages

### 3. Verify Database State

- Use Debug Console to query Prisma
- Check user approval status, roles, etc.
- Verify relationships (UserProfile, TokenWallet)

### 4. Check Environment

```typescript
// In Debug Console:
process.env.NODE_ENV; // Should be 'test'
process.env.TEST_DATABASE_URL; // Should point to Render DB
process.env.JWT_SECRET; // Should exist
```

### 5. Serial Execution Always

- All configs use `--runInBand`
- Prevents database conflicts
- Essential for integration tests

## 🔧 Troubleshooting

### ESM Loader Error on Linux

```
Error: Uncaught Error at asyncRunEntryPointWithESMLoader
No debugger available, can not send 'variables'
```

**Solution**: Updated all Jest debug configurations to use `program` instead of `runtimeExecutable`:

```json
"program": "${workspaceFolder}/backend/node_modules/jest/bin/jest.js"
```

This runs Jest directly with Node.js instead of trying to use the shell wrapper, which fixes the ESM loader issue on Linux.

### Debug Session Won't Start

```bash
# Check Jest is installed:
cd backend && npm list jest

# Reinstall if needed:
npm install --save-dev jest @types/jest ts-jest

# Clear Jest cache:
npx jest --clearCache
```

### Breakpoints Not Hitting

```
1. Ensure source maps enabled (already in tsconfig.json)
2. Check "skipFiles" doesn't exclude your code
3. Try adding `debugger;` keyword instead
4. Reload VS Code window (Ctrl+Shift+P → "Reload Window")
```

### Cannot Read Database

```
1. Verify TEST_DATABASE_URL in backend/.env
2. Check database connection in beforeAll:
   await prisma.$connect()
3. Run migrations if needed:
   cd backend && npx prisma migrate dev
```

## 🎯 Next Steps

1. **Run Integration Tests in Debug Mode**:

   ```
   F5 → "🎯 Jest: Debug Integration Tests"
   ```

2. **Set Breakpoints** in failing tests:
   - `integration.test.ts` line where test fails
   - Inspect `res.status` and `res.body`

3. **Use Debug Console** to query database state

4. **Check Token Payloads** to ensure JWT includes email field

5. **Verify Response Structures** match expected format

## 📚 Additional Resources

- [Jest Debugging Docs](https://jestjs.io/docs/troubleshooting)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- Backend README: `backend/README.md`
- Copilot Instructions: `.github/copilot-instructions.md`

---

**Happy Debugging! 🐛→✅**
