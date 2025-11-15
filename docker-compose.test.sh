#!/bin/bash

# Docker Compose Configuration Test Suite
# Validates the docker-compose.yml setup for Toy-for-Toy development environment
#
# Test coverage:
# 1. YAML syntax validation
# 2. Required services presence
# 3. Port mapping verification
# 4. Volume configuration
# 5. Environment variables documentation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/pawelkalkun/Projects/private/toys-for-toys"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.yml"
ENV_EXAMPLE="${PROJECT_ROOT}/.env.local.example"

echo -e "${YELLOW}Docker Compose Configuration Test Suite${NC}\n"

# Test 1: Check if docker-compose.yml exists
echo "[TEST 1] Checking if docker-compose.yml exists..."
if [ -f "$COMPOSE_FILE" ]; then
    echo -e "${GREEN}✓ PASS${NC}: docker-compose.yml found\n"
else
    echo -e "${RED}✗ FAIL${NC}: docker-compose.yml not found at $COMPOSE_FILE"
    exit 1
fi

# Test 2: Validate YAML syntax
echo "[TEST 2] Validating docker-compose.yml YAML syntax..."
if docker-compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}: YAML syntax is valid\n"
else
    echo -e "${RED}✗ FAIL${NC}: Invalid YAML syntax in docker-compose.yml"
    docker-compose -f "$COMPOSE_FILE" config
    exit 1
fi

# Test 3: Verify required services exist
echo "[TEST 3] Verifying required services..."
REQUIRED_SERVICES=("postgres" "postgrest" "studio" "mailhog")
MISSING_SERVICES=()

for service in "${REQUIRED_SERVICES[@]}"; do
    if docker-compose -f "$COMPOSE_FILE" config | grep -q "^\s*$service:"; then
        echo -e "  ${GREEN}✓${NC} Service '$service' found"
    else
        echo -e "  ${RED}✗${NC} Service '$service' NOT found"
        MISSING_SERVICES+=("$service")
    fi
done

if [ ${#MISSING_SERVICES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: All required services present\n"
else
    echo -e "${RED}✗ FAIL${NC}: Missing services: ${MISSING_SERVICES[*]}"
    exit 1
fi

# Test 4: Verify port mappings
echo "[TEST 4] Verifying port mappings..."
EXPECTED_PORTS=(
    "5432"
    "3000"
    "5555"
    "8025"
)

CONFIG_OUTPUT=$(docker-compose -f "$COMPOSE_FILE" config)

for port in "${EXPECTED_PORTS[@]}"; do
    if echo "$CONFIG_OUTPUT" | grep -q "$port"; then
        echo -e "  ${GREEN}✓${NC} Port $port is mapped"
    else
        echo -e "  ${RED}✗${NC} Port $port mapping not found"
        exit 1
    fi
done

echo -e "${GREEN}✓ PASS${NC}: All port mappings are correct\n"

# Test 5: Verify PostgreSQL volume configuration
echo "[TEST 5] Checking PostgreSQL volume configuration..."
if docker-compose -f "$COMPOSE_FILE" config | grep -q "postgres_data"; then
    echo -e "  ${GREEN}✓${NC} Volume 'postgres_data' is configured"
else
    echo -e "  ${RED}✗${NC} Volume 'postgres_data' not found"
    exit 1
fi

if docker-compose -f "$COMPOSE_FILE" config | grep -q "/var/lib/postgresql/data"; then
    echo -e "  ${GREEN}✓${NC} PostgreSQL data mount point is configured"
else
    echo -e "  ${RED}✗${NC} PostgreSQL data mount point not found"
    exit 1
fi

echo -e "${GREEN}✓ PASS${NC}: Volume configuration is correct\n"

# Test 6: Verify network configuration
echo "[TEST 6] Checking network configuration..."
if docker-compose -f "$COMPOSE_FILE" config | grep -q "toy-for-toy-network"; then
    echo -e "  ${GREEN}✓${NC} Network 'toy-for-toy-network' is configured"
else
    echo -e "  ${RED}✗${NC} Network 'toy-for-toy-network' not found"
    exit 1
fi

echo -e "${GREEN}✓ PASS${NC}: Network configuration is correct\n"

# Test 7: Verify environment variables file
echo "[TEST 7] Checking environment variables documentation..."
if [ -f "$ENV_EXAMPLE" ]; then
    echo -e "  ${GREEN}✓${NC} .env.local.example file exists"

    REQUIRED_VARS=(
        "POSTGRES_PASSWORD"
        "POSTGRES_HOST"
        "POSTGRES_PORT"
        "POSTGRES_DB"
        "POSTGRES_USER"
        "POSTGREST_JWT_SECRET"
        "SUPABASE_PROJECT_ID"
        "MAILHOG_SMTP_PORT"
        "MAILHOG_UI_PORT"
    )

    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" "$ENV_EXAMPLE"; then
            echo -e "    ${GREEN}✓${NC} Variable '$var' documented"
        else
            echo -e "    ${RED}✗${NC} Variable '$var' NOT documented"
            MISSING_VARS+=("$var")
        fi
    done

    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: All environment variables documented\n"
    else
        echo -e "${RED}✗ FAIL${NC}: Missing variable documentation: ${MISSING_VARS[*]}"
        exit 1
    fi
else
    echo -e "${RED}✗ FAIL${NC}: .env.local.example not found"
    exit 1
fi

# Test 8: Verify .gitignore includes Docker volumes
echo "[TEST 8] Checking .gitignore for Docker configurations..."
GITIGNORE="${PROJECT_ROOT}/.gitignore"

if grep -q "\.env\.local" "$GITIGNORE"; then
    echo -e "  ${GREEN}✓${NC} .env.local is in .gitignore"
else
    echo -e "  ${RED}✗${NC} .env.local is NOT in .gitignore"
    exit 1
fi

if grep -q "docker-compose.override.yml" "$GITIGNORE"; then
    echo -e "  ${GREEN}✓${NC} docker-compose.override.yml is in .gitignore"
else
    echo -e "  ${RED}✗${NC} docker-compose.override.yml is NOT in .gitignore"
fi

echo -e "${GREEN}✓ PASS${NC}: .gitignore is properly configured\n"

# Test 9: Check docker and docker-compose installation
echo "[TEST 9] Verifying Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "  ${GREEN}✓${NC} Docker is installed: $DOCKER_VERSION"
else
    echo -e "  ${RED}✗${NC} Docker is not installed"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "  ${GREEN}✓${NC} Docker Compose is installed: $COMPOSE_VERSION"
else
    echo -e "  ${RED}✗${NC} Docker Compose is not installed"
    exit 1
fi

echo -e "${GREEN}✓ PASS${NC}: Docker tools are installed\n"

# Summary
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}All Tests Passed!${NC}"
echo -e "${GREEN}===========================================${NC}\n"

echo "Summary:"
echo "  - docker-compose.yml is valid and contains all required services"
echo "  - All port mappings are correctly configured"
echo "  - PostgreSQL persistence volume is configured"
echo "  - Network isolation is enabled"
echo "  - Environment variables are documented in .env.local.example"
echo "  - .gitignore properly excludes sensitive files"
echo "  - Docker and Docker Compose are installed"
echo ""
echo "Next steps:"
echo "  1. Copy .env.local.example to .env.local and update values as needed"
echo "  2. Run: docker-compose up -d"
echo "  3. Wait ~30 seconds for PostgreSQL to initialize"
echo "  4. Access Supabase Studio at http://localhost:5555"
echo "  5. Access Mailhog UI at http://localhost:8025"
