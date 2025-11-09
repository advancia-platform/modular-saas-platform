╔════════════════════════════════════════════════════════════════════════════════╗
║ ║
║ 📋 QUICK REFERENCE - POWERSHELL COMMANDS ║
║ ║
╚════════════════════════════════════════════════════════════════════════════════╝

🎯 MOST COMMON COMMANDS YOU'LL USE
═══════════════════════════════════════════════════════════════════════════════

┌─ GIT COMMANDS ─────────────────────────────────────────────────────────────────┐

git checkout main
git pull origin main
git log --oneline -3 # See last 3 commits
git status # Check what changed
git add .
git commit -m "message"
git push origin main

└────────────────────────────────────────────────────────────────────────────────┘

┌─ DOCKER COMMANDS ──────────────────────────────────────────────────────────────┐

docker compose up -d db redis # Start services in background
docker compose down # Stop all services
docker compose ps # List running services
docker compose logs -f app # View app logs (follow)
docker compose logs db # View database logs
docker compose exec db psql -U postgres # Connect to database

└────────────────────────────────────────────────────────────────────────────────┘

┌─ NPM/NODE COMMANDS ────────────────────────────────────────────────────────────┐

npm install # Install dependencies
npm run dev # Start in development mode
npm start # Start in production mode
npm run build # Build for production
npm test # Run tests
npm test -- integration.test.ts # Run specific test file

└────────────────────────────────────────────────────────────────────────────────┘

┌─ PRISMA COMMANDS ──────────────────────────────────────────────────────────────┐

npx prisma migrate dev --name "name" # Create new migration (dev)
npx prisma migrate deploy # Apply migrations (production)
npx prisma generate # Regenerate Prisma client
npx prisma studio # Open database UI
npx prisma reset # Reset database (⚠️ deletes data)

└────────────────────────────────────────────────────────────────────────────────┘

┌─ VERIFICATION COMMANDS ────────────────────────────────────────────────────────┐

# Test backend health endpoint

Invoke-RestMethod http://localhost:4000/api/health

# Test registration endpoint

curl -X POST http://localhost:4000/api/auth/register `    -Headers @{'Content-Type'='application/json'}`
-Body '{"email":"test@example.com","password":"Test123!@#"}'

# Check if port is in use

Get-NetTCPConnection -LocalPort 4000

# View running processes

Get-Process | Where-Object {$\_.ProcessName -like "_node_"}

└────────────────────────────────────────────────────────────────────────────────┘

📁 DIRECTORY STRUCTURE - Where to Navigate
═══════════════════════════════════════════════════════════════════════════════

C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\
 ├─ backend/ ← Run npm commands here
├─ frontend/ ← Run Next.js dev server here
├─ .env.example ← Copy to create .env
├─ docker-compose.yml ← Docker services config
└─ scripts/ ← Deployment scripts

⚙️ QUICK SETUP SEQUENCE
═══════════════════════════════════════════════════════════════════════════════

Tab 1 - Git & Setup:
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform
git pull origin main
cd backend
Copy-Item .env.example .env

# Edit .env with your secrets

Tab 2 - Docker:
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform
docker compose up -d db redis

Tab 3 - Backend:
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev

Tab 4 - Frontend (optional):
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\frontend
npm install
npm run dev

Tab 5 - Testing:
Invoke-RestMethod http://localhost:4000/api/health

# Browse to http://localhost:3000 in browser

🔧 ENVIRONMENT VARIABLES NEEDED (.env)
═══════════════════════════════════════════════════════════════════════════════

DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/saas_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YourStrongPassword
POSTGRES_DB=saas_platform
JWT_SECRET=YourSecretKeyAt32CharsMinimumLength
API_KEY=dev-api-key-123
NEXT_PUBLIC_APP_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000
NODE_ENV=development

🆘 TROUBLESHOOTING QUICK REFERENCE
═══════════════════════════════════════════════════════════════════════════════

Problem: "ECONNREFUSED"
→ Database not running: docker compose up -d db redis

Problem: "Port 4000 already in use"
→ Kill process: Get-Process -Name node | Stop-Process -Force

Problem: "Module not found"
→ Reinstall: Remove-Item -Recurse node_modules; npm install

Problem: "Cannot find module .env"
→ Create .env: Copy-Item .env.example .env

Problem: "Prisma client not found"
→ Generate: npx prisma generate

Problem: Database migration failed
→ Check logs: docker compose logs db
→ Reset database: npx prisma migrate reset

Problem: Health check returns 404
→ Backend not running: npm run dev
→ Wrong URL: should be http://localhost:4000/api/health

📊 CHECKING SERVICE STATUS
═══════════════════════════════════════════════════════════════════════════════

# See all containers

docker compose ps

# Check if backend is listening

Get-NetTCPConnection -LocalPort 4000

# View backend process

Get-Process -Name node

# Test database connection

docker compose exec db pg_isready -U postgres

# Check environment variables

$env:DATABASE_URL # Should show your connection string

🔐 IMPORTANT SECURITY REMINDERS
═══════════════════════════════════════════════════════════════════════════════

• Never commit .env file (add to .gitignore)
• Use strong passwords for POSTGRES_PASSWORD
• JWT_SECRET should be random and at least 32 characters
• Don't share your .env file or secrets with anyone
• Rotate secrets regularly on production

📞 GETTING HELP
═══════════════════════════════════════════════════════════════════════════════

When something breaks:

1. Read the error message completely
2. Check the relevant logs:
   - Backend: npm run dev output
   - Database: docker compose logs db
   - Frontend: browser console (F12)
3. Search error in docs (Google the exact error)
4. Try the fix in TROUBLESHOOTING section
5. If still stuck, share the full error message

════════════════════════════════════════════════════════════════════════════════

Now you're ready! Start with:
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform
git pull origin main
