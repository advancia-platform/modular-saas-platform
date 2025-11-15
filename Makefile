# ═══════════════════════════════════════════════════════════════
# Advancia Pay Ledger - Development & Test Makefile
# ═══════════════════════════════════════════════════════════════
# Quick shortcuts for common development tasks
# Usage: make <target>
# ═══════════════════════════════════════════════════════════════

.PHONY: help test test-watch test-coverage up down logs clean \
        db-setup db-migrate db-seed db-reset db-studio \
        install lint format docker-test docker-up docker-down \
        docker-logs docker-clean ci-test

# ─── Variables ───────────────────────────────────────────────
DOCKER_COMPOSE := docker-compose -f docker-compose.test.yml
BACKEND_DIR := backend
FRONTEND_DIR := frontend

# ─── Default Target ──────────────────────────────────────────
help: ## Show this help message
	@echo "╔════════════════════════════════════════════════════════╗"
	@echo "║   Advancia Pay Ledger - Development Commands          ║"
	@echo "╚════════════════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ═══════════════════════════════════════════════════════════════
# Local Testing (without Docker)
# ═══════════════════════════════════════════════════════════════

test: ## Run all tests locally
	@echo "🧪 Running tests..."
	cd $(BACKEND_DIR) && npm test

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	cd $(BACKEND_DIR) && npm run test:watch

test-coverage: ## Run tests with coverage report
	@echo "📊 Running tests with coverage..."
	cd $(BACKEND_DIR) && npm run test:coverage
	@echo "✅ Coverage report: $(BACKEND_DIR)/coverage/index.html"

test-verbose: ## Run tests with verbose output
	@echo "🔊 Running tests with verbose output..."
	cd $(BACKEND_DIR) && npm run test:verbose

# ═══════════════════════════════════════════════════════════════
# Database Management
# ═══════════════════════════════════════════════════════════════

db-setup: ## Complete test database setup (create + migrate + seed)
	@echo "🔧 Setting up test database..."
	cd $(BACKEND_DIR) && npm run db:setup:test

db-migrate: ## Run database migrations
	@echo "📦 Running migrations..."
	cd $(BACKEND_DIR) && npm run migrate:test

db-seed: ## Seed test database with sample data
	@echo "🌱 Seeding test database..."
	cd $(BACKEND_DIR) && npm run seed:test

db-reset: ## Reset test database (drop + migrate + seed)
	@echo "♻️  Resetting test database..."
	cd $(BACKEND_DIR) && npm run db:reset:test

db-studio: ## Open Prisma Studio for test database
	@echo "🎨 Opening Prisma Studio..."
	cd $(BACKEND_DIR) && npm run prisma:studio:test

# ═══════════════════════════════════════════════════════════════
# Docker Compose Commands
# ═══════════════════════════════════════════════════════════════

docker-test: ## Run tests in Docker containers (build + test + exit)
	@echo "🐳 Running tests in Docker..."
	$(DOCKER_COMPOSE) up --build --abort-on-container-exit backend
	@echo "✅ Tests completed"

docker-up: ## Start all services in background
	@echo "🚀 Starting services in Docker..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ Services started:"
	@echo "   - PostgreSQL: localhost:5432"
	@echo "   - Redis: localhost:6379"
	@echo "   - Backend: http://localhost:4001"
	@echo "   - Frontend: http://localhost:3001"
	@echo "   - Mailhog UI: http://localhost:8025"

docker-down: ## Stop all Docker services
	@echo "🛑 Stopping Docker services..."
	$(DOCKER_COMPOSE) down
	@echo "✅ Services stopped"

docker-logs: ## View logs from all services
	@echo "📋 Viewing Docker logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f

docker-logs-backend: ## View backend logs only
	@echo "📋 Viewing backend logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f backend

docker-logs-postgres: ## View PostgreSQL logs only
	@echo "📋 Viewing PostgreSQL logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f postgres

docker-clean: ## Remove containers, volumes, and networks
	@echo "🧹 Cleaning up Docker resources..."
	$(DOCKER_COMPOSE) down -v --remove-orphans
	@echo "✅ Docker resources cleaned"

docker-rebuild: ## Rebuild Docker images from scratch
	@echo "🔨 Rebuilding Docker images..."
	$(DOCKER_COMPOSE) build --no-cache
	@echo "✅ Images rebuilt"

docker-ps: ## Show running containers
	@echo "📦 Running containers:"
	$(DOCKER_COMPOSE) ps

docker-shell-backend: ## Open shell in backend container
	@echo "💻 Opening shell in backend container..."
	$(DOCKER_COMPOSE) exec backend sh

