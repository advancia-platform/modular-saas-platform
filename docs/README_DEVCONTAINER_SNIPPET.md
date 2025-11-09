## Develop in Dev Containers or Codespaces

Use the provided dev container to avoid local Prisma/Node tooling issues and get a consistent environment. This sets up Node, Postgres, Redis, and all tooling automatically.

- VS Code Dev Containers

  1. Open this repo in VS Code and choose: Reopen in Container
  2. Wait for setup to finish (installs deps, generates Prisma client)
  3. Run the VS Code task: Start Development Servers
  4. Frontend: http://localhost:3000 · Backend health: http://localhost:4000/api/health

- GitHub Codespaces

  1. On GitHub, click Code -> Create codespace on main
  2. When ports 3000/4000 appear, open them in the browser

- Handy VS Code tasks
  - Start Development Servers
  - Type Check & Lint
  - Run Tests
  - Database Tools (Prisma Studio)

See docs/DEV_CONTAINERS_AND_CODESPACES.md for full details and troubleshooting.
