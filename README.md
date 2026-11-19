# ExportLeads — Production B2B International Buyer-Discovery & Outreach Engine

**ExportLeads** is an automated B2B buyer-discovery, enrichment, AI-classification, and cold-outreach dashboard built for Indian exporters targeting overseas markets.

- **Default Demo Scenario:** Product = *Singing Bowls* (Category: *Home Decor / Wellness*), Origin = *India*, Destination = *United States*.
- **Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (new-york style), Recharts, TanStack Query, Prisma ORM, and Google Gemini 1.5 Flash.

---

## 1. Quick Start

### 1.1 Prerequisites
- Node.js 20+ or 22+
- PostgreSQL database (e.g. Neon, Supabase, or AWS RDS)
- Google Cloud Account with Places API (New), Custom Search API, and Gmail API enabled

### 1.2 Installation
```bash
# Clone the repository
git clone https://github.com/avinashsinghpal/API_Export.git
cd API_Export

# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables template
cp .env.example .env.local

# Generate Prisma Client & Run Migrations
npx prisma generate
npx prisma db push

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 2. Real Data Sources & Architecture

The system executes a strictly sequential, compliant discovery pipeline:
`Search Discovery → Normalization → Deduplication → Email Validation → Gemini Classification → Gmail Outreach`.

### Supported Discovery Providers
1. **Google Places API (New):** Executes Text Searches (`places:searchText`) targeting commercial showrooms, gift boutiques, and wholesale hubs in specific US cities.
2. **Google Programmable Search (CSE):** Discovers direct importers and distributors via web indexes.
3. **Apollo.io API:** Queries decision-makers by trade keywords and job titles (`Buyer`, `Purchaser`, `Owner`, `Curator`).
4. **Polite Web Crawler:** Enriches prospect domains by checking `robots.txt`, identifying itself with `ExportLeads-DiscoveryBot/1.0`, throttling to max 1 req/2s, respecting `noindex`, and extracting mailto links and wholesale indicators.
5. **CSV/XLSX Bulk Ingestion:** Server-side parsing with Papaparse, Zod validation, and root-domain deduplication.

---

## 3. Deliverability Safeguards & Compliance

### 3.1 CAN-SPAM & International Anti-Spam Requirements
- **Physical Address:** Automatically embeds the exporter's registered postal address in the footer of every message.
- **One-Click Unsubscribe:** Generates signed tokens pointing to `/unsubscribe/[token]` and inserts `List-Unsubscribe` + `List-Unsubscribe-Post` headers.
- **Suppression Engine:** Immediately quashes all sends to unsubscribed or bounced addresses.

### 3.2 Automated Gmail Throttling
- Daily cap defaults to 40 emails/day with a warm-up ramp to protect new domains.
- Jittered random intervals (60s–180s) between dispatches.
- Real-time **Spam-Risk Meter** auditing link density, attachment payload, and trigger phrases.

---

## 4. Google Cloud Platform Configuration

### 4.1 OAuth Consent Screen
1. Go to **Google Cloud Console** > **APIs & Services** > **OAuth consent screen**.
2. Select **External**, fill in App Name (`ExportLeads`) and Developer Email.
3. Under **Scopes**, add:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
4. Add your test exporter Gmail account as a test user.

### 4.2 API Keys
Enable the following in **APIs & Services** > **Library**:
- **Places API (New)**
- **Custom Search API**
- **Gmail API**

---

## 5. Exporter Domain DNS Setup (SPF, DKIM, DMARC)

To achieve >95% inbox placement in the US, configure your DNS records:

1. **SPF (TXT Record):**
   ```
   v=spf1 include:_spf.google.com ~all
   ```
2. **DKIM (TXT Record):**
   Generate 2048-bit key in Google Workspace Admin Console (`Apps > Google Workspace > Gmail > Authenticate email`) and publish the TXT record on your domain.
3. **DMARC (TXT Record at `_dmarc.yourdomain.com`):**
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourdomain.com; pct=100
   ```

---

## 6. Running Tests

```bash
# Run Vitest unit tests (normalization, deduplication, spam risk, DNS validation)
npm test
```

---

## 7. Deployment (Vercel + Neon)

1. Push your repository to GitHub.
2. Import the project into **Vercel**.
3. In **Settings > Environment Variables**, add the values from `.env.example`.
4. Deploy! Vercel automatically runs `next build` and generates static and edge routes.
