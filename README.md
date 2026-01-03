# 🎯 Lume - Lead Unified Mapping Enrichment

<div align="center">

**AI-Powered Lead Management Platform for Facebook & Instagram**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3.4-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)

</div>

---

## 📖 Descrizione

**Lume** è una piattaforma web moderna per la gestione dei lead (potenziali clienti) che utilizza l'Intelligenza Artificiale per estrarre e arricchire contatti da Facebook e Instagram.

### ✨ Funzionalità Principali

- 🎯 **Source Audiences**: Gestione gruppi di URL Facebook/Instagram
- 🔍 **AI-Powered Search**: Estrazione contatti usando LLM + Embeddings
- ✉ **Data Enrichment**: Integrazione Apollo.io e Hunter.io
- 📊 **Dashboard**: Statistiche real-time con cost tracking
- 🔧 **Filters**: Sistema di filtri logici componibili
- 📤 **Export CSV**: Formato compliant Meta Ads
- 🚀 **Upload to Meta**: Caricamento diretto su Meta Ads
- 🧪 **Demo Mode**: Simulazione completa per testing
- 📝 **Logs**: System logging per admin

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenRouter (LLM), Mixedbread (Embeddings)
- **Enrichment**: Apollo.io, Hunter.io
- **Deployment**: Vercel + GitHub

---

## 🚀 Quick Start

```bash
# Installa dipendenze
npm install

# Configura environment variables
cp .env.local.example .env.local

# Avvia development server
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)

---

## 📋 Setup Database

1. Crea un progetto su https://supabase.com
2. Vai su SQL Editor
3. Copia il contenuto di `supabase/migrations/001_initial_schema.sql`
4. Esegui la migration

---

## 📁 Struttura Progetto

```
lume/
├── app/                    # Next.js App Router
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Dashboard pages
│   └── api/              # API routes
├── components/           # React components
├── lib/                  # Libraries & services
├── supabase/            # Database migrations
└── types/               # TypeScript definitions
```

---

## 🔐 Sicurezza

- ✅ Row Level Security (RLS) su tutte le tabelle
- ✅ API keys criptate client-side
- ✅ Authentication con Supabase Auth
- ✅ Admin/user roles
- ✅ HTTPS obbligatorio in produzione

---

## 📦 Build

```bash
npm run build
```

---

## 🚀 Deploy

Per la guida completa al deploy, vedi **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)**

**Quick Deploy:**
1. Push su GitHub
2. Connetti su Vercel
3. Configura environment variables
4. Deploy!

---

## 📄 License

MIT

---

<div align="center">

**Built with ❤️ using Next.js and Supabase**

</div>
