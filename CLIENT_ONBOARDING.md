# Lume - Guida Onboarding Clienti

## 📋 Panoramica

Questo documento descrive il processo completo per l'onboarding di nuovi clienti che acquisiscono la soluzione **Lume** con formula "chiavi in mano".

---

## 🎯 Modello di Fornitura

### **Cosa Forniamo**
- ✅ Licenza software Lume (perpetua)
- ✅ Setup ambiente di produzione completo
- ✅ Configurazione database Supabase
- ✅ Configurazione hosting Vercel
- ✅ Configurazione API Meta (Facebook/Instagram)
- ✅ Configurazione API esterne (Apollo, Hunter, OpenRouter, Mixedbread)
- ✅ Formazione team (1-2 giorni)
- ✅ Manutenzione evolutiva (contratto annuale)

### **Cosa Fornisce il Cliente**
- ✅ Account GitHub (per repository dedicato)
- ✅ Account Vercel (per hosting)
- ✅ Account Supabase (per database)
- ✅ Account Meta Developer (per APIs)
- ✅ API Keys per servizi esterni
- ✅ Dominio proprio (opzionale, ma consigliato)

### **Cosa NON Facciamo**
- ❌ Non mettiamo mai le chiavi su GitHub
- ❌ Non condividiamo le chiavi via email
- ❌ Non salviamo le chiavi in chiaro
- ❌ Non paghiamo i costi di hosting (a carico cliente)

---

## 📦 Prerequisiti

### **Prima di Iniziare - Fornitore**

- [ ] Repository principale Lume pronto e documentato
- [ ] Template di contratto preparato
- [ ] Lista di controllo setup preparata
- [ ] Documentazione utente pronta

### **Prima di Iniziare - Cliente**

- [ ] Account GitHub attivo
- [ ] Account Vercel attivo (gratuito)
- [ ] Account Supabase attivo (gratuito o Pro)
- [ ] Account Meta Developer attivo
- [ ] API Keys ottenute:
  - [ ] OpenRouter
  - [ ] Mixedbread AI
  - [ ] Apollo.io
  - [ ] Hunter.io
- [ ] Dominio proprio (opzionale)

---

## 🚀 Fase 1: Preparazione Repository

### **Step 1.1: Creazione Repository Cliente**

```bash
# Clone repository principale
cd /workspace/clienti
mkdir cliente-nome
cd cliente-nome
git clone https://github.com/tuo-azienda/lume.git .

# Personalizzazione branding (opzionale)
# - Modifica logo: components/icons/lume-logo.tsx
# - Modifica colori: tailwind.config.ts
# - Modifica nome app: app/layout.tsx

# Inizializza git
rm -rf .git
git init
git add .
git commit -m "Initial setup for [Cliente Nome]"

# Crea repository GitHub privato
gh repo create cliente-nome --private \
  --description "Lume - Lead Management Platform for [Cliente Nome]" \
  --team=clienti

# Pusha il codice
git remote add origin https://github.com/tuo-azienda/cliente-nome.git
git push -u origin main
```

### **Step 1.2: Configurazione Accessi**

```bash
# Aggiungi il cliente come collaboratore
gh repo edit cliente-nome --add-admin=github-username-del-cliente

# Oppure usa Teams per gestione multi-utente
gh team add cliente-nome-team --repo tuo-azienda/cliente-nome
```

---

## 🔧 Fase 2: Configurazione Database Supabase

### **Step 2.1: Creazione Progetto Supabase**

```
Istruzioni per FORNITORE:

1. Login su https://supabase.com
2. Clicca "New Project"
3. Configura:
   - Name: cliente-nome-lume
   - Database Password: [genera password forte e salvala nel password manager]
   - Region: [scegli regione più vicina al cliente]
4. Attendi creazione (2-3 minuti)
5. Copia le credenziali:
   - Project URL
   - anon/public key
   - service_role key
```

### **Step 2.2: Applica Migrations**

```bash
# Installa Supabase CLI (se non già installato)
npm install -g supabase

# Connettiti al progetto
supabase login
# Inserisci access token personale

# Link al progetto
supabase link --project-ref [project-id]

# Applica migrations
supabase db push

# Oppure SQL manuale:
psql -h db.[project-id].supabase.co -U postgres \
  -d postgres < supabase/migrations/001_initial_schema.sql
```

### **Step 2.3: Verifica Schema**

