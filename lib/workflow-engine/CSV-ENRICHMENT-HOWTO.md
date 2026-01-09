# CSV Enrichment - Guida Passo Passo

## Il Tuo CSV di Esempio

```csv
nome;celular;email;nascimento
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983
Giuseppe Verdi;3273456789;giuseppe.verdi@mydomain.com;
```

---

## STEP 1: Leggere il CSV 📄

Il CSV viene parsato e separato in colonne:

| Campo | Descrizione |
|-------|-------------|
| `nome` | Nome completo (es. "Mario Rossi") |
| `celular` | Numero di telefono (es. "3291234567") |
| `email` | Email (es. "mario.rossi@mydomain.com") |
| `nascimento` | Data di nascita in formato DD/MM/YYYY (es. "21/02/1986") |

---

## STEP 2: Convertire nel Formatro Richiesto 🔄

Ogni contatto del CSV viene trasformato nel formato richiesto dal workflow:

### Esempio: Mario Rossi

**Input CSV:**
```csv
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
```

**Convertito in:**
```json
{
  "email": "mario.rossi@mydomain.com",
  "firstName": "Mario",
  "lastName": "Rossi",
  "fullName": "Mario Rossi",
  "phone": "+393291234567",
  "birthDate": "1986-02-21"
}
```

### Trasformazioni Applicate:

1. **Nome** → `firstName` e `lastName`
   - `"Mario Rossi"` → firstName: `"Mario"`, lastName: `"Rossi"`

2. **Cellular** → `phone` con prefisso internazionale
   - `"3291234567"` → phone: `"+393291234567"` (aggiunge +39)

3. **Nascimento** → `birthDate` in formato ISO
   - `"21/02/1986"` → birthDate: `"1986-02-21"`

4. **Calcolo età** → `age`
   - Da `"1986-02-21"` → age: `38` (al 2024)

---

## STEP 3: Eseguire le 3 Strategie di Enrichment ⚙️

### Strategia 1: Country Detection 🌎

**Rileva il paese dal numero di telefono**

```
Input: "+393291234567"
↓
Rileva prefisso: +39
↓
Country: Italy (IT)
Confidence: high
```

**Risultato per Mario Rossi:**
```json
{
  "country": {
    "code": "IT",
    "name": "Italy",
    "region": "europe",
    "language": "it-IT",
    "confidence": "high",
    "detectionMethod": "phone"
  }
}
```

**System Prompt LLM per Italia:**
```
Sei un esperto nell'analisi di profili demografici per l'Italia.
Considera la cultura italiana, inclusi:
- Passione per il calcio
- Musica italiana, opera
- Gastronomia (pizza, pasta, vino)
- Moda e design
- Arte, storia, cultura
- Famiglia e tradizioni

Analizza interessi basati su età, genere e contesto culturale italiano.
```

---

### Strategia 2: LinkedIn via Apollo 💼

**Solo per email business**

```
Input: "mario.rossi@mydomain.com"
↓
Classificazione email: business (@mydomain.com non è @gmail, @yahoo, etc)
↓
Chiamata ad Apollo API
↓
Risultato: LinkedIn profile trovato (o non)
```

**Se trovato:**
```json
{
  "linkedin": {
    "found": true,
    "url": "https://linkedin.com/in/mario-rossi-123456",
    "title": "Software Engineer",
    "company": "MyDomain S.r.l.",
    "confidence": "high",
    "emailType": "business"
  }
}
```

**Se non trovato:**
```json
{
  "linkedin": {
    "found": false,
    "confidence": "low",
    "emailType": "business"
  }
}
```

**Costo:** $0.02 solo per email business (non per @gmail, @yahoo)

---

### Strategia 3: LLM Interest Inference ❤️

**Inferisce gli interessi usando LLM con prompt country-specific**

```
Input:
  - Nome: Mario Rossi
  - Età: 38 anni
  - Paese: Italy (IT)
  - Lingua: italiano

↓

Prompt LLM (specifico per Italia):
  Analisa questo profilo e inferisci interessi considerando a cultura italiana.

  Nome: Mario Rossi
  Età: 38 anni
  Paese: Italy
  Região: europe

  Interessi comuni no país: calcio, musica italiana, gastronomia, moda, arte, viaggi, tecnologia, cinema, motori, famiglia

  Return a JSON array of inferred interests...

↓

LLM Response (OpenRouter con model google/gemma-2-27b-it):
  [
    {"topic": "calcio", "confidence": 0.92, "category": "sport"},
    {"topic": "tecnologia", "confidence": 0.85, "category": "professionale"},
    {"topic": "musica italiana", "confidence": 0.78, "category": "intrattenimento"},
    {"topic": "viaggi", "confidence": 0.75, "category": "lifestyle"},
    {"topic": "gastronomia", "confidence": 0.70, "category": "cibo"}
  ]
```

**Costo:** ~$0.0001 per contatto (modello gratuito)

---

## STEP 4: Risultato Completo 📊

### Mario Rossi - Enriched Contact

```json
{
  "id": "1",
  "email": "mario.rossi@mydomain.com",
  "firstName": "Mario",
  "lastName": "Rossi",
  "fullName": "Mario Rossi",
  "phone": "+393291234567",
  "birthDate": "1986-02-21",
  "age": 38,

  // Strategy 1: Country Detection
  "country": {
    "code": "IT",
    "name": "Italy",
    "region": "europe",
    "language": "it-IT",
    "confidence": "high",
    "detectionMethod": "phone"
  },

  // Strategy 2: LinkedIn (email business)
  "linkedin": {
    "found": true,
    "url": "https://linkedin.com/in/mario-rossi-123456",
    "title": "Software Engineer",
    "company": "MyDomain S.r.l.",
    "confidence": "high",
    "emailType": "business"
  },

  // Strategy 3: LLM Interests (country-specific)
  "interests": [
    { "topic": "calcio", "confidence": 0.92, "category": "sport" },
    { "topic": "tecnologia", "confidence": 0.85, "category": "professionale" },
    { "topic": "musica italiana", "confidence": 0.78, "category": "intrattenimento" },
    { "topic": "viaggi", "confidence": 0.75, "category": "lifestyle" },
    { "topic": "gastronomia", "confidence": 0.70, "category": "cibo" }
  ],

  "enrichmentCost": 0.0201,
  "enrichedAt": "2026-01-09T15:30:00.000Z"
}
```

---

## STEP 5: Generare CSV Arricchito 📄

### Output CSV Formattato

```csv
nome;celular;email;nascimento;eta;paese;linkedin;interessi;costo_enrichment
"Mario Rossi";"+393291234567";"mario.rossi@mydomain.com";"1986-02-21";"38";"Italy";"https://linkedin.com/in/mario-rossi-123456";"calcio, tecnologia, musica italiana, viaggi, gastronomia";"0.0201"
"Luca Bianchi";"+393282345678";"luca.bianchi@mydomain.com";"1983-01-27";"41";"Italy";"https://linkedin.com/in/luca-bianchi-789012";"calcio, cinema, moda, arte, vino";"0.0201"
"Giuseppe Verdi";"+393273456789";"giuseppe.verdi@mydomain.com";"";;"Italy";"https://linkedin.com/in/giuseppe-verdi-345678";"calcio, opera, musica classica, storia, motori";"0.0201"
```

### Colonne Aggiunte:

| Colonna | Descrizione |
|---------|-------------|
| `eta` | Età calcolata dalla data di nascita |
| `paese` | Paese rilevato (es. "Italy") |
| `linkedin` | URL profilo LinkedIn (se trovato) |
| `interessi` | Lista interessi separati da virgola |
| `costo_enrichment` | Costo dell'enrichment per questo contatto |

---

## Esempio Completo con Output Atteso

### Input CSV (3 contatti)

