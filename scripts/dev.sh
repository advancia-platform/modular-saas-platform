#!/bin/bash
#
# Quick launcher - detects best method and starts dev environment
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Advancia Pay Ledger - Quick Start"
echo ""
echo "Choose your development setup:"
echo ""
echo "  1) tmux split panes (RECOMMENDED - like your screenshot)"
echo "  2) Separate terminal windows (graphical)"
echo "  3) Background mode with logs"
echo "  4) Manual (show commands)"
echo ""
read -p "Enter choice (1-4) [default: 1]: " choice
choice=${choice:-1}

case $choice in
    1)
        echo "✅ Starting tmux setup..."
        exec "$SCRIPT_DIR/start-dev-tmux.sh"
        ;;
    2)
        echo "✅ Starting split terminal setup..."
        exec "$SCRIPT_DIR/start-dev-split.sh"
        ;;
    3)
        echo "✅ Starting background mode..."
        exec "$SCRIPT_DIR/start-dev.sh"
        ;;
    4)
        echo ""
        echo "Manual Setup:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Terminal 1 - Backend:"
        echo "  cd $(dirname "$SCRIPT_DIR")/backend"
        echo "  npm run dev"
        echo ""
        echo "Terminal 2 - Frontend:"
        echo "  cd $(dirname "$SCRIPT_DIR")/frontend"
        echo "  npm run dev:3001"
        echo ""
        echo "Then access:"
        echo "  Backend:  http://localhost:4000"
        echo "  Frontend: http://localhost:3001"
        echo ""
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac
