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
    if [ -f .env.example ]; then
      echo "Creating .env.local from template..."
      cp -n .env.example .env.local
      echo -e "${GREEN}✓ Created .env.local from .env.example${NC}"
      echo -e "${YELLOW}➜ Please edit .env.local and add your Supabase credentials${NC}"
      echo ""
      exit 0
    else
      echo -e "${RED}✗ .env.example template not found; cannot create .env.local${NC}"
      exit 1
    fi
fi

# Source environment variables safely
echo "Reading environment variables from .env.local..."
set -a
# Allow only simple KEY=VALUE lines, ignore comments and invalid lines
# shellcheck disable=SC1091
if grep -qE '^[[:space:]]*[^#[:space:]]+[[:space:]]*=' .env.local; then
  . .env.local
else
  echo -e "${RED}✗ .env.local does not contain valid KEY=VALUE entries${NC}"
  exit 1
fi
set +a

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
if [ -n "$VITE_SUPABASE_URL" ]; then
    # Basic URL sanity check
    if ! echo "$VITE_SUPABASE_URL" | grep -Eq '^https://[a-z0-9-]+\.supabase\.co/?$'; then
      echo -e "${YELLOW}⚠️  VITE_SUPABASE_URL format looks unusual: $VITE_SUPABASE_URL${NC}"
    fi
    
    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
      echo -e "${YELLOW}⚠️  VITE_SUPABASE_ANON_KEY not set; testing reachability without auth headers${NC}"
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${VITE_SUPABASE_URL}/rest/v1/")
    else
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${VITE_SUPABASE_URL}/rest/v1/" \
        -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}")
    fi
    
    if [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 500 ]; then
        echo -e "${GREEN}✓ Supabase API endpoint is reachable${NC}"
        echo "  HTTP Status: $HTTP_CODE"
        if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
          echo -e "${YELLOW}⚠️  Authorization failed. Ensure VITE_SUPABASE_ANON_KEY is correct${NC}"
        fi
    else
        echo -e "${RED}✗ Cannot reach Supabase API${NC}"
        echo "  HTTP Status: $HTTP_CODE"
        echo "  Verify VITE_SUPABASE_URL, network connectivity, or project status"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping API test (URL not set)${NC}"
fi

# Check if psql is available for database connection test
echo ""
echo "5. Testing direct database connection..."
if [ -n "$DATABASE_URL" ]; then
    if command -v psql &> /dev/null; then
        echo "Testing with psql..."
        TEST_URL="$DATABASE_URL"
        if ! echo "$TEST_URL" | grep -q 'sslmode='; then
          # Append sslmode=require safely
          if echo "$TEST_URL" | grep -q '?'; then
            TEST_URL="${TEST_URL}&sslmode=require"
          else
            TEST_URL="${TEST_URL}?sslmode=require"
          fi
        fi
        if OUTPUT=$(psql "$TEST_URL" -c "SELECT version();" 2>&1); then
            echo -e "${GREEN}✓ Database connection successful${NC}"
        else
            echo -e "${RED}✗ Database connection failed${NC}"
            echo "  Hint: Ensure your password is correct and SSL is enabled."
            echo "  Error: $(echo "$OUTPUT" | tail -n 1)"
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

URL_OK=false
if [ -n "$VITE_SUPABASE_URL" ] && echo "$VITE_SUPABASE_URL" | grep -Eq '^https://[a-z0-9-]+\.supabase\.co/?$'; then
  URL_OK=true
fi

if $URL_OK && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${GREEN}✓ Application configuration looks good!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'npm run dev' to start the development server"
    echo "  2. Open http://localhost:5173 in your browser"
    echo "  3. Test creating a project and syncing data"
else
    echo -e "${RED}✗ Missing or invalid configuration${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env.local and add your Supabase credentials"
    echo "  2. Ensure VITE_SUPABASE_URL looks like https://your-project.supabase.co"
    echo "  3. Get credentials from: https://supabase.com"
    echo "  4. See SUPABASE_DATABASE_SETUP.md for detailed instructions"
fi

echo ""
echo "For detailed setup instructions, see:"
echo "  - SUPABASE_DATABASE_SETUP.md"
echo "  - supabase/README.md"
echo ""
