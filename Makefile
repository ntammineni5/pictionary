.PHONY: help install build format lint test run clean dev docker-build docker-up docker-down
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

## help: Show this help message
help:
	@echo "$(BLUE)Pictionary Game - Makefile Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Setup & Installation:$(NC)"
	@echo "  make install          - Install all dependencies"
	@echo "  make install-frontend - Install frontend dependencies"
	@echo "  make install-backend  - Install backend dependencies"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev              - Run both frontend and backend in dev mode"
	@echo "  make dev-frontend     - Run frontend in dev mode"
	@echo "  make dev-backend      - Run backend in dev mode"
	@echo ""
	@echo "$(GREEN)Build:$(NC)"
	@echo "  make build            - Build both frontend and backend"
	@echo "  make build-frontend   - Build frontend only"
	@echo "  make build-backend    - Build backend only"
	@echo ""
	@echo "$(GREEN)Format:$(NC)"
	@echo "  make format           - Format all code"
	@echo "  make format-frontend  - Format frontend code"
	@echo "  make format-backend   - Format backend code"
	@echo "  make format-check     - Check code formatting"
	@echo ""
	@echo "$(GREEN)Lint:$(NC)"
	@echo "  make lint             - Lint all code"
	@echo "  make lint-frontend    - Lint frontend code"
	@echo "  make lint-backend     - Lint backend code"
	@echo "  make lint-fix         - Fix linting issues"
	@echo ""
	@echo "$(GREEN)Test:$(NC)"
	@echo "  make test             - Run all tests"
	@echo "  make test-frontend    - Run frontend tests"
	@echo "  make test-backend     - Run backend tests"
	@echo "  make test-watch       - Run tests in watch mode"
	@echo "  make test-coverage    - Run tests with coverage"
	@echo ""
	@echo "$(GREEN)Run:$(NC)"
	@echo "  make run              - Run production build"
	@echo "  make run-frontend     - Run frontend in production"
	@echo "  make run-backend      - Run backend in production"
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-up        - Start with Docker Compose"
	@echo "  make docker-down      - Stop Docker Compose"
	@echo "  make docker-logs      - View Docker logs"
	@echo "  make docker-clean     - Clean Docker resources"
	@echo ""
	@echo "$(GREEN)Utility:$(NC)"
	@echo "  make clean            - Clean build artifacts"
	@echo "  make clean-all        - Clean everything including node_modules"
	@echo "  make check            - Run format check + lint + test"
	@echo "  make setup            - Initial project setup"
	@echo ""

# ============================================================================
# Installation
# ============================================================================

## install: Install all dependencies
install:
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

install-frontend:
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

install-backend:
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"

# ============================================================================
# Development
# ============================================================================

## dev: Run both frontend and backend in development mode
dev:
	@echo "$(BLUE)Starting development servers...$(NC)"
	npm run dev

dev-frontend:
	@echo "$(BLUE)Starting frontend dev server...$(NC)"
	npm run dev:client

dev-backend:
	@echo "$(BLUE)Starting backend dev server...$(NC)"
	npm run dev:server

# ============================================================================
# Build
# ============================================================================

## build: Build both frontend and backend
build:
	@echo "$(BLUE)Building application...$(NC)"
	npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

build-frontend:
	@echo "$(BLUE)Building frontend...$(NC)"
	npx next build
	@echo "$(GREEN)✓ Frontend build complete$(NC)"

build-backend:
	@echo "$(BLUE)Building backend...$(NC)"
	npx tsc --project tsconfig.server.json
	@echo "$(GREEN)✓ Backend build complete$(NC)"

# ============================================================================
# Format
# ============================================================================

## format: Format all code with Prettier
format:
	@echo "$(BLUE)Formatting code...$(NC)"
	npm run format
	@echo "$(GREEN)✓ Code formatted$(NC)"

format-frontend:
	@echo "$(BLUE)Formatting frontend code...$(NC)"
	npm run format:frontend
	@echo "$(GREEN)✓ Frontend code formatted$(NC)"

format-backend:
	@echo "$(BLUE)Formatting backend code...$(NC)"
	npm run format:backend
	@echo "$(GREEN)✓ Backend code formatted$(NC)"

