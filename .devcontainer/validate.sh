#!/bin/bash
# Codespace validation script
# This script validates that all Codespace components are properly configured

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Validation functions
validate_files() {
    print_header "Validating Codespace Configuration Files"
    
    local files=(
        ".devcontainer/devcontainer.json"
        ".devcontainer/docker-compose.yml"
        ".devcontainer/Dockerfile"
        ".devcontainer/setup.sh"
        ".devcontainer/init-db.sql"
        ".devcontainer/README.md"
        ".github/codespaces.yml"
        ".github/workflows/codespace-prebuild.yml"
    )
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "$file exists"
        else
            print_error "$file is missing"
        fi
    done
}

validate_package_json() {
    print_header "Validating Package.json Scripts"
    
    local scripts=(
        "dev"
        "dev:ui" 
        "dev:api"
        "dev:services"
        "test:working"
        "test:e2e"
        "codespace:setup"
    )
    
    for script in "${scripts[@]}"; do
        if npm run | grep -q "$script"; then
            print_success "Script '$script' exists"
        else
            print_warning "Script '$script' not found"
        fi
    done
}

validate_docker_compose() {
    print_header "Validating Docker Compose Configuration"
    
    if docker-compose -f .devcontainer/docker-compose.yml config > /dev/null 2>&1; then
        print_success "docker-compose.yml is valid"
    else
        print_error "docker-compose.yml has syntax errors"
    fi
    
    # Check required services
    local services=("app" "db" "redis" "prometheus")
    for service in "${services[@]}"; do
        if docker-compose -f .devcontainer/docker-compose.yml config | grep -q "$service:"; then
            print_success "Service '$service' configured"
        else
            print_error "Service '$service' not found"
        fi
    done
}

validate_devcontainer_json() {
    print_header "Validating DevContainer Configuration"
    
    if command -v jq > /dev/null; then
        if jq . .devcontainer/devcontainer.json > /dev/null 2>&1; then
            print_success "devcontainer.json is valid JSON"
        else
            print_error "devcontainer.json has syntax errors"
        fi
        
        # Check required fields
        if jq -e '.name' .devcontainer/devcontainer.json > /dev/null; then
            print_success "Container name configured"
        else
            print_warning "Container name not set"
        fi
        
        if jq -e '.forwardPorts' .devcontainer/devcontainer.json > /dev/null; then
            print_success "Port forwarding configured"
        else
            print_warning "Port forwarding not configured"
        fi
    else
        print_warning "jq not installed, skipping JSON validation"
    fi
}

validate_test_setup() {
    print_header "Validating Test Configuration"
    
    local test_files=(
        "tests/utils/testHelpers.tsx"
        "tests/patterns/dynamicUIStates.test.tsx"
        "jest.config.js"
        "playwright.config.ts"
        "cypress.config.ts"
    )
    
    for file in "${test_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "Test file '$file' exists"
        else
            print_warning "Test file '$file' not found"
        fi
    done
}

validate_documentation() {
    print_header "Validating Documentation"
    
    local docs=(
        "README.md"
        ".devcontainer/README.md"
        "TESTING_GUIDE.md"
        "docs/development.md"
    )
    
    for doc in "${docs[@]}"; do
        if [[ -f "$doc" ]]; then
            print_success "Documentation '$doc' exists"
        else
            print_warning "Documentation '$doc' not found"
        fi
    done
}

main() {
    echo -e "${BLUE}"
    cat << 'EOF'
    ╔═══════════════════════════════════════════════════════════════╗
    ║                   Codespace Validation                       ║
    ║                 Modular SaaS Platform                        ║
    ╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    validate_files
    validate_package_json
    validate_docker_compose
    validate_devcontainer_json
    validate_test_setup
    validate_documentation
    
    print_header "Validation Summary"
    
    echo -e "\n${GREEN}Codespace configuration validation complete!${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo "1. Commit and push these changes to your repository"
    echo "2. Go to GitHub.com → Your Repository → Code → Codespaces"
    echo "3. Click 'Create codespace on main'"
    echo "4. Wait for automatic setup to complete (2-3 minutes)"
    echo "5. Start developing with all tools pre-configured!"
    
    echo -e "\n${YELLOW}Pro tip:${NC} Use a 'Large' or 'XL' machine type for the best performance with the testing suite."
}

# Run validation
main "$@"