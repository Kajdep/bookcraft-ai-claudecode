#!/bin/bash

# Supabase Database Connection Validator
# This script helps you verify your Supabase database connection
# Usage: ./validate-db-connection.sh

echo "=================================================="
echo "Supabase Database Connection Validator"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local file not found${NC}"
    echo "Creating from template..."
    cp .env.example .env.local
    echo -e "${GREEN}✓ Created .env.local from .env.example${NC}"
    echo -e "${YELLOW}➜ Please edit .env.local and add your Supabase credentials${NC}"
    echo ""
    exit 1
fi

# Source environment variables
echo "Reading environment variables from .env.local..."
export $(cat .env.local | grep -v '^#' | xargs)

# Check VITE_SUPABASE_URL
echo ""
echo "1. Checking VITE_SUPABASE_URL..."
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}✗ VITE_SUPABASE_URL is not set${NC}"
    echo "  Please add it to .env.local"
    echo "  Example: VITE_SUPABASE_URL=https://your-project.supabase.co"
else
    echo -e "${GREEN}✓ VITE_SUPABASE_URL is set${NC}"
    echo "  Value: $VITE_SUPABASE_URL"
fi

# Check VITE_SUPABASE_ANON_KEY
echo ""
echo "2. Checking VITE_SUPABASE_ANON_KEY..."
if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}✗ VITE_SUPABASE_ANON_KEY is not set${NC}"
    echo "  Please add it to .env.local"
    echo "  Get it from: Supabase Dashboard → Settings → API"
else
    echo -e "${GREEN}✓ VITE_SUPABASE_ANON_KEY is set${NC}"
    echo "  Value: ${VITE_SUPABASE_ANON_KEY:0:20}..."
fi

# Check DATABASE_URL (optional)
echo ""
echo "3. Checking DATABASE_URL (optional for migrations)..."
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL is not set (optional)${NC}"
    echo "  This is only needed for running migrations"
    echo "  Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
else
    echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
    # Don't print the full URL as it contains password
    echo "  Format appears valid"
fi

# Test connection with curl (if URL is set)
echo ""
echo "4. Testing Supabase API connectivity..."
if [ ! -z "$VITE_SUPABASE_URL" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${VITE_SUPABASE_URL}/rest/v1/" \
        -H "apikey: ${VITE_SUPABASE_ANON_KEY}")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
        echo -e "${GREEN}✓ Supabase API is reachable${NC}"
        echo "  HTTP Status: $HTTP_CODE"
    else
        echo -e "${RED}✗ Cannot reach Supabase API${NC}"
        echo "  HTTP Status: $HTTP_CODE"
        echo "  Check your VITE_SUPABASE_URL and internet connection"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping API test (URL not set)${NC}"
fi

# Check if psql is available for database connection test
echo ""
echo "5. Testing direct database connection..."
if [ ! -z "$DATABASE_URL" ]; then
    if command -v psql &> /dev/null; then
        echo "Testing with psql..."
        if psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
            echo -e "${GREEN}✓ Database connection successful${NC}"
        else
            echo -e "${RED}✗ Database connection failed${NC}"
            echo "  Check your DATABASE_URL and database password"
        fi
    else
        echo -e "${YELLOW}⚠️  psql not installed (skipping test)${NC}"
        echo "  Install PostgreSQL client to test database connections"
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set (skipping)${NC}"
fi

# Summary
echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="

if [ ! -z "$VITE_SUPABASE_URL" ] && [ ! -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${GREEN}✓ Application configuration looks good!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'npm run dev' to start the development server"
    echo "  2. Open http://localhost:5173 in your browser"
    echo "  3. Test creating a project and syncing data"
else
    echo -e "${RED}✗ Missing required configuration${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env.local and add your Supabase credentials"
    echo "  2. Get credentials from: https://supabase.com"
    echo "  3. See SUPABASE_DATABASE_SETUP.md for detailed instructions"
fi

echo ""
echo "For detailed setup instructions, see:"
echo "  - SUPABASE_DATABASE_SETUP.md"
echo "  - supabase/README.md"
echo ""
