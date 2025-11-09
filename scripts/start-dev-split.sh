#!/bin/bash
#
# Advancia Pay Ledger - Split Terminal Development Setup
# Opens backend and frontend in split terminal windows
#

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🚀 Advancia Pay Ledger - Split Terminal Setup${NC}"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if we're in a graphical environment
if [ -z "$DISPLAY" ] && [ -z "$WAYLAND_DISPLAY" ]; then
    echo -e "${YELLOW}⚠️  No graphical display detected${NC}"
    echo -e "${YELLOW}   Use './scripts/start-dev.sh' for background mode${NC}"
    echo -e "${YELLOW}   Or run in tmux/screen session${NC}"
    exit 1
fi

# Function to detect available terminal emulator
detect_terminal() {
    if command -v gnome-terminal &> /dev/null; then
        echo "gnome-terminal"
    elif command -v konsole &> /dev/null; then
        echo "konsole"
    elif command -v xfce4-terminal &> /dev/null; then
        echo "xfce4-terminal"
    elif command -v mate-terminal &> /dev/null; then
        echo "mate-terminal"
    elif command -v xterm &> /dev/null; then
        echo "xterm"
    else
        echo "none"
    fi
}

TERMINAL=$(detect_terminal)

if [ "$TERMINAL" == "none" ]; then
    echo -e "${RED}❌ No terminal emulator found${NC}"
    echo -e "${YELLOW}   Install gnome-terminal, konsole, or xfce4-terminal${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using terminal: $TERMINAL${NC}"

# Launch terminals based on detected emulator
case $TERMINAL in
    gnome-terminal)
        gnome-terminal --tab --title="Backend (Port 4000)" --working-directory="$PROJECT_ROOT/backend" -- bash -c "echo '🔧 Starting Backend...'; npm run dev; exec bash" &
        sleep 1
        gnome-terminal --tab --title="Frontend (Port 3001)" --working-directory="$PROJECT_ROOT/frontend" -- bash -c "echo '🎨 Starting Frontend...'; npm run dev:3001; exec bash" &
        ;;
    
    konsole)
        konsole --new-tab -e bash -c "cd '$PROJECT_ROOT/backend' && echo '🔧 Starting Backend...' && npm run dev; exec bash" &
        sleep 1
        konsole --new-tab -e bash -c "cd '$PROJECT_ROOT/frontend' && echo '🎨 Starting Frontend...' && npm run dev:3001; exec bash" &
        ;;
    
    xfce4-terminal)
        xfce4-terminal --tab --title="Backend" --working-directory="$PROJECT_ROOT/backend" -e "bash -c 'echo 🔧 Starting Backend...; npm run dev; exec bash'" &
        sleep 1
        xfce4-terminal --tab --title="Frontend" --working-directory="$PROJECT_ROOT/frontend" -e "bash -c 'echo 🎨 Starting Frontend...; npm run dev:3001; exec bash'" &
        ;;
    
    mate-terminal)
        mate-terminal --tab --title="Backend" --working-directory="$PROJECT_ROOT/backend" -e "bash -c 'echo 🔧 Starting Backend...; npm run dev; exec bash'" &
        sleep 1
        mate-terminal --tab --title="Frontend" --working-directory="$PROJECT_ROOT/frontend" -e "bash -c 'echo 🎨 Starting Frontend...; npm run dev:3001; exec bash'" &
        ;;
    
    xterm)
        xterm -T "Backend (Port 4000)" -e "cd '$PROJECT_ROOT/backend' && echo '🔧 Starting Backend...' && npm run dev; exec bash" &
        sleep 1
        xterm -T "Frontend (Port 3001)" -e "cd '$PROJECT_ROOT/frontend' && echo '🎨 Starting Frontend...' && npm run dev:3001; exec bash" &
        ;;
esac

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Development servers launching in separate windows!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e ""
echo -e "  ${CYAN}Backend API:${NC}      http://localhost:4000"
echo -e "  ${CYAN}Frontend Dev:${NC}     http://localhost:3001"
echo -e "  ${CYAN}Admin Login:${NC}      http://localhost:3001/admin/login"
echo -e ""
echo -e "${YELLOW}Check the separate terminal windows for server output${NC}"
