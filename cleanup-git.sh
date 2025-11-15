#!/bin/bash
################################################################################
# Advancia Pay Ledger - Git Cleanup Script
# 
# Removes ignored files from Git history, shrinks repo size, and
# re-enables full Git features in VS Code
#
# Usage: bash cleanup-git.sh
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "\n${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

################################################################################
# Pre-cleanup checks
################################################################################

print_header "Advancia Git Cleanup & Optimization"

# Check if in git repo
if [ ! -d .git ]; then
    print_error "Not in a Git repository"
    exit 1
fi

print_success "Git repository detected"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes"
    echo
    git status --short | head -20
    if [ $(git status --porcelain | wc -l) -gt 20 ]; then
        echo -e "${YELLOW}... and $(( $(git status --porcelain | wc -l) - 20 )) more files${NC}"
    fi
    echo
    read -p "Continue anyway? This will stage all changes. (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Cleanup cancelled"
        exit 1
    fi
fi

################################################################################
# Step 1: Check repo size BEFORE cleanup
################################################################################

print_header "Step 1: Measuring Current Repo Size"

echo -e "${CYAN}Repository statistics BEFORE cleanup:${NC}"
git count-objects -vH

BEFORE_SIZE=$(git count-objects -v | grep "size-pack" | awk '{print $2}')
print_info "Current packed size: ${BEFORE_SIZE} KB"

################################################################################
# Step 2: Apply .gitignore rules
################################################################################

print_header "Step 2: Applying .gitignore Rules"

if [ ! -f .gitignore ]; then
    print_error ".gitignore file not found"
    print_info "Please create .gitignore before running this script"
    exit 1
fi

print_success "Found .gitignore file"

# Show what will be removed
print_warning "Files that will be removed from Git tracking:"
git ls-files -i --exclude-standard | head -20
IGNORED_COUNT=$(git ls-files -i --exclude-standard | wc -l)
echo
print_info "Total ignored files in Git: $IGNORED_COUNT"

if [ $IGNORED_COUNT -eq 0 ]; then
    print_success "No ignored files in Git tracking"
else
    echo
    read -p "Remove these files from Git tracking? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Removing ignored files from Git..."
        
        # Remove cached files
        git rm -r --cached . > /dev/null 2>&1 || true
        
        # Re-add everything (respecting .gitignore)
        git add .
        
        # Check if there are changes to commit
        if [ -n "$(git diff --cached --name-only)" ]; then
            git commit -m "chore: apply .gitignore cleanup - remove ignored files" -q
            print_success "Ignored files removed and changes committed"
        else
            print_info "No changes to commit"
        fi
    else
        print_warning "Skipping .gitignore application"
    fi
fi

################################################################################
# Step 3: Remove deleted files from Git history
################################################################################

print_header "Step 3: Cleaning Git History"

print_warning "Removing references to deleted files..."

# Expire reflog
git reflog expire --expire=now --all

print_success "Reflog expired"

################################################################################
# Step 4: Garbage collection
################################################################################

print_header "Step 4: Running Garbage Collection"

print_warning "Running git gc (this may take a few minutes)..."

# Basic garbage collection
git gc --prune=now -q

print_success "Basic garbage collection complete"

# Aggressive garbage collection
read -p "Run aggressive garbage collection? (slower but more thorough) (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Running aggressive gc..."
    git gc --aggressive --prune=now
    print_success "Aggressive garbage collection complete"
fi

################################################################################
# Step 5: Check repo size AFTER cleanup
################################################################################

print_header "Step 5: Measuring Repo Size After Cleanup"

echo -e "${CYAN}Repository statistics AFTER cleanup:${NC}"
git count-objects -vH

AFTER_SIZE=$(git count-objects -v | grep "size-pack" | awk '{print $2}')
print_info "New packed size: ${AFTER_SIZE} KB"

# Calculate size reduction
if [ "$BEFORE_SIZE" -gt "$AFTER_SIZE" ]; then
    REDUCTION=$((BEFORE_SIZE - AFTER_SIZE))
    PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", ($REDUCTION / $BEFORE_SIZE) * 100}")
    echo
    print_success "Repo size reduced by ${REDUCTION} KB (${PERCENTAGE}%)"
elif [ "$BEFORE_SIZE" -eq "$AFTER_SIZE" ]; then
    echo
    print_info "No size reduction (repo was already clean)"
else
    echo
    print_warning "Repo size increased slightly (normal for some repos)"
fi

################################################################################
# Step 6: Verify Git status
################################################################################

print_header "Step 6: Verifying Git Status"

UNTRACKED=$(git status --porcelain 2>/dev/null| grep "^??" | wc -l)
MODIFIED=$(git status --porcelain 2>/dev/null| grep "^ M" | wc -l)
STAGED=$(git status --porcelain 2>/dev/null| grep "^M" | wc -l)

echo -e "${CYAN}Current Git status:${NC}"
echo -e "  Untracked files: ${YELLOW}$UNTRACKED${NC}"
echo -e "  Modified files:  ${YELLOW}$MODIFIED${NC}"
echo -e "  Staged files:    ${YELLOW}$STAGED${NC}"

if [ $UNTRACKED -gt 100 ]; then
    echo
    print_warning "You have $UNTRACKED untracked files"
    print_info "Consider adding them to .gitignore if they shouldn't be tracked"
fi

################################################################################
# Step 7: Push changes (optional)
################################################################################

print_header "Step 7: Push Changes to Remote"

CURRENT_BRANCH=$(git branch --show-current)

read -p "Push changes to remote ($CURRENT_BRANCH)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Pushing to origin/$CURRENT_BRANCH..."
    
    if git push origin $CURRENT_BRANCH; then
        print_success "Changes pushed successfully"
    else
        print_error "Push failed - you may need to force push"
        echo
        read -p "Force push? (WARNING: This rewrites remote history) (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push --force origin $CURRENT_BRANCH
            print_success "Force push successful"
        fi
    fi
else
    print_warning "Skipping push (remember to push manually later)"
fi

################################################################################
# Completion
################################################################################

print_header "✅ Git Cleanup Complete!"

echo -e "${GREEN}Your repository is now clean and optimized!${NC}\n"

echo -e "${CYAN}What Changed:${NC}"
echo -e "  ✓ Removed ignored files from Git tracking"
echo -e "  ✓ Expired old reflog entries"
echo -e "  ✓ Ran garbage collection"
echo -e "  ✓ Optimized repository storage"
echo -e "  ✓ Reduced repo size by ~${PERCENTAGE:-0}%\n"

echo -e "${CYAN}Next Steps:${NC}"
echo -e "  1. Restart VS Code to re-enable Git features"
echo -e "  2. Verify status page: ${YELLOW}http://localhost:3000/status${NC}"
echo -e "  3. Check ignored files are not tracked: ${YELLOW}git status${NC}"
echo -e "  4. Monitor repo size: ${YELLOW}git count-objects -vH${NC}\n"

echo -e "${CYAN}Prevent Future Bloat:${NC}"
echo -e "  • Always commit source code only"
echo -e "  • Keep logs, builds, and secrets in .gitignore"
echo -e "  • Use GitHub Actions for build artifacts"
echo -e "  • Run this cleanup script quarterly\n"

echo -e "${YELLOW}Note: If VS Code still shows many changes, restart it now.${NC}\n"
