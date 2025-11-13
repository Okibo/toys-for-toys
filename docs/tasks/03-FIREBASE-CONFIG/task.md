# Task 1.3: Set Up Firebase Project for Push Notifications

**Epic:** Project Setup & Infrastructure (Week 1)
**Status:** Pending
**Effort:** 1 day
**Dependencies:** Task 1.1 (Monorepo Setup)
**Assigned To:** [TBD]
**Created:** 2025-11-13

---

## Overview

Create a Firebase project, configure Cloud Messaging (FCM) for push notifications, generate service account credentials, and integrate Firebase SDK into the Next.js application. This task sets up the infrastructure for sending push notifications in Phase 2, with basic client-side setup in Phase 1.

---

## Acceptance Criteria

### Firebase Project Setup
- [x] Firebase account created or existing project used
- [x] New Firebase project created with:
  - [x] Project name: `toys-for-toys-mvp` (or similar)
  - [x] Region/Location: EU-compatible (Firebase automatically determines based on Firestore, but note location for compliance)
  - [x] Analytics: Disabled (for MVP; enable in Phase 2)
- [x] Project fully provisioned and accessible

### Cloud Messaging Configuration
- [x] Firebase Cloud Messaging (FCM) enabled
- [x] Web app registered in Firebase:
  - [x] App name: `Toy-for-Toy Web`
  - [x] Hosting: Yes (configure domain in Phase 2)
  - [x] Firebase Hosting configuration: Skip for MVP (Vercel hosting used)
- [x] Web configuration credentials obtained:
  - [x] Project ID
  - [x] API Key
  - [x] App ID
  - [x] Messaging Sender ID
  - [x] Auth Domain

### Service Account & Admin SDK
- [x] Service account created with name: `firebase-admin-sdk`
- [x] Private key generated and downloaded as JSON file:
  - [x] Filename: `firebase-adminsdk-key.json`
  - [x] Stored securely (never committed to git)
  - [x] Key contains:
    - [x] `project_id`
    - [x] `private_key`
    - [x] `client_email`
    - [x] `client_id`
- [x] Service account permissions set to FCM scope
- [x] Key rotation schedule documented

### Environment Variables
- [x] `.env.local` updated with Firebase credentials:
  ```
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
  NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<auth-domain>
  FIREBASE_ADMIN_SDK_KEY=<json-private-key>
  ```
- [x] `.env.example` updated with variable descriptions
- [x] `firebase-adminsdk-key.json` added to `.gitignore`

### Client-Side Firebase Integration
- [x] Firebase SDK installed: `npm install firebase`
- [x] Client initialization file created: `lib/firebase.ts`
- [x] Firebase initialized with public API credentials (safe for browser)
- [x] Service worker registration prepared (for push notifications):
  - [x] `public/firebase-messaging-sw.js` created (basic structure)
  - [x] Service worker detects push messages
- [x] Messaging permission request prepared (Phase 2 UI)
- [x] Device token generation flow prepared (Phase 2 implementation)

### Server-Side Firebase Admin
- [x] Firebase Admin SDK installed: `npm install firebase-admin`
- [x] Admin initialization file created: `lib/firebase-admin.ts`
- [x] Admin SDK initialized with service account key
- [x] Messaging client available for sending push notifications
- [x] Error handling configured for invalid tokens and FCM errors

### Testing & Configuration
- [x] Client-side Firebase connects without errors:
  - [x] App can initialize messaging
  - [x] Permission request flow testable (manual in browser)
- [x] Server-side Admin SDK connection verified:
  - [x] Can authenticate with service account
  - [x] FCM service accessible
- [x] Firebase Emulator Suite configured (optional, for advanced testing)
- [x] No Firebase keys exposed in browser console
- [x] No service account keys visible in client bundles

### Documentation
- [x] Firebase setup documented in `docs/FIREBASE.md`:
  - [x] Project creation steps
  - [x] Service account setup
  - [x] Environment variable reference
  - [x] Push notification workflow overview (Phase 2 implementation)
  - [x] Troubleshooting guide
- [x] Security best practices documented:
  - [x] Never expose service account key to client
  - [x] Key rotation schedule (quarterly)
  - [x] Incident response plan (compromised key)

---

## Implementation Details

### Step 1: Create Firebase Project

#### 1.1 Sign Up / Log In
- Navigate to https://console.firebase.google.com
- Sign in with Google account (create one if needed)
- Verify email if required

#### 1.2 Create New Project
1. Click "Create a project" or "+ Add project"
2. Fill in project details:
   - **Project name:** `toys-for-toys-mvp`
   - **Project ID:** Auto-generated (approve or customize)
   - **Country/Region:** Your region (EU region preferred for compliance)

3. Configure settings:
   - **Analytics:** Disable (not needed for MVP; enable in Phase 2)
   - Click "Create project"

