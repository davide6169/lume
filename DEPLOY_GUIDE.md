# 🚀 Lume - Guida al Deploy Completa

Questa guida ti accompagnerà passo dopo passo nel deploy dell'applicazione Lume.

---

## 📋 INDICE

1. [Prerequisiti](#prerequisiti)
2. [Setup Database Supabase](#1-setup-database-supabase)
3. [Setup Meta App](#2-setup-meta-app)
4. [Configurazione Environment Variables](#3-configurazione-environment-variables)
5. [Deploy su Vercel](#4-deploy-su-vercel)
6. [Setup Post-Deploy](#5-setup-post-deploy)
7. [Testing dell'Applicazione](#6-testing-dellapplicazione)
8. [Troubleshooting](#7-troubleshooting)

---

## Prerequisiti

### Account Necessari

- ✅ Account GitHub (con repository creato)
- ✅ Account Vercel (gratuito)
- ✅ Account Supabase (piano gratuito ok)
- ✅ Account Meta Developers (gratuito)

### Strumenti Necessari

- ✅ Git installato localmente
- ✅ Node.js 18+ installato
- ✅ Browser moderno (Chrome/Edge/Firefox)

---

## 1. SETUP DATABASE SUPABASE

### 1.1 Creare Progetto Supabase

1. Vai su https://supabase.com
2. Clicca su **"Start your project"**
3. Accedi con GitHub (consigliato)
4. Clicca **"New Project"**
5. Compila i dati:
   - **Name:** `lume-prod` (o il nome che preferisci)
   - **Database Password:** Scegli una password forte e **SALVALA!**
   - **Region:** Scegli la regione più vicina ai tuoi utenti (es. EU West per Europa)
   - **Pricing Plan:** Free tier è sufficiente per iniziare

⏳ **Attendi 1-2 minuti** mentre Supabase crea il progetto.

### 1.3 Configurare il Database

1. Nel tuo progetto Supabase, vai su **SQL Editor** (menu laterale)
2. Copia il contenuto del file `supabase/migrations/001_initial_schema.sql`
3. Incolla nello SQL Editor
4. Clicca **"Run"** o premi `Ctrl+Enter`

✅ **Verifica:** Dovresti vedere "Success. No rows returned" (le tabelle sono state create)

### 1.4 Verificare Tabelle Create

Vai su **Table Editor** nel menu laterale. Dovresti vedere:
- ✅ `profiles`
- ✅ `source_audiences`
- ✅ `shared_audiences`
- ✅ `contacts`
- ✅ `filters`
- ✅ `settings`
- ✅ `cost_tracking`
- ✅ `logs`

### 1.5 Configurare Authentication

1. Vai su **Authentication** → **Configuration**
2. In **Site URL**, inserisci: `http://localhost:3000` (per sviluppo locale)
3. Assicurati che **Email Provider** sia abilitato

### 1.6 Ottenere Credenziali Supabase

1. Vai su **Project Settings** (icona ingranaggio ⚙️)
2. Trova **API** nella sezione **Project API keys**
3. Copia questi valori:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGc... (la chiave pubblica)
   ```
4. **SALVA QUESTE CREDENZIALI!** Serviranno dopo.

---

## 2. SETUP META APP

### 2.1 Creare Meta App

1. Vai su https://developers.facebook.com
2. Accedi con il tuo account Facebook
3. Clicca su **"Create App"** → **"Business"**
4. Compila:
   - **Display Name:** `Lume Lead Management`
   - **App Purpose:** `Personal`
5. Clicca **"Create App"**

### 2.2 Configurare App Basic Settings

1. Nel dashboard dell'app, vai su **Settings** → **Basic**
2. Copia **App ID** e **App Secret**
3. **SALVA QUESTE CREDENZIALI!**

### 2.3 Configurare Facebook Login

1. Vai su **Add Product** → **Facebook Login**
2. Clicca **"Set Up"**
3. Scegli **"Web"**
4. Compila:
   - **Site URL:** `http://localhost:3000` (per sviluppo)
   - **Deauthorize Callback URL:** `http://localhost:3000`
5. Clicca **"Save"**

### 2.4 Configurare Marketing API

1. Vai su **Add Product** → **Marketing API**
2. Seleziona il tuo **Ad Account** (creane uno nuovo se non ce l'hai)
3. Clicca **"Set Up"**
4. Genera **System User** per le API calls

### 2.5 Generare Access Token

1. Vai su **Tools** → **Graph API Explorer**
2. In **User or Page**, seleziona il tuo account
3. In **Permissions**, aggiungi:
   - `pages_manage_engagement`
   - `pages_read_engagement`
   - `ads_management`
   - `business_management`
4. Clicca **"Generate Access Token"**
5. **SALVA IL TOKEN!** (è lungo e inizia con `EAA...`)

⚠️ **NOTA IMPORTANTE:** In produzione, userai il **System User** token, non il tuo token personale.

---

## 3. CONFIGURAZIONE ENVIRONMENT VARIABLES

### 3.1 Creare File Environment Variables

Nel tuo progetto locale, crea il file `.env.local`:

```bash
# Copia questo file e riempi i valori
cp .env.local.example .env.local
```

### 3.2 Compilare le Variabili

Apri `.env.local` e compila:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...tua-chiave-pubblica
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tua-chiave-service-role (da Settings → API)

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Per sviluppo locale

# Meta (Facebook/Instagram) API
META_APP_ID=tuo-app-id
META_APP_SECRET=tuo-app-secret
META_ACCESS_TOKEN=EAA...tuo-access-token

# OpenRouter API (LLM)
OPENROUTER_API_KEY=sk-or-v1-tuo-key
OPENROUTER_DEFAULT_MODEL=mistral-7b-instruct:free

# Mixedbread API (Embeddings)
MIXEDBREAD_API_KEY=tuochiave-mixedbread

# Apollo.io API
APOLLO_API_KEY=tua-chiave-apollo

# Hunter.io API
HUNTER_API_KEY=tua-chiave-hunter

# Encryption Key (per API keys storage)
ENCRYPTION_KEY=una-string-di-almeno-32-caratteri-random
```

### 3.3 Generare Encryption Key

Esegui questo comando per generare una chiave di crittografia:

```bash
openssl rand -base64 32
```

Copia l'output nel campo `ENCRYPTION_KEY`.

### 3.4 API Keys Esterne

#### OpenRouter (LLM)
1. Vai su https://openrouter.ai/keys
2. Crea account gratuito
3. Copia la API key

#### Mixedbread (Embeddings)
1. Vai su https://www.mixedbread.com/api
2. Crea account
3. Ottieni API key

#### Apollo.io (Enrichment)
1. Vai su https://www.apollo.io/api
2. Iscriviti per accesso API

#### Hunter.io (Email Verification)
1. Vai su https://hunter.io/api
2. Crea account gratuito
3. Ottieni API key

---

## 4. DEPLOY SU VERCEL

### 4.1 Preparare Repository GitHub

```bash
# Nella directory del progetto
git init
git add .
git commit -m "Initial commit: Lume lead management application"
```

### 4.2 Push su GitHub

1. Crea un nuovo repository su GitHub:
   - Vai su https://github.com/new
   - Repository name: `lume`
   - Non inizializzare con README
   - Clicca **"Create repository"**

2. Push del codice:
```bash
git remote add origin https://github.com/tuo-username/lume.git
git branch -M main
git push -u origin main
```

### 4.3 Deploy su Vercel

1. Vai su https://vercel.com
2. Accedi con **GitHub** (consigliato)
3. Clicca **"Add New..."** → **"Project"**
4. Seleziona il repository `lume` da GitHub
5. Configura:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (lascia così)
   - **Build Command:** `npm run build` (autocompilato)
   - **Install Command:** `npm ci` (autocompilato)
   - **Output Directory:** `.next` (autocompilato)

### 4.4 Configurare Environment Variables su Vercel

1. Prima del deploy, Vercel ti chiederà le environment variables
2. Compila **tutte** le variabili dal file `.env.local`
3. Assicurati di includere:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` → `https://tuo-dominio.vercel.app`
   - Tutte le chiavi API (Meta, OpenRouter, etc.)

4. Clicca **"Deploy"**

⏳ **Attendi 2-3 minuti** per il deploy iniziale.

### 4.5 Verificare Deploy

1. Vercel ti mostrerà una URL come: `https://lume-xxxxx.vercel.app`
2. Clicca per visitare il sito
3. Dovresti vedere la pagina di login ✅

---

## 5. SETUP POST-DEPLOY

### 5.1 Aggiornare Supabase Site URL

1. Torna su Supabase → **Authentication** → **Configuration**
2. Aggiorna **Site URL** con il tuo dominio Vercel:
   ```
   https://tuo-sito.vercel.app
   ```

### 5.2 Aggiornare Meta App Redirect URLs

1. Vai su Meta Developers → **Settings** → **Basic**
2. Aggiungi ai **Valid OAuth Redirect URIs**:
   ```
   https://tuo-sito.vercel.app/auth/callback
   ```

### 5.3 Aggiornare Environment Variables su Vercel

1. Vai su Vercel → **Project** → **Settings** → **Environment Variables**
2. Aggiorna:
   ```
   NEXT_PUBLIC_APP_URL=https://tuo-sito.vercel.app
   ```

3. Clicca **"Redeploy"** per applicare le modifiche

---

## 6. TESTING DELL'APPLICAZIONE

### 6.1 Creare Account Admin

1. Visita il tuo sito: `https://tuo-sito.vercel.app`
2. Clicca su **"Sign up"**
3. Crea il primo account (sarà automaticamente admin)

### 6.2 Configurare Settings

1. Accedi all'app
2. Vai su **Settings**
3. Inserisci le API keys:
   - Meta (Facebook/Instagram)
   - OpenRouter
   - Mixedbread
   - Apollo.io
   - Hunter.io
4. Attiva/Disattiva **Demo Mode** come preferisci
5. Clicca **"Save API Keys"**

### 6.3 Testare Demo Mode

1. Vai su **Source Audiences**
2. Clicca **"Add Source Audience"**
3. Seleziona **Facebook**
4. Inserisci URL di esempio:
   ```
   https://www.facebook.com/groups/techenthusiasts
   https://www.facebook.com/startupnews
   ```
5. Clicca **"Create Audience"**

6. Seleziona l'audience creata
7. Clicca **"Start Search"**
8. Attendi il completamento
9. Vai su **Shared Audiences** per vedere i contatti estratti

### 6.4 Testare Export CSV

1. In **Shared Audiences**, seleziona un audience
2. Clicca **"Export CSV"**
3. Apri il file scaricato e verifica il formato

### 6.5 Testare Filtri

1. Vai su **Filters**
2. Clicca **"Add First Rule"**
3. Seleziona campo, operatore e valore
4. Clicca **"Save Current Filter"**
5. Dai un nome al filtro
6. Clicca **"Save"**

### 6.6 Testare Dashboard

1. Vai su **Dashboard**
2. Verifica che tutte le statistiche siano visualizzate
3. Controlla il **Cost Breakdown**

### 6.7 Testare Logs (Admin Only)

1. Assicurati di essere loggato come admin
2. Vai su **Logs**
3. Verifica che i log siano visibili
4. Testa **Export** e **Clear All**

---

## 7. TROUBLESHOOTING

### Problema: "Error: Not authenticated"

**Soluzione:**
- Verifica che le environment variables siano configurate correttamente su Vercel
- Controlla che `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` siano valide

### Problema: "Middleware error"

**Soluzione:**
- Verifica che `middleware.ts` sia nella root del progetto
- Controlla che le funzioni del middleware siano corrette

### Problema: "Database connection failed"

**Soluzione:**
- Verifica che la migration sia stata eseguita su Supabase
- Controlla che `SERVICE_ROLE_KEY` sia corretta nelle environment variables

### Problema: "Meta API error"

**Soluzione:**
- Verifica che l'access token sia valido
- Controlla che l'app abbia i permessi corretti
- Usa Demo Mode per testare senza Meta API

### Problema: "Build failed"

**Soluzione:**
```bash
# Localmente, esegui
npm run build

# Se ci sono errori, correggili prima di pushare
npm run lint
```

### Problema: "Demo mode non funziona"

**Soluzione:**
- Verifica che in Settings, **Demo Mode** sia attivo
- Controlla la console per errori JavaScript

---

## 📊 CHECKLIST DEL PRE-DEPLOY

Prima di fare il deploy in produzione, verifica:

- [ ] Tutte le migration Supabase sono state eseguite
- [ ] Environment variables sono configurate localmente
- [ ] Il build funziona localmente: `npm run build`
- [ ] Il development server funziona: `npm run dev`
- [ ] Le API keys sono state testate in demo mode
- [ ] Il repository GitHub è pronto
- [ ] L'account Vercel è configurato

---

## 🔐 SICUREZZA IN PRODUZIONE

### Best Practices per la Sicurezza

1. **NUNCA committare `.env.local`** su Git
2. **Usa Strong Passwords** per il database Supabase
3. **Ruota le API Keys** regolarmente
4. **Abilita 2FA** su Supabase, Vercel, GitHub
5. **Monitora i Logs** regolarmente per attività sospette
6. **Limita i permessi** delle API keys Meta

### Environment Variables di Produzione

```bash
# ATTENZIONE: In produzione, usa dominio custom
NEXT_PUBLIC_APP_URL=https://tuo-dominio.com

# Usa Vercel Environment Variables, mai hardcoded
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
```

---

## 🌙 CUSTOM DOMAIN (Opzionale)

### Configurare Dominio Personalizzato

1. Acquista dominio su:
   - Namecheap
   - GoDaddy
   - Cloudflare (gratis)

2. Vai su Vercel → **Settings** → **Domains**
3. Clicca **"Add Domain"**
4. Inserisci il tuo dominio

3. Configura i DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (fornito da Vercel)
   ```

5. Attendi la propagazione DNS (può richiedere fino a 48 ore)

---

## 📈 MONITORAGGIO

### Impostare Monitoring

1. **Vercel Analytics**
   - Attivo automaticamente
   - Dashboard delle visite

2. **Supabase Logs**
   - Vai su **Logs** nel dashboard Supabase
   - Monitora query lente o errori

3. **Error Tracking**
   - Considera integrare Sentry per error tracking
   - O usa Vercel Logs

---

## 🆘 SUPPORTO

### Risorse Utili

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Meta API Docs:** https://developers.facebook.com/docs

### Debug Mode

Per abilitare debug mode, aggiungi a `.env.local`:

```bash
DEBUG=supabase:* npm run dev
```

---

## ✅ DEPLOY COMPLETATO!

Congratulazioni! La tua applicazione Lume è ora live.

**Prossimi passi:**
1. Testa tutte le funzionalità
2. Raccogli feedback dagli utenti
3. Itera basandoti sul feedback

**Buon successo con Lume! 🚀**
