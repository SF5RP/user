#!/bin/bash

# Deployment Readiness Check Script
# Checks if all required files and configurations are in place
# Usage: bash check-deployment-readiness.sh

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✅${NC} $1"
}

check_fail() {
    echo -e "${RED}❌${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠️ ${NC} $1"
    ((WARNINGS++))
}

section() {
    echo
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
}

section "🔍 Deployment Readiness Check"

# ============================================
# 1. Check GitHub Actions Workflow
# ============================================
section "📋 GitHub Actions Workflow"

if [ -f ".github/workflows/deploy.yml" ]; then
    check_pass "GitHub Actions workflow file exists"
    
    # Check for required secrets in comments
    if grep -q "SSH_PRIVATE_KEY" ".github/workflows/deploy.yml"; then
        check_pass "Workflow references SSH_PRIVATE_KEY"
    else
        check_fail "Workflow does not reference SSH_PRIVATE_KEY"
    fi
    
    if grep -q "SERVER_HOST" ".github/workflows/deploy.yml"; then
        check_pass "Workflow references SERVER_HOST"
    else
        check_fail "Workflow does not reference SERVER_HOST"
    fi
else
    check_fail "GitHub Actions workflow file missing (.github/workflows/deploy.yml)"
fi

# ============================================
# 2. Check Backend Files
# ============================================
section "🔧 Backend Configuration"

if [ -f "backend/env.example" ]; then
    check_pass "backend/env.example exists"
else
    check_fail "backend/env.example missing"
fi

if [ -f "deploy/systemd/user-service-backend.service.example" ]; then
    check_pass "Backend systemd service example exists"
else
    check_fail "Backend systemd service example missing (deploy/systemd/user-service-backend.service.example)"
fi

if [ -f "deploy/systemd/user-service-frontend.service.example" ]; then
    check_pass "Frontend systemd service example exists"
else
    check_fail "Frontend systemd service example missing (deploy/systemd/user-service-frontend.service.example)"
fi

if [ -f "deploy/nginx/user-service.conf" ]; then
    check_pass "Nginx configuration exists"
    
    # Check if domain is configured
    if grep -q "yourdomain.com" "deploy/nginx/user-service.conf"; then
        check_warn "Nginx config still has placeholder domain (yourdomain.com)"
    else
        check_pass "Nginx domain configured"
    fi
else
    check_fail "Nginx configuration missing (deploy/nginx/user-service.conf)"
fi

# ============================================
# 3. Check Frontend Files
# ============================================
section "💻 Frontend Configuration"

if [ -d "frontend" ]; then
    check_pass "Frontend directory exists"
    
    if [ -f "frontend/package.json" ]; then
        check_pass "Frontend package.json exists"
    else
        check_fail "Frontend package.json missing"
    fi
    
    if [ -f "frontend/scripts/prepare-deploy.js" ]; then
        check_pass "Frontend deploy preparation script exists"
    else
        check_fail "Frontend deploy preparation script missing (frontend/scripts/prepare-deploy.js)"
    fi
    
else
    check_fail "Frontend directory missing"
fi

# ============================================
# 4. Check Go Backend
# ============================================
section "🔨 Go Backend"

if [ -f "backend/main.go" ]; then
    check_pass "backend/main.go exists"
else
    check_fail "backend/main.go missing"
fi

if [ -f "backend/go.mod" ]; then
    check_pass "backend/go.mod exists"
else
    check_fail "backend/go.mod missing"
fi

if [ -d "backend/internal" ]; then
    check_pass "backend/internal directory exists"
else
    check_fail "backend/internal directory missing"
fi

# ============================================
# 5. Check Documentation
# ============================================
section "📚 Documentation"

if [ -f "README.md" ]; then
    check_pass "README.md exists"
else
    check_warn "README.md missing"
fi

if [ -f "docs/DEPLOYMENT.md" ]; then
    check_pass "docs/DEPLOYMENT.md exists"
else
    check_warn "docs/DEPLOYMENT.md missing"
fi

# ============================================
# 6. Check Git Configuration
# ============================================
section "🔀 Git Configuration"

if [ -d ".git" ]; then
    check_pass "Git repository initialized"
    
    # Check if on main/master branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" == "main" ] || [ "$current_branch" == "master" ]; then
        check_pass "On deployment branch: $current_branch"
    else
        check_warn "Not on main/master branch (current: $current_branch)"
    fi
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        check_warn "Uncommitted changes present"
    else
        check_pass "No uncommitted changes"
    fi
else
    check_fail "Not a git repository"
fi

# ============================================
# 7. Check Environment Variables
# ============================================
section "🔐 Environment Variables Check"

if [ -f "backend/env.example" ]; then
    required_vars=(
        "DISCORD_CLIENT_ID"
        "DISCORD_CLIENT_SECRET"
        "DISCORD_REDIRECT_URI"
        "JWT_SECRET"
        "DB_HOST"
        "DB_NAME"
        "DB_USER"
        "DB_PASSWORD"
        "SERVER_PORT"
        "FRONTEND_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" "backend/env.example"; then
            check_pass "$var defined in backend/env.example"
        else
            check_fail "$var missing in backend/env.example"
        fi
    done
fi

# ============================================
# Summary
# ============================================
section "📊 Summary"

echo
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Perfect! Everything is ready for deployment!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Ready with warnings: $WARNINGS warning(s)${NC}"
    echo -e "${YELLOW}You can proceed with deployment, but consider fixing warnings.${NC}"
    exit 0
else
    echo -e "${RED}❌ Not ready for deployment!${NC}"
    echo -e "${RED}Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo
    echo "Please fix the errors above before deploying."
    exit 1
fi
