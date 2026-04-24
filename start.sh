#!/bin/bash

# ============================================
# AI Predictive Maintenance Platform - Startup
# ============================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   AI Predictive Maintenance Platform             ║"
echo "║   Starting up...                                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ----------------------------
# Step 1: Kill processes on used ports
# ----------------------------
echo -e "${YELLOW}[1/6] Cleaning up used ports (3000, 3001)...${NC}"

kill_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${RED}Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  ${GREEN}Port $port is free${NC}"
  fi
}

kill_port 3000
kill_port 3001

# ----------------------------
# Step 2: Check .env file
# ----------------------------
echo -e "${YELLOW}[2/6] Checking environment configuration...${NC}"
if [ ! -f .env ]; then
  echo -e "${RED}ERROR: .env file not found!${NC}"
  echo "Please create a .env file in the project root. See README for required variables."
  exit 1
fi
echo -e "  ${GREEN}.env file found${NC}"

# Load env vars
set -a
source .env
set +a

# ----------------------------
# Step 3: Check PostgreSQL
# ----------------------------
echo -e "${YELLOW}[3/6] Checking PostgreSQL connection...${NC}"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
  echo -e "${RED}ERROR: psql not found. Please install PostgreSQL.${NC}"
  exit 1
fi

# Try to connect to PostgreSQL
if ! pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -q 2>/dev/null; then
  echo -e "${YELLOW}  PostgreSQL is not running. Attempting to start...${NC}"
  if command -v brew &> /dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  fi
  sleep 2
  if ! pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -q 2>/dev/null; then
    echo -e "${RED}ERROR: Cannot connect to PostgreSQL. Please start it manually.${NC}"
    exit 1
  fi
fi
echo -e "  ${GREEN}PostgreSQL is running${NC}"

# ----------------------------
# Step 4: Initialize Database
# ----------------------------
echo -e "${YELLOW}[4/6] Initializing database...${NC}"

DB_NAME="${DB_NAME:-predictive_maintenance}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Create database if it doesn't exist
if ! PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "  ${YELLOW}Creating database '$DB_NAME'...${NC}"
  PGPASSWORD="${DB_PASSWORD:-postgres}" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || true
fi

# Run schema
echo -e "  ${BLUE}Running schema migration...${NC}"
PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_DIR/backend/src/db/schema.sql" -q 2>/dev/null || {
  echo -e "  ${YELLOW}Schema may already exist, continuing...${NC}"
}

# Seed data
echo -e "  ${BLUE}Seeding data...${NC}"
PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_DIR/backend/src/db/seed.sql" -q 2>/dev/null || {
  echo -e "  ${YELLOW}Seed data may already exist, continuing...${NC}"
}

echo -e "  ${GREEN}Database initialized${NC}"

# ----------------------------
# Step 5: Install dependencies
# ----------------------------
echo -e "${YELLOW}[5/6] Installing dependencies...${NC}"

echo -e "  ${BLUE}Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm install --silent 2>/dev/null

echo -e "  ${BLUE}Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --silent 2>/dev/null

cd "$PROJECT_DIR"
echo -e "  ${GREEN}Dependencies installed${NC}"

# ----------------------------
# Step 6: Start services with hot reload
# ----------------------------
echo -e "${YELLOW}[6/6] Starting services with hot reload...${NC}"

# Start backend with nodemon (auto-reload on file changes)
echo -e "  ${BLUE}Starting backend on port 3001 (nodemon - auto-reload)...${NC}"
cd "$PROJECT_DIR/backend"
npx nodemon src/server.js &
BACKEND_PID=$!
cd "$PROJECT_DIR"

# Wait for backend to be ready
echo -e "  ${YELLOW}Waiting for backend to start...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}Backend is ready!${NC}"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo -e "  ${RED}Backend failed to start. Check logs above.${NC}"
    exit 1
  fi
done

# Start frontend (React dev server - auto-reload on file changes)
echo -e "  ${BLUE}Starting frontend on port 3000 (auto-reload)...${NC}"
cd "$PROJECT_DIR/frontend"
BROWSER=none PORT=3000 npm start &
FRONTEND_PID=$!
cd "$PROJECT_DIR"

# Wait for frontend
echo -e "  ${YELLOW}Waiting for frontend to start...${NC}"
for i in {1..60}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}Frontend is ready!${NC}"
    break
  fi
  sleep 1
  if [ $i -eq 60 ]; then
    echo -e "  ${YELLOW}Frontend is still starting... Check http://localhost:3000 shortly.${NC}"
  fi
done

# ----------------------------
# Success!
# ----------------------------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗"
echo -e "║   Platform is running!                           ║"
echo -e "╠══════════════════════════════════════════════════╣"
echo -e "║   Frontend:  http://localhost:3000               ║"
echo -e "║   Backend:   http://localhost:3001               ║"
echo -e "║   API Health: http://localhost:3001/api/health   ║"
echo -e "╠══════════════════════════════════════════════════╣"
echo -e "║   Demo Login:                                    ║"
echo -e "║   Email:    admin@factory.com                    ║"
echo -e "║   Password: password123                          ║"
echo -e "╠══════════════════════════════════════════════════╣"
echo -e "║   Hot Reload: Both servers auto-reload on        ║"
echo -e "║   file changes (nodemon + react-scripts)         ║"
echo -e "╠══════════════════════════════════════════════════╣"
echo -e "║   Press Ctrl+C to stop all services              ║"
echo -e "╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Graceful shutdown
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down services...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  kill_port 3000
  kill_port 3001
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