```csv
nome;celular;email;nascimento
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983
Giuseppe Verdi;3273456789;giuseppe.verdi@mydomain.com;
```

### Output Atteso (JSON)

```json
{
  "contacts": [
    {
      "fullName": "Mario Rossi",
      "email": "mario.rossi@mydomain.com",
      "phone": "+393291234567",
      "age": 38,
      "country": {
        "code": "IT",
        "name": "Italy",
        "detectionMethod": "phone"
      },
      "linkedin": {
        "found": true,
        "url": "https://linkedin.com/in/mario-rossi-123456",
        "title": "Software Engineer",
        "company": "MyDomain",
        "emailType": "business"
      },
      "interests": [
        { "topic": "calcio", "confidence": 0.92, "category": "sport" },
        { "topic": "tecnologia", "confidence": 0.85, "category": "professionale" },
        { "topic": "viaggi", "confidence": 0.75, "category": "lifestyle" }
      ],
      "enrichmentCost": 0.0201
    },
    {
      "fullName": "Luca Bianchi",
      "email": "luca.bianchi@mydomain.com",
      "phone": "+393282345678",
      "age": 41,
      "country": {
        "code": "IT",
        "name": "Italy",
        "detectionMethod": "phone"
      },
      "linkedin": {
        "found": true,
        "url": "https://linkedin.com/in/luca-bianchi-789012",
        "title": "Marketing Manager",
        "company": "MyDomain",
        "emailType": "business"
      },
      "interests": [
        { "topic": "calcio", "confidence": 0.88, "category": "sport" },
        { "topic": "cinema", "confidence": 0.82, "category": "intrattenimento" },
        { "topic": "moda", "confidence": 0.76, "category": "stile" }
      ],
      "enrichmentCost": 0.0201
    },
    {
      "fullName": "Giuseppe Verdi",
      "email": "giuseppe.verdi@mydomain.com",
      "phone": "+393273456789",
      "age": null,
      "country": {
        "code": "IT",
        "name": "Italy",
        "detectionMethod": "phone"
      },
      "linkedin": {
        "found": true,
        "url": "https://linkedin.com/in/giuseppe-verdi-345678",
        "title": "CEO",
        "company": "MyDomain",
        "emailType": "business"
      },
      "interests": [
        { "topic": "calcio", "confidence": 0.95, "category": "sport" },
        { "topic": "opera", "confidence": 0.90, "category": "musica" },
        { "topic": "musica classica", "confidence": 0.85, "category": "intrattenimento" },
        { "topic": "storia", "confidence": 0.78, "category": "cultura" },
        { "topic": "motori", "confidence": 0.72, "category": "hobby" }
      ],
      "enrichmentCost": 0.0201
    }
  ],
  "metadata": {
    "totalContacts": 3,
    "countryDetected": 3,
    "linkedinFound": 3,
    "businessEmails": 3,
    "personalEmails": 0,
    "totalInterests": 13,
    "avgInterestsPerContact": 4.3,
    "totalCost": 0.0603,
    "costBreakdown": {
      "apollo": 0.06,
      "openrouter": 0.0003
    }
  }
}
```

### Output CSV Arricchito

```csv
nome;celular;email;nascimento;eta;paese;linkedin;interessi;costo_enrichment
"Mario Rossi";"+393291234567";"mario.rossi@mydomain.com";"1986-02-21";"38";"Italy";"https://linkedin.com/in/mario-rossi-123456";"calcio, tecnologia, viaggi";"0.0201"
"Luca Bianchi";"+393282345678";"luca.bianchi@mydomain.com";"1983-01-27";"41";"Italy";"https://linkedin.com/in/luca-bianchi-789012";"calcio, cinema, moda";"0.0201"
"Giuseppe Verdi";"+393273456789";"giuseppe.verdi@mydomain.com";"";;"Italy";"https://linkedin.com/in/giuseppe-verdi-345678";"calcio, opera, musica classica, storia, motori";"0.0201"
```

---

## Come Eseguire l'Enrichment

