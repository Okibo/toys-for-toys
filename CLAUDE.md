# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Toy-for-Toy** is a cross-platform cashless toy exchange platform built on a ticket-based economy system. It's a monorepo with a Next.js web frontend and Capacitor native mobile wrapper, all backed by Supabase.

**Core Value Proposition:**

- No monetary transactions between users; instead, a 1-for-1 ticket barter system
- Monetized via targeted advertising and rewarded mini-games
- GDPR-compliant child data handling with parental controls
- Real-time updates for chat, ticket balance, and notifications

## Essential Commands

### Development

```bash
npm install                 # Install dependencies
npm run dev                 # Start dev server (http://localhost:3000)
npm run build               # Build for production
npm run lint                # Run linter
npm run test                # Run Jest tests
npm test -- <filename>      # Run specific test file
```

### Mobile Development

```bash
npm run build               # Build Next.js (required before Capacitor sync)
npx cap sync                # Sync web assets to native projects
npx cap open android        # Open Android Studio
npx cap open ios            # Open Xcode (macOS only)
npx cap run android         # Run on Android emulator
npx cap run ios             # Run on iOS simulator
```

### Database & Backend

```bash
npx supabase start          # Start local Supabase (requires Supabase CLI)
npx supabase db push        # Push migrations to remote
```

### Deployment

```bash
# Vercel (automatic on push to main)
npx vercel                  # Deploy to Vercel
npx vercel --prod           # Production deployment
```

## Technology Stack

| Layer             | Technology               | Key Details                       |
| ----------------- | ------------------------ | --------------------------------- |
| **Frontend**      | Next.js + React          | SSR/SSG, API routes, middleware   |
| **Mobile**        | Capacitor                | Native iOS/Android wrapper        |
| **UI Components** | shadcn/ui + Tailwind CSS | Accessible, responsive design     |
| **Database**      | Supabase (PostgreSQL)    | Auth, RLS, Realtime subscriptions |
| **ORM**           | Prisma                   | Type-safe database queries        |
| **Notifications** | Firebase FCM             | Cross-platform push notifications |
| **Email**         | SendGrid                 | Transactional emails              |
| **Storage**       | Supabase Storage         | Toy images with RLS protection    |
| **Hosting**       | Vercel                   | Web frontend deployment           |
| **Testing**       | Jest + Playwright        | Unit/integration and E2E tests    |

## Architecture Overview

### Directory Structure

```
/
├── components/              # React UI components (Cards, Forms, Ads)
├── pages/                   # Next.js routes and API endpoints
├── lib/                     # Utilities, Supabase client, hooks
├── styles/                  # Tailwind CSS, theme configuration
├── public/                  # Static assets
├── supabase/                # Database schema, migrations, policies, Edge Functions
├── tests/                   # Jest test files
├── docs/                    # Documentation, wireframes, PRD specs
└── .claude/                 # AI agent orchestration system
```

### Core Business Logic: Ticket Economy

The ticket system is the application's foundation:

1. **Listing**: User lists a toy (costs 1 ticket)
2. **Request**: Another user requests the toy (spends 1 ticket)
3. **Escrow**: Ticket is frozen by the system during exchange
4. **Confirmation**: Upon delivery verification or 48h timeout, ticket releases to lister

**Key Database Concepts:**

- `tickets` table: User ticket balances (incremented/decremented on exchange)
- `exchanges` table: Active transactions with status tracking (pending → confirmed → completed)
- `toys` table: Listable items with tags and categories
- RLS policies enforce data isolation by user_id

### Data Flow

```
User (Web/Mobile)
    ↓
Next.js Frontend
    ↓
Supabase Client SDK
    ↓
Supabase Backend
  ├─ PostgreSQL (Source of truth)
  ├─ Auth (JWT tokens)
  ├─ Realtime (Live subscriptions)
  ├─ Storage (Images with RLS)
  └─ Edge Functions (Serverless logic)
    ↓
External Services
  ├─ Firebase FCM (Push notifications)
  ├─ SendGrid (Email)
  └─ Google AdMob/AdSense (Monetization)
```

### Real-time Architecture

- **Supabase Realtime**: Handles in-app live updates (chat, ticket balance)
- **Firebase FCM**: Background push notifications triggered by Supabase Edge Functions
- **Smart polling fallback**: Web notifications if real-time unavailable

## Development Workflow

### Before Starting Work

1. Ensure `.env.local` has valid Supabase credentials
2. Run `npm install` to sync dependencies
3. Start dev server with `npm run dev`
4. Verify Supabase connection in browser console

### When Making Database Changes

1. Create migration: `npx prisma migrate dev --name <feature_name>`
2. Update `lib/prisma.ts` if modifying client configuration
3. Check RLS policies in Supabase Studio for data isolation
4. Test migrations locally before pushing to production

