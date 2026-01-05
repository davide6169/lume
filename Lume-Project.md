# Lume - Lead Unified Mapping Enrichment

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Software Architecture](#software-architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [User Guide](#user-guide)
- [Development Guide](#development-guide)
- [Deployment](#deployment)

---

## Project Overview

**Lume** is an AI-powered lead management platform designed to extract, enrich, and manage contact information from Facebook and Instagram social media platforms. The application enables businesses to create custom audiences for Facebook/Instagram Ads through intelligent contact extraction from social media content.

### Value Proposition

- **AI-Powered Extraction**: Automatically extract contacts from Facebook/Instagram posts and comments
- **Multi-Source Enrichment**: Enhance contact data using Apollo.io and Hunter.io APIs
- **Smart Filtering**: Create complex logical filters to segment audiences
- **Meta Ads Integration**: Direct upload to Meta Custom Audiences or CSV export
- **Cost Tracking**: Monitor API usage costs across all services in real-time
- **Demo Mode**: Test all features without using real API credits

### Target Users

- Digital Marketing Agencies
- E-commerce Businesses
- Social Media Managers
- Lead Generation Specialists
- Facebook/Instagram Advertisers

---

## Key Features

### 1. Source Audience Management
- **Create Collections**: Organize Facebook/Instagram URLs into source audiences
- **Multiple Sources**: Support for Facebook pages, groups, posts; Instagram profiles and media
- **Batch Processing**: Select and process multiple audiences simultaneously
- **Status Tracking**: Real-time status updates (pending, processing, completed, failed)

### 2. Contact Extraction Pipeline
**Multi-Stage Enrichment Process:**
1. **Content Fetching**: Retrieve posts/comments from Meta GraphAPI
2. **AI Extraction**: Use LLM (OpenRouter) to extract structured contact data
3. **Regex Pattern Matching**: Extract emails and phone numbers
4. **Data Validation**: Filter incomplete contacts (missing required fields)
5. **Email Finding**: Hunter.io Email Finder for missing emails
6. **Contact Enrichment**: Apollo.io for missing names and company data
7. **Email Verification**: Hunter.io Email Verifier
8. **Vector Embeddings**: Mixedbread AI for semantic search capability

### 3. Audience Management
- **Shared Audiences**: View extracted contacts with full details
- **Contact Details**: First name, last name, email, phone, city, country, interests
- **Logical Filtering**: Create complex filter rules with AND/OR logic
- **Export Options**: CSV export (Meta Ads compliant format)
- **Direct Upload**: Upload directly to Meta Custom Audiences

### 4. Filter System
**Supported Fields:**
- First Name, Last Name, Email, Phone
- City, Country, Interests

**Operators:**
- CONTAINS, EQUALS, NOT
- STARTS_WITH, ENDS_WITH
- GT (Greater Than), LT (Less Than)

**Logical Operators:**
- AND: All conditions must be true
- OR: At least one condition must be true

### 5. Cost Tracking
- **Real-time Monitoring**: Track costs as they accumulate
- **Per-Service Breakdown**: View costs by API service
- **Operation-Level Tracking**: See costs for individual operations
- **Historical Data**: Access cost history via dashboard

### 6. Demo Mode
- **Risk-Free Testing**: Test all features without spending credits
- **Realistic Simulation**: Simulated API calls with accurate delays
- **Data Isolation**: Demo data stored separately from production
- **Instant Toggle**: Switch between demo and production modes

### 7. System Logging
- **Admin-Only Access**: Comprehensive system logs for administrators
- **Multiple Log Levels**: info, warn, error, debug
- **Detailed Metadata**: Request/response data for API calls
- **Export Functionality**: Export logs for analysis

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.1 | React framework with App Router |
| **TypeScript** | 5.7 | Type-safe development |
| **TailwindCSS** | 4 | Utility-first styling |
| **shadcn/ui** | Latest | Pre-built UI components (Radix UI) |
| **Zustand** | 5.0 | State management with persist middleware |
| **Recharts** | 3.6 | Data visualization |
| **Lucide React** | Latest | Icon library |
| **next-themes** | Latest | Dark mode support |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | - | Serverless backend |
| **Supabase** | Latest | PostgreSQL database & auth |
| **PostgreSQL** | 15 | Relational database with pgvector |
| **pgvector** | Latest | Vector similarity search |

### External APIs
| Service | Purpose | Pricing Model |
|---------|---------|---------------|
| **Meta GraphAPI** | v19.0 | Fetch FB/IG content | Free |
| **OpenRouter** | LLM API | Contact extraction | ~$0.0001/token |
| **Mixedbread AI** | Embeddings | Semantic search | ~$0.00001/token |
| **Apollo.io** | Enrichment | Find missing data | $0.02/enrichment |
| **Hunter.io** | Email tools | Verify/find emails | $0.0013-0.003/call |

### Development Tools
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Git**: Version control
- **GitHub**: Repository hosting
- **Vercel**: Deployment platform

---

## Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Pages      │  │ Components   │  │   Stores     │       │
│  │ (App Router) │  │  (React/UI)   │  │  (Zustand)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │API Routes    │  │Middlewares   │  │Server Actions│       │
│  │(app/api/)    │  │(Auth/Protect)│  │(auth/actions)│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │JobProcessor  │  │API Integrations│ │Business Logic│       │
│  │(Async Jobs)  │  │(Meta/Apollo/  │  │(Extraction/  │       │
│  │              │  │Hunter/etc)   │  │Enrichment)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Supabase     │  │ PostgreSQL   │  │ pgvector     │       │
│  │ Client       │  │ Database     │  │ Embeddings   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Production Mode Flow
```
User Action (Search)
    ↓
Client (Zustand Store)
    ↓
API Route (/api/source-audiences/start)
    ↓
JobProcessor.createJob()
    ↓
Async Processing (Don't await)
    ↓
Return jobId to client
    ↓
Client polls /api/jobs/[id] every 2s
    ↓
Job Progress Updates
    ↓
Meta GraphAPI → Fetch Posts/Comments
    ↓
ContactExtractor → Regex + AI Extraction
    ↓
Hunter.io → Email Finder/Verifier
    ↓
Apollo.io → Contact Enrichment
    ↓
Mixedbread → Vector Embeddings
    ↓
Supabase → Store Contacts
    ↓
Job Complete
    ↓
Client updates Zustand + Supabase
```

#### Demo Mode Flow
```
User Action (Search)
    ↓
Client (useDemoStore)
    ↓
Simulated Job Processing
    ↓
Delays + Progress Updates
    ↓
Fake Data Generation
    ↓
Cost Calculation (Simulated)
    ↓
Complete Job
    ↓
Store in useDemoStore (localStorage only)
```

---

## Software Architecture

### Component Architecture

#### Page Structure
```
app/
├── (auth)/                    # Authentication pages (public)
│   ├── login/
│   └── signup/
├── (dashboard)/               # Protected pages (require auth)
│   ├── dashboard/            # Statistics overview
│   ├── source-audiences/     # URL collection management
│   ├── shared-audiences/     # Extracted contacts
│   ├── filters/              # Filter builder
│   ├── settings/             # Configuration
│   ├── logs/                 # Admin logs
│   └── docs/                 # Documentation
└── api/                      # Backend routes
```

#### Component Hierarchy

**Dashboard Components:**
```
DashboardPage
├── StatsCards
├── CostChart (Recharts)
└── RecentActivity
```

**Source Audience Components:**
```
SourceAudiencePage
├── SourceAudienceList
│   └── SourceAudienceCard
├── CreateSourceAudienceDialog
└── SourceAudienceActions
```

**Shared Audience Components:**
```
SharedAudiencePage
├── SharedAudienceList
│   └── SharedAudienceCard
├── ContactTable
├── ExportCSVButton
└── UploadToMetaButton
```

**Shared Components:**
```
LogViewer
├── LogLevelFilter
├── LogCard (flip animation)
└── LogExportDialog
```

### State Management Architecture

**Zustand Stores:**

1. **useDemoStore** - Demo mode state
   ```typescript
   interface DemoState {
     isDemoMode: boolean
     demoSourceAudiences: SourceAudience[]
     demoSharedAudiences: SharedAudience[]
     demoLogs: LogEntry[]
     totalCost: number
     costBreakdown: CostBreakdown[]
     setIsDemoMode: (enabled) => void
     // ... CRUD operations
   }
   ```

2. **useSettingsStore** - User preferences
   ```typescript
   interface SettingsState {
     demoMode: boolean
     logsEnabled: boolean
     selectedLlmModel: string
     selectedEmbeddingModel: string
     apiKeys: Record<string, string>
     // ... setters
   }
   ```

3. **useSourceAudiencesStore** - Source audience state
4. **useSharedAudiencesStore** - Shared audience state
5. **useFiltersStore** - Filter rules
6. **useSearchProgressStore** - Job progress tracking

**Persist Middleware:**
- All stores use `persist` middleware
- Stored in `localStorage` with keys:
  - `lume-demo-storage` (demo data)
  - `lume-settings` (user preferences)
  - `lume-source-audiences` (source audiences)
  - `lume-shared-audiences` (shared audiences)
  - `lume-filters` (filter rules)

### Job Processing System

**Singleton Pattern:**
```typescript
class JobProcessor {
  private static instance: JobProcessor
  private jobs: Map<string, Job>

  static getInstance(): JobProcessor {
    if (!JobProcessor.instance) {
      JobProcessor.instance = new JobProcessor()
      // Use globalThis to persist across HMR
      if (typeof globalThis !== 'undefined') {
        globalThis.__jobProcessorJobs = this.jobs
      }
    }
    return instance
  }
}
```

**Job Lifecycle:**
```
pending → processing → completed/failed/cancelled
```

**Job Types:**
- `SEARCH`: Extract contacts from source audiences
- `UPLOAD_TO_META`: Upload to Meta Custom Audiences

**Progress Tracking:**
- Progress: 0-100%
- Timeline: Array of events with timestamps
- Status updates every 2s via polling

---

## Database Schema

### Tables Overview

#### **profiles**
User profile information linked to Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id`: UUID matching Supabase Auth user ID
- `email`: User email address
- `full_name`: User's full name
- `role`: 'admin' or 'user' (first user is automatically admin)

**Relationships:**
- One-to-many with all user-owned tables

#### **source_audiences**
Collections of Facebook/Instagram URLs for processing.

```sql
CREATE TABLE source_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('facebook', 'instagram')),
  urls JSONB NOT NULL DEFAULT '[]',
  selected BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `urls`: Array of URL strings
- `selected`: Batch selection flag
- `status`: Processing state
- `error_message`: Error details if failed

**Indexes:**
- `idx_source_audiences_user_status` on (user_id, status)

#### **shared_audiences**
Result audiences containing extracted contacts.

```sql
CREATE TABLE shared_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_audience_id UUID REFERENCES source_audiences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contacts JSONB NOT NULL DEFAULT '[]',
  selected BOOLEAN DEFAULT false,
  uploaded_to_meta BOOLEAN DEFAULT false,
  meta_audience_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `contacts`: Array of contact objects (JSONB)
- `uploaded_to_meta`: Meta Custom Audience upload flag
- `meta_audience_id`: Meta's audience ID (after upload)

**Relationships:**
- Many-to-one with source_audiences

#### **contacts**
Normalized contact storage with vector embeddings.

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_audience_id UUID NOT NULL REFERENCES shared_audiences(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  interests JSONB DEFAULT '[]',
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Features:**
- `embedding`: 1536-dim vector for similarity search (pgvector)
- `interests`: Array of interest tags

**Indexes:**
- `idx_contacts_email` on (email)
- `idx_contacts_embedding` on (embedding) (vector index)

#### **filters**
Logical filter rules for contact segmentation.

```sql
CREATE TABLE filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rules JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Rules Structure:**
```json
[
  {
    "field": "firstName",
    "operator": "CONTAINS",
    "value": "John",
    "logicalOperator": "AND"
  },
  {
    "field": "city",
    "operator": "EQUALS",
    "value": "New York",
    "logicalOperator": "OR"
  }
]
```

#### **settings**
User preferences and encrypted API keys.

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_keys JSONB NOT NULL DEFAULT '{}',
  demo_mode BOOLEAN NOT NULL DEFAULT true,
  selected_llm_model TEXT,
  logs_enabled BOOLEAN NOT NULL DEFAULT true,
  selected_embedding_model TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Security Note:**
- API keys are stored in browser localStorage (client-side only)
- Never transmitted to server for security

#### **cost_tracking**
Track API usage costs per service.

```sql
CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service TEXT CHECK (service IN ('supabase', 'openrouter', 'mixedbread', 'apollo', 'hunter')),
  operation TEXT NOT NULL,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  units INTEGER,
  unit_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Cost Tracking:**
- Per-operation cost calculation
- Aggregated by service and user
- Dashboard visualization

#### **logs**
System-wide logging (admin-only).

```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  level TEXT CHECK (level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Row Level Security:**
- Only admins can read logs
- All authenticated users can write (via API)

### Security: Row Level Security (RLS)

All tables have RLS policies enabled:

```sql
-- Example for source_audiences
CREATE POLICY "Users can view own source audiences"
  ON source_audiences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own source audiences"
  ON source_audiences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own source audiences"
  ON source_audiences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own source audiences"
  ON source_audiences FOR DELETE
  USING (user_id = auth.uid());

-- Admin override
CREATE POLICY "Admins can view all source audiences"
  ON source_audiences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## API Endpoints

### Authentication & User Management

#### `GET /api/user/profile`
Get current user profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "admin"
}
```

#### `POST /api/auth/meta/callback`
Meta OAuth callback handler.

**Query Params:**
- `code`: OAuth authorization code
- `state`: OAuth state parameter

### Source Audiences

#### `GET /api/source-audiences`
List all source audiences for current user.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Facebook Group Leads",
    "type": "facebook",
    "urls": ["https://facebook.com/groups/123", "..."],
    "selected": false,
    "status": "completed",
    "created_at": "2025-01-05T10:00:00Z"
  }
]
```

#### `POST /api/source-audiences`
Create new source audience.

**Body:**
```json
{
  "name": "My Facebook Group",
  "type": "facebook",
  "urls": ["https://facebook.com/groups/123"]
}
```

#### `POST /api/source-audiences/start`
Start contact extraction job.

**Body:**
```json
{
  "sourceAudienceIds": ["uuid-1", "uuid-2"],
  "sharedAudienceName": "Extracted Leads"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job-uuid",
  "message": "Search started successfully"
}
```

### Shared Audiences

#### `GET /api/shared-audiences`
List all shared audiences.

**Query Params:**
- `filterId`: (optional) Apply filter

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Extracted Leads",
    "contacts": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "city": "New York",
        "country": "USA"
      }
    ],
    "uploaded_to_meta": false
  }
]
```

#### `POST /api/shared-audiences`
Create shared audience manually.

#### `POST /api/upload-meta`
Upload to Meta Custom Audiences.

**Body:**
```json
{
  "sharedAudienceId": "uuid"
}
```

### Filters

#### `GET /api/filters`
List all filters.

#### `POST /api/filters`
Create new filter.

**Body:**
```json
{
  "name": "US Contacts",
  "rules": [
    {
      "field": "country",
      "operator": "EQUALS",
      "value": "USA",
      "logicalOperator": "AND"
    }
  ]
}
```

### Jobs

#### `GET /api/jobs/[id]`
Get job status and progress.

**Response:**
```json
{
  "id": "job-uuid",
  "type": "SEARCH",
  "status": "processing",
  "progress": 45,
  "timeline": [
    {
      "event": "SEARCH_STARTED",
      "timestamp": "2025-01-05T10:00:00Z",
      "details": {}
    }
  ]
}
```

#### `DELETE /api/jobs/[id]`
Cancel running job.

### Dashboard

#### `GET /api/dashboard`
Get dashboard statistics.

**Query Params:**
- `demoMode`: boolean

**Response:**
```json
{
  "sourceAudiencesCount": 5,
  "totalUrls": 23,
  "contactsCount": 1523,
  "uploadedToMetaCount": 3,
  "totalCost": 12.45,
  "costBreakdown": [
    { "service": "apollo", "cost": 5.20 },
    { "service": "hunter", "cost": 3.15 }
  ]
}
```

### Settings

#### `POST /api/settings/save`
Save settings to database.

**Body:**
```json
{
  "demoMode": false,
  "logsEnabled": true
}
```

#### `POST /api/settings/test-api`
Test API endpoint with scenarios.

**Body:**
```json
{
  "serviceKey": "openrouter",
  "scenarioId": "chat-completion",
  "apiKey": "sk-...",
  "isDemoMode": false
}
```

**Response:**
```json
{
  "success": true,
  "simulated": false,
  "outcome": "PASS",
  "request": { ... },
  "response": { ... }
}
```

### Logs (Admin Only)

#### `GET /api/logs`
List all logs (admin only).

**Query Params:**
- `level`: (optional) Filter by level

#### `DELETE /api/logs/[id]`
Delete specific log entry (admin only).

---

## User Guide

### Getting Started

#### 1. Sign Up / Log In
- Navigate to `/login` or `/signup`
- Create account with email and password
- First user automatically becomes admin

#### 2. Configure API Keys
- Go to **Settings** → **API Keys** tab
- Enter API keys for services:
  - **Meta (Facebook/Instagram)**: Required for fetching content
  - **OpenRouter**: Required for AI contact extraction
  - **Mixedbread**: Required for embeddings
  - **Apollo.io**: Required for contact enrichment
  - **Hunter.io**: Required for email verification/finding
- Click **Save API Keys**
- Use **Test** button to verify each API key

#### 3. Create Source Audience
- Navigate to **Source Audiences**
- Click **+ Create Source Audience**
- Enter:
  - **Name**: e.g., "Facebook Group - Tech Enthusiasts"
  - **Type**: Facebook or Instagram
  - **URLs**: One URL per line
    - Facebook: pages, groups, posts
    - Instagram: profiles, media
- Click **Create**

#### 4. Extract Contacts
- Select source audiences (checkboxes)
- Click **Search** button in toolbar
- Job starts immediately
- Monitor progress in real-time
- View results in **Shared Audiences**

#### 5. Manage Contacts
- Go to **Shared Audiences**
- View extracted contacts in table
- Use **Filters** to segment contacts
- **Export to CSV** or **Upload to Meta**

### Demo Mode

**Enable Demo Mode:**
- Toggle **Demo** switch in header (purple sparkles icon)
- All API calls are simulated
- No real costs incurred
- Perfect for testing features

**Demo Mode Features:**
- Pre-populated demo source audiences
- Simulated contact extraction
- Realistic cost tracking
- Progress updates

### Filtering Contacts

**Create Filter:**
1. Navigate to **Filters**
2. Click **+ Create Filter**
3. Add rules:
   - Select field (firstName, email, city, etc.)
   - Select operator (CONTAINS, EQUALS, etc.)
   - Enter value
   - Choose logical operator (AND/OR)
4. Add more rules as needed
5. Enter filter name
6. Click **Save**

**Apply Filter:**
- Go to **Shared Audiences**
- Select audience
- Click **Filter** button
- Choose saved filter
- View filtered results

### Export to Meta Ads

**Option 1: CSV Export**
1. In Shared Audiences, select audience
2. Click **Export to CSV**
3. File is Meta Ads compliant format
4. Upload to Meta Ads Manager

**Option 2: Direct Upload**
1. In Shared Audiences, select audience
2. Click **Upload to Meta**
3. Grant Meta permissions if prompted
4. Audience created in Meta Ads Manager

### Cost Monitoring

**View Costs:**
- Dashboard shows total cost
- Cost breakdown chart by service
- Real-time updates during jobs

**Cost Breakdown:**
- **OpenRouter**: Per-token pricing
- **Mixedbread**: Per-token pricing
- **Apollo.io**: Per-enrichment
- **Hunter.io**: Per-call (finder/verifier)
- **Meta**: Free

---

## Development Guide

### Local Development Setup

#### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Meta Developer account
- API accounts for external services

#### Installation

```bash
# Clone repository
git clone https://github.com/davide6169/lume.git
cd lume

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure environment variables
nano .env.local
```

#### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Meta
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
META_ACCESS_TOKEN=your-access-token

# External APIs
OPENROUTER_API_KEY=your-openrouter-key
MIXEDBREAD_API_KEY=your-mixedbread-key
APOLLO_API_KEY=your-apollo-key
HUNTER_API_KEY=your-hunter-key

# Encryption
ENCRYPTION_KEY=your-encryption-key
```

#### Run Development Server

```bash
npm run dev
```

Navigate to http://localhost:3000

#### Database Setup

```bash
# Apply migrations
npx supabase db push

# Or manually run SQL files
psql -h db.project.supabase.co -U postgres -d postgres < supabase/migrations/001_initial_schema.sql
```

### Project Structure Deep Dive

#### App Router Structure

```
app/
├── (auth)/                    # Unauthenticated routes
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/               # Authenticated routes
│   ├── layout.tsx            # Dashboard layout with nav
│   ├── page.tsx              # Redirect to /dashboard
│   ├── dashboard/
│   │   └── page.tsx          # Stats overview
│   ├── source-audiences/
│   │   ├── page.tsx          # List + create
│   │   └── [id]/
│   │       └── page.tsx      # Detail view
│   ├── shared-audiences/
│   │   └── page.tsx          # List + manage
│   ├── filters/
│   │   └── page.tsx          # Filter builder
│   ├── settings/
│   │   └── page.tsx          # Configuration
│   ├── logs/
│   │   └── page.tsx          # Admin logs
│   └── docs/
│       └── page.tsx          # Documentation
└── api/                      # Backend routes
```

#### Component Organization

```
components/
├── ui/                        # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── common/                    # Shared components
│   └── LogViewer.tsx
├── dashboard/                 # Dashboard-specific
│   ├── StatsCards.tsx
│   └── CostChart.tsx
├── source-audiences/
│   ├── SourceAudienceList.tsx
│   ├── SourceAudienceCard.tsx
│   └── CreateDialog.tsx
├── shared-audiences/
│   ├── SharedAudienceList.tsx
│   ├── SharedAudienceCard.tsx
│   └── ContactTable.tsx
├── filters/
│   ├── FilterBuilder.tsx
│   └── FilterList.tsx
├── providers/
│   ├── supabase-provider.tsx
│   └── job-notification-provider.tsx
└── icons/
    └── lume-logo.tsx
```

#### Service Layer

```
lib/services/
├── job-processor.ts          # Job management singleton
├── meta-graphapi.ts          # Meta API integration
├── contact-extractor.ts      # Contact extraction logic
├── apollo-enrichment-stub.ts # Apollo.io integration
├── hunter-io-stub.ts         # Hunter.io integration
├── demo-mode.ts              # Demo simulation
└── api-usage-stub.ts         # Cost tracking
```

#### State Management

```
lib/stores/
├── useDemoStore.ts           # Demo mode state
├── useSettingsStore.ts       # User preferences
├── useSourceAudiencesStore.ts # Source audiences
├── useSharedAudiencesStore.ts # Shared audiences
├── useFiltersStore.ts        # Filters
└── useSearchProgressStore.ts # Job progress
```

### Key Development Patterns

#### 1. Server Components vs Client Components

**Server Components** (default):
- Database queries
- API route handlers
- Authentication checks

```typescript
// Default: Server Component
export default function DashboardPage() {
  const supabase = createSupabaseServerClient()
  const { data: profiles } = await supabase.from('profiles').select('*')
  return <Dashboard data={profiles} />
}
```

**Client Components** (with 'use client'):
- Interactive UI
- State management
- Event handlers

```typescript
'use client'
export function SearchButton() {
  const [loading, setLoading] = useState(false)
  const handleClick = () => { ... }
  return <Button onClick={handleClick}>Search</Button>
}
```

#### 2. Authentication Flow

```typescript
// Middleware: Check auth on protected routes
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}
```

#### 3. Database Queries

```typescript
// Server-side query
const supabase = createSupabaseServerClient()
const { data, error } = await supabase
  .from('source_audiences')
  .select('*')
  .eq('user_id', user.id)
