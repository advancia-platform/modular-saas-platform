# 🎨 VS Code Extensions Guide

**All extensions needed for this project**

---

## 📥 Essential Extensions (Install These!)

### 1️⃣ **Prisma** - Database ORM Support
- **ID:** `prisma.prisma`
- **What it does:** Syntax highlighting, intellisense, and formatting for Prisma schema
- **Why you need it:** All your database models are in Prisma
- **Status:** ⭐⭐⭐⭐⭐

### 2️⃣ **TypeScript Vue Plugin** - Vue Type Support
- **ID:** `Vue.volar`
- **What it does:** Vue 3 support with TypeScript
- **Why you need it:** Better IntelliSense and error checking
- **Status:** ⭐⭐⭐⭐

### 3️⃣ **ESLint** - Code Quality
- **ID:** `dbaeumer.vscode-eslint`
- **What it does:** Real-time code quality checking
- **Why you need it:** Catch bugs before running code
- **Status:** ⭐⭐⭐⭐⭐

### 4️⃣ **Prettier** - Code Formatter
- **ID:** `esbenp.prettier-vscode`
- **What it does:** Auto-format code on save
- **Why you need it:** Consistent code style
- **Status:** ⭐⭐⭐⭐⭐

### 5️⃣ **REST Client** - Test API Endpoints
- **ID:** `humao.rest-client`
- **What it does:** Send HTTP requests directly from VS Code
- **Why you need it:** Test your backend API without Postman
- **Status:** ⭐⭐⭐⭐

### 6️⃣ **Thunder Client** - Alternative REST Client
- **ID:** `rangav.vscode-thunder-client`
- **What it does:** Beautiful API testing UI
- **Why you need it:** Alternative to REST Client or Postman
- **Status:** ⭐⭐⭐⭐

### 7️⃣ **PostgreSQL** - Database Management
- **ID:** `ckolkman.vscode-postgres`
- **What it does:** Connect to PostgreSQL database from VS Code
- **Why you need it:** Query database directly
- **Status:** ⭐⭐⭐⭐

### 8️⃣ **GitHub Copilot** - AI Code Assistant
- **ID:** `GitHub.copilot`
- **What it does:** AI-powered code suggestions
- **Why you need it:** Write code faster
- **Status:** ⭐⭐⭐⭐⭐ (Free with GitHub account)

### 9️⃣ **Git Graph** - Visualize Git History
- **ID:** `mhutchie.git-graph`
- **What it does:** Beautiful git commit visualization
- **Why you need it:** Understand commit history
- **Status:** ⭐⭐⭐⭐

### 🔟 **Thunder Client** - REST API Testing
- **ID:** `rangav.vscode-thunder-client`
- **What it does:** Test APIs without leaving VS Code
- **Why you need it:** Quick API testing
- **Status:** ⭐⭐⭐⭐

---

## 📥 Recommended Extensions

### **Tailwind CSS IntelliSense** - CSS Helper
- **ID:** `bradlc.vscode-tailwindcss`
- **What it does:** Auto-complete for Tailwind CSS classes
- **Why helpful:** Your frontend uses Tailwind
- **Status:** ⭐⭐⭐⭐⭐

### **Auto Rename Tag** - HTML Helper
- **ID:** `formulahendry.auto-rename-tag`
- **What it does:** Auto-rename matching HTML/JSX tags
- **Why helpful:** Faster JSX editing
- **Status:** ⭐⭐⭐⭐

### **Thunder Client** - API Testing
- **ID:** `rangav.vscode-thunder-client`
- **What it does:** Test REST APIs
- **Why helpful:** Test your backend endpoints
- **Status:** ⭐⭐⭐⭐

### **Better Comments** - Comment Highlighting
- **ID:** `aaron-bond.better-comments`
- **What it does:** Color-coded comments
- **Why helpful:** Organize your comments
- **Status:** ⭐⭐⭐

### **Indent Rainbow** - Visual Indentation
- **ID:** `oderwat.indent-rainbow`
- **What it does:** Color-codes indentation levels
- **Why helpful:** Spot indentation errors
- **Status:** ⭐⭐⭐

### **Path Intellisense** - Auto-complete Paths
- **ID:** `christian-kohler.path-intellisense`
- **What it does:** Auto-complete file paths
- **Why helpful:** Faster imports
- **Status:** ⭐⭐⭐⭐

### **Todo Highlight** - TODO Comments
- **ID:** `wayou.vscode-todo-highlight`
- **What it does:** Highlights TODO comments
- **Why helpful:** Keep track of tasks
- **Status:** ⭐⭐⭐

---

## 🛠️ Development Extensions

### **Debugger for Chrome/Edge** - JavaScript Debugging
- **ID:** `msjsdiag.debugger-for-chrome`
- **What it does:** Debug JavaScript in browser
- **Why helpful:** Find and fix bugs
- **Status:** ⭐⭐⭐⭐

### **Jest** - Test Runner
- **ID:** `orta.vscode-jest`
- **What it does:** Run Jest tests in VS Code
- **Why helpful:** Test your code
- **Status:** ⭐⭐⭐⭐

### **Docker** - Container Support
- **ID:** `ms-azuretools.vscode-docker`
- **What it does:** Docker syntax and management
- **Why helpful:** Work with Docker Compose
- **Status:** ⭐⭐⭐⭐

