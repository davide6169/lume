# CSV Interest Enrichment - Guida Rapida

## 🎯 Obiettivo

**Banco di prova iniziale** del workflow engine per arricchire un CSV di contatti con interessi.

## 📥 Input

```csv
nome;celular;email;nascimento
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986
Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983
Giuseppe Verdi;3273456789;giuseppe.verdi@mydomain.com;
```

## 📤 Output

```csv
nome;celular;email;nascimento;interessi
Mario Rossi;3291234567;mario.rossi@mydomain.com;21/02/1986;chitarra elettrica, escursionismo montagna, fotografia paesaggi
Luca Bianchi;3282345678;luca.bianchi@mydomain.com;27/01/1983;cinema italiano, regia teatrale, letteratura
Giuseppe Verdi;3273456789;giuseppe.verdi@mydomain.com;;opera lirica, musica classica, pianoforte
```

**NOTA:** Il campo `interessi` viene aggiunto alla fine. Se non troviamo dati bio, il campo è vuoto.

## ⚙️ Come Funziona

### 3 Strategie Utilizzate

1. **Country Detection** (dal telefono)
   - Input: `+393291234567`
   - Output: `Italy` 🇮🇹
   - Costo: GRATIS
   - Coverage: 100%

2. **LinkedIn via Apify** (solo email business)
   - Actor: `supreme_coder/linkedin-profile-scraper`
   - Input: `mario.rossi@mydomain.com`
   - Output: Skills professionali
   - Costo: $0.003 per contatto
   - Coverage: ~35%

3. **Instagram Search via Apify**
   - Actor: `apify/instagram-search-scraper`
   - Input: "Mario Rossi" + Italy
   - Output: Bio + Posts
   - Costo: $0.05 per contatto
   - Coverage: 40-60%

4. **Contextualized LLM Analysis**
   - Analizza bio/posts CON context culturale italiano
   - Estrae interessi REALI (non stereotipi)
   - Costo: $0.0001 per contatto

### Se NON Troviamo Dati Bio?

```
✅ Campo "interessi" = VUOTO
✅ NON generiamo interessi fake
✅ Siamo onesti con il cliente
```

## 💰 Costi per 100 Contatti

| Strategy | Contatti | Costo | Totale |
|----------|----------|-------|--------|
| Country Detection | 100 | $0.00 | $0.00 |
| LinkedIn (35) | 35 | $0.003 | $0.11 |
| Instagram (50) | 50 | $0.05 | $2.50 |
| LLM Analysis | 50 | $0.0001 | $0.01 |
| **TOTALE** | **100** | | **$2.62** |

**Costo medio per contatto:** ~$0.026

## 🚀 Come Eseguire

### Opzione 1: Script Node.js

```bash
npx tsx lib/workflow-engine/examples/csv-interest-enrichment-example.ts
```

### Opzione 2: Blocco Diretto

```typescript
import { CSVInterestEnrichmentBlock } from './lib/workflow-engine'

const block = new CSVInterestEnrichmentBlock()

const input = {
  csv: {
    headers: ['nome', 'celular', 'email', 'nascimento'],
    rows: [
      {
        nome: 'Mario Rossi',
        celular: '3291234567',
        email: 'mario.rossi@mydomain.com',
        nascimento: '21/02/1986'
      }
    ]
  }
}

const config = {
  apifyToken: process.env.APIFY_TOKEN,
  openrouterToken: process.env.OPENROUTER_API_KEY,
  enableLinkedIn: true,
  enableInstagram: true
}

const result = await block.execute(config, input, context)
```

## 📊 Risultato Atteso

Per 100 contatti italiani con email business:

```
✅ 50 contatti con interessi REALI (da LinkedIn/Instagram)
⚠️ 50 contatti con campo interessi VUOTO (nessun profilo social trovato)

💰 Costo totale: $2.62
📈 Coverage: 50% con dati verificati
```

## 🎯 File Creati

1. **Blocco:** `lib/workflow-engine/blocks/csv/csv-interest-enrichment.block.ts`
2. **Esempio:** `lib/workflow-engine/examples/csv-interest-enrichment-example.ts`

## ⚡ Prossimi Passi

1. Setta le API keys (Apify + OpenRouter)
2. Prepara il tuo CSV con le colonne: nome, celular, email, nascimento
3. Esegui lo script
4. Recupera il CSV arricchito con il campo "interessi"

**Pronto per il banco di prova! 🚀**
