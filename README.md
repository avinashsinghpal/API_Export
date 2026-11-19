# ExportLeads — Localhost B2B Buyer-Discovery & Sourcing Engine

**ExportLeads** is a local-first B2B buyer-discovery, enrichment, and AI-classification dashboard tailored for Indian exporters targeting overseas markets.

- **Default Scenario:** Product = *Singing Bowls* (Category: *Home Decor / Wellness*), Origin = *India*, Destination = *United States*.
- **Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (New York style), Recharts, TanStack Query, Prisma ORM with local SQLite (`./data/app.db`), and Google Gemini 1.5 Flash.
- **Runs with ONE command:** `npm run dev` (no Docker, no Redis, no queue servers, no cloud database required).

---

## 1. Quick Start Guide

### 1.1 Prerequisites
- **Node.js:** v20.x or v22.x
- **Package Manager:** `npm` (v10+)
- **OS:** Windows, macOS, or Linux

### 1.2 Installation & Setup
```bash
# 1. Clone the repository
git clone https://github.com/avinashsinghpal/API_Export.git
cd API_Export

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Create your local environment file
cp .env.example .env.local

# 4. Generate Prisma Client & Initialize local SQLite database
npx prisma generate
npx prisma db push

# 5. (Optional) Pre-seed local database with singing bowls leads
node scripts/seed-sqlite.mjs

# 6. Start the local engine
npm run dev
```