### When Adding New Features

1. Follow the existing component structure in `/components`
2. Use Supabase RLS for data security (never rely on frontend auth alone)
3. Leverage real-time subscriptions for live updates
4. Add Jest tests in `/tests` (collocate with feature)
5. Update TypeScript types in relevant files

### Testing Strategy

- **Unit/Integration**: Jest for React components, utilities, and hooks
- **E2E**: Playwright for user workflows (login, exchange, messaging)
- **Manual**: Test on actual mobile devices before release
- Run `npm test` locally; CI/CD runs on pull requests

## Security & Compliance

### Key Security Patterns

- **RLS Policies**: All data access goes through Supabase RLS (row-level security)
- **JWT Authentication**: Stateless auth via Supabase; check token validity before DB queries
- **Data Minimization**: Only collect necessary user/child data
- **Encrypted Storage**: Sensitive data encrypted at rest via Supabase
- **HTTPS Enforcement**: All external APIs require secure transport

### GDPR Compliance (Child Data)

- Parental consent required before storing child information
- Implement data deletion workflows (`lib/gdpr-utils.ts` pattern)
- Transparent privacy policies; parental controls for data sharing
- Regular audit of data retention policies
- Do NOT store unnecessary personal information

## Common Development Patterns

### Using Supabase Client

```typescript
// In lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(URL, ANON_KEY);

// In components
const { data, error } = await supabase.from('toys').select('*').eq('user_id', userId); // RLS automatically filters
```

### Real-time Subscriptions

```typescript
supabase
  .from('tickets')
  .on('*', (payload) => {
    // Update UI with new ticket balance
  })
  .subscribe();
```

### Firebase Push Notifications

Triggered by Supabase Edge Functions when:

- New exchange match found
- Shipment confirmed
- Message received in chat

## Environment Variables

Required `.env.local` variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<firebase-project>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
SENDGRID_API_KEY=<sendgrid-key>
```

## Deployment & CI/CD

### Vercel (Web)

- Automatic deployment on push to `main` branch
- Preview deployments for pull requests
- Environment variables configured in Vercel dashboard
- Check build logs at vercel.com

### Mobile (iOS/Android)

- Use Capacitor to build native binaries
- Test on physical devices before app store submission
- Update Capacitor config in `capacitor.config.ts`

## Debugging Tips

### Local Development Issues

- **Blank page**: Check browser console for Supabase connection errors
- **Auth failures**: Verify `.env.local` credentials match Supabase project
- **Real-time not updating**: Check Supabase Realtime is enabled; fallback to polling
- **Mobile build fails**: Run `npm run build` first, then `npx cap sync --fresh`

### Database Issues

- Use Supabase Studio to inspect data and test queries
- Check RLS policies if data is hidden unexpectedly
- View logs: Supabase Dashboard → Logs
- Test Edge Functions: Use `npx supabase functions test`

## AI Agent System

The project uses a specialized multi-agent orchestration system with 19 domain experts:

**Key Agents:**

- **software-architect**: System design and architecture decisions
- **nextjs-expert**: Framework-specific patterns and optimization
- **supabase-expert**: Database design, RLS, real-time subscriptions
- **frontend-react-expert**: Component architecture and state management
- **security-expert**: Vulnerability analysis and compliance
- **agent-orchestrator**: Coordinates task delegation across agents

**Usage**: Reference agents in `.claude/agents/` for domain-specific guidance.

## References

- **README.md**: Project overview, setup instructions
- **docs/sketches/**: UI/UX wireframes for all major user flows
- **docs/create-prd.txt**: PRD generation specification
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Prisma Docs**: https://www.prisma.io/docs

## Quick Troubleshooting

| Issue                     | Solution                                              |
| ------------------------- | ----------------------------------------------------- |
| `Cannot find module 'X'`  | Run `npm install` and restart dev server              |
| Supabase connection fails | Check `.env.local`; verify project URL and keys       |
| Mobile build fails        | Run `npm run build` before `npx cap sync`             |
| Tests fail                | Run `npm test -- --no-coverage` for full output       |
| TypeScript errors         | Check `tsconfig.json`; run `npm run build` to rebuild |
| Realtime not working      | Check Supabase Realtime enabled; verify RLS policies  |

## Important Notes for Future Work

1. **Always respect RLS policies**: The database enforces security, not the application layer
2. **Test on mobile devices**: Capacitor behavior differs from web; always validate on iOS and Android
3. **Monitor third-party dependencies**: Security vulnerabilities in Supabase, Next.js, and Firebase matter
4. **GDPR is non-negotiable**: Child data protection is a legal requirement, not optional
5. **Real-time updates matter for UX**: Users expect instant feedback on exchanges, tickets, and messages

- @agent-agent-orchestrator can never do any changes.
- @agent-agent-orchestrator must always delegate tasks to other agents
