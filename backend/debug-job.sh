#!/bin/bash
# Quick Debugging Job Launcher
# Usage: ./debug-job.sh [test-name]

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")"

echo -e "${BLUE}🐛 Advancia Pay Ledger - Debug Job Launcher${NC}"
echo ""

# Check if specific test requested
TEST_FILE="${1:-all}"

case "$TEST_FILE" in
    "all")
        echo -e "${YELLOW}Running all tests with debugger...${NC}"
        node --inspect-brk=9229 node_modules/jest/bin/jest.js --runInBand --verbose
        ;;
    "integration")
        echo -e "${YELLOW}Running integration tests with debugger...${NC}"
        node --inspect-brk=9229 node_modules/jest/bin/jest.js integration.test.ts --runInBand --verbose
        ;;
    "auth")
        echo -e "${YELLOW}Running auth tests with debugger...${NC}"
        node --inspect-brk=9229 node_modules/jest/bin/jest.js auth.test.ts --runInBand --verbose
        ;;
    "health")
        echo -e "${YELLOW}Running health tests with debugger...${NC}"
        node --inspect-brk=9229 node_modules/jest/bin/jest.js health.test.ts --runInBand --verbose
        ;;
    "smoke")
        echo -e "${YELLOW}Running smoke tests with debugger...${NC}"
        node --inspect-brk=9229 node_modules/jest/bin/jest.js smoke.test.ts --runInBand --verbose
        ;;
    "coverage")
        echo -e "${YELLOW}Running tests with coverage...${NC}"
        npm run test:cov
        echo -e "${GREEN}✅ Coverage report: coverage/index.html${NC}"
        ;;
    "watch")
        echo -e "${YELLOW}Starting watch mode...${NC}"
        npm run test:watch
        ;;
    *)
        echo -e "${YELLOW}Running custom test: $TEST_FILE${NC}"
        node --inspect-brk=9229 node_modules/jest/bin/jest.js "$TEST_FILE" --runInBand --verbose
        ;;
esac

echo ""
echo -e "${GREEN}✅ Debug job complete!${NC}"
echo ""
echo "💡 Tips:"
echo "  - Debugger listening on ws://127.0.0.1:9229"
echo "  - Attach VS Code debugger or use Chrome DevTools"
echo "  - Press F5 in VS Code to start debugging"