format-check:
	@echo "$(BLUE)Checking code formatting...$(NC)"
	npm run format:check
	@echo "$(GREEN)✓ Format check complete$(NC)"

# ============================================================================
# Lint
# ============================================================================

## lint: Lint all code with ESLint
lint:
	@echo "$(BLUE)Linting code...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Lint complete$(NC)"

lint-frontend:
	@echo "$(BLUE)Linting frontend code...$(NC)"
	npm run lint:frontend
	@echo "$(GREEN)✓ Frontend lint complete$(NC)"

lint-backend:
	@echo "$(BLUE)Linting backend code...$(NC)"
	npm run lint:backend
	@echo "$(GREEN)✓ Backend lint complete$(NC)"

lint-fix:
	@echo "$(BLUE)Fixing lint issues...$(NC)"
	npm run lint:fix
	@echo "$(GREEN)✓ Lint issues fixed$(NC)"

# ============================================================================
# Test
# ============================================================================

## test: Run all tests
test:
	@echo "$(BLUE)Running tests...$(NC)"
	npm test
	@echo "$(GREEN)✓ Tests complete$(NC)"

test-frontend:
	@echo "$(BLUE)Running frontend tests...$(NC)"
	npm run test:frontend
	@echo "$(GREEN)✓ Frontend tests complete$(NC)"

test-backend:
	@echo "$(BLUE)Running backend tests...$(NC)"
	npm run test:backend
	@echo "$(GREEN)✓ Backend tests complete$(NC)"

test-watch:
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	npm run test:watch

test-coverage:
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	npm run test:coverage
	@echo "$(GREEN)✓ Coverage report generated$(NC)"

# ============================================================================
# Run
# ============================================================================

## run: Run production build
run: build
	@echo "$(BLUE)Starting production servers...$(NC)"
	npm start

run-frontend:
	@echo "$(BLUE)Starting frontend production server...$(NC)"
	npm run start:client

run-backend:
	@echo "$(BLUE)Starting backend production server...$(NC)"
	npm run start:server

# ============================================================================
# Docker
# ============================================================================

## docker-build: Build Docker image
docker-build:
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t pictionary:latest .
	@echo "$(GREEN)✓ Docker image built$(NC)"

docker-up:
	@echo "$(BLUE)Starting Docker Compose...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Docker Compose started$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:3001$(NC)"

docker-down:
	@echo "$(BLUE)Stopping Docker Compose...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Docker Compose stopped$(NC)"

docker-logs:
	@echo "$(BLUE)Viewing Docker logs...$(NC)"
	docker-compose logs -f

docker-clean:
	@echo "$(BLUE)Cleaning Docker resources...$(NC)"
	docker-compose down -v
	docker system prune -f
	@echo "$(GREEN)✓ Docker resources cleaned$(NC)"

# ============================================================================
# Clean
# ============================================================================

## clean: Clean build artifacts
clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf .next dist coverage
	@echo "$(GREEN)✓ Build artifacts cleaned$(NC)"

clean-all: clean
	@echo "$(BLUE)Cleaning all dependencies...$(NC)"
	rm -rf node_modules package-lock.json
	@echo "$(GREEN)✓ All dependencies cleaned$(NC)"

# ============================================================================
# Utility
# ============================================================================

## check: Run format check, lint, and tests
check: format-check lint test
	@echo "$(GREEN)✓ All checks passed$(NC)"

## setup: Initial project setup
setup:
	@echo "$(BLUE)Setting up project...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✓ .env file created$(NC)"; \
	else \
		echo "$(YELLOW)⚠ .env file already exists$(NC)"; \
	fi
	@make install
	@echo "$(GREEN)✓ Project setup complete$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Review .env file"
	@echo "  2. Run 'make dev' to start development"
	@echo "  3. Open http://localhost:3000"

# ============================================================================
# CI/CD
# ============================================================================

## ci: Run CI pipeline (format check, lint, test, build)
ci: format-check lint test build
	@echo "$(GREEN)✓ CI pipeline complete$(NC)"

## pre-commit: Run before committing (format, lint-fix, test)
pre-commit: format lint-fix test
	@echo "$(GREEN)✓ Pre-commit checks complete$(NC)"
