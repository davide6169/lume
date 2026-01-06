# [NOME CLIENTE] - Lume Lead Management Platform

Piattaforma AI-powered per l'estrazione, arricchimento e gestione di contatti da Facebook e Instagram.

## 🚀 Quick Start

### Accesso alla Piattaforma

- **URL Produzione:** https://app.[cliente-dominio].it
- **Admin:** [Nome Admin] ([email])
- **Documentazione:** [Link documentazione interna]

### Primo Accesso

1. Vai su: https://app.[cliente-dominio].it/login
2. Inserisci le tue credenziali
3. Esplora la dashboard

## 📋 Informazioni Tecniche

### Stack Tecnologico

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel
- **Authentication:** Supabase Auth

### Architettura

```
┌─────────────────────────────────────────┐
│  Vercel (Hosting)                        │
│  - Next.js App                           │
│  - API Routes                            │
│  - Server Components                     │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  Supabase (Database & Auth)              │
│  - PostgreSQL Database                   │
│  - Authentication                        │
│  - Row Level Security (RLS)              │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  External APIs                           │
│  - Meta Graph API (Facebook/Instagram)  │
│  - OpenRouter (LLM)                      │
│  - Apollo.io (Enrichment)                │
│  - Hunter.io (Email Finder/Verifier)     │
│  - Mixedbread AI (Vector Embeddings)      │
└─────────────────────────────────────────┘
```

## 🔑 Configurazione Ambiente

### Environment Variables

Le variabili d'ambiente sono configurate su Vercel e NON sono presenti nel repository per motivi di sicurezza.

Per modificare:
1. Vai su [Vercel Dashboard](https://vercel.com/[tua-organizzazione]/[repo])
2. Settings → Environment Variables
3. Modifica le variabili necessarie
4. Redeploy

### Database Schema

Il database Supabase contiene le seguenti tabelle principali:

- **profiles** - Profili utenti
- **source_audiences** - Audience da Facebook/Instagram
- **shared_audiences** - Audience elaborate
- **contacts** - Contatti estratti
- **filters** - Filtri custom
- **settings** - Impostazioni utenti
- **cost_tracking** - Tracciamento costi API
- **logs** - Log di sistema

## 🛠️ Sviluppo Locale

### Prerequisiti

- Node.js 18+
- npm o yarn
- Account Supabase (per dev database)

### Setup

```bash
# Clone repository
git clone https://github.com/[tua-organizzazione]/[repo].git
cd [repo]

# Installa dipendenze
npm install

# Copia environment template
cp .env.example .env.local

# Configura variabili (fornite dal fornitore)
nano .env.local

# Run development server
npm run dev
```

Apri http://localhost:3000

### Comandi Disponibili

```bash
npm run dev          # Avvia development server
npm run build        # Build per produzione
npm run start        # Avvia production server
npm run lint         # Esegue ESLint
```

## 📊 Funzionalità

### 1. Source Audience Management

Creazione e gestione di audience da Facebook e Instagram:
- Supporto per Facebook pages, groups, posts
- Supporto per Instagram profiles e media
- Batch processing
- Status tracking in tempo reale

### 2. Contact Extraction Pipeline

Estrazione multi-stage arricchita con AI:
1. Fetching contenuti da Meta GraphAPI
2. Estrazione AI-powered (OpenRouter LLM)
3. Regex pattern matching
4. Email finding (Hunter.io)
5. Contact enrichment (Apollo.io)
6. Email verification
7. Vector embeddings (Mixedbread AI)

### 3. Audience Management

- Gestione shared audiences
- Filtri logici complessi (AND/OR)
- Export CSV (Meta Ads compliant)
- Upload diretto a Meta Custom Audiences

### 4. Cost Tracking

- Monitoraggio costi in tempo reale
- Breakdown per servizio API
- Tracking operazione-level
- Storico costi

### 5. Demo Mode

- Test risk-free senza spendere crediti
- Simulazione API calls realistica
- Dati demo isolati

## 🔒 Sicurezza

### Autenticazione

- Supabase Auth con email/password
- Row Level Security (RLS) su tutte le tabelle
- Session management con token refresh

### Crittografia

- API keys crittografate con AES-256 (v1.1.1+)
- Encryption key configurata su Vercel
- Safe storage in localStorage

### Permessi

- **Admin**: Accesso completo + gestione utenti
- **User**: Accesso limitato ai propri dati

## 📈 Monitoraggio e Logs

### Dashboard Statistiche

- Total source audiences
- Total URLs processate
- Total contacts trovati
- Total contacts uploadati su Meta
- Total costi API

### Admin Logs

Accessibile da: `/logs`

- Logs livello: info, warn, error, debug
- Metadata JSON per context
- Filtri per utente e livello

## 🆘 Troubleshooting

### Problemi Comuni

**Deploy fallisce**
- Verifica environment variables su Vercel
- Controlla build logs per errori specifici

**Login non funziona**
- Verifica connessione database Supabase
- Controlla RLS policies
- Svuota cache browser

**Meta API errors**
- Verifica token validità
- Controlla permessi app Meta
- Rigenera access token se necessario

### Supporto Tecnico

Per supporto tecnico, contatta:

- **Email:** [supporto-email]
- **Slack/Teams:** [se disponibile]
- **Documentazione:** [link docs]

## 📝 Documentazione

- [Guida Utente Completa](link-guida-utente)
- [API Documentation](link-api-docs)
- [Troubleshooting Guide](link-troubleshooting)
- [Changelog](link-changelog)

## 🔄 Aggiornamenti

### Policy Aggiornamenti

In base al contratto di manutenzione:
- **Base**: Aggiornamenti sicurezza entro 7 giorni
- **Pro**: Bug fixes + features minori entro 48h
- **Premium**: Bug fixes + features custom entro 24h

### Changelog

Manteniamo un changelog pubblico per tutte le modifiche:

- [View Changelog](link-changelog)

## 📄 Licenza

Licenza software "Lume" concessa a **[NOME CLIENTE]**.

- **Proprietà Intellettuale:** [Tuo Nome/Azienda]
- **Tipo Licenza:** Licenza d'uso perpetua
- **Diritti:** Uso, modifica, deploy
- **Limitazioni:** Non rivendibile come prodotto standalone

## 📞 Contatti

### Fornitore

- **Nome/Azienda:** [Tuo Nome/Azienda]
- **Email:** [tua email]
- **Sito Web:** [tuo sito]
- **GitHub:** https://github.com/tuo-azienda

### Cliente

- **Azienda:** [NOME CLIENTE]
- **Contatto Tecnico:** [Nome]
- **Email:** [email]
- **Sito Web:** [cliente sito]

---

**Versione:** 1.0
**Setup Completato:** [Data]
**Ultimo Aggiornamento:** [Data]

---

*Piattaforma sviluppata con ❤️ da [Tuo Nome/Azienda]*