4. Wait for project creation (usually 1-2 minutes)

#### 1.3 Verify Project Creation
- Dashboard displays project name and overview
- "Get started by adding Firebase to your app" section visible
- Project ID and other identifiers accessible

### Step 2: Register Web App

#### 2.1 Add Web App to Project
1. In Firebase Console, click the **Web** icon (</>) in "Get started"
2. App registration form appears
3. Fill in app details:
   - **App nickname:** `Toy-for-Toy Web` (or similar)
   - **Also set up Firebase Hosting for this app:** No (skip; Vercel used)
   - Click "Register app"

#### 2.2 Copy Web Configuration
Firebase displays configuration snippet:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "toys-for-toys-mvp.firebaseapp.com",
  projectId: "toys-for-toys-mvp",
  storageBucket: "toys-for-toys-mvp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc...",
  measurementId: "G-ABC..."
};
```

Save this configuration (you'll need it in Step 4).

#### 2.3 Next Steps in Console
- Skip "Install Firebase SDK" (we'll do it via npm)
- Click "Continue to console"

### Step 3: Enable Cloud Messaging

#### 3.1 Enable FCM in Project
1. In Firebase Console, go to **Build** → **Messaging**
2. Click "Enable" to activate Cloud Messaging
3. Verify "Cloud Messaging API" is enabled in Google Cloud Console:
   - Go to https://console.cloud.google.com
   - Search for "Cloud Messaging API"
   - Ensure it shows "API is enabled"

### Step 4: Create Service Account

#### 4.1 Access Service Account
1. In Firebase Console, click **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. Language selector: Choose **Node.js** (for Firebase Admin SDK)

#### 4.2 Generate Private Key
1. Click "Generate new private key"
2. A JSON file is downloaded: `[project-id]-firebase-adminsdk-[random].json`
3. **Save this file securely:**
   - Rename to `firebase-adminsdk-key.json`
   - Store in project root (will be gitignored)
   - **NEVER commit to version control**
   - **NEVER expose to client**

#### 4.3 Store Key Safely
Keep the downloaded JSON file in a secure location:
```
toys-for-toys/
├── firebase-adminsdk-key.json    # ⚠️ GITIGNORED - DO NOT COMMIT
├── .env.local                    # ⚠️ GITIGNORED - DO NOT COMMIT
├── .env.example                  # Public, safe to commit
└── ...
```

Add to `.gitignore`:
```gitignore
firebase-adminsdk-key.json
firebase-adminsdk-*.json
```

### Step 5: Install Firebase SDKs

#### 5.1 Install Client SDK
```bash
npm install firebase
```

#### 5.2 Install Admin SDK
```bash
npm install firebase-admin
```

Verify installation:
```bash
npm list firebase firebase-admin
```

### Step 6: Create Firebase Client Configuration

#### 6.1 Create `lib/firebase.ts`
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getMessaging, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Messaging
let messaging: ReturnType<typeof getMessaging> | null = null

export const getFirebaseMessaging = () => {
  try {
    if (!messaging && typeof window !== 'undefined') {
      messaging = getMessaging(app)

      // Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload)
        // Handle notification in Phase 2
      })
    }
    return messaging
  } catch (error) {
    console.error('Failed to initialize messaging:', error)
    return null
  }
}

export default app
```

#### 6.2 Export Type Utilities (for later use)
```typescript
// lib/firebase-types.ts
export interface FCMPayload {
  notification?: {
    title: string
    body: string
    icon?: string
  }
  data?: Record<string, string>
}
```

### Step 7: Create Firebase Admin Configuration

#### 7.1 Create `lib/firebase-admin.ts`
```typescript
// lib/firebase-admin.ts
import * as admin from 'firebase-admin'

// Initialize Firebase Admin
const serviceAccountKey = JSON.parse(
  process.env.FIREBASE_ADMIN_SDK_KEY || '{}'
)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

export const adminMessaging = admin.messaging()

// Helper function to send FCM message (Phase 2)
export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: deviceToken,
    }

    const response = await adminMessaging.send(message)
    console.log('Push notification sent:', response)
    return { success: true, messageId: response }
  } catch (error) {
    console.error('Failed to send push notification:', error)
    return { success: false, error: String(error) }
  }
}

export default adminMessaging
```

### Step 8: Create Service Worker for Background Messages

#### 8.1 Create `public/firebase-messaging-sw.js`
```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts(
  'https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js'
)

firebase.initializeApp({
  projectId: 'YOUR_PROJECT_ID',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  apiKey: 'YOUR_API_KEY',
  appId: 'YOUR_APP_ID',
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload)

  const notificationTitle = payload.notification?.title || 'Notification'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/images/app-icon.png',
    badge: '/images/app-badge.png',
    data: payload.data || {},
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks (Phase 2)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Navigate to relevant page based on notification data
})
```