---

## 🎯 Optional Extensions

### **Peacock** - Workspace Color Coding
- **ID:** `johnpapa.vscode-peacock`
- **What it does:** Color-code workspaces
- **Why helpful:** Visual workspace organization
- **Status:** ⭐⭐⭐

### **Code Spell Checker** - Spell Check
- **ID:** `streetsidesoftware.code-spell-checker`
- **What it does:** Checks spelling in code
- **Why helpful:** Catch typos
- **Status:** ⭐⭐⭐

### **GitLens** - Git Supercharger
- **ID:** `eamodio.gitlens`
- **What it does:** Advanced git info
- **Why helpful:** See commit history inline
- **Status:** ⭐⭐⭐⭐⭐

### **Live Server** - Local Server
- **ID:** `ritwickdey.liveserver`
- **What it does:** Local development server
- **Why helpful:** Auto-reload static files
- **Status:** ⭐⭐⭐

---

## 📋 Quick Install Commands

### Install All Essential (Copy & Paste)
```powershell
# Run these commands in PowerShell or Terminal:

code --install-extension prisma.prisma
code --install-extension Vue.volar
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension humao.rest-client
code --install-extension rangav.vscode-thunder-client
code --install-extension ckolkman.vscode-postgres
code --install-extension GitHub.copilot
code --install-extension mhutchie.git-graph
code --install-extension bradlc.vscode-tailwindcss
```

### Install All Recommended (Copy & Paste)
```powershell
code --install-extension formulahendry.auto-rename-tag
code --install-extension aaron-bond.better-comments
code --install-extension oderwat.indent-rainbow
code --install-extension christian-kohler.path-intellisense
code --install-extension wayou.vscode-todo-highlight
code --install-extension eamodio.gitlens
```

### Install One at a Time
```powershell
# Prisma
code --install-extension prisma.prisma

# ESLint
code --install-extension dbaeumer.vscode-eslint

# Prettier
code --install-extension esbenp.prettier-vscode

# REST Client
code --install-extension humao.rest-client

# PostgreSQL
code --install-extension ckolkman.vscode-postgres

# GitHub Copilot
code --install-extension GitHub.copilot

# Tailwind CSS
code --install-extension bradlc.vscode-tailwindcss

# GitLens
code --install-extension eamodio.gitlens
```

---

## ✅ Verify Installation

```powershell
# Run this to see all installed extensions:
code --list-extensions

# Or in VS Code:
# 1. Press Ctrl+Shift+X (Extensions)
# 2. Should see list of extensions installed
```

---

## 🔧 Configuration After Install

### Prettier (Auto-Format on Save)
```json
// In VS Code Settings:
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```

### ESLint (Auto-Fix on Save)
```json
// In VS Code Settings:
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Tailwind CSS (IntelliSense)
```json
// In VS Code Settings:
{
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## 📖 Usage Examples

### Using Prisma Extension
- Open `backend/prisma/schema.prisma`
- See syntax highlighting
- Get IntelliSense suggestions
- Format with `Shift+Alt+F`

### Using REST Client
- Create a file: `requests.http`
- Write requests:
  ```http
  GET http://localhost:3001/health
  
  POST http://localhost:3001/auth/login
  Content-Type: application/json
  
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- Click "Send Request" above each request

### Using PostgreSQL Extension
1. Open Command Palette: `Ctrl+Shift+P`
2. Type: "PostgreSQL: Add Connection"
3. Enter connection details
4. Browse and query database

### Using GitHub Copilot
- Start typing: `function add(`
- Copilot suggests completion
- Press `Tab` to accept
- Press `Escape` to reject

---

## 🎨 Theme Recommendations

### Popular Themes
- **Dracula Official** - Dark, beautiful
- **One Dark Pro** - Popular, clean
- **Nord** - Arctic blue theme
- **Synthwave 84** - Retro, vibrant
- **GitHub Dark** - Official GitHub theme

### Install Theme
```powershell
code --install-extension dracula-theme.theme-dracula
```

---

## 🚀 Your Setup is Complete!

You now have:
✅ Prisma support for database
✅ ESLint for code quality
✅ Prettier for formatting
✅ REST Client for API testing
✅ PostgreSQL for database access
✅ GitHub Copilot for AI assistance
✅ Tailwind CSS support
✅ Git visualization
✅ And more!

---

## 📝 Extensions.json (Workspace Recommendations)

Create `.vscode/extensions.json` in your project:

```json
{
  "recommendations": [
    "prisma.prisma",
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "humao.rest-client",
    "rangav.vscode-thunder-client",
    "ckolkman.vscode-postgres",
    "GitHub.copilot",
    "mhutchie.git-graph",
    "bradlc.vscode-tailwindcss",
    "eamodio.gitlens",
    "formulahendry.auto-rename-tag",
    "aaron-bond.better-comments"
  ]
}
```

---

## ✨ Next Steps

1. Install extensions using commands above
2. Restart VS Code
3. Open your project
4. Verify extensions are working
5. Start coding!

---

*Date: October 19, 2025*  
*For: -modular-saas-platform project*  
*Status: Ready to Use!*