### Opzione 1: Script Node.js

```bash
npx tsx lib/workflow-engine/examples/csv-enrichment-example.ts
```

### Opzione 2: Usare il Blocco Direttamente

```typescript
import { LeadEnrichmentBlock } from './lib/workflow-engine'
import { ContextFactory } from './lib/workflow-engine'
import { parseCSV, convertToEnrichmentInput } from './lib/workflow-engine/examples/csv-enrichment-example'

// 1. Leggere CSV
const csvContent = fs.readFileSync('contacts.csv', 'utf-8')
const csvContacts = parseCSV(csvContent)

// 2. Convertire
const enrichmentInput = convertToEnrichmentInput(csvContacts)

// 3. Eseguire
const context = ContextFactory.create({
  workflowId: 'csv-enrichment',
  secrets: {
    apollo: process.env.APOLLO_API_KEY!,
    openrouter: process.env.OPENROUTER_API_KEY!
  }
})

const block = new LeadEnrichmentBlock()
const result = await block.execute(config, enrichmentInput, context)

// 4. Salvare risultati
fs.writeFileSync('enriched.json', JSON.stringify(result.output, null, 2))
```

### Opzione 3: REST API

```bash
curl -X POST http://localhost:3000/api/workflows/lead-enrichment-complete/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "contacts": [
        {
          "email": "mario.rossi@mydomain.com",
          "firstName": "Mario",
          "lastName": "Rossi",
          "phone": "+393291234567",
          "birthDate": "1986-02-21"
        }
      ]
    },
    "secrets": {
      "apollo": "your-apollo-token",
      "openrouter": "your-openrouter-token"
    }
  }'
```

---

## Costi per il Tuo CSV

### 3 Contatti (Tutti Email Business)

| Strategy | Contatti | Costo/Contatto | Totale |
|----------|----------|----------------|--------|
| Country Detection | 3 | $0.00 | $0.00 |
| LinkedIn (Apollo) | 3 | $0.02 | $0.06 |
| LLM Interests | 3 | $0.0001 | $0.0003 |
| **TOTALE** | **3** | **$0.0201** | **$0.0603** |

**Costo medio per contatto:** ~$0.02

**Se avessi email personali (@gmail):**
- Costo per contatto: ~$0.0001 (solo LLM interests)
- Totale 3 contatti: ~$0.0003

---

## Note Importanti

### 1. Email Business vs Personali

Il sistema classifica automaticamente le email:

**Email Business (Apollo attivo):**
- mario.rossi@mydomain.com ✅
- luca.bianchi@azienda.it ✅
- giuseppe.verdi@startup.com ✅

**Email Personali (Apollo saltato):**
- mario.rossi@gmail.com ❌
- luca.bianchi@yahoo.com ❌
- giuseppe.verdi@libero.it ❌

### 2. Numero di Telefono

Il numero deve avere il prefisso internazionale:

**Corretto:**
- +393291234567 ✅
- +39 329 1234567 ✅

**Accettabile (viene convertito):**
- 3291234567 → +393291234567 ✅

### 3. Data di Nascita

La data viene usata per inferire interessi appropriati all'età:

**Giovani (18-25):**
- Videogiochi, musica, social media, scuola

**Adulti (26-45):**
- Lavoro, famiglia, viaggi, tecnologia

**Maturi (46+):**
- Pensione, salute, nipoti, hobby

---

## Prossimi Passi

1. **Prepara il tuo CSV** con le colonne: nome, celular, email, nascimento
2. **Ottieni API Keys:**
   - Apollo: https://www.apollo.io/
   - OpenRouter: https://openrouter.ai/
3. **Esegui l'enrichment:**
   ```bash
   npx tsx lib/workflow-engine/examples/csv-enrichment-example.ts
   ```
4. **Recupera i file generati:**
   - `enriched-contacts.csv` - CSV arricchito
   - `enriched-contacts.json` - JSON completo

---

**Buon enrichment! 🎉**