```

#### 4. Error Handling

```typescript
try {
  const result = await apiCall()
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  console.error('[API] Error:', error)
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  )
}
```

#### 5. Job Processing Pattern

```typescript
// Create job (don't await)
const job = JobProcessor.getInstance().createJob({
  type: 'SEARCH',
  userId: user.id,
  data: { sourceAudienceIds }
})

// Start async processing
processJobAsync(job.id)

// Return job ID immediately
return NextResponse.json({ success: true, jobId: job.id })

// Client polls for updates
const poll = setInterval(async () => {
  const response = await fetch(`/api/jobs/${jobId}`)
  const { data: job } = await response.json()
  updateProgress(job.progress)

  if (job.status === 'completed') {
    clearInterval(poll)
    handleComplete(job.result)
  }
}, 2000)
```

### Testing

#### Run Tests

```bash
# Unit tests (when available)
npm test

# E2E tests (when available)
npm run test:e2e

# Type checking
npx tsc --noEmit
```

#### API Testing

Use the **Settings** → **API Keys** tab:
1. Configure API key
2. Click **Test** button
3. View detailed request/response

### Debugging

#### Enable Debug Mode

```typescript
// Set log level to debug
useSettingsStore.getState().setLogsEnabled(true)

// View logs at /logs (admin only)
```

#### Console Logs

```typescript
// Job processing logs
console.log('[JobProcessor] Job started:', jobId)
console.log('[JobProcessor] Progress:', progress)
console.log('[JobProcessor] Timeline:', timeline)