Open your browser to: **[http://localhost:3000](http://localhost:3000)**

---

## 2. API Keys & Free Quota Setup

ExportLeads runs in **Local Demo Mode** out of the box using realistic pre-seeded US buyer directory data. To execute live searches against real US businesses, configure your free API keys:

### 2.1 Google Places API (New)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `exportleads-discovery`).
3. Navigate to **APIs & Services &rarr; Library** and search for **Places API (New)**. Click **Enable**.
4. Go to **APIs & Services &rarr; Credentials** and click **Create Credentials &rarr; API key**.
5. Copy your key into `.env.local`:
   ```bash
   GOOGLE_PLACES_API_KEY="AIzaSyYourGeneratedPlacesKeyHere"
   ```

### 2.2 How to Set a Quota Cap & Budget Alert in Google Cloud
To guarantee you stay 100% within Google Cloud's free tier:
1. In Google Cloud Console, navigate to **Billing &rarr; Budgets & alerts**.
2. Click **Create Budget**. Name it `ExportLeads Free Tier Guard`.
3. Set the budget amount to **$10.00 / month**. Check the boxes for alerts at **50% ($5.00)** and **90% ($9.00)** sent to your email.
4. Navigate to **APIs & Services &rarr; Enabled APIs &rarr; Places API (New) &rarr; Quotas**.
5. Locate **Text Search Requests** and edit the quota limit to **100 requests per day**.
6. ExportLeads also enforces a local safety stop defined by `MONTHLY_PLACES_REQUEST_LIMIT="100"` in `.env.local` to prevent accidental overages.

### 2.3 Google Gemini API (AI Classification)
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API key** (free tier includes 15 RPM).
3. Paste the key into `.env.local`:
   ```bash
   GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
   ```

---

## 3. First-Search Walkthrough (Step-by-Step)

Follow these steps to perform your first live buyer discovery:

1. **Open the Dashboard:** Navigate to [http://localhost:3000](http://localhost:3000).
2. **Go to Buyer Discovery:** Click **"Buyer Discovery"** in the sidebar.
3. **Configure Search Parameters:**
   - **Product:** `Singing Bowls`
   - **Category:** `Home Decor`
   - **Destination:** `United States`
   - **State:** `Texas`
   - **City:** `Austin`
   - **Target Buyer Types:** Select `Wholesalers`, `Showrooms`, `Importers`, and `Wellness Stores`.
   - Notice the **Pre-Run Estimate banner**: `Pre-Run Estimate: ~4 targeted queries (Austin, Texas) • 4 Places API Calls • 7d Cache Active`.
4. **Execute Discovery:**
   - Click the green **"Run Discovery"** button.
   - The live SSE terminal streams real-time queries:
     - `wholesaler Singing Bowls Austin Texas`
     - `showroom Singing Bowls Austin Texas`
     - Deduplication shielding cross-references root domains and email hashes.
5. **Enrich Discovered Contacts:**
   - Click **"Leads Database"** in the sidebar.
   - Select the newly discovered leads using the checkboxes.
   - Click **"Enrich Selected"** in the floating action bar. The polite crawler visits each company's `/contact` and `/about` pages, extracts direct buyer email addresses, phones, and decision-maker names, and sets the source URL reference.
6. **Validate Deliverability:**
   - Click **"Email Validation"** in the sidebar.
   - Inspect the **Deliverability Breakdown** chart. Click **"Run Hygiene Scan"** to perform live RFC syntax, disposable blocklist, and DNS MX checks.
7. **Inspect AI B2B Classification:**
   - Click **"AI Classification"** in the sidebar.
   - Observe the semantic classification results: B2B wholesalers vs consumer accounts, confidence gauges, and reasoning explanations.
   - Adjust the **Confidence Threshold** slider or use the inline `<Select>` on any row to manually override the decision.

---

## 4. Manual Sourcing Toolkit

For trade fair attendees and manual outreach, the **Manual Sourcing Toolkit** (accessible under **Buyer Discovery &rarr; Non-IT Exporter Sourcing Playbook**) generates customized search operators and direct deep links:

- **LinkedIn Recruiter String:** Dynamically generated query using active product keywords, buyer titles (`Buyer`, `Procurement Manager`, `Purchasing`), and target state/city. Includes one-click copy and direct link.
- **Google & Maps Dork Search:** Filtered queries eliminating retail consumer aggregators (`-amazon -walmart -ebay`).
- **8 Direct Trade Directories:**
  1. **ImportYeti:** US Customs bills of lading and container consignee records.
  2. **ThomasNet:** North American commercial and industrial distributors.
  3. **Faire:** Wholesale boutique and retail showroom marketplace.
  4. **Alibaba:** International buyer inquiries.
  5. **IndiaMART:** Exporter catalog comparisons.
  6. **Yellow Pages US:** State & city-level commercial business listings.
  7. **Yelp:** Regional acoustic, sound therapy, and gift showrooms.
  8. **Chamber of Commerce:** US metropolitan business chambers.

---

## 5. Cold-Calling & Sourcing Workflows

- **Call List Tab:** In the **Leads Database** section, click the **"Call List"** toggle to view only leads with phone numbers.
- **Caller Drawer:** Click any lead to open the slide-over Sheet. Toggle the **"Marked as Called"** badge, review decision-maker profiles, and type follow-up notes in the caller scratchpad. All notes persist directly to `./data/app.db`.
- **Database Backup & Reset:**
  - In **Settings &rarr; Data & Privacy**, click **"Download Backup"** to get a timestamped `.db` SQLite backup.
  - In **Settings &rarr; Danger Zone**, use the **"Wipe Database"** action to reset or purge local data with confirmation safeguards.

---

## 6. Testing

Run the full Vitest unit test suite (28 passing tests):
```bash
npm test
```
The test suite validates:
- E.164 phone normalization, root-domain extraction, and state abbreviation mapping (`tests/normalizer.test.ts`).
- Root-domain deduplication and Jaro-Winkler company fuzzy matching (`tests/dedupe.test.ts`).
- RFC-822 syntax, disposable domains, and DNS MX resolution (`tests/dns.test.ts`).
- Places multi-angle query building (`tests/places-queries.test.ts`).
- Monthly quota safety counters (`tests/quota.test.ts`).
- Polite crawler email extraction and SSRF private IP rejection (`tests/crawler.test.ts`).
- Gemini structured JSON output validation and consumer filtering (`tests/gemini.test.ts`).
- Anti-spam scoring and merge token resolution (`tests/spam-risk.test.ts`).
