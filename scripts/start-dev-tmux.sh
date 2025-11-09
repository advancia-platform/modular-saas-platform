#!/bin/bash
#
# Advancia Pay Ledger - tmux Split Pane Setup
# Creates a tmux session with backend (left) and frontend (right) side-by-side
# This matches the layout shown in your screenshot
#

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🚀 Advancia Pay Ledger - tmux Development Setup${NC}"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}❌ tmux is not installed${NC}"
    echo -e "${YELLOW}   Install it with: sudo apt install tmux${NC}"
    exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_NAME="advancia-dev"

# Kill existing session if it exists
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Killing existing session '$SESSION_NAME'${NC}"
    tmux kill-session -t $SESSION_NAME
fi

echo -e "${GREEN}✅ Creating new tmux session: $SESSION_NAME${NC}"

# Create new tmux session with backend
tmux new-session -d -s $SESSION_NAME -n "Advancia Dev" -c "$PROJECT_ROOT/backend"

# Set pane title for backend
tmux send-keys -t $SESSION_NAME:0.0 "clear" C-m
tmux send-keys -t $SESSION_NAME:0.0 "echo '🔧 BACKEND SERVER (Port 4000)'" C-m
tmux send-keys -t $SESSION_NAME:0.0 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION_NAME:0.0 "echo ''" C-m

# Split window vertically (creates right pane)
tmux split-window -h -t $SESSION_NAME:0 -c "$PROJECT_ROOT/frontend"

# Set pane title for frontend
tmux send-keys -t $SESSION_NAME:0.1 "clear" C-m
tmux send-keys -t $SESSION_NAME:0.1 "echo '🎨 FRONTEND DEV SERVER (Port 3001)'" C-m
tmux send-keys -t $SESSION_NAME:0.1 "echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'" C-m
tmux send-keys -t $SESSION_NAME:0.1 "echo ''" C-m

# Balance the panes (50/50 split)
tmux select-layout -t $SESSION_NAME:0 even-horizontal

# Start backend server in left pane
tmux send-keys -t $SESSION_NAME:0.0 "npm run dev" C-m

# Wait a moment for backend to start
sleep 2

# Start frontend server in right pane
tmux send-keys -t $SESSION_NAME:0.1 "npm run dev:3001" C-m

# Focus on left pane (backend)
tmux select-pane -t $SESSION_NAME:0.0

# Attach to the session
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Starting tmux session with split panes${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "  ${CYAN}Layout:${NC}           Backend (left) | Frontend (right)"
echo -e "  ${CYAN}Backend API:${NC}      http://localhost:4000"
echo -e "  ${CYAN}Frontend Dev:${NC}     http://localhost:3001"
echo -e "  ${CYAN}Admin Login:${NC}      http://localhost:3001/admin/login"
echo -e ""
echo -e "${YELLOW}tmux commands:${NC}"
echo -e "  ${CYAN}Ctrl+B then →/←${NC}   Switch between panes"
echo -e "  ${CYAN}Ctrl+B then D${NC}     Detach from session (servers keep running)"
echo -e "  ${CYAN}tmux attach -t $SESSION_NAME${NC}  Re-attach to session"
echo -e "  ${CYAN}Ctrl+B then &${NC}     Kill entire session"
echo -e ""
echo -e "${GREEN}Attaching to session...${NC}"
echo -e ""

sleep 1
tmux attach-session -t $SESSION_NAME