// API logs
console.log('[API] Request:', { endpoint, method, body })
console.log('[API] Response:', { status, data })
```

#### Timeline Events

Each job has a timeline array:
```json
[
  { "event": "SEARCH_STARTED", "timestamp": "...", "details": {} },
  { "event": "FETCHING_CONTENT", "timestamp": "...", "details": { "url": "..." } },
  { "event": "EXTRACTING_CONTACTS", "timestamp": "...", "details": { "count": 150 } }
]
```

---

## Deployment

### Vercel Deployment

#### 1. Prepare for Deployment

```bash
# Build project
npm run build

# Test production build locally
npm run start
```

#### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# - All SUPABASE_* variables
# - META_* variables
# - External API keys
# - ENCRYPTION_KEY
```

#### 3. Configure Supabase

```bash
# Update site URL in Supabase
# Project Settings → API → URL

# Configure Meta OAuth
# Project Settings → Authentication → Providers → Facebook
# Callback URL: https://your-domain.vercel.app/api/auth/meta/callback
```

#### 4. Configure Meta App

```bash
# Go to Meta Developers Portal
# Your App → Settings → Basic

# Add redirect URIs:
# - https://your-domain.vercel.app/api/auth/meta/callback
# - https://your-domain.vercel.app

# Set permissions:
# - pages_show_list
# - groups_access_member_info
# - instagram_basic
# - instagram_manage_comments
```

