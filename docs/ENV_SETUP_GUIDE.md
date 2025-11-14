# Environment Variable Setup Guide

This guide walks you through setting up Firebase credentials for local development and production deployment.

## Prerequisites

- Access to Firebase Console for your project
- `.env.local` file in project root (create if missing)
- Git configured (for `.env.local` to be ignored)

## Step 1: Get Firebase Public Configuration

1. **Open Firebase Console**
   - Navigate to: https://console.firebase.google.com/
   - Select your project (e.g., "toys-for-toys-mvp")

2. **Go to Project Settings**
   - Click the gear icon (⚙️) in the left sidebar
   - Select "Project settings"

3. **Find Web Configuration**
   - Scroll to "Your apps" section
   - Find your web app (or create one if missing)
   - Click the web app to see its configuration

4. **Copy Public Credentials**
   - You'll see configuration with the following fields
   - We only need specific fields for Cloud Messaging (not Auth, Database, or Storage - those use Supabase):

   ```javascript
   const firebaseConfig = {
     apiKey: 'AIzaSy...',
     projectId: 'toys-for-toys-mvp',
     messagingSenderId: '123456789012345',
     appId: '1:123456789012345:web:abc123def456ghi789',
   };
   ```

5. **Add to `.env.local`**
   - Open `/Users/pawelkalkun/Projects/private/toys-for-toys/.env.local` (create if missing)
   - Add only these Cloud Messaging variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=toys-for-toys-mvp
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012345
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012345:web:abc123def456ghi789
   ```

## Step 2: Get Firebase Admin SDK Key (Server-Side)

### 2a: Generate Service Account Key

1. **In Firebase Console, go to Service Accounts**
   - Click the gear icon (⚙️)
   - Select "Project settings"
   - Click "Service accounts" tab

2. **Generate New Private Key**
   - Under "Firebase Admin SDK," select Node.js
   - Click "Generate New Private Key"
   - A JSON file will download (e.g., `toys-for-toys-mvp-firebase-adminsdk-abc123-def456.json`)

3. **Important Notes**
   - This file contains SENSITIVE credentials
   - NEVER commit this file to Git
   - NEVER share via email/Slack/GitHub
   - Keep it in a secure location
   - Delete after extracting the key

### 2b: Extract Key Content

1. **Open the downloaded JSON file** with a text editor
   - It will look like:

   ```json
   {
     "type": "service_account",
     "project_id": "toys-for-toys-mvp",
     "private_key_id": "abc123def456...",
     "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-abc123@toys-for-toys-mvp.iam.gserviceaccount.com",
     "client_id": "123456789012345",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-abc123%40toys-for-toys-mvp.iam.gserviceaccount.com"
   }
   ```

2. **Convert to Single Line String**
   - Easiest method: Copy entire JSON content and paste
   - Or use command line:

   ```bash
   # On macOS/Linux
   cat /path/to/downloaded/file.json | tr '\n' ' ' | sed 's/"//g'

   # Better: Just copy the entire content
   cat /path/to/downloaded/file.json
   ```

### 2c: Add to `.env.local`

1. **Open `.env.local` again**
   - Paste the entire JSON as a single line:

   ```env
   FIREBASE_ADMIN_SDK_KEY='{"type":"service_account","project_id":"toys-for-toys-mvp","private_key_id":"abc123def456...","private_key":"-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----\n","client_email":"firebase-adminsdk-abc123@toys-for-toys-mvp.iam.gserviceaccount.com","client_id":"123456789012345","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-abc123%40toys-for-toys-mvp.iam.gserviceaccount.com"}'
   ```

2. **Important Formatting Notes**
   - Use SINGLE quotes around the entire JSON string
   - The `private_key` field contains literal `\n` characters (not newlines)
   - Do NOT manually format/prettify the JSON
   - Copy it exactly as provided by Firebase

3. **Verify Format**
   - Open Node.js console and test:
   ```bash
   node
   > const key = process.env.FIREBASE_ADMIN_SDK_KEY
   > JSON.parse(key)
   # Should display the parsed object without errors
   ```

### 2d: Clean Up

1. **Delete the downloaded JSON file**

   ```bash
   rm ~/Downloads/toys-for-toys-mvp-firebase-adminsdk-abc123-def456.json
   ```

   - This prevents accidental file exposure

2. **Secure the `.env.local` file**

   ```bash
   chmod 600 /Users/pawelkalkun/Projects/private/toys-for-toys/.env.local
   ```

   - This restricts read access to owner only

## Step 3: Verify Configuration

### 3a: Check `.env.local` File

```bash
cd /Users/pawelkalkun/Projects/private/toys-for-toys

# View environment variables (careful - shows secrets!)
cat .env.local

