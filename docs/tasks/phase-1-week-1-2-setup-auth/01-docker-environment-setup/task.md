# Task P1-W1-SETUP-001: Docker Environment Setup & Project Initialization

## Task ID
P1-W1-SETUP-001

## Epic
Phase 1 Week 1-2: Project Setup & Authentication

## Title
Docker Environment Setup & Project Initialization

## Description
Initialize the complete Docker development environment for Toy-for-Toy using Docker Compose. This includes setting up Supabase (PostgreSQL, PostgREST, Studio), Next.js development server, mock email service (Mailhog), and Firebase mock configuration. This is the foundational task that all other development depends on.

## Acceptance Criteria

### Docker Compose Configuration
- [ ] `docker-compose.yml` created with services:
  - Supabase PostgreSQL (port 5432)
  - PostgREST API (port 3000 - adjust Next.js to 3001)
  - Supabase Studio (port 5555)
  - Mailhog (ports 1025 for SMTP, 8025 for UI)
- [ ] Environment variables properly configured in `.env.local`
- [ ] Data persistence: PostgreSQL volume mounted to prevent data loss
- [ ] All services start cleanly with `docker-compose up`

### Next.js Project Structure
- [ ] Next.js project initialized with TypeScript
- [ ] Core directory structure created:
  - `/components` - React components
  - `/pages/api` - API routes
  - `/lib` - Utility functions and Supabase client
  - `/public` - Static assets
  - `/supabase` - Database migrations and RLS policies
  - `/tests` - Test files
  - `/docs` - Documentation
- [ ] `tsconfig.json` configured with proper paths
- [ ] `.env.local.example` created with all required variables

### Dependencies & Configuration
- [ ] `package.json` includes all core dependencies:
  - @supabase/supabase-js
  - next (latest LTS)
  - react, react-dom
  - tailwindcss
  - jest
  - @types/node, @types/react
- [ ] Tailwind CSS configured with `tailwind.config.ts`
- [ ] PostCSS configured for Tailwind
- [ ] Jest configuration created for testing
- [ ] ESLint and Prettier configured

### Development Tools
- [ ] `.devcontainer` setup for VS Code development
- [ ] `Dockerfile` for containerized Next.js (optional but recommended)
- [ ] Startup script: `npm run dev` launches on localhost:3001
- [ ] Health check endpoint: `GET /api/health` returns {"status": "ok"}

### Documentation
- [ ] `/docs/SETUP.md` with:
  - Prerequisites (Docker, Node.js version)
  - Step-by-step setup instructions
  - Environment variable explanation
  - Common troubleshooting (port conflicts, permission issues)
  - Accessing services URLs (Studio, Mailhog)

## Estimated Hours
8-12 hours

## Dependencies
None (foundational task)

## Testing Requirements

### Manual Testing
- [ ] Clone repo, run `docker-compose up` (no errors)
- [ ] Verify all services healthy: `docker-compose ps`
- [ ] Access Supabase Studio at http://localhost:5555
- [ ] Access Mailhog UI at http://localhost:8025
- [ ] Verify Next.js dev server on localhost:3001
- [ ] Test health endpoint: `curl http://localhost:3001/api/health`

### Database Connection
- [ ] Supabase client can connect from Next.js
- [ ] Basic query works: list tables from Supabase
- [ ] RLS policies can be verified in Studio

## Database/Schema Changes
None (schema comes in subsequent tasks)

## Technology Stack
- Docker Compose 2.0+
- Next.js 14+
- TypeScript 5+
- Supabase (self-hosted via Docker)
- Tailwind CSS 3+
- Jest 29+

## Implementation Notes

### Port Management
- Ensure no conflicts with existing services
- If ports unavailable, update `.env` and docker-compose.yml
- Document alternative ports in SETUP.md

### Supabase Configuration
- Use `supabase_id` = "dev" for local development
- Master key available in docker-compose configuration
- Studio password can be set in environment

### Next.js Development
- Hot-reload should work in Docker (verify volume mounts)
- Source maps enabled for easier debugging
- Development mode enabled (no production build required)

### Git Workflow
- `.env.local` added to `.gitignore` (security)
- `.env.local.example` committed with dummy values
- `docker-compose.override.yml` for local overrides (optional)

## Success Metrics
- All Docker services start without errors
- Next.js dev server accessible at localhost:3001
- Supabase Studio fully functional
- Mailhog ready for email testing
- Team can onboard with single command: `docker-compose up`

## Related Stories (from PRD)
- Story 1: User Registration & Onboarding (depends on this)
- Story 13: Internationalization (uses Next.js i18n setup)

## Related Functional Requirements
- FR-AUTH-001: Email/Password Registration (infrastructure for auth)

## Risk Factors
- Docker/compose version incompatibilities (mitigate: document minimum versions)
- Port conflicts on developer machines (mitigate: provide conflict resolution guide)
- Network issues pulling images (mitigate: provide offline alternatives)