### Environment Variables Checklist

**Required:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `ENCRYPTION_KEY`

**Optional (for production mode):**
- [ ] `META_APP_ID`
- [ ] `META_APP_SECRET`
- [ ] `META_ACCESS_TOKEN`
- [ ] `OPENROUTER_API_KEY`
- [ ] `MIXEDBREAD_API_KEY`
- [ ] `APOLLO_API_KEY`
- [ ] `HUNTER_API_KEY`

### Post-Deployment

**1. Verify Database**
- Run migrations: `npx supabase db push`
- Check tables created
- Verify RLS policies

**2. Test Authentication**
- Sign up new account
- Verify profile creation
- Check admin assignment

**3. Test Demo Mode**
- Enable demo mode
- Create test source audience
- Run search job
- Verify simulated data

**4. Configure Production APIs** (optional)
- Add real API keys
- Test each service
- Run small batch job
- Verify costs tracked correctly

**5. Monitor Logs**
- Access /logs as admin
- Check for errors
- Verify all services working

---

## Troubleshooting

### Common Issues

#### 1. Job Stuck in "Processing"
**Solution:**
- Check browser console for errors
- Verify API keys are valid
- Check /api/jobs/[id] endpoint
- Restart server if using globalThis persistence issue

#### 2. Demo Mode Not Working
**Solution:**
- Check localStorage in browser DevTools
- Verify useDemoStore initialization
- Clear localStorage and reload

#### 3. API Tests Failing
**Solution:**
- Verify API keys are correct
- Check service status pages
- Ensure sufficient credits/quota
- Check network tab for failed requests

#### 4. Meta Upload Failing
**Solution:**
- Verify Meta access token is valid
- Check token permissions
- Ensure audience has contacts
- Check Meta API rate limits

#### 5. Costs Not Showing
**Solution:**
- Enable logging in settings
- Check cost_tracking table
- Verify API usage stub is tracking calls
- Refresh dashboard

### Debug Mode

Enable comprehensive logging:

```typescript
// In browser console
localStorage.setItem('lume-debug', 'true')

// Then reload page
```

### Support

For issues or questions:
- GitHub Issues: https://github.com/davide6169/lume/issues
- Documentation: /docs page in app
- Admin Logs: Check /logs (if admin)

---

## License

Proprietary - All rights reserved

---

## Changelog

### Version 1.0.0 (January 2025)
- Initial release
- Demo mode system
- Source audience management
- Contact extraction pipeline
- Meta Ads integration
- Cost tracking
- Admin logging
- API testing interface
- New logo design
