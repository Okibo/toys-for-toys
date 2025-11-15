# Quick Start Guide - Toy-for-Toy Development

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Supabase project (for backend configuration)

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local  # or use your editor
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

Optional (for notifications and marketing):
- Firebase credentials (for push notifications)
- SendGrid API key (for email)

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Common Commands

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript
```

### Testing
```bash
npm test                 # Run all tests
npm test -- --watch     # Watch mode
npm test -- --coverage  # With coverage report
npm test -- setup.test  # Run specific test file
```

### Code Quality
```bash
# Prettier will auto-format on save if configured in your editor
npx prettier --write "pages/**/*.tsx" "components/**/*.tsx"
```

## Project Structure

```
/components     - Reusable React components (Cards, Forms, etc.)
/pages          - Next.js pages and routes
/pages/api      - API endpoints (serverless functions)
/lib            - Utility functions, Supabase client, hooks
/public         - Static assets (images, fonts, icons)
/styles         - Global CSS and Tailwind configuration
/supabase       - Database migrations and RLS policies
/tests          - Jest test files
/types          - TypeScript type definitions
```

## Import Path Aliases

Use the convenient `@/` prefix for clean imports:

```typescript
// Instead of:
import { Button } from '../../../components/Button';

// Use:
import { Button } from '@/components/Button';

// Other available aliases:
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/index';
```

## Key Features

### Health Check Endpoint
Test if the API is running:
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok","timestamp":"2025-11-15T..."}
```

### Tailwind CSS
Styling is configured with Tailwind CSS. Use utility classes directly in JSX:
```tsx
<div className="max-w-6xl mx-auto px-4 py-12">
  <h1 className="text-4xl font-bold text-gray-900">Hello</h1>
</div>
```

### TypeScript
All files use TypeScript with strict mode enabled. Types are in `/types` directory.

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write code following the structure**
   - Components in `/components`
   - Pages in `/pages`
   - Utilities in `/lib`
   - API routes in `/pages/api`

3. **Write tests** in `/tests` alongside your features

4. **Format and lint**
   ```bash
   npm run lint
   npx prettier --write .
   ```

5. **Test locally**
   ```bash
   npm test
   npm run build  # Verify production build works
   ```

6. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   git push origin feature/your-feature-name
   ```

7. **Create a pull request** to `develop` branch

## Troubleshooting

### Port 3000 Already in Use
```bash
# On macOS/Linux:
lsof -i :3000
kill -9 <PID>

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Module Not Found Errors
```bash
# Clear Next.js cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### TypeScript Errors
```bash
# Check TypeScript compilation
npm run type-check

# Re-build if needed
npm run build
```

### Supabase Connection Issues
- Verify `.env.local` has correct credentials
- Check Supabase project is accessible
- Ensure your IP is whitelisted (if applicable)

## Browser DevTools

The application includes Next.js React DevTools. In development, you can:
- Inspect components
- Check performance
- Debug state management

## Performance Tips

1. Use `next/Image` for images instead of `<img>`
2. Lazy load components with `dynamic()` from Next.js
3. Use Tailwind's responsive classes: `sm:`, `md:`, `lg:`, `xl:`
4. Keep component props minimal and memoize when needed

## Next Steps

1. Read `SETUP_SUMMARY.md` for complete project overview
2. Check `CLAUDE.md` for project context and conventions
3. Review database schema in `/supabase` directory
4. Explore existing components in `/components`
5. Look at API routes in `/pages/api` for patterns

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Help & Support

For issues or questions:
1. Check the troubleshooting section above
2. Review existing code in the repository
3. Check project documentation in `/docs`
4. Ask team lead for guidance

---

**Happy coding!** 🚀