docker-shell-postgres: ## Open PostgreSQL shell
	@echo "🐘 Opening PostgreSQL shell..."
	$(DOCKER_COMPOSE) exec postgres psql -U test_user -d advancia_test

# ═══════════════════════════════════════════════════════════════
# Development Workflow
# ═══════════════════════════════════════════════════════════════

install: ## Install dependencies for all packages
	@echo "📦 Installing dependencies..."
	cd $(BACKEND_DIR) && npm install
	cd $(FRONTEND_DIR) && npm install
	@echo "✅ Dependencies installed"

install-backend: ## Install backend dependencies only
	@echo "📦 Installing backend dependencies..."
	cd $(BACKEND_DIR) && npm install

install-frontend: ## Install frontend dependencies only
	@echo "📦 Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install

dev-backend: ## Start backend in development mode
	@echo "🔥 Starting backend dev server..."
	cd $(BACKEND_DIR) && npm run dev

dev-frontend: ## Start frontend in development mode
	@echo "🔥 Starting frontend dev server..."
	cd $(FRONTEND_DIR) && npm run dev

lint: ## Run linter on all code
	@echo "🔍 Linting code..."
	cd $(BACKEND_DIR) && npm run lint || echo "No lint script found"
	cd $(FRONTEND_DIR) && npm run lint || echo "No lint script found"

format: ## Format code with Prettier
	@echo "✨ Formatting code..."
	cd $(BACKEND_DIR) && npm run format || echo "No format script found"
	cd $(FRONTEND_DIR) && npm run format || echo "No format script found"

# ═══════════════════════════════════════════════════════════════
# CI/CD Simulation
# ═══════════════════════════════════════════════════════════════

ci-test: ## Simulate CI/CD test pipeline
	@echo "🤖 Simulating CI/CD pipeline..."
	@echo "1️⃣  Starting PostgreSQL..."
	$(DOCKER_COMPOSE) up -d postgres redis
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 10
	@echo "2️⃣  Installing dependencies..."
	cd $(BACKEND_DIR) && npm ci
	@echo "3️⃣  Running migrations..."
	cd $(BACKEND_DIR) && npm run migrate:test
	@echo "4️⃣  Seeding database..."
	cd $(BACKEND_DIR) && npm run seed:test
	@echo "5️⃣  Running tests..."
	cd $(BACKEND_DIR) && npm test -- --coverage --maxWorkers=2
	@echo "6️⃣  Cleaning up..."
	$(DOCKER_COMPOSE) down
	@echo "✅ CI/CD simulation complete"

# ═══════════════════════════════════════════════════════════════
# Monitoring & Status
# ═══════════════════════════════════════════════════════════════

status: ## Show status of all services
	@echo "📊 Service Status:"
	@echo ""
	@echo "Docker Containers:"
	@$(DOCKER_COMPOSE) ps || echo "  No containers running"
	@echo ""
	@echo "PostgreSQL:"
	@$(DOCKER_COMPOSE) exec postgres pg_isready -U test_user 2>/dev/null && echo "  ✅ Healthy" || echo "  ❌ Not running"
	@echo ""
	@echo "Redis:"
	@$(DOCKER_COMPOSE) exec redis redis-cli ping 2>/dev/null && echo "  ✅ Healthy" || echo "  ❌ Not running"

health: ## Check health of all services
	@echo "🏥 Health Check:"
	@$(DOCKER_COMPOSE) exec postgres pg_isready -U test_user || true
	@$(DOCKER_COMPOSE) exec redis redis-cli ping || true
	@curl -f http://localhost:4001/health || echo "Backend not responding"

# ═══════════════════════════════════════════════════════════════
# Cleanup & Maintenance
# ═══════════════════════════════════════════════════════════════

clean-coverage: ## Remove coverage reports
	@echo "🧹 Removing coverage reports..."
	rm -rf $(BACKEND_DIR)/coverage
	@echo "✅ Coverage reports removed"

clean-logs: ## Remove log files
	@echo "🧹 Removing log files..."
	rm -rf $(BACKEND_DIR)/logs/*.log
	@echo "✅ Log files removed"

clean-node-modules: ## Remove node_modules (use with caution)
	@echo "🧹 Removing node_modules..."
	rm -rf $(BACKEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/node_modules
	@echo "✅ node_modules removed (run 'make install' to reinstall)"

clean-all: docker-clean clean-coverage clean-logs ## Clean everything (Docker + coverage + logs)
	@echo "✅ All cleaned up!"

# ═══════════════════════════════════════════════════════════════
# Quick Shortcuts
# ═══════════════════════════════════════════════════════════════

quick-test: db-setup test ## Quick setup + test (most common workflow)

reset-and-test: db-reset test ## Reset database and run tests

full-ci: install ci-test ## Full CI pipeline (install + test)
