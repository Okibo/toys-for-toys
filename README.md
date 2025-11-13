# 🧸 Toy-for-Toy (Private Repo)

> **The Eco-Friendly, Cashless Toy Exchange Platform.**
> *Give a toy, get a ticket, take a toy.*

[![CI](https://github.com/pawelkalkun/toys-for-toys/actions/workflows/ci.yml/badge.svg)](https://github.com/pawelkalkun/toys-for-toys/actions/workflows/ci.yml) ![Project Status](https://img.shields.io/badge/Status-MVP%20Development-orange) ![License](https://img.shields.io/badge/License-Proprietary-red) ![Stack](https://img.shields.io/badge/Tech-Next.js%20%7C%20Supabase%20%7C%20Capacitor-green)

## 🔒 Confidentiality Notice

**This is a private, proprietary project.**
The source code, design architectures, and business logic contained in this repository are confidential and proprietary to the owner. Unauthorized copying, distribution, or public display of this code is strictly prohibited.

---

## 📖 Project Overview

**Toy-for-Toy** is a cross-platform mobile and web application designed to solve the problem of expensive toys and short attention spans via a cashless exchange model.

**Business Core:**
Unlike standard marketplaces, **no money changes hands between users**. The economy is based on a closed-loop **Ticket System (1-for-1)** supported by Ad-Revenue.

### 🌟 Key Features

* **Ticket Economy (1-for-1):** A simplified exchange model. 1 Toy = 1 Ticket.
* **Anti-Fraud Escrow:** Tickets are "frozen" during the transaction until the item is verified.
* **Smart Wishlist:** Uses a structured Category + Tag system for instant matching.
* **Mini-Games (Retention):** Daily educational games to earn ticket fragments (supported by Rewarded Video Ads).
* **Native Ad Integration:** Non-intrusive ads powered by AdMob/AdSense.

---

## ⚙️ System Logic

### The "Ticket" System 🎟️
We replaced monetary value with a barter token to ensure fairness:
1.  **Listing:** User B lists a toy.
2.  **Request:** User A spends **1 Ticket**.
3.  **Escrow:** The Ticket is locked by the system.
4.  **Release:** Upon delivery confirmation (or 48h timeout), the **1 Ticket** is released to User B.

### Monetization Strategy 💰
* **Native Display Ads:** Targeted based on child age/interests.
* **Rewarded Video Ads:** Voluntary ads within Mini-Games.

---

## 🛠️ Tech Stack

The project is built as a monorepo sharing logic between Web and Mobile. We utilize the **Supabase Ecosystem** heavily to minimize backend complexity.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (React)** | Core application logic, SEO-friendly WebApp. |
| **Mobile** | **Capacitor** | Native wrapper for iOS/Android. |
| **Backend** | **Supabase** | PostgreSQL DB, Auth, and Edge Functions. |
| **Storage** | **Supabase Storage** | Storing toy images. Integrated with Auth RLS (Row Level Security). |
| **Hosting** | **Vercel** | Frontend deployment. |
| **Background Push** | **Firebase (FCM)** | Wake-up notifications (e.g., "New Match Found") triggered via Edge Functions. |
| **Live Updates** | **Supabase Realtime** | In-app live state updates (e.g., Chat, Ticket Balance update). |
| **Transactional** | **SendGrid** | Email notifications (Password reset, Weekly summary). |

---

## 🚀 Local Development Setup

Follow these steps to set up the development environment.

### Prerequisites
* Node.js (v18+)
* npm or yarn
* Supabase CLI (optional)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd toy-for-toy
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory with your Supabase credentials:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access app at: [http://localhost:3000](http://localhost:3000)

5.  **Mobile Build (Capacitor)**
    ```bash
    npm run build
    npx cap sync
    npx cap open android  # Opens Android Studio
    ```

---

## 📂 Structure Overview

```text
/
├── components/        # UI Components (Cards, Ads, Modals)
├── pages/            # Next.js Routes
├── lib/              # Supabase Client & Utils
├── styles/           # Tailwind CSS
├── public/           # Assets
└── supabase/         # DB Schema, Storage Policies & Edge Functions