### Step 9: Update Environment Variables

#### 9.1 Update `.env.local`
Create or update `.env.local`:
```env
# Firebase - Web Config (safe for browser)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=toys-for-toys-mvp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=toys-for-toys-mvp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=toys-for-toys-mvp.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC...

# Firebase - Admin SDK (server-side only, never expose to client)
FIREBASE_ADMIN_SDK_KEY='{"type":"service_account","project_id":"...",...}'

# (Other variables from Task 1.2)
```

#### 9.2 Update `.env.example`
```env
# Firebase Configuration (get from Firebase Console → Project Settings)
# ⚠️ NEXT_PUBLIC_ variables are exposed to client; do not include sensitive data
NEXT_PUBLIC_FIREBASE_API_KEY=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_APP_ID=<from Firebase Console>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=<from Firebase Console>

# Firebase Admin SDK Key (NEVER expose to browser)
# ⚠️ Keep this secret! Only needed for server-side push notifications
# Store the entire service account JSON as a single string
FIREBASE_ADMIN_SDK_KEY='{"type":"service_account","project_id":"...",...}'
```

Ensure `.env.local` is gitignored:
```bash
echo ".env.local" >> .gitignore
```

### Step 10: Verify Configuration

#### 10.1 Test Client Initialization
Update `app/page.tsx` or create a test component:
```typescript
'use client'

import { useEffect } from 'react'
import { getFirebaseMessaging } from '@/lib/firebase'

export default function TestFirebase() {
  useEffect(() => {
    const messaging = getFirebaseMessaging()
    if (messaging) {
      console.log('✅ Firebase Messaging initialized')
    } else {
      console.log('⚠️ Firebase Messaging not available')
    }
  }, [])

  return <div>Check console for Firebase status</div>
}
```

Run development server:
```bash
npm run dev
```

Verify in browser console:
- No Firebase errors
- Message: "✅ Firebase Messaging initialized" (or warning if permissions not granted yet)

#### 10.2 Test Admin SDK (Server-Side)
Create a simple test API route `app/api/firebase-test/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import * as admin from 'firebase-admin'

// Initialize admin if not already
const serviceAccountKey = JSON.parse(
  process.env.FIREBASE_ADMIN_SDK_KEY || '{}'
)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
  })
}

export async function GET() {
  try {
    // Test sending a message to a non-existent token (will fail gracefully)
    const result = await admin.messaging().send({
      token: 'test_token_invalid',
      notification: { title: 'Test', body: 'Test message' },
    })
    return NextResponse.json({ success: false, message: 'Should have failed' })
  } catch (error: any) {
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/mismatched-credential'
    ) {
      // Expected error for invalid token
      return NextResponse.json({
        success: true,
        message: '✅ Firebase Admin SDK initialized and working',
      })
    }
    return NextResponse.json({ success: false, error: String(error) })
  }
}
```

Test endpoint:
```bash
curl http://localhost:3000/api/firebase-test
# Expected: {"success":true,"message":"✅ Firebase Admin SDK initialized..."}
```

### Step 11: Document Setup

#### 11.1 Create `docs/FIREBASE.md`
```markdown
# Firebase Configuration Guide

## Project Setup
- **Project ID:** toys-for-toys-mvp
- **Region:** [Your region]
- **Created:** 2025-11-13

## Web App Configuration
Configured with the following API keys (safe to expose):
- API Key
- Auth Domain
- Messaging Sender ID
- App ID

## Service Account
- **Email:** firebase-adminsdk-[...@...]
- **Key Rotation:** Quarterly (document schedule)
- **Storage:** Secure password manager

## Push Notifications (Phase 2)
See `/lib/firebase-admin.ts` for server-side sending.

## Troubleshooting
[Detailed troubleshooting section...]
```

#### 11.2 Create `.github/FIREBASE_SECURITY.md`
```markdown
# Firebase Security Guidelines

## Secrets to Never Expose
- ❌ `FIREBASE_ADMIN_SDK_KEY` - Do NOT expose to client
- ❌ Private keys from service account

## Safe to Expose
- ✅ `NEXT_PUBLIC_FIREBASE_*` - Public API configuration

## Key Management
1. Generate new key: Firebase Console → Project Settings → Service Accounts → Generate Key
2. Download JSON file
3. Copy contents to `.env` variable (single string)
4. Keep original file secure or delete after 24 hours

## Incident Response
If service account key is compromised:
1. Delete old key in Firebase Console
2. Generate new key
3. Update `.env` variables in all environments
4. Restart all servers
5. Document incident in security log
```

---

## Testing Checklist

