# Troubleshooting Guide

This guide covers common development issues and their solutions for the Toy-for-Toy project.

## Module/Dependency Issues

### "Cannot find module X" Error

**Symptoms:**

- Import statements show red underlines in IDE
- Error: `Cannot find module 'X'` or `Module not found: Can't resolve 'X'`
- Application fails to start or compile

**Solutions:**

1. **Reinstall dependencies:**

   ```bash
   npm install
   ```

2. **Clear node_modules and reinstall:**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Clear Next.js cache:**

   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Verify package is in package.json:**
   - Check if the package exists in `package.json`
   - If missing, install it: `npm install <package-name>`

5. **TypeScript can't find types:**
   ```bash
   npm install --save-dev @types/<package-name>
   ```

### Dependency Version Conflicts

**Symptoms:**

- `npm install` shows peer dependency warnings
- Application has unexpected behavior after updates

**Solutions:**

1. **Check for conflicting versions:**

   ```bash
   npm ls <package-name>
   ```

2. **Update to compatible versions:**

   ```bash
   npm update
   ```

3. **Force resolution (use carefully):**
   - Add to `package.json`:
   ```json
   "overrides": {
     "package-name": "version"
   }
   ```

## Supabase Connection Issues

### Connection Fails Error

**Symptoms:**

- Blank page on load
- Console error: `Failed to connect to Supabase`
- Auth failures or database queries return errors

**Solutions:**

