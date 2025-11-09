# Develop in Dev Containers or GitHub Codespaces

This repository includes a full dev container setup to give you a consistent, fast development environment that avoids platform-specific issues (like Prisma engine downloads on Windows).

## Why use it?

- Reproducible Node/Prisma/Postgres/Redis toolchain
- Auto-forwarded ports (3000 frontend, 4000 backend, 5432 Postgres, 6379 Redis)
- Preinstalled extensions (ESLint, Prettier, Jest, Tailwind, Docker, Copilot, etc.)
- Automated setup via `.devcontainer/setup.sh` (installs deps, runs prisma generate/migrate, builds apps)

## Quick start: VS Code Dev Containers (local)

1. Open the repo in VS Code.
2. When prompted, click "Reopen in Container" (or Command Palette → Dev Containers: Reopen in Container).
3. Wait for setup to finish (first boot installs dependencies and tools).
4. Start the dev servers:
   - VS Code Task: "🚀 Start Development Servers" (recommended), or
   - Open terminals in the container and run:
     - Backend: `npm run dev` in `backend/`
     - Frontend: `npm run dev` in `frontend/`
5. Visit:
   - Frontend: http://localhost:3000
   - Backend health: http://localhost:4000/api/health

Notes

- The container uses Postgres and Redis services declared in `.devcontainer/docker-compose.yml`.
- Environment defaults are set in `.devcontainer/devcontainer.json` (DATABASE_URL, REDIS_URL, etc.).
- `setup.sh` also installs Playwright browsers for E2E tests.

## Quick start: GitHub Codespaces (cloud)

1. On GitHub, click "Code" → "Create codespace on main".
2. The codespace boots using the same `.devcontainer/` configuration.
3. Use the "Ports" tab to open Frontend (3000) and Backend (4000).
4. Start the dev servers via the same VS Code tasks or npm scripts as above.

## Launch Pad tasks (inside container or Codespaces)

- 🚀 Start Development Servers: boots backend and frontend
- 🔍 Type Check & Lint: validates both apps
- 🧪 Run Tests: backend Jest + frontend Playwright
- 🗄️ Database Tools: opens Prisma Studio

Run via VS Code: Terminal → Run Task…

## GitLens usage

- Core GitLens features (blame, hovers, history, diffs) work without sign-in.
- Sign in only if you need GitLens+ features (Cloud Workspaces, Cloud Patches, premium views).

## Troubleshooting

- Prisma generate downloads blocked: Containers/Codespaces typically avoid this by using Linux base images and unrestricted network paths. If generate still fails, retry inside the container: `cd backend && npx prisma generate`.
- Port collisions: Stop local services using 3000/4000 or change port mappings in `.devcontainer/docker-compose.yml`.
- First-boot builds fail: Re-run tasks after setup completes; check `/workspaces/modular-saas-platform/.devcontainer/setup.sh` logs in the terminal.

---

## Suggested README snippet

Copy-paste the following into your root `README.md` under a new "Develop" section.

```md
## Develop in Dev Containers or Codespaces

This repo ships with a full dev container. It standardizes Node/Prisma/Postgres/Redis and avoids platform-specific issues.

- VS Code Dev Containers

  1. Open the repo in VS Code → "Reopen in Container".
  2. Wait for setup to complete.
  3. Run VS Code Task: "🚀 Start Development Servers" (or dev scripts).
  4. Frontend: http://localhost:3000 · Backend health: http://localhost:4000/api/health

- GitHub Codespaces

  1. On GitHub: Code → "Create codespace on main".
  2. Use the Ports tab to open 3000/4000.

- Tasks (Launch Pad): Start servers, Type check & Lint, Run Tests, Database Tools.
- GitLens: sign in only for Cloud Workspaces/Patches; core features work without an account.

See `docs/DEV_CONTAINERS_AND_CODESPACES.md` for details.
```
