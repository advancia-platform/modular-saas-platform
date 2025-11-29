# Minimal TypeScript Project Template

## Quick Start

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run compiled JavaScript
npm start

# OR run directly with ts-node (no manual compilation)
npm run dev

# Watch mode (auto-recompile)
npm run build:watch

# Development with auto-restart
npm run dev:watch

# Type check only (no emit)
npm run typecheck
```

## Debugging in VS Code

### Method 1: Debug TypeScript directly (Recommended)

1. Open any `.ts` file
2. Set breakpoints (click left of line numbers)
3. Press `F5` or select **"🐛 Debug TypeScript (ts-node)"**
4. Debugger stops at breakpoints!

### Method 2: Debug compiled JavaScript

1. Run `npm run build` first
2. Select **"🏃 Debug Compiled JS"**
3. Press `F5`

### Method 3: Attach to running process

1. Run `npm run debug` in terminal
2. Select **"🔗 Attach to Process"**
3. Press `F5`

## Project Structure

```
ts-template/
├── src/
│   └── index.ts      # Entry point
├── dist/             # Compiled JS (git-ignored)
├── .vscode/
│   ├── launch.json   # Debug configurations
│   └── tasks.json    # Build tasks
├── package.json
├── tsconfig.json     # TypeScript config
└── README.md
```

## TypeScript Config Highlights

- **Strict mode enabled** - catches type errors early
- **Source maps** - debug TypeScript directly
- **ES2022 target** - modern JavaScript features
- **Declaration files** - for library authors

## Common Debug Tips

1. **Check compiler errors first**: `npm run typecheck`
2. **Use console.log with types**:
   ```typescript
   console.log("user:", typeof user, user);
   ```
3. **Set conditional breakpoints**: Right-click breakpoint → "Edit Breakpoint"
4. **Watch expressions**: Add variables to Watch panel
5. **Debug Console**: Evaluate expressions at breakpoint

## Environment Variables

- `DEBUG=true` - Enable debug logging
- `NODE_ENV=development` - Development mode