1. **Verify environment variables in `.env.local`:**

   ```bash
   # Check these exist and are correct
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

2. **Restart development server after changing .env:**

   ```bash
   # Stop server (Ctrl+C) then:
   npm run dev
   ```

3. **Verify Supabase project is active:**
   - Log into Supabase Dashboard
   - Check project status
   - Verify URL matches your `.env.local`

4. **Test connection manually:**
   - Open browser console at `http://localhost:3000`
   - Run: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`
   - Should display your Supabase URL (not undefined)

5. **Check API keys are valid:**
   - Go to Supabase Dashboard → Settings → API
   - Copy fresh keys if needed
   - Update `.env.local`

### RLS Policy Blocking Data Access

**Symptoms:**

- Queries return empty arrays unexpectedly
- Console shows: `new row violates row-level security policy`

**Solutions:**

1. **Check RLS policies in Supabase Studio:**
   - Navigate to Authentication → Policies
   - Verify policies exist for the table
   - Test policies with SQL Editor

2. **Verify user is authenticated:**

   ```typescript
   const {
     data: { user },
   } = await supabase.auth.getUser();
   console.log('Current user:', user);
   ```

3. **Test query with service role key (backend only):**
   ```typescript
   // In API routes only - never in frontend
   import { createClient } from '@supabase/supabase-js';
   const supabaseAdmin = createClient(url, serviceRoleKey);
   ```

## Dev Server Issues

### Dev Server Won't Start

**Symptoms:**

- `npm run dev` fails immediately
- Error during server initialization

**Solutions:**

1. **Check for syntax errors:**

   ```bash
   npm run lint
   ```

2. **Clear Next.js cache:**

   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check Node.js version:**

   ```bash
   node -v  # Should be >= 18.17.0
   ```

   - Update Node.js if needed: https://nodejs.org/

4. **Check for missing dependencies:**
   ```bash
   npm install
   ```

### Port Already in Use

**Symptoms:**

- Error: `Port 3000 is already in use`
- Server fails to start

**Solutions:**

1. **Kill process on port 3000:**

   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Use a different port:**

   ```bash
   PORT=3001 npm run dev
   ```

3. **Find and close other Next.js instances:**
   ```bash
   ps aux | grep next
   kill <PID>
   ```

### Hot Reload Not Working

**Symptoms:**

- Changes to code don't reflect in browser
- Must manually refresh to see updates

**Solutions:**

1. **Check file watching limits (Linux):**

   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart development server:**

   ```bash
   # Ctrl+C to stop, then:
   npm run dev
   ```

3. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)

## Build Issues

### npm run build Fails

**Symptoms:**

- Build process exits with errors
- Deployment fails

**Solutions:**

1. **Check for TypeScript errors:**

   ```bash
   npx tsc --noEmit
   ```

   - Fix all type errors shown

2. **Check for ESLint errors:**

   ```bash
   npm run lint
   ```

   - Fix errors or warnings marked as errors

3. **Clear build cache and retry:**

   ```bash
   rm -rf .next
   npm run build
   ```

4. **Check for environment variables:**
   - Ensure all required `NEXT_PUBLIC_*` variables are set
   - Build time requires these to be available

5. **Increase Node.js memory (large projects):**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

### TypeScript Errors During Build

**Symptoms:**

- Type errors appear during `npm run build`
- Errors like: `Property 'X' does not exist on type 'Y'`

**Solutions:**

1. **Update TypeScript types:**

   ```bash
   npm install --save-dev @types/node @types/react @types/react-dom
   ```

2. **Check tsconfig.json is correct:**

   ```json
   {
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true
     }
   }
   ```

3. **Generate Prisma types:**

   ```bash
   npx prisma generate
   ```

4. **Clear TypeScript cache:**
   ```bash
   rm -rf .next tsconfig.tsbuildinfo
   npm run build
   ```

### Out of Memory During Build

**Symptoms:**

- Build fails with: `JavaScript heap out of memory`

**Solutions:**

1. **Increase Node.js memory limit:**

   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

2. **Add to package.json scripts:**
   ```json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
     }
   }
   ```

## Mobile/Capacitor Issues

### Mobile Build Fails

**Symptoms:**

- `npx cap sync` fails
- Native project won't open
- Build errors in Android Studio/Xcode

**Solutions:**

1. **Build Next.js first (REQUIRED):**

   ```bash
   npm run build
   npx cap sync
   ```

2. **Clean sync with fresh copy:**

   ```bash
   npm run build
   npx cap sync --force
   ```

3. **Check Capacitor configuration:**
   - Verify `capacitor.config.ts` has correct `webDir: 'out'`
   - Ensure Next.js is configured for static export if using `out` directory

4. **Update Capacitor:**
   ```bash
   npm install @capacitor/core @capacitor/cli
   ```

### Android Studio/Xcode Won't Open

**Symptoms:**

- `npx cap open android` or `npx cap open ios` fails
- IDE not found error

**Solutions:**

1. **Install required tools:**
   - **Android**: Install Android Studio from https://developer.android.com/studio
   - **iOS**: Install Xcode from App Store (macOS only)

2. **Set environment variables (Android):**

   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

3. **Open manually:**
   - Navigate to `android/` or `ios/` folder
   - Open project in IDE directly

### Plugin Errors

**Symptoms:**

- Native plugin not found
- Plugin method fails at runtime

**Solutions:**

1. **Sync plugins:**

   ```bash
   npm install
   npx cap sync
   ```

2. **Reinstall plugin:**

   ```bash
   npm uninstall @capacitor/plugin-name
   npm install @capacitor/plugin-name
   npx cap sync
   ```

3. **Check plugin is registered:**
   - Verify in `capacitor.config.ts`
   - Check native files updated in `android/` or `ios/`

## Testing Issues

### Jest Tests Failing

**Symptoms:**

- `npm test` shows failed tests
- Configuration errors

**Solutions:**

1. **Run tests with full output:**

   ```bash
   npm test -- --no-coverage --verbose
   ```

2. **Update snapshots if UI changed:**

   ```bash
   npm test -- -u
   ```

3. **Clear Jest cache:**

   ```bash
   npx jest --clearCache
   npm test
   ```

4. **Check Jest configuration:**
   - Verify `jest.config.js` exists
   - Ensure `testEnvironment: 'jsdom'` for React tests

5. **Install missing test dependencies:**
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom
   ```

### Playwright E2E Tests Failing

**Symptoms:**

- E2E tests timeout or fail
- Browser won't launch

**Solutions:**

