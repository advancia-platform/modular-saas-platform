#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Advancia Pay Ledger (Resilient Mode)${NC}"

# Function to check if service is healthy
check_health() {
  local service=$1
  local url=$2
  local max_attempts=30
  local attempt=1

  echo -e "${YELLOW}⏳ Waiting for $service to be ready...${NC}"
  
  while [ $attempt -le $max_attempts ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      echo -e "${GREEN}✅ $service is healthy${NC}"
      return 0
    fi
    
    echo -e "   Attempt $attempt/$max_attempts..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo -e "${RED}❌ $service health check failed${NC}"
  return 1
}

# Ensure logs directory exists
mkdir -p logs

# Start backend with auto-restart
echo -e "${GREEN}📦 Starting Backend API...${NC}"
cd backend

# Kill any existing process on port 4000
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

# Start with automatic restart on failure
while true; do
  npm start 2>&1 | tee ../logs/backend-$(date +%Y%m%d-%H%M%S).log &
  BACKEND_PID=$!
  
  echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
  
  # Wait for health check
  sleep 5
  check_health "Backend" "http://localhost:4000/api/health" || {
    echo -e "${YELLOW}⚠️  Backend not responding, restarting...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    sleep 3
    continue
  }
  
  # Monitor the process
  wait $BACKEND_PID
  EXIT_CODE=$?
  
  echo -e "${RED}Backend exited with code $EXIT_CODE${NC}"
  echo -e "${YELLOW}🔄 Restarting in 5 seconds...${NC}"
  sleep 5
done &

cd ..

# Start frontend with auto-restart
echo -e "${GREEN}🎨 Starting Frontend...${NC}"
cd frontend

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

while true; do
  npm start 2>&1 | tee ../logs/frontend-$(date +%Y%m%d-%H%M%S).log &
  FRONTEND_PID=$!
  
  echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"
  
  # Wait for startup
  sleep 5
  check_health "Frontend" "http://localhost:3000" || {
    echo -e "${YELLOW}⚠️  Frontend not responding, restarting...${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
    sleep 3
    continue
  }
  
  # Monitor the process
  wait $FRONTEND_PID
  EXIT_CODE=$?
  
  echo -e "${RED}Frontend exited with code $EXIT_CODE${NC}"
  echo -e "${YELLOW}🔄 Restarting in 5 seconds...${NC}"
  sleep 5
done &

# Keep script running
echo -e "${GREEN}✨ All services running with auto-restart enabled${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Handle shutdown gracefully
trap 'echo -e "${YELLOW}Shutting down...${NC}"; kill $(jobs -p); exit 0' SIGINT SIGTERM

wait