# Verify all required variables are present
grep "NEXT_PUBLIC_FIREBASE" .env.local
grep "FIREBASE_ADMIN_SDK_KEY" .env.local
```

### 3b: Test Firebase Connection

1. **Start development server**

   ```bash
   npm install  # If not already done
   npm run dev
   ```

2. **Open browser console** (DevTools > Console)
   - Navigate to http://localhost:3000
   - Should see no Firebase initialization errors
   - Should see `Firebase initialized successfully` or similar (check console logs)

3. **Verify credentials are accessible**
   ```javascript
   // In browser console:
   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID; // Should show project ID
   process.env.FIREBASE_ADMIN_SDK_KEY; // Should be undefined (server-side only)
   ```

### 3c: Run Tests

```bash
npm test -- firebase-env.test.ts
npm test -- firebase-security.test.ts
```

All tests should PASS.

## Step 4: Production Deployment (Vercel)

### 4a: Add Variables to Vercel

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Select Project**
   - Click your project (toys-for-toys or similar)

3. **Go to Settings > Environment Variables**

4. **Add Cloud Messaging Variables**
   For each `NEXT_PUBLIC_FIREBASE_*` variable (Cloud Messaging only):
   - `NEXT_PUBLIC_FIREBASE_API_KEY` - Value from Firebase - Environment: All
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Value: `toys-for-toys-mvp` - Environment: All
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Value from Firebase - Environment: All
   - `NEXT_PUBLIC_FIREBASE_APP_ID` - Value from Firebase - Environment: All

5. **Add Server-Side Variable**
   - Name: `FIREBASE_ADMIN_SDK_KEY`
   - Value: `{"type":"service_account",...}`
   - **IMPORTANT:** Select "Production" environment only (server-side)
   - Do NOT select "Exposed to Browser"

### 4b: Verify in Vercel

1. **Check variables are set**
   - Settings > Environment Variables
   - All variables should be listed

2. **Trigger a new deployment**

   ```bash
   git push main  # or push to production branch
   ```

3. **Monitor build logs**
   - Vercel Dashboard > Deployments
   - Click latest deployment
   - Check logs for "Firebase initialized successfully" or similar
   - Should NOT show credentials in logs

## Step 5: Configure API Key Restrictions (Firebase Console)

To secure the public API key:

1. **Go to Firebase Console**
   - Project Settings > API Keys

2. **Click the Browser/Web API Key**

3. **Set API Restrictions**
   - Restrict Key: Cloud Messaging API
   - (Optionally add other APIs if needed)
   - Save

4. **Set HTTP Referrer Restrictions**
   - Add referrers:
     - `localhost:3000/*` (development)
     - `https://your-domain.com/*` (production)
     - `https://preview-*.vercel.app/*` (preview deployments)
   - Save

## Troubleshooting

### Issue: "Firebase config missing required field"

**Cause:** A Firebase Cloud Messaging environment variable is missing from `.env.local`

**Solution:**

- Verify all required `NEXT_PUBLIC_FIREBASE_*` variables are in `.env.local`:
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - NEXT_PUBLIC_FIREBASE_APP_ID
- Run `npm run dev` and check error message for which field is missing
- Copy the missing value from Firebase Console (Project Overview > Web app section)

### Issue: "FIREBASE_ADMIN_SDK_KEY environment variable is not set"

**Cause:** Server-side code can't find the admin SDK key

**Solution:**

- Verify `FIREBASE_ADMIN_SDK_KEY` is in `.env.local`
- Restart dev server: `npm run dev`
- Check key is properly formatted (single line, single quotes)

### Issue: "Service account missing required field"

**Cause:** The JSON structure is invalid or incomplete

**Solution:**

- Download a fresh service account JSON from Firebase Console
- Verify the JSON contains all fields:
  - type
  - project_id
  - private_key_id
  - private_key
  - client_email
  - client_id
  - auth_uri
  - token_uri
  - auth_provider_x509_cert_url
  - client_x509_cert_url

### Issue: "Notifications not working on production"

**Cause:** Environment variables not properly set in Vercel

**Solution:**

- Check Vercel Dashboard > Settings > Environment Variables
- Verify these Cloud Messaging variables match Firebase Console:
  - NEXT_PUBLIC_FIREBASE_API_KEY
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID
  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - NEXT_PUBLIC_FIREBASE_APP_ID
- Verify `FIREBASE_ADMIN_SDK_KEY` is server-only
- Trigger a new deployment after updating variables
- Check Vercel build logs for errors

### Issue: "Cannot find module 'firebase-admin' in browser"

**Cause:** `firebase-admin` imported in client-side code

**Solution:**

- Search for `firebase-admin` imports in `/components`, `/lib/hooks`, `/pages` (not `/pages/api`)
- Move `firebase-admin` usage to `/lib/firebase-admin.ts` or `/pages/api/*`
- Only import from `/lib/firebase.ts` in client code

## Security Reminders

- [ ] NEVER commit `.env.local` to Git
- [ ] NEVER share `FIREBASE_ADMIN_SDK_KEY` via email/Slack/chat
- [ ] NEVER hardcode any credentials in source code
- [ ] NEVER log or expose `FIREBASE_ADMIN_SDK_KEY` in error messages
- [ ] Keep `.env.local` with restricted permissions: `chmod 600 .env.local`
- [ ] Delete downloaded service account JSON files after extracting
- [ ] Rotate credentials quarterly (see FIREBASE_SECURITY.md)
- [ ] Use `.gitignore` to prevent accidental commits

## Next Steps

After setup is complete:

1. Run `npm test` to verify all tests pass
2. Run `npm run dev` to start development server
3. Test Firebase functionality (notifications, etc.)
4. Review `docs/FIREBASE_SECURITY.md` for security best practices
5. Complete `docs/FIREBASE_SECURITY_CHECKLIST.md` before deploying to production

## Support

For issues or questions:

- Check `docs/FIREBASE_SECURITY.md` for security guidance
- Check `docs/FIREBASE_QUICK_REFERENCE.md` for common patterns
- Review test files for examples: `tests/firebase-*.test.ts`
- Consult Firebase documentation: https://firebase.google.com/docs
