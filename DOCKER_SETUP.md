# Docker Setup Guide for Toy-for-Toy

Complete Docker Compose configuration for local development of the Toy-for-Toy toy exchange platform.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Services](#services)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## Quick Start

### Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- 4GB available RAM minimum
- 500MB disk space for PostgreSQL data

### Setup (2 minutes)

```bash
# 1. Navigate to project root
cd /Users/pawelkalkun/Projects/private/toys-for-toys

# 2. Copy environment configuration
cp .env.local.example .env.local

# 3. (Optional) Edit .env.local with your values
# For basic development, the defaults work fine
# nano .env.local

# 4. Start all services
docker-compose up -d

# 5. Wait for PostgreSQL to initialize (30 seconds)
docker-compose logs postgres

# 6. Access services:
#    - Supabase Studio: http://localhost:5555
#    - PostgREST API:   http://localhost:3000
#    - Mailhog UI:      http://localhost:8025
#    - PostgreSQL:      localhost:5432 (psql connection)
```

### Verify Everything Works

```bash
# Test PostgreSQL connection
docker-compose exec postgres pg_isready

# Test PostgREST API
curl http://localhost:3000/

# View logs
docker-compose logs -f [service-name]
```

### Stop Services

```bash
# Stop all containers (data persists)
docker-compose down

# Stop and remove volumes (destructive!)
docker-compose down -v
```

## Architecture

### Service Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
│              (toy-for-toy-network bridge)                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PostgreSQL   │  │ PostgREST    │  │ Supabase     │       │
│  │ (5432)       │←─┤ (3000)       │←─┤ Studio (5555)│       │
│  │              │  │              │  │              │       │
│  │ RLS Policies │  │ Auto API     │  │ Web UI       │       │
│  │ Encryption   │  │ RLS Enforcer │  │ DB Explorer  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         ▲                                                    │
│         │                                                    │
│  ┌──────┴──────────┐                                         │
│  │ Mailhog (8025)  │                                         │
│  │ Email Testing   │                                         │
│  │ SMTP: 1025      │                                         │
│  └─────────────────┘                                         │
│                                                              │
│  Persistent Volume: postgres_data                           │
│  (/var/lib/postgresql/data)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Supabase Studio** (Web UI) connects to PostgREST
2. **PostgREST** (API) connects to PostgreSQL
3. **PostgreSQL** enforces Row-Level Security (RLS) policies
4. **Mailhog** captures SMTP emails for testing

## Services

### PostgreSQL (port 5432)

**Image**: `supabase/postgres:15-1.50.3`

PostgreSQL database with Supabase extensions and advanced monitoring:

- **RLS Policies**: Row-level security enforced by database
- **pgAudit**: Auditing for security compliance
- **Performance Logging**: All queries logged for debugging
- **Data Persistence**: Named volume `postgres_data`
- **Health Check**: Automatic restart on failure

**Environment Variables**:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres (CHANGE IN PRODUCTION)
POSTGRES_DB=postgres
```

**Initialization**:
- Runs migrations from `./supabase/migrations/` (if present)
- Auto-creates tables and RLS policies
- 30-second startup grace period before services connect

**Access**:
```bash
# Via docker-compose
docker-compose exec postgres psql -U postgres

# Via local psql
psql -h localhost -U postgres -d postgres
```

### PostgREST (port 3000)

**Image**: `postgrest/postgrest:v12.0.1`

Auto-generates RESTful API from PostgreSQL schema:

- **Automatic API Generation**: Each table → REST endpoint
- **RLS Enforcement**: Automatically applies database security policies
- **JWT Authentication**: Validates tokens before DB queries
- **CORS Support**: Configured for local development
- **Health Check**: Validates API connectivity

**Environment Variables**:
```
PGRST_DB_URI=postgres://user:pass@postgres:5432/postgres
PGRST_JWT_SECRET=your-secret-key-here
PGRST_JWT_AUD=authenticated
PGRST_DB_SCHEMA=public
```

**API Endpoints**:
```bash
# Health check
curl http://localhost:3000/

# List all tables
curl http://localhost:3000/rpc

# Query data (with RLS enforcement)
curl "http://localhost:3000/toys?select=*&limit=10"
```

### Supabase Studio (port 5555)

**Image**: `supabase/studio:20240919-6cfe189`

Web interface for database management and exploration:

- **Table Explorer**: Browse and edit data visually
- **Query Editor**: Write and test SQL directly
- **RLS Policy Manager**: Create and modify security policies
- **API Documentation**: Auto-generated API docs
- **Performance Monitoring**: Query logs and performance metrics

**Access**: `http://localhost:5555`

**Features**:
- Visual schema editor
- RLS policy builder
- Real-time data editing
- SQL query testing
- Database backups management

### Mailhog (port 8025)

**Image**: `mailhog/mailhog:v1.0.1`

Email testing service for development:

- **SMTP Server**: Captures all outgoing emails
- **Web UI**: View sent emails at `http://localhost:8025`
- **No Configuration Needed**: Works immediately
- **Email Persistence**: Emails stored in memory (not persistent across restarts)

**Use Cases**:
- Test password reset emails
- Test notification emails
- Verify email templates
- Check email headers and content

**SMTP Configuration**:
```
Host: localhost
Port: 1025
No authentication required
```

**Access Emails**: `http://localhost:8025`

## Configuration

### Environment Variables

Copy `.env.local.example` to `.env.local` and customize:

```bash
cp .env.local.example .env.local
```

**Critical Variables**:

| Variable | Purpose | Default | Change? |
|----------|---------|---------|---------|
| `POSTGRES_PASSWORD` | DB password | `postgres` | YES (prod only) |
| `POSTGREST_JWT_SECRET` | API auth token | `super-secret...` | YES (prod) |
| `POSTGRES_USER` | DB user | `postgres` | NO |
| `POSTGRES_HOST` | DB hostname | `postgres` | NO |
| `POSTGRES_PORT` | DB port | `5432` | NO |

**Optional Variables** (for Firebase, SendGrid, etc.):
- See `.env.local.example` for full documentation

### Custom Configuration

#### Change PostgreSQL Password

In `.env.local`:
```bash
POSTGRES_PASSWORD=my-secure-password-123
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

#### Change API Port

Edit `docker-compose.yml`:
```yaml
postgrest:
  ports:
    - "3001:3000"  # Changed from 3000 to 3001
```

#### Add Custom Initialization

Place `.sql` files in `./supabase/docker/`:
```bash
mkdir -p ./supabase/docker
echo "CREATE TABLE custom_table (id serial primary key);" > ./supabase/docker/init.sql
```

Restart PostgreSQL:
```bash
docker-compose restart postgres
```

## Development Workflow

### Starting Fresh

```bash
# Remove everything (DESTRUCTIVE)
docker-compose down -v

# Start again
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f postgrest
docker-compose logs -f studio

# Last 100 lines
docker-compose logs --tail=100
```

### Connect to Database

#### Using Docker Exec
```bash
docker-compose exec postgres psql -U postgres -d postgres
```

#### Using Local psql
```bash
psql -h localhost -U postgres -d postgres
```

#### Using pgAdmin (Optional)
```bash
# Add to docker-compose.yml
pgadmin:
  image: dpage/pgadmin4:latest
  ports:
    - "5050:80"
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@local
    PGADMIN_DEFAULT_PASSWORD: admin
```

### Running Migrations

After creating new migrations in `./supabase/migrations/`:

```bash
# Restart PostgreSQL to apply new migrations
docker-compose restart postgres

# Verify in Studio: http://localhost:5555
```

### Testing the API

```bash
# Health check
curl http://localhost:3000/

# List all tables
curl http://localhost:3000/rpc

# Query specific table
curl "http://localhost:3000/profiles?select=*&limit=5"

# With authentication header
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/profiles"
```

### Testing Email

1. Configure your app to send SMTP to `localhost:1025`
2. Trigger an email action (e.g., password reset)
3. View email at `http://localhost:8025`
4. Verify content and headers

## Troubleshooting

### Container Won't Start

```bash
# Check error logs
docker-compose logs postgres

# Look for:
# - Port already in use: Change ports in docker-compose.yml
# - Disk full: Clean up Docker volumes
# - Permission denied: Check file ownership
```

### PostgreSQL Fails to Initialize

```bash
# Remove corrupted volume
docker-compose down -v

# Start fresh
docker-compose up -d postgres

# Check logs
docker-compose logs postgres
```

### Can't Connect to Database

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check health status
docker-compose exec postgres pg_isready

# Test connection
psql -h localhost -U postgres -d postgres -c "SELECT 1"
```

### PostgREST API Returns 500 Error

```bash
# Check API logs
docker-compose logs postgrest

# Verify database connection
docker-compose logs postgrest | grep "PGRST"

# Restart PostgREST
docker-compose restart postgrest
```

### Port Conflicts

**If you see "port already in use"**:

Option 1: Stop the conflicting service
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

Option 2: Use different ports in docker-compose.yml
```yaml
postgrest:
  ports:
    - "3001:3000"  # Use 3001 instead of 3000
```

Option 3: Use docker-compose.override.yml for local overrides
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  postgrest:
    ports:
      - "3001:3000"
```

### Mailhog Emails Not Appearing

```bash
# Verify service is running
docker-compose ps mailhog

# Check SMTP connectivity
docker-compose exec mailhog telnet localhost 1025

# View service logs
docker-compose logs mailhog

# Restart service
docker-compose restart mailhog
```

### Out of Disk Space

```bash
# Check Docker storage
docker system df

# Clean up unused volumes
docker volume prune

# Remove all unused data
docker system prune -a --volumes  # WARNING: Destructive
```

## Performance Optimization

### Resource Limits

Current limits in docker-compose.yml:

- **PostgreSQL**: 2 CPU, 2GB RAM
- **PostgREST**: 1 CPU, 512MB RAM
- **Studio**: 1 CPU, 512MB RAM
- **Mailhog**: 0.5 CPU, 256MB RAM

Adjust based on your machine:

```yaml
postgres:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 4G
```

### Database Performance

Enable query caching in PostgreSQL:
```bash
docker-compose exec postgres psql -U postgres -c \
  "ALTER DATABASE postgres SET shared_buffers='256MB'"
```

### Network Performance

Use native Docker networking (already configured) instead of bridges.

## Production Deployment

### Before Deploying

⚠️ **CRITICAL: Never use development configuration in production!**

```bash
# 1. Rotate ALL secrets
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGREST_JWT_SECRET=$(openssl rand -hex 32)

# 2. Update environment variables
nano .env.local

# 3. Remove development tools (Mailhog, Studio debugging)

# 4. Enable SSL/TLS

# 5. Set up automated backups

# 6. Configure monitoring and alerting

# 7. Test thoroughly in staging environment
```

### Recommended Readings

- [Docker Security Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [Supabase Production Checklist](https://supabase.com/docs/guides/hosting/overview)

## Getting Help

### Check Logs

```bash
# Docker Compose logs
docker-compose logs [service]

# Docker container logs
docker logs toy-for-toy-postgres

# PostgreSQL logs
docker-compose exec postgres tail -f /var/log/postgresql/postgresql.log
```

### Validate Configuration

```bash
# Validate docker-compose.yml syntax
docker-compose config

# Run test suite
./docker-compose.test.sh
```

### Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgREST Docs**: https://postgrest.org/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Docker Docs**: https://docs.docker.com/

---

**Last Updated**: November 15, 2025
**Toy-for-Toy Development Team**
