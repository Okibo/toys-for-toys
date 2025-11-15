# Docker Quick Reference

Fast lookup for common Docker Compose commands in Toy-for-Toy development.

## Essential Commands

```bash
# Start services (background)
docker-compose up -d

# Stop services (keep data)
docker-compose down

# Remove everything including data (DESTRUCTIVE)
docker-compose down -v

# View service status
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f postgres
docker-compose logs -f postgrest
docker-compose logs -f studio
docker-compose logs -f mailhog

# Restart service
docker-compose restart postgres

# Execute command in container
docker-compose exec postgres psql -U postgres
```

## Service Access

| Service | URL/Port | Purpose |
|---------|----------|---------|
| PostgreSQL | `localhost:5432` | Database (psql clients) |
| PostgREST API | `http://localhost:3000` | REST API endpoints |
| Supabase Studio | `http://localhost:5555` | Database web UI |
| Mailhog | `http://localhost:8025` | Email testing UI |

## Database Operations

### Connect to Database

```bash
# Via Docker
docker-compose exec postgres psql -U postgres -d postgres

# Via local psql
psql -h localhost -U postgres -d postgres

# List all databases
psql -h localhost -U postgres -c "\l"

# List all tables
psql -h localhost -U postgres -c "\dt"
```

### Run SQL Query

```bash
# Via Docker
docker-compose exec postgres psql -U postgres -c "SELECT * FROM profiles LIMIT 5;"

# Via local psql
psql -h localhost -U postgres -c "SELECT * FROM profiles LIMIT 5;"

# Execute from file
docker-compose exec postgres psql -U postgres -f /path/to/query.sql
```

### Create Backup

```bash
# Backup entire database
docker-compose exec postgres pg_dump -U postgres > backup.sql

# Backup specific table
docker-compose exec postgres pg_dump -U postgres -t profiles > profiles_backup.sql

# Compressed backup
docker-compose exec postgres pg_dump -U postgres | gzip > backup.sql.gz
```

### Restore from Backup

```bash
# Restore entire database
docker-compose exec -T postgres psql -U postgres < backup.sql

# Restore with gzip
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U postgres
```

## API Testing

### Health Check

```bash
curl http://localhost:3000/
```

### List All Tables

```bash
curl http://localhost:3000/rpc
```

### Query Data

```bash
# Get all profiles
curl "http://localhost:3000/profiles?select=*"

# Get with limit
curl "http://localhost:3000/profiles?select=*&limit=10"

# Get single record
curl "http://localhost:3000/profiles?id=eq.1"

# Get with join
curl "http://localhost:3000/profiles?select=*,toys(*)"
```

### With Authentication

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/profiles"
```

## Email Testing

### Send Test Email

Configure your app to send to `localhost:1025` and trigger an action.

### View Sent Emails

Open `http://localhost:8025` in browser.

### Check Email Headers

```bash
# Via Mailhog UI
# 1. Go to http://localhost:8025
# 2. Click on email
# 3. View all headers
```

## Troubleshooting

### Check Service Health

```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose ps postgres

# Get detailed info
docker inspect toy-for-toy-postgres
```

### Test Port Connectivity

```bash
# Test PostgreSQL
nc -zv localhost 5432

# Test PostgREST
nc -zv localhost 3000

# Test Studio
nc -zv localhost 5555

# Test Mailhog
nc -zv localhost 8025
```

### Free Locked Ports

```bash
# Find process using port
lsof -i :5432

# Kill process
kill -9 <PID>
```

### Rebuild Images

```bash
# Force rebuild all images
docker-compose up -d --build

# Rebuild specific service
docker-compose build --no-cache postgres
```

### Clean Up

```bash
# Remove unused Docker resources
docker system prune

# Remove unused volumes
docker volume prune

# Remove all unused data (WARNING: destructive)
docker system prune -a --volumes
```

## Compose Files

### Main Configuration
- **File**: `docker-compose.yml`
- **Purpose**: Production-like configuration with all services
- **Status**: Version controlled

### Local Overrides (Optional)
- **File**: `docker-compose.override.yml`
- **Purpose**: Local customizations (ports, resources, etc.)
- **Status**: Automatically loaded, add to `.gitignore`

### Example Override File

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
  postgrest:
    ports:
      - "3001:3000"  # Use 3001 instead of 3000
```

## Environment Variables

### Key Variables

```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=postgres

# PostgREST
POSTGREST_JWT_SECRET=super-secret-jwt-token-change-in-production

# Supabase
SUPABASE_PROJECT_ID=dev

# Email
SENDGRID_API_KEY=your-key-here
```

### Load Custom Environment

```bash
# Create custom .env file
echo "POSTGRES_PASSWORD=my-password" > .env.custom

# Load it
export $(cat .env.custom | xargs)
docker-compose up -d
```

## Common Issues

### "Port already in use"

```bash
# Option 1: Kill the process
lsof -i :5432
kill -9 <PID>

# Option 2: Use different port (docker-compose.override.yml)
```

### "Cannot connect to PostgreSQL"

```bash
# Check if service is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Wait for health check
docker-compose exec postgres pg_isready
```

### "API returns 500 error"

```bash
# Check API logs
docker-compose logs postgrest

# Restart API
docker-compose restart postgrest

# Verify database connection
docker-compose exec postgrest env | grep PGRST_DB_URI
```

### "Storage full"

```bash
# Check disk usage
docker system df

# Remove unused volumes
docker volume prune

# Remove service and recreate (loses data)
docker-compose down -v
docker-compose up -d
```

## Performance Tuning

### Increase Database Memory

Edit `docker-compose.yml`:
```yaml
postgres:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 4G
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### Enable Query Logging

Via Supabase Studio:
1. Go to `http://localhost:5555`
2. Click "SQL Editor"
3. Run: `ALTER DATABASE postgres SET log_statement='all';`

### View Slow Queries

```bash
docker-compose exec postgres psql -U postgres -c \
  "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

## Docker Info

### List All Containers

```bash
docker container ls -a | grep toy-for-toy
```

### Inspect Container

```bash
docker inspect toy-for-toy-postgres
```

### View Docker Events

```bash
docker events --filter "label=com.docker.compose.service"
```

### Docker Compose Version

```bash
docker-compose --version
```

## Useful Aliases

Add to your `.zshrc` or `.bashrc`:

```bash
# Start development environment
alias tft-start="docker-compose up -d"

# Stop development environment
alias tft-stop="docker-compose down"

# View logs
alias tft-logs="docker-compose logs -f"

# Connect to database
alias tft-db="docker-compose exec postgres psql -U postgres"

# Run tests
alias tft-test="./docker-compose.test.sh"
```

Then use:
```bash
tft-start
tft-logs
tft-db
```

---

**Quick Links**:
- Full Documentation: `DOCKER_SETUP.md`
- Configuration: `docker-compose.yml`
- Environment: `.env.local.example`
- Tests: `docker-compose.test.sh`