```sql
-- Connessione al database via Supabase SQL Editor

-- Verifica tabelle create
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Dovresti vedere:
-- - profiles
-- - source_audiences
-- - shared_audiences
-- - contacts
-- - filters
-- - settings
-- - cost_tracking
-- - logs
```

---

## 🌐 Fase 3: Configurazione Vercel

### **Step 3.1: Cliente Connette Repository**

```
ISTRUZIONI PER CLIENTE:

1. Vai su https://vercel.com/new
2. Fai login con GitHub
3. Clicca "Import Git Repository"
4. Seleziona: cliente-nome
5. Configura:
   - Framework Preset: Next.js (auto-detect)
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
6. Clicca "Deploy"
   → Il deploy FALLIRÀ (normale, mancano env vars)
```

### **Step 3.2: Configurazione Environment Variables (FORNITORE)**

```
Vercel Dashboard → cliente-nome → Settings → Environment Variables

Aggiungi le seguenti variabili:

=== SUPABASE ===
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://[project-id].supabase.co
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [anon key da Supabase]
Environment: Production, Preview, Development

Name: SUPABASE_SERVICE_ROLE_KEY
Value: [service_role key da Supabase]
Environment: Production ⚠️ SOLO Production, NON selezionare "Expose to Browser"

=== APPLICATION ===
Name: NEXT_PUBLIC_APP_URL
Value: https://[dominio-cliente-o-vercel-domain]
Environment: Production, Preview, Development

=== META APIS ===
Name: META_APP_ID
Value: [Meta App ID del cliente]
Environment: Production, Preview, Development

Name: META_APP_SECRET
Value: [Meta App Secret del cliente]
Environment: Production ⚠️ SOLO Production

Name: META_ACCESS_TOKEN
Value: [Meta Access Token del cliente]
Environment: Production ⚠️ SOLO Production

=== EXTERNAL APIS ===
Name: OPENROUTER_API_KEY
Value: [OpenRouter API key del cliente]
Environment: Production, Preview, Development

Name: MIXEDBREAD_API_KEY
Value: [Mixedbread API key del cliente]
Environment: Production, Preview, Development

Name: APOLLO_API_KEY
Value: [Apollo API key del cliente]
Environment: Production, Preview, Development

Name: HUNTER_API_KEY
Value: [Hunter API key del cliente]
Environment: Production, Preview, Development

=== ENCRYPTION ===
Name: ENCRYPTION_KEY
Value: [genera stringa casuale 32+ caratteri]
Environment: Production ⚠️ SOLO Production
```

### **Step 3.3: Genera ENCRYPTION_KEY**

```bash
# Genera chiave di crittografia casuale
openssl rand -base64 32
# Oppure
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### **Step 3.4: Trigger Nuovo Deploy**

```
Vercel Dashboard → Deployments

1. Trova l'ultimo deploy (fallito)
2. Clicca sui 3 puntini (⋮)
3. Clicca "Redeploy"
4. Seleziona "Apply Environment Variables"
5. Conferma

Attendi 2-3 minuti → Deploy dovrebbe andare a buon fine! ✅
```

---

## 🔐 Fase 4: Sicurezza e Verifiche

### **Step 4.1: Verifica Assenza Chiavi nel Repository**

```bash
# Verifica che non ci siano chiavi committate
cd /workspace/clienti/cliente-nome

grep -r "eyJhbGc" . --exclude-dir=node_modules --exclude-dir=.next
grep -r "supabase.co" . --exclude-dir=node_modules --exclude-dir=.next
grep -r "NEXT_PUBLIC_SUPABASE" . --exclude-dir=node_modules --exclude-dir=.next
grep -r "API_KEY\|SECRET\|TOKEN" . --exclude-dir=node_modules --exclude-dir=.next

# Se trovi qualcosa, rimuovilo immediatamente!
```

### **Step 4.2: Verifica .gitignore**

```bash
# Assicurati che .gitignore contenga:
cat .gitignore

# Dovrebbe includere:
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Keys
*.key
*.pem
credentials.json
secrets.json

# Logs
*.log
npm-debug.log*
```

### **Step 4.3: Verifica Deploy Funzionante**

```
Vai sull'URL del deployment:
https://cliente-nome.vercel.app

Verifica:
1. ✅ La pagina login si carica
2. ✅ Non ci sono errori in console (F12)
3. ✅ Puoi fare signup
4. ✅ Dopo signup, vieni reindirizzato alla dashboard
5. ✅ Puoi creare una source audience
```

---

## 📚 Fase 5: Configurazione Dominio (Opzionale)

### **Step 5.1: Configurazione DNS Cliente**

```
ISTRUZIONI PER CLIENTE:

1. Vai sul provider DNS (GoDaddy, Namecheap, etc.)
2. Aggiungi record CNAME:

   Nome: app (o www, o lascia @ per root)
   Tipo: CNAME
   Valore: cname.vercel-dns.com

   OPPURE record A:

   Nome: app
   Tipo: A
   Valore: 76.76.21.21

3. Salva e attendi propagazione (5-60 minuti)
```

### **Step 5.2: Configurazione Dominio su Vercel**

```
Vercel Dashboard → cliente-nome → Settings → Domains

1. Clicca "Add Domain"
2. Inserisci: app.cliente-dominio.it
3. Scegli:
   - ☑️ Redirect app.cliente-dominio.it to www.cliente-dominio.it
   - ☐ Oppure lascia non selezionato
4. Clicca "Add"

Vercel mostrerà i record DNS da configurare.
Una volta configurati, Vercel rileverà automaticamente e
provisionerà il certificato SSL.
```

### **Step 5.3: Aggiorna Environment Variables**

```
Vercel → Settings → Environment Variables

Modifica:
Name: NEXT_PUBLIC_APP_URL
Value: https://app.cliente-dominio.it

E redeploya!
```

---

## 👥 Fase 6: Creazione Primo Utente Admin

### **Step 6.1: Signup Primo Utente**

```
1. Vai su: https://app.cliente-dominio.it/signup
2. Compila il form:
   - Email: [email admin del cliente]
   - Password: [password forte]
   - Full Name: [Nome dell'admin]
3. Clicca "Sign Up"

IL PRIMO UTENTE DIVENTA AUTOMATICAMENTE ADMIN! ✅
```

### **Step 6.2: Verifica Database**

```sql
-- Vai su Supabase → Table Editor → profiles

Dovresti vedere:
- id: [uuid]
- email: [email admin]
- full_name: [nome admin]
- role: admin
- status: approved (perché è il primo)
```

### **Step 6.3: Test Funzionalità Admin**

```
1. Fai login con l'account admin
2. Vai su: Settings → Database
3. Configura un database di test (opzionale)
4. Vai su: Source Audiences
5. Crea una audience di test
6. Vai su: Dashboard
7. Verifica che le statistiche funzionano
```

---

## 📖 Fase 7: Formazione Team

### **Giorno 1: Formazione Base (4 ore)**

**Mattina (2 ore):**
- Presentazione Lume (30 min)
- Architettura e componenti (30 min)
- Demo funzionalità principali (30 min)
- Q&A (30 min)

**Pomeriggio (2 ore):**
- Hands-on: Creazione source audiences (30 min)
- Hands-on: Estrazione contatti (30 min)
- Hands-on: Filtri e segmentazione (30 min)
- Hands-on: Export e upload Meta (30 min)

### **Giorno 2: Formazione Avanzata (4 ore)**

**Mattina (2 ore):**
- Configurazione API Meta (30 min)
- Configurazione API esterne (30 min)
- Gestione costi e budget (30 min)
- Best practices e tips (30 min)

**Pomeriggio (2 ore):**
- Gestione utenti e permessi (30 min)
- Lettura logs e debug (30 min)
- Troubleshooting comune (30 min)
- Sessione Q&A avanzata (30 min)

---

## ✅ Fase 8: Checklist Consegna

### **Documentazione Fornita**

- [ ] Manuale utente completo (PDF/Docs)
- [ ] Guida setup tecnico (questo documento)
- [ ] Architettura sistema (diagrammi)
- [ ] API Documentation (se necessaria)
- [ ] Troubleshooting guide
- [ ] Video tutorial (opzionale)

### **Accessi Forniti**

- [ ] Repository GitHub: credenziali e link
- [ ] Vercel Dashboard: accesso collaboratore
- [ ] Supabase Dashboard: accesso proprietario
- [ ] Meta Developer Account: configurato
- [ ] API Keys: configurate (non condivise via email)

### **Test Effettuati**

- [ ] Deploy production funzionante
- [ ] Signup/Login funzionante
- [ ] Creazione source audiences funzionante
- [ ] Estrazione contatti funzionante
- [ ] Export CSV funzionante
- [ ] Upload Meta funzionante
- [ ] Dashboard statistiche funzionante
- [ ] Cost tracking funzionante

### **Formazione Completata**

- [ ] Giorno 1: Formazione base completata
- [ ] Giorno 2: Formazione avanzata completata
- [ ] Materiale didattico fornito
- [ ] Q&A session completata
- [ ] Feedback raccolto

### **Contratti e Pagamenti**

- [ ] Contratto licenza firmato
- [ ] Contratto manutenzione firmato
- [ ] Acconto setup ricevuto
- [ ] Fattura setup emessa
- [ ] Piano manutenzione attivato

---

## 🎉 Fase 9: Go-Live e Handoff

### **Step 9.1: Handoff Meeting**

```
Agenda:

1. Recap servizi forniti (15 min)
2. Dimostrazione ambiente live (15 min)
3. Accessi e permessi (15 min)
4. Processo di supporto (15 min)
5. Q&A finale (30 min)
```

### **Step 9.2: Documento Handoff**

```markdown
# Handoff Document - [Cliente Nome]

## Data: [Data]
## Fornitore: [Tuo Nome/Azienda]
## Cliente: [Cliente Nome]

### Ambiente di Produzione
- URL: https://app.cliente-dominio.it
- Status: ✅ Operativo

### Accessi Principali
- Repository GitHub: https://github.com/tuo-azienda/cliente-nome
- Vercel Dashboard: https://vercel.com/tuo-username/cliente-nome
- Supabase Dashboard: https://supabase.com/project/[project-id]

### Utenti Admin
1. Nome: [Nome]
   Email: [email]
   Ruolo: admin

### Contratti Attivi
- Licenza software: ✅ Attiva
- Manutenzione: ✅ Attiva (rinnovo: [data])

### Prossimi Steps
1. Monitoraggio prime 2 settimane
2. Check meeting tra 1 mese
3. Report trimestrale manutenzione

### Contatti Supporto
- Email: [tua email]
- Telefono: [tuo telefono]
- Slack/Teams: [se disponibile]
```

---

## 🛠️ Troubleshooting Comune

### **Deploy Fallito**

```
Sintomo: Vercel deployment fails
Possibili cause:
1. Environment variables mancanti
   → Soluzione: Verifica tutte le vars siano configurate
2. Build error
   → Soluzione: Controlla logs su Vercel → Deployments → [failed deploy] → Build Logs
3. Database connection failed
   → Soluzione: Verifica SUPABASE_URL e SUPABASE_ANON_KEY
```

### **Signup Non Funziona**

```
Sintomo: Utente non può registrarsi
Possibili cause:
1. Supabase auth non attivo
   → Soluzione: Verifica che auth.users esista
2. RLS policies troppo restrittive
   → Soluzione: Verifica policies in Supabase → Authentication → Policies
3. Environment variables errate
   → Soluzione: Verifica NEXT_PUBLIC_SUPABASE_URL e ANON_KEY
```

### **Meta API Non Funziona**

```
Sintomo: Errore connessione Meta
Possibili cause:
1. API keys scadute
   → Soluzione: Rigenera token su Meta Developer
2. Permessi insufficienti
   → Soluzione: Verifica permessi app Meta
3. Webhook non configurato
   → Soluzione: Configura webhook URL su Meta Developer
```

---

## 📞 Supporto Post-Consegna

### **Prime 2 Settimane**

- Monitoraggio quotidiano
- Supporto email entro 24h
- Call settimanali check

### **Dopo Primo Mese**

- Supporto email entro 48h
- Call mensili
- Report trimestrale

### **Contratto Manutenzione**

In base al piano scelto:
- **Base**: Bug fixes entro 7 giorni
- **Pro**: Bug fixes entro 48h + features minori
- **Premium**: Bug fixes entro 24h + features custom

---

## 📄 Allegati

1. Template Contratto Licenza
2. Template Contratto Manutenzione
3. Manuale Utente Lume
4. API Documentation
5. Troubleshooting Guide Avanzata

---

## 📝 Note

### **Per il Fornitore**

- Mantieni sempre aggiornata questa guida
- Personalizza per ogni cliente
- Tieni traccia di lezioni apprese
- Documenta ogni problema e soluzione

### **Per il Cliente**

- Conserva questo documento
- Condividi con il team IT
- Usa come riferimento per troubleshooting
- Contatta il supporto per dubbi

---

**Versione:** 1.0
**Ultimo Aggiornamento:** Gennaio 2025
**Autore:** [Tuo Nome/Azienda]

Per domande o supporto, contatta: [tua email]