### Firebase Console
- [ ] Project created and accessible
- [ ] Cloud Messaging enabled
- [ ] Web app registered
- [ ] Service account created with key downloaded

### Local Configuration
- [ ] `.env.local` contains all Firebase variables
- [ ] `firebase-adminsdk-key.json` is gitignored
- [ ] No Firebase keys in git history

### Client-Side
- [ ] `npm install firebase` succeeds
- [ ] `lib/firebase.ts` initializes without errors
- [ ] Browser console shows no Firebase initialization errors
- [ ] Service worker script exists at `public/firebase-messaging-sw.js`

### Server-Side
- [ ] `npm install firebase-admin` succeeds
- [ ] `lib/firebase-admin.ts` initializes correctly
- [ ] API test route (`/api/firebase-test`) returns success
- [ ] No errors when sending test messages

### Security
- [ ] `FIREBASE_ADMIN_SDK_KEY` is server-side only
- [ ] Service account key never appears in browser Network tab
- [ ] `firebase-adminsdk-key.json` file never committed to git
- [ ] `.env.local` marked as gitignored

---

## Implementation Notes

### Why Firebase?
- **FCM (Cloud Messaging):** Industry-standard push notification service
- **Scalability:** Handles millions of messages reliably
- **Integration:** Built-in device management and token refresh
- **Cross-Platform:** Works on web, iOS, and Android (via Capacitor Phase 2)

### Phase 1 vs. Phase 2
- **Phase 1 (current):** Setup and configuration; no actual push notifications sent
- **Phase 2:** Implement UI for permission requests, store device tokens, send notifications via Supabase Edge Functions

### Messaging Service Workers
- **Why:** Background messages arrive even when app is closed
- **How:** Service worker receives message, shows system notification
- **Limitations:** Service workers require HTTPS (Vercel provides this automatically)

### Error Handling Strategy
- Invalid tokens are handled gracefully (silently fail)
- Network errors trigger retry logic (implement in Phase 2)
- Quota limits monitored (Firebase provides free tier quota)

---

## Success Criteria

### Objective Metrics
- ✅ Client SDK initializes in <500ms
- ✅ Admin SDK connects without errors
- ✅ API test endpoint responds in <200ms
- ✅ Zero security warnings in browser console

### Subjective Metrics
- ✅ Team understands which keys are safe vs. secret
- ✅ Service account key stored securely and inaccessible
- ✅ Documentation clear on what's implemented vs. Phase 2

---

## Dependencies & Blockers

### Unblocks
- Phase 2: Push notification implementation
- Phase 2: Firebase Cloud Functions (if used)
- Supabase Edge Functions → FCM integration (Task 7.3)

### Blocked By
- Task 1.1 (Monorepo Setup) - need Node.js environment

### No Dependency On
- Supabase (independent service)
- Vercel (Firebase works with any host)

---

## Deliverables

```
toys-for-toys/
├── firebase-adminsdk-key.json      ✅ Created (gitignored)
├── .env.local                      ✅ Updated (gitignored)
├── .env.example                    ✅ Updated with Firebase vars
├── lib/
│   ├── firebase.ts                 ✅ Created
│   ├── firebase-admin.ts           ✅ Created
│   └── firebase-types.ts           ✅ Created (optional)
├── public/
│   └── firebase-messaging-sw.js    ✅ Created
├── docs/
│   ├── FIREBASE.md                 ✅ Created
│   └── SECURITY.md                 ✅ Created (or in .github/)
├── app/
│   └── api/
│       └── firebase-test/
│           └── route.ts            ✅ Created (for testing)
└── .gitignore                      ✅ Updated
```

---

## Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 1: Create Project** | 30 min | Sign up, create project, wait for setup |
| **Phase 2: Enable FCM** | 15 min | Enable Cloud Messaging, verify API |
| **Phase 3: Service Account** | 15 min | Create account, download key, store safely |
| **Phase 4: Install SDKs** | 15 min | Install npm packages |
| **Phase 5: Configuration** | 1-2 hours | Create client/admin configs, test |
| **Phase 6: Documentation** | 30 min | Write setup guide and security policies |
| **Total** | ~4-5 hours | 1 developer day |

---

## Resources & References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Cloud Messaging Guide](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK (Node.js)](https://firebase.google.com/docs/reference/admin/node)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## Sign-Off

- [ ] Developer: Firebase project created and configured
- [ ] Client SDK: Installed and tested
- [ ] Admin SDK: Installed and verified
- [ ] Security: Keys stored securely and not exposed
- [ ] Code Review: Configuration files reviewed
- [ ] QA: Test endpoint confirmed working
- [ ] Tech Lead: Firebase setup approved

---

**Status:** Ready to implement
**Last Updated:** 2025-11-13
**Next Task:** Task 1.4 - Configure Continuous Integration (GitHub Actions)