1. **Install Playwright browsers:**

   ```bash
   npx playwright install
   ```

2. **Run in headed mode for debugging:**

   ```bash
   npx playwright test --headed
   ```

3. **Increase timeout for slow operations:**

   ```typescript
   test.setTimeout(60000); // 60 seconds
   ```

4. **Check baseURL is correct:**
   - Verify `playwright.config.ts` has correct `baseURL`
   - Ensure dev server is running before tests

### Module Mock Issues

**Symptoms:**

- Tests fail with: `Cannot find module from 'X'`
- Mocks not working

**Solutions:**

1. **Configure module paths in jest.config.js:**

   ```javascript
   moduleNameMapper: {
     '^@/(.*)$': '<rootDir>/$1',
   }
   ```

2. **Mock external dependencies:**

   ```javascript
   jest.mock('@supabase/supabase-js', () => ({
     createClient: jest.fn(),
   }));
   ```

3. **Clear module cache:**
   ```bash
   npx jest --clearCache
   ```

## Real-time/Subscription Issues

### Supabase Realtime Not Updating

**Symptoms:**

- Live updates don't appear
- Subscriptions not triggering callbacks

**Solutions:**

1. **Check Realtime is enabled in Supabase:**
   - Dashboard → Database → Replication
   - Enable Realtime for relevant tables

2. **Verify subscription code:**

   ```typescript
   const subscription = supabase
     .from('table_name')
     .on('*', (payload) => {
       console.log('Change received!', payload);
     })
     .subscribe();

   // Don't forget to unsubscribe
   return () => {
     supabase.removeSubscription(subscription);
   };
   ```

3. **Check RLS policies don't block subscriptions:**
   - Test with service role key (backend only)

4. **Fallback to polling if needed:**
   ```typescript
   useEffect(() => {
     const interval = setInterval(() => {
       fetchData();
     }, 5000);
     return () => clearInterval(interval);
   }, []);
   ```

## Firebase Issues

### Push Notifications Not Working

**Symptoms:**

- FCM tokens not generated
- Notifications not received

**Solutions:**

1. **Verify Firebase config in `.env.local`:**

   ```bash
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
   NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
   ```

2. **Check service worker is registered:**
   - Verify `public/firebase-messaging-sw.js` exists
   - Check browser DevTools → Application → Service Workers

3. **Request notification permissions:**

   ```typescript
   const permission = await Notification.requestPermission();
   console.log('Permission:', permission);
   ```

4. **Test on HTTPS (required for FCM):**
   - Local: Use `localhost` (allowed)
   - Production: Ensure site uses HTTPS

## Performance Issues

### Slow Page Load

**Solutions:**

1. **Check for large images:**
   - Use Next.js `<Image>` component
   - Compress images before upload

2. **Analyze bundle size:**

   ```bash
   npm run build
   npx @next/bundle-analyzer
   ```

3. **Implement code splitting:**
   ```typescript
   const Component = dynamic(() => import('./Component'));
   ```

### Database Queries Slow

**Solutions:**

1. **Add indexes to frequently queried columns:**

   ```sql
   CREATE INDEX idx_toys_user_id ON toys(user_id);
   ```

2. **Use Supabase Query Performance:**
   - Dashboard → Performance
   - Identify slow queries

3. **Optimize RLS policies:**
   - Avoid complex calculations in policies
   - Use indexed columns

## Still Having Issues?

If none of these solutions work:

1. **Check project logs:**
   - Browser DevTools → Console
   - Terminal output from `npm run dev`
   - Supabase Dashboard → Logs

2. **Search GitHub issues:**
   - Next.js: https://github.com/vercel/next.js/issues
   - Supabase: https://github.com/supabase/supabase/issues
   - Capacitor: https://github.com/ionic-team/capacitor/issues

3. **Ask for help:**
   - Include error messages
   - Share relevant code snippets
   - Describe steps to reproduce

4. **Document new issues:**
   - Add to this guide if you find new solutions
   - Help future developers
