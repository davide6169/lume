# Lume - Lead Unified Mapping Enrichment Platform

A complete multi-tenant SaaS platform for extracting, enriching, and managing contact data from Facebook and Instagram audiences using AI-powered automation.

---

## Table of Contents

1. [Overview](#overview)
2. [Value Proposition](#value-proposition)
3. [Target Users](#target-users)
4. [Core Features](#core-features)
5. [Technology Stack](#technology-stack)
6. [Architecture](#architecture)
7. [Database Schema](#database-schema)
8. [API Integrations](#api-integrations)
9. [Security](#security)
10. [Configuration](#configuration)
11. [Deployment](#deployment)

---

## Overview

**Lume** is an AI-powered lead management platform that helps businesses:
- Extract contact information from Facebook/Instagram social media interactions
- Enrich contact data with multiple professional databases
- Build custom audiences for Meta advertising campaigns
- Track and manage all associated costs automatically

**Current Version:** v1.4.0
**Last Updated:** January 2026
**License:** Proprietary

---

## Value Proposition

### For Marketing Teams
- **Automated Lead Generation**: Extract contacts from social media without manual data entry
- **AI-Powered Enrichment**: Automatically find missing emails, names, and professional data
- **Direct Meta Ads Integration**: Upload custom audiences in one click
- **Cost Tracking**: Monitor all API costs in real-time

### For Business Owners
- **Multi-Tenant Architecture**: Each organization has isolated data and API keys
- **Demo Mode**: Test the entire platform without using real API credits
- **Configurable Workflows**: Adjust scraping limits, retention policies, and AI models
- **Comprehensive Logging**: Full audit trail of all operations

---

## Target Users

- **Marketing Agencies**: Manage lead generation for multiple clients
- **E-commerce Businesses**: Build custom audiences from social engagement
- **B2B Companies**: Enrich social leads with professional contact data
- **Startups**: Cost-effective lead generation without expensive tools

---

## Core Features

### 1. Source Audience Management

Create and manage source audiences from social media URLs:

**Supported Platforms:**
- Facebook Posts
- Instagram Posts
- Instagram Reels

**URL Management:**
- Add multiple URLs per audience
- Bulk URL import via CSV
- URL validation and parsing
- Status tracking (pending, processing, completed, failed)

**Audience Types:**
- Facebook audiences (post comments)
- Instagram audiences (post comments, reel comments)

---

### 2. AI-Powered Contact Extraction

**LLM-Based Extraction:**
- Extracts first name, last name, email from social media comments
- Configurable LLM models via OpenRouter
- Default: mistral-7b-instruct:free (can be changed in settings)

**Extraction Pipeline:**
1. Fetch comments from Facebook/Instagram using Apify
2. Parse comment text using LLM
3. Extract structured contact data
4. Validate extracted data

**Configurable Limits:**
- Facebook Posts Limit: 1-10,000 (default: 100)
- Instagram Comments Limit: 1-10,000 (default: 100)

---

### 3. Contact Enrichment

**Multi-Stage Enrichment Process:**

**Stage 1: Email Finding (Hunter.io)**
- Finds professional email addresses
- 60% success rate for partial contacts
- Cost: $0.02 per search

**Stage 2: Contact Enrichment (Apollo.io)**
- Recovers missing names and job titles
- Adds professional data (company, LinkedIn, phone, location)
- 70% success rate for remaining partials
- Cost: $0.03 per enrichment

**Stage 3: Email Verification (Hunter.io)**
- Verifies all email addresses
- Ensures deliverability before uploading to Meta
- Cost: $0.001 per verification

**Smart Filtering:**
- Automatic removal of partial contacts
- CSV export of discarded contacts for review
- Meta compliance (email + first_name + last_name required)

---

### 4. Semantic Search & Filtering

**Vector Embeddings:**
- Automatic embedding generation using Mixedbread AI
- Model: mxbai-embed-large-v1 (configurable)
- Semantic similarity search across all contacts

**Filter System:**
- Create custom filter rules
- Operators: CONTAINS, EQUALS, NOT, STARTS_WITH, ENDS_WITH, GT, LT
- Logical operators: AND, OR
- Combine multiple filters for complex queries
- Real-time filter application

**Filter Capabilities:**
- Filter by any contact field
- Save and reuse filters
- Combine with semantic search
- Export filtered results

---

### 5. Shared Audiences & Meta Integration

**Audience Management:**
- Combine multiple source audiences
- Remove duplicates automatically
- Apply filters before sharing
- Preview audience before export

**Meta Custom Audiences:**
- One-click upload to Meta Ads
- Automatic audience creation via GraphAPI
- Track upload status
- Support for large audiences (10,000+ contacts)

**Export Options:**
- CSV export
- JSON export
- Direct upload to Meta Custom Audiences

---

### 6. Cost Tracking & Dashboard

**Real-Time Cost Tracking:**

**Tracked Services:**
- **OpenRouter**: LLM contact extraction (~$0.000001/token)
- **Mixedbread AI**: Vector embeddings (~$0.00000001/token)
- **Apollo.io**: Contact enrichment ($0.03/enrichment)
- **Hunter.io Finder**: Email finding ($0.02/search)
- **Hunter.io Verifier**: Email verification ($0.001/verification)
- **Apify**: Web scraping (~$0.003/result average)
- **Meta GraphAPI**: Free

**Dashboard Features:**
- Total cost across all services
- Cost breakdown by service with percentages
- Visual bar charts with color coding
- 7-day activity tracking
- Real-time updates as jobs complete
- Persistent storage in database

---

### 7. Demo Mode

**Production Demo Access (v1.1.4+):**
- **JWT-based Demo Authentication**: Secure demo account for first-time access
- **Zero-Configuration Deployment**: Deploy on Vercel without database env variables
- **Dedicated Client Deployments**: Share demo credentials offline with clients
- **Demo Credentials**: `demo@lume.app` / `Lume#Secure$2026!Pr0d@Acc3ss`
- **Auto-Activation**: Demo mode automatically activates when demo user logs in
- **Seamless Transition**: Configure own database in Settings → switch to production

**Production Deployment Workflow:**
1. Deploy to Vercel with only demo env variables
2. Share demo credentials with client offline
3. Client logs in → automatic demo mode
4. Client configures their database in Settings
5. Future logins use configured database

**Full Platform Simulation:**
- Test all features without using real API credits
- Realistic demo data generation
- Same UX as production mode
- Perfect for training and evaluation

**Demo Behavior:**
- Simulated API delays
- Realistic token usage
- Demo source audiences and contacts
- Simulated cost tracking
- Admin features enabled for testing

---

### 8. User Management & Approval System

**Multi-Tenant Architecture:**
- Each organization has isolated data
- Row-Level Security (RLS) in PostgreSQL
- User-specific API keys and settings

**User Roles:**
- **Admin**: Full access, can approve users, manage settings
- **User**: Standard access, pending approval until approved

**Approval Workflow:**
- New users sign up as "pending"
- Admins approve users via Users page
- Pending users locked in Demo mode
- First user = admin + auto-approved

---

### 9. Settings & Configuration

**API Keys Management:**
- Apify (Facebook/Instagram scraping)
- OpenRouter (LLM models)
- Mixedbread (Embeddings)
- Apollo.io (Contact enrichment)
- Hunter.io (Email tools)
- Each key has test button for validation
- AES-256 encryption in localStorage
- Export/import settings as JSON

**Database Configuration:**
- Multi-tenant Supabase setup
- Users configure their own database
- Connection testing with real-time validation
- Required for production mode

**Preferences:**
- LLM model selection
- Embedding model selection
- Facebook posts limit (1-10,000, default: 100)
- Instagram comments limit (1-10,000, default: 100)
- Log retention days (1-30, default: 3)

**Import/Export:**
- Export all settings including API keys (with security warning)
- Import settings from JSON file
- Perfect for team onboarding

---

### 10. System Logging

**Automatic Job Logging:**
- Jobs automatically save logs on completion
- Complete timeline captured including:
  - Apify token validation
  - Facebook/Instagram scraping events
  - LLM extraction events
  - Contact enrichment events
  - All other timeline events

**Log Management:**
- Configurable retention (1-30 days, default: 3)
- Automatic cleanup of old logs
- Server-side cleanup after job completion
- Admin-only access (Settings → Logs)

**Log Features:**
- Interactive display with expandable cards
- Export individual or all logs to TXT
- Filter by level (error, warn, info, debug)
- Full event timeline with details
- Error logging with context

---

### 11. Security & Encryption

**Client-Side Encryption:**
- AES-256 encryption for API keys
- Custom storage middleware for Zustand
- Automatic encryption on save
- Automatic decryption on load
- No plain text keys in localStorage

**Server-Side Security:**
- Row-Level Security (RLS) policies
- User isolation enforced at database level
- Admin-only operations protected
- Secure session management

**API Security:**
- Supabase authentication
- Server-side API route protection
- Input validation with Zod
- SQL injection prevention
- XSS protection

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
| **CryptoJS** | Latest | AES-256 encryption for sensitive data |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | - | Serverless backend |
| **Supabase** | Latest | PostgreSQL database & auth |
| **PostgreSQL** | 15 | Relational database with pgvector |
| **pgvector** | Latest | Vector similarity search |

### External APIs
| Service | Purpose | Pricing |
|---------|---------|---------|
| **Apify** | Web scraping | Instagram: $1.50/1K results, Facebook: ~$5/100 results |
| **OpenRouter** | LLM API | ~$0.0001/token |
| **Mixedbread AI** | Embeddings | ~$0.00001/token |
| **Apollo.io** | Enrichment | $0.03/enrichment |
| **Hunter.io** | Email tools | $0.0013-0.003/call |

---

## Architecture

### Multi-Tenant Architecture

**User Isolation:**
- Each organization has its own Supabase database
- Users configure their database URL and anon key
- Row-Level Security (RLS) ensures data isolation
- No cross-tenant data access possible

**Database Setup:**
- Admin configures master database
- Regular users connect via their own Supabase projects
- Shared schema across all tenants
- Migration scripts for setup

---

### Database Schema

**Tables:**

**profiles**
- id (UUID, PK)
- email (text, unique)
- full_name (text)
- role (enum: admin/user)
- status (enum: pending/approved)
- created_at (timestamp)
- updated_at (timestamp)

**source_audiences**
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- name (text)
- type (enum: facebook/instagram)
- urls (text array)
- selected (boolean)
- status (enum: pending/processing/completed/failed)
- error_message (text)
- created_at (timestamp)
- updated_at (timestamp)

**shared_audiences**
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- source_audience_id (UUID, FK → source_audiences)
- source_audience_type (enum: facebook/instagram)
- name (text)
- contacts (JSONB)
- selected (boolean)
- uploaded_to_meta (boolean)
- meta_audience_id (text)
- created_at (timestamp)
- updated_at (timestamp)

**filters**
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- name (text)
- rules (JSONB)
- created_at (timestamp)
- updated_at (timestamp)

**logs**
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- level (enum: error/warn/info/debug)
- message (text)
- metadata (JSONB)
- created_at (timestamp)

**cost_tracking**
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- service (text)
- operation (text)
- cost (numeric)
- units (numeric)
- unit_type (text)
- created_at (timestamp)

**user_settings**
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- settings (JSONB)
- created_at (timestamp)
- updated_at (timestamp)

---

### Component Architecture

**Main Application Layout:**
- Dashboard layout with navigation
- Job notification provider
- Real-time updates via polling
- Theme support (light/dark)

**Key Components:**
- **SourceAudienceList**: Manage source audiences
- **SharedAudienceList**: Manage enriched audiences
- **FilterManager**: Create and apply filters
- **LogViewer**: View system logs
- **UserManagement**: Admin user approvals
- **Settings**: Configure API keys and preferences

**Job Processing:**
- Background job processor with timeline updates
- Real-time progress tracking
- Automatic cost calculation
- Error handling and recovery

---

## API Integrations

### Apify Integration

**Usage:** Web scraping for Facebook and Instagram

**Features:**
- Token validation before use
- Facebook posts scraper
- Instagram comments scraper
- Configurable result limits
- Automatic retry on failure
- Cost tracking per result

**Endpoints:**
- `POST /v2/acts/apify~instagram-scraper/runs`
- `POST /v2/acts/apify~facebook-posts-scraper/runs`

### OpenRouter Integration

**Usage:** LLM-based contact extraction

**Features:**
- Multiple model support
- Token-based pricing
- Configurable model selection
- Usage tracking per job

**Default Model:** mistral-7b-instruct:free

### Mixedbread AI Integration

**Usage:** Vector embeddings for semantic search

**Features:**
- High-quality embeddings
- Token-based pricing
- Configurable model selection
- Similarity search in PostgreSQL

**Default Model:** mxbai-embed-large-v1

### Apollo.io Integration

**Usage:** Contact data enrichment

**Features:**
- Email and name enrichment
- Professional data retrieval
- Credit-based pricing
- Usage tracking

### Hunter.io Integration

**Usage:** Email finding and verification

**Features:**
- Email finder API
- Email verifier API
- Separate pricing per operation
- High deliverability rate

### Meta GraphAPI Integration

**Usage:** Custom audience upload

**Features:**
- Automatic audience creation
- Batch upload support
- Status tracking
- Free to use

---

## Security

### Authentication & Authorization

**Authentication:**
- Supabase Auth (email/password)
- Session management
- Automatic token refresh
- Secure cookie handling

**Authorization:**
- Role-based access control (admin/user)
- Row-Level Security (RLS)
- User ownership verification
- Admin-only endpoints protected

### Data Encryption

**Client-Side:**
- AES-256 encryption for API keys
- Encrypted storage in localStorage
- Automatic decryption on load
- No plain text storage

**Transit:**
- HTTPS only
- Supabase secure connections
- API key transmission in headers

### Input Validation

**Zod Schemas:**
- Runtime type validation
- Input sanitization
- SQL injection prevention
- XSS protection

---

## Configuration

### Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key

**Optional (for multi-tenant):**
- None (users configure their own databases)

### Settings Store

**Persisted Settings:**
- API keys (encrypted)
- LLM model selection
- Embedding model selection
- Source data limits (Facebook & Instagram retrieval limits)
- Log retention days
- Database configuration
- Demo mode toggle

**Storage:**
- Zustand with persist middleware
- localStorage with encryption
- Automatic sync with database

---

## Deployment

### Development

```bash
npm install
npm run dev
```

Access at: http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

1. **Supabase Project:**
   - Create new project at supabase.com
   - Run migration scripts
   - Configure RLS policies

2. **API Keys:**
   - Sign up for external API services
   - Configure keys in Settings
   - Test each connection

3. **First User:**
   - Sign up via /signup
   - Automatically becomes admin
   - Approve other users

---

## Cost Estimation

### Per-Job Costs

**Small Job (100 contacts from 1 URL):**
- Apify scraping: ~$0.30
- LLM extraction: ~$0.10
- Embeddings: ~$0.01
- Enrichment: ~$3.00
- Email finder/verifier: ~$1.20
- **Total: ~$4.61 per 100 contacts**

**Large Job (1,000 contacts from 10 URLs):**
- Apify scraping: ~$3.00
- LLM extraction: ~$1.00
- Embeddings: ~$0.10
- Enrichment: ~$30.00
- Email finder/verifier: ~$12.00
- **Total: ~$46.10 per 1,000 contacts**

### Monthly Estimates

**Light Usage (1,000 contacts/month):**
- ~$46/month in API costs
- Suitable for small businesses

**Medium Usage (10,000 contacts/month):**
- ~$461/month in API costs
- Suitable for marketing agencies

**Heavy Usage (100,000 contacts/month):**
- ~$4,610/month in API costs
- Suitable for large enterprises

---

## Support & Documentation

**Documentation:**
- In-app Docs page (comprehensive guides)
- Lume-Project-History.md (development history)
- API documentation for external services

**Getting Started:**
1. Configure API keys in Settings
2. Create Source Audiences with social URLs
3. Click "Search" to extract contacts
4. Review Shared Audiences
5. Apply filters or upload to Meta

**Demo Mode:**
- Enable in Settings (or automatically for pending users)
- Test all features without spending credits
- Same UX as production mode

---

## License & Attribution

**License:** Proprietary - All rights reserved

**Technologies Used:**
- Next.js by Vercel
- Supabase for backend
- shadcn/ui components
- External APIs: Apify, OpenRouter, Mixedbread, Apollo.io, Hunter.io

**Attribution:**
- Logo and branding: Custom design
- Icons: Lucide React
- Fonts: Inter (Google Fonts)

---

**End of Document**

For detailed development history and feature additions over time, see [Lume-Project-History.md](./Lume-Project-History.md)
