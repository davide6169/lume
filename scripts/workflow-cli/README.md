# Workflow CLI

Command Line Interface per il Workflow Engine.

## Configurazione

Il CLI può essere configurato in tre modi (in ordine di priorità):

### 1. Opzioni da riga di comando
```bash
npm run workflow list -- --supabase-url "https://your-project.supabase.co" --supabase-key "your-key"
```

### 2. File di configurazione locale `.workflow-cli.json`
Crea un file `.workflow-cli.json` nella root del progetto:

```json
{
  "database": {
    "supabaseUrl": "https://your-project.supabase.co",
    "supabaseKey": "your-service-role-key",
    "tenantId": ""
  },
  "secrets": {
    "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}",
    "APOLLO_API_KEY": "${APOLLO_API_KEY}"
  },
  "defaults": {
    "outputFormat": "table",
    "verbose": false
  }
}
```

### 3. Variabili d'ambiente
```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run workflow list
```

## Comandi Disponibili

### Workflow Management

```bash
# Lista tutti i workflow
npm run workflow list

# Filtra per categoria
npm run workflow list -- --filter category=enrichment

# Filtra per tag
npm run workflow list -- --tags csv,ai

# Output come JSON
npm run workflow list -- --json

# Ottieni dettagli workflow
npm run workflow get -- --id csv-interest-enrichment

# Crea nuovo workflow da file
npm run workflow create -- --file ./my-workflow.json

# Aggiorna workflow esistente
npm run workflow update -- --id csv-interest-enrichment --file ./updated-workflow.json

# Elimina workflow (con conferma)
npm run workflow delete -- --id csv-interest-enrichment

# Elimina workflow senza conferma
npm run workflow delete -- --id csv-interest-enrichment --yes

# Valida workflow senza salvarlo
npm run workflow validate -- --file ./my-workflow.json
```

### Workflow Execution

```bash
# Esegui workflow
npm run workflow exec -- --id csv-interest-enrichment --file ./test-config.json

# Esegui con configurazione baseline
npm run workflow exec -- --id csv-interest-enrichment --use-baseline

# Esegui con input inline
npm run workflow exec -- --id csv-interest-enrichment --input '{"users": [...]}'

# Esegui con monitoraggio real-time
npm run workflow exec -- --id csv-interest-enrichment --watch

# Lista esecuzioni
npm run workflow executions

# Filtra esecuzioni per workflow
npm run workflow executions -- --id csv-interest-enrichment

# Filtra per stato
npm run workflow executions -- --status completed
```

### Block Management

```bash
# Lista tutti i blocchi disponibili
npm run workflow blocks list

# Filtra per categoria
npm run workflow blocks list -- --category api

# Ottieni dettagli blocco
npm run workflow blocks get -- --type csv.interestEnrichment

# Test blocco con configurazione
npm run workflow blocks test -- --type csv.interestEnrichment --config ./test-config.json

# Test blocco con baseline
npm run workflow blocks test -- --type csv.interestEnrichment --use-baseline

# Genera configurazione baseline
npm run workflow blocks baseline -- --type csv.interestEnrichment

# Specifica output directory
npm run workflow blocks baseline -- --type csv.interestEnrichment --output ./test-configs/baseline
```

## File di Configurazione Test

### Test Config per Blocchi

```json
// test-configs/baseline/csv-interest-enrichment.baseline.json
{
  "blockType": "csv.interestEnrichment",
  "description": "Baseline test config for CSV Interest Enrichment block",
  "version": "1.0.0",
  "generatedAt": "2026-01-10T08:02:30.104Z",
  "input": {
    "contacts": [
      {
        "email": "test@example.com",
        "name": "Mario Rossi",
        "company": "Example Inc"
      }
    ]
  },
  "config": {
    "maxContacts": 10,
    "country": "IT"
  },
  "secrets": {
    "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}",
    "APOLLO_API_KEY": "${APOLLO_API_KEY}"
  },
  "expectedOutputSchema": {}
}
```

### Test Config per Workflow

```json
// test-configs/workflows/csv-enrichment.test.json
{
  "workflowId": "csv-interest-enrichment",
  "description": "Test config for CSV Interest Enrichment workflow",
  "input": {
    "csvFile": "./test-data/sample-contacts.csv",
    "parameters": {
      "maxContacts": 100,
      "country": "IT"
    }
  },
  "secrets": {
    "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}",
    "APOLLO_API_KEY": "${APOLLO_API_KEY}"
  },
  "validation": {
    "expectedMinContacts": 90,
    "expectedMaxCost": 5.0,
    "maxDuration": 60000
  }
}
```

## Esempi d'Uso

### 1. Setup Iniziale

```bash
# Copia template configurazione
cp .workflow-cli.json.example .workflow-cli.json

# Modifica con le tue credenziali
nano .workflow-cli.json
```

### 2. Creare un Workflow

```bash
# Crea file definizione workflow
cat > my-workflow.json << EOF
{
  "workflowId": "my-workflow",
  "name": "My Workflow",
  "description": "Test workflow",
  "version": 1,
  "category": "test",
  "nodes": [...],
  "edges": [...]
}
EOF

# Valida prima di creare
npm run workflow validate -- --file my-workflow.json

# Crea nel database
npm run workflow create -- --file my-workflow.json
```

### 3. Testare un Blocco

```bash
# Genera baseline
npm run workflow blocks baseline -- --type csv.interestEnrichment

# Modifica baseline con i tuoi dati di test
nano test-configs/baseline/csv.interestEnrichment.baseline.json

# Testa il blocco
npm run workflow blocks test -- --type csv.interestEnrichment --use-baseline
```

## Troubleshooting

### Database non configurato

```
[ERROR] Supabase URL not configured.
```

Soluzione: Crea `.workflow-cli.json` o configura le env variables.

### Workflow non trovato

```
[ERROR] Workflow not found: my-workflow
```

Soluzione: Usa `npm run workflow list` per vedere i workflow disponibili.

### ValidationError

```
[ERROR] ❌ Workflow validation failed!
```

Soluzione: Controlla gli errori e correggi la definizione del workflow.

## Struttura File

```
├── .workflow-cli.json                 # Configurazione CLI (non commit)
├── .workflow-cli.json.example         # Template configurazione
├── scripts/
│   ├── workflow-cli.ts                # Entry point
│   └── workflow-cli/
│       ├── commands/                  # Comandi CLI
│       └── utils/                     # Utilities
└── test-configs/                      # Configurazioni test
    ├── baseline/                      # Baseline blocchi
    └── workflows/                     # Test workflow
```

## Supporto

Per problemi o domande:
1. Controlla `.workflow-cli.json.example` per la configurazione
2. Usa `--help` su qualsiasi comando per vedere le opzioni
3. Consulta la documentazione del workflow engine
