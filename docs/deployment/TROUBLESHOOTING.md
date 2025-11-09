# 🔧 Troubleshooting Guide

Common issues and quick fixes for the Advancia Pay Ledger platform.

---

## 🚀 Development Server Issues

### ❌ Page Not Updating

**Symptom**: Changes not reflecting in browser after saving files

**Fix**:
```powershell
# Restart the frontend dev server
cd frontend
npm run dev
```

**Alternative** (if issue persists):
```powershell
# Clear Next.js cache and restart
rm -rf .next
npm run dev
```

---

### ❌ Port Busy Error

**Symptom**: `EADDRINUSE: address already in use :::3000` or `:::4000`

**Fix for Frontend (Port 3000)**:
```powershell
# Kill process on port 3000
npx kill-port 3000

# Or use the clean script
npm run clean
```

**Fix for Backend (Port 4000)**:
```powershell
# Kill process on port 4000
npx kill-port 4000

# Then restart
cd backend
npm run dev
```

**Windows-specific fix**:
```powershell
# Find and kill the process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Or for port 4000
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

---

### ❌ Blank Page / White Screen

**Symptom**: Browser shows empty page, no errors in console

**Causes & Fixes**:

1. **Missing Import Path**
   ```typescript
   // ❌ Wrong
   import Dashboard from '../components/Dashboard'
   
   // ✅ Correct - use path alias
   import Dashboard from '@/components/Dashboard'
   ```

2. **Component Not Exported**
   ```typescript
   // ❌ Missing export
   function MyComponent() { ... }
   
   // ✅ Correct
   export default function MyComponent() { ... }
   ```

3. **Check Browser Console**
   - Press `F12` → Console tab
   - Look for red error messages
   - Common errors:
     - `Module not found`
     - `Cannot find module`
     - `Unexpected token`

4. **Verify Page Structure**
   ```typescript
   // frontend/src/app/page.tsx
   export default function Home() {
     return (
       <main>
         <Dashboard />
       </main>
     )
   }
   ```

---

### ❌ Tailwind CSS Not Working

**Symptom**: Classes like `bg-blue-500` not applying styles

**Check 1**: Verify `globals.css` includes Tailwind directives
```css
/* frontend/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Check 2**: Ensure `globals.css` is imported in layout
```typescript
// frontend/src/app/layout.tsx
import './globals.css'
```

**Check 3**: Verify `tailwind.config.js` content paths
```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ... rest of config
}
```

**Fix**: Restart dev server after config changes
```powershell
npm run dev
```

---

## 🎨 Frontend Issues

### ❌ Component Not Rendering

**Symptom**: Component doesn't appear on page

**Debugging Steps**:

1. **Check Import Path**
   ```typescript
   // Use absolute imports with @/ alias
   import MyComponent from '@/components/MyComponent'
   ```

2. **Verify Component Export**
   ```typescript
   // Named export
   export function MyComponent() { ... }
   
   // Default export (preferred)
   export default function MyComponent() { ... }
   ```

3. **Check for Errors**
   - Open browser console (F12)
   - Look for red error messages
   - Check terminal for compilation errors

4. **Verify Component Usage**
   ```typescript
   // ✅ Correct
   <MyComponent />
   
   // ❌ Wrong (if default export)
   <MyComponent></MyComponent> // Can work but use self-closing
   ```

---

### ❌ "use client" Directive Issues

**Symptom**: `Error: useState can only be used in Client Components`

**Fix**: Add `"use client"` at top of file
```typescript
"use client";

import { useState } from 'react';

export default function MyComponent() {
  const [count, setCount] = useState(0);
  // ...
}
```

**When to use `"use client"`**:
- Components using React hooks (`useState`, `useEffect`, etc.)
- Components with event handlers (`onClick`, `onChange`, etc.)
- Components using browser APIs (`window`, `document`, etc.)
- Third-party libraries that require client-side rendering

---

### ❌ Framer Motion Not Animating

**Symptom**: Animations don't play or components appear static

**Fix 1**: Add `"use client"` directive
```typescript
"use client";
import { motion } from "framer-motion";
```

**Fix 2**: Verify animation props
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

**Fix 3**: Check for layout conflicts
```typescript
// Add layout prop for smoother animations
<motion.div layout>
  Content
</motion.div>
```

---

## 🔌 Backend Issues

### ❌ API Not Responding

**Symptom**: Frontend shows "Failed to fetch" or network errors

**Debugging Steps**:

1. **Check Backend is Running**
   ```powershell
   cd backend
   npm run dev
   ```
   Should see: `Server listening on port 4000`

2. **Test API Manually**
   ```powershell
   # Test health endpoint
   curl http://localhost:4000/health
   
   # Or use PowerShell
   Invoke-WebRequest -Uri http://localhost:4000/health
   ```

3. **Check CORS Configuration**
   ```typescript
   // backend/src/index.ts
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true
   }));
   ```

4. **Verify Frontend API URL**
   ```typescript
   // Should match backend port
   const API_URL = 'http://localhost:4000';
   ```

---

### ❌ Socket.IO Not Connecting

**Symptom**: Real-time updates not working

**Fix 1**: Check Socket.IO initialization
```typescript
// frontend
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  transports: ['websocket', 'polling']
});
```

**Fix 2**: Verify backend Socket.IO setup
```typescript
// backend/src/index.ts
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});
```

**Fix 3**: Check connection in browser console
```typescript
socket.on('connect', () => {
  console.log('✅ Socket.IO connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Socket.IO disconnected');
});
```

---

## 📦 Dependency Issues

### ❌ Module Not Found

**Symptom**: `Cannot find module 'framer-motion'` or similar

**Fix**:
```powershell
# Install all dependencies
cd frontend
npm install

# Or install specific package
npm install framer-motion
```

**For Backend**:
```powershell
cd backend
npm install
```

---

### ❌ TypeScript Errors

**Symptom**: Red squiggly lines or compilation errors

**Fix 1**: Install type definitions
```powershell
npm install --save-dev @types/node @types/react @types/react-dom
```

**Fix 2**: Check `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Fix 3**: Restart TypeScript server in VS Code
- Press `Ctrl+Shift+P`
- Type: `TypeScript: Restart TS Server`
- Press Enter

---

## 🗄️ Database Issues

### ❌ Prisma Client Not Generated

**Symptom**: `@prisma/client` module not found

**Fix**:
```powershell
cd backend
npx prisma generate
```

---

### ❌ Database Connection Failed

**Symptom**: `Can't reach database server` or connection timeout

**Fix 1**: Check PostgreSQL is running
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Or check Docker container
docker ps | grep postgres
```

**Fix 2**: Verify DATABASE_URL
```env
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/advancia_db?schema=public"
```

**Fix 3**: Test connection
```powershell
cd backend
npx prisma db pull
```

---

### ❌ Migration Failed

**Symptom**: `Migration engine error` or schema drift

**Fix 1**: Reset database (⚠️ Development only!)
```powershell
cd backend
npx prisma migrate reset
```

**Fix 2**: Create new migration
```powershell
npx prisma migrate dev --name fix_schema
```

**Fix 3**: Check migration status
```powershell
npx prisma migrate status
```

---

## 🎯 Quick Commands Reference

### Frontend Commands
```powershell
cd frontend

npm install              # Install dependencies
npm run dev             # Start dev server
npm run dev:open        # Start with turbo mode
npm run build           # Production build
npm run lint            # Check for errors
npm run clean           # Kill port 3000 and restart
```

### Backend Commands
```powershell
cd backend

npm install              # Install dependencies
npm run dev             # Start dev server
npm run build           # Compile TypeScript
npx prisma generate     # Generate Prisma Client
npx prisma migrate dev  # Run migrations
npx prisma studio       # Open database GUI
```

### Port Management
```powershell
# Kill specific port
npx kill-port 3000
npx kill-port 4000

# Kill multiple ports
npx kill-port 3000 4000

# Windows-specific
Get-NetTCPConnection -LocalPort 3000 | Select OwningProcess
Stop-Process -Id <PID> -Force
```

---

## 🔍 Debugging Tips

### 1. Check Browser Console
- Press `F12` → Console tab
- Look for errors (red text)
- Check Network tab for failed requests

### 2. Check Terminal Output
- Frontend terminal: Compilation errors, warnings
- Backend terminal: API errors, database issues

### 3. Use VS Code Debugger
```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### 4. Enable Verbose Logging
```typescript
// Add to components for debugging
console.log('Component rendered:', { props, state });

useEffect(() => {
  console.log('Effect triggered:', dependency);
}, [dependency]);
```

---

## 📚 Helpful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Socket.IO Docs](https://socket.io/docs/)
- [Prisma Docs](https://www.prisma.io/docs)

---

## 🆘 Still Having Issues?

1. **Clear All Caches**
   ```powershell
   # Frontend
   cd frontend
   rm -rf .next node_modules package-lock.json
   npm install
   
   # Backend
   cd backend
   rm -rf dist node_modules package-lock.json
   npm install
   ```

2. **Check System Requirements**
   - Node.js 18+ installed: `node --version`
   - npm 9+ installed: `npm --version`
   - Git installed: `git --version`

3. **Restart Everything**
   ```powershell
   # Kill all Node processes
   taskkill /F /IM node.exe
   
   # Restart VS Code
   # Restart servers
   ```

4. **Check File Permissions**
   - Ensure you have write permissions in project directory
   - Run terminal as administrator if needed

---

**💡 Pro Tip**: Keep both frontend and backend terminals open side-by-side to see errors from both services in real-time!

**🎯 Quick Fix Checklist**:
- [ ] Backend running on port 4000?
- [ ] Frontend running on port 3000?
- [ ] Dependencies installed (`node_modules` exists)?
- [ ] Browser console clear of errors?
- [ ] Using `@/` import aliases?
- [ ] `"use client"` added to interactive components?
- [ ] Tailwind classes working?
- [ ] Socket.IO connected?

---

**Need more help?** Check the `README.md` for setup instructions or `DASHBOARD_IMPLEMENTATION.md` for component details.
