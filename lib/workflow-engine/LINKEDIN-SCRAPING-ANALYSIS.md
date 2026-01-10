# LinkedIn Scraping su Apify - Analisi Comparativa

**Data:** 10 Gennaio 2026
**Obiettivo:** Valutare le migliori opzioni per LinkedIn scraping su Apify per il use case di CSV enrichment
**Contesto:** Workflow engine per arricchimento CSV con dati LinkedIn/Instagram + AI

---

## 📋 Sommario Esecutivo

### Scelta Consigliata
**Actor:** `supreme_coder/linkedin-profile-scraper`
**Costo:** $3 per 1,000 profili ($0.003 per profilo)
**Autenticazione:** No cookie LinkedIn richiesto

### Razionale Principale
- ✅ **70% più economico** dell'API ufficiale Apify
- ✅ **Zero autenticazione LinkedIn** richiesta (no cookies)
- ✅ **Zero rischio** per il tuo account LinkedIn
- ✅ **Alta success rate** e velocità
- ✅ **Adatto** per batch processing su larga scala

---

## 🔍 Opzioni Disponibili su Apify

### 1. API Ufficiale Apify
- **URL:** [apify.com/api/linkedin-scraping-api](https://apify.com/api/linkedin-scraping-api)
- **Costo:** ~$10 per 1,000 profili ($0.01 per profilo)
- **Autenticazione LinkedIn:** ❌ NO - non richiede cookie
- **Autenticazione Apify:** ✅ Sì - richiede API token
- **Pro:**
  - Soluzione ufficiale Apify
  - Supporto e manutenzione garantiti
  - Python client dedicato disponibile
  - Dati strutturati JSON
- **Contro:**
  - 3.3x più costoso di supreme_coder
  - Meno flessibile per use case specifici

### 2. supreme_coder (SCELTA ATTUALE)
- **URL:** [apify.com/supreme_coder/linkedin-profile-scraper](https://apify.com/supreme_coder/linkedin-profile-scraper)
- **Costo:** $3 per 1,000 profili ($0.003 per profilo)
- **Autenticazione LinkedIn:** ❌ NO - no cookie required
- **Autenticazione Apify:** ✅ Sì - richiede API token
- **Caratteristiche:**
  - ✅ Super fast scraping
  - ✅ High success rate
  - ✅ No cookies required
  - ✅ No risk al account LinkedIn
  - ✅ Live data extraction

### 3. dev_fusion - Con Email Discovery
- **URL:** [apify.com/dev_fusion/linkedin-profile-scraper](https://apify.com/dev_fusion/linkedin-profile-scraper)
- **Costo:** Non specificato (stimato ~$5 per 1,000 profili)
- **Autenticazione LinkedIn:** ❌ NO - no cookie required
- **Caratteristiche:**
  - ✅ **INCLUDE email discovery**
  - ✅ No cookies required
  - ✅ Bulk processing
- **Vantaggio:**
  - Elimina bisogno di separare email finder
  - Costo totale potenzialmente inferiore (profilo + email in uno)

### 4. harvestapi - LinkedIn Profile Search
- **URL:** [apify.com/harvestapi/linkedin-profile-search](https://apify.com/harvestapi/linkedin-profile-search)
- **Costo:** ~$9 per 1,000 profili ($0.009 per profilo)
- **Autenticazione LinkedIn:** ❌ NO - no cookie required
- **Caratteristiche:**
  - ✅ Search avanzato
  - ✅ No cookies required
  - Enterprise scale

### 5. bebity - Pay-Per-Result
- **URL:** [apify.com/bebity/best-cheapest-linkedin-profiles-scraper-pay-per-result](https://apify.com/bebity/best-cheapest-linkedin-profiles-scraper-pay-per-result)
- **Modello:** Pay-per-result
- **Autenticazione:** No cookies required
- **Vantaggio:**
  - ✅ **Paga solo se trova dati**
  - Zero costi per risultati vuoti
  - Ottimo per dati incerti

### 6. Actor con Cookie (SConsigliati)
- **curious_coder/linkedin-profile-scraper**
- **Costo:** ~$25/month + usage
- **Autenticazione:** ⚠️ Richiede LinkedIn cookies
- **Svantaggi:**
  - Richiede session cookies LinkedIn
  - Rischio account detection
  - Complessità di gestione sessioni

---

## 💰 Analisi Costi Dettagliata

### Costo per 1,000 Profili

| Soluzione | Costo | Risparmio vs API Ufficiale |
|-----------|-------|---------------------------|
| **API Ufficiale** | $10.00 | - |
| **supreme_coder** | $3.00 | 70% |
| **harvestapi** | $9.00 | 10% |
| **dev_fusion** | ~$5.00 | 50% (stimato) |
| **bebity (PPR)** | Variabile | 0-100% |

### Costo per Volume

| Volume | API Ufficiale | supreme_coder | Risparmio |
|--------|---------------|---------------|----------|
| 1,000 profili | $10 | $3 | $7 |
| 10,000 profili | $100 | $30 | $70 |
| 100,000 profili | $1,000 | $300 | $700 |

### Costo Totale Workflow (per 1,000 contatti)

```
Approccio 1: supreme_coder + Email finder separato
├─ LinkedIn (supreme_coder): $3/1000
├─ Email finder (Hunter.io): $4/1000
└─ Totale: $7/1000

Approccio 2: dev_fusion con email integrata
└─ LinkedIn + Email: ~$5/1000
└─ Risparmio: $2/1000 (29%)
```

---

## 🔐 Autenticazione e Sicurezza

### Requisiti Autenticazione

Tutte le soluzioni richiedono **Apify API Token**, ma differiscono per LinkedIn:

#### ❌ Richiedono Cookie LinkedIn (SConsigliati)
- `curious_coder/linkedin-profile-scraper`
- Rischio account detection
- Complessità gestione sessioni

#### ✅ NO Cookie LinkedIn (Consigliate)
- **API Ufficiale** - `api/linkedin-scraping-api`
- **supreme_coder** - `supreme_coder/linkedin-profile-scraper`
- **dev_fusion** - `dev_fusion/linkedin-profile-scraper`
- **harvestapi** - `harvestapi/linkedin-profile-search`
- **bebity** - `bebity/best-cheapest-linkedin-profiles-scraper-pay-per-result`

### Tabella Comparativa Sicurezza

| Soluzione | Cookie LinkedIn? | Apify Token | Rischio Account |
|-----------|-----------------|-------------|-----------------|
| **API Ufficiale** | ❌ NO | ✅ Sì | 🟢 Zero |
| **supreme_coder** | ❌ NO | ✅ Sì | 🟢 Zero |
| **dev_fusion** | ❌ NO | ✅ Sì | 🟢 Zero |
| **harvestapi** | ❌ NO | ✅ Sì | 🟢 Zero |
| **curious_coder** | ⚠️ Sì | ✅ Sì | 🔴 Alto |

---

## 📊 Razionali della Scelta

### Perché `supreme_coder` è stata scelta nel codice originale:

1. **Costo-Efficacia**
   - $3/1000 vs $10/1000 = **70% di risparmio**
   - Per 10,000 contatti: **$70 di risparmio**

2. **Semplicità Operativa**
   - No cookies = niente session management
   - No autenticazione LinkedIn
   - Zero configurazione LinkedIn

3. **Volume e Scalabilità**
   - Adatto per batch processing
   - Scalabile per grandi dataset
   - Alta success rate

4. **Sicurezza**
   - Zero rischio per account LinkedIn
   - Non compromette credenziali
   - Lavora con dati pubblici

### Quando considerare alternative:

#### **→ dev_fusion** (con email)
Se ti servono anche le email:
```
Costo approccio attuale:
├─ supreme_coder: $3/1000 (profilo)
├─ Hunter.io: $4/1000 (email)
└─ Totale: $7/1000

Costo con dev_fusion:
└─ dev_fusion: ~$5/1000 (profilo + email)
└─ Risparmio: $2/1000 (29%)
```

**Vantaggi aggiuntivi:**
- Meno actor nel workflow
- Meno complessità di orchestrazione
- Unica chiamata API invece di due

#### **→ API Ufficiale** (per enterprise)
Se ti serve:
- Supporto enterprise dedicato
- SLA e contratti di servizio
- Aggiornamenti continui garantiti
- Risk compliance e governance

#### **→ bebity Pay-Per-Result** (per dati incerti)
Se:
- Non sei sicuro di trovare profili
- Vuoi zero costi per risultati vuoti
- Hai alta percentuale di ricerche senza risultato

---

## 🎯 Raccomandazioni Finali

### Per CSV Enrichment Use Case

**Mantieni `supreme_coder`** perché:
1. ✅ Zero autenticazione LinkedIn (come API ufficiale)
2. ✅ 70% più economico dell'API ufficiale
3. ✅ Zero rischio per il tuo account
4. ✅ Funziona con dati pubblici/metadata
5. ✅ Alta success rate

### Considera `dev_fusion` se:
- Vuoi **email discovery** integrata
- Vuoi ridurre numero di actor nel workflow
- Vuoi ottimizzare costi totali (profilo + email)
- Prezzo combinato ~$5/1000 vs $7/1000 attuale

### Non usare actor con cookie perché:
- ❌ Rischio ban account LinkedIn
- ❌ Complessità gestione sessioni
- ❌ Manutenzione cookies che scadono
- ❌ Non vale la pena per questo use case

---

## 📚 Risorse e Riferimenti

### Documentazione Apify
- [Apify Platform Pricing](https://apify.com/pricing)
- [Apify API Documentation](https://docs.apify.com/api/v2)
- [LinkedIn Scraping API](https://apify.com/api/linkedin-scraping-api)

### Actor Specifici
- [supreme_coder LinkedIn Scraper](https://apify.com/supreme_coder/linkedin-profile-scraper)
- [dev_fusion LinkedIn with Email](https://apify.com/dev_fusion/linkedin-profile-scraper)
- [harvestapi LinkedIn Search](https://apify.com/harvestapi/linkedin-profile-search)
- [bebity Pay-Per-Result](https://apify.com/bebity/best-cheapest-linkedin-profiles-scraper-pay-per-result)
- [harvestapi LinkedIn Posts](https://apify.com/harvestapi/linkedin-profile-posts)

### Analisi e Confronti
- [Apify Review 2025](https://hackceleration.com/apify-review/)
- [Best LinkedIn Scraping Tools 2025](https://medium.com/@darshankhandelbal12/5-best-linkedin-scraping-tools-ranked-by-scalability-data-quality-and-pricing-9183593dfb06)
- [Best LinkedIn Scrapers Benchmarks](https://research.aimultiple.com/linkedin-scrapers/)
- [Apify Pricing Analysis](https://igleads.io/resources/apify-pricing/)

### Python Client
- [LinkedIn Scraping API Python](https://apify.com/api/linkedin-scraping-api/python)
- [No-Cookie LinkedIn Python](https://apify.com/logical_scrapers/linkedin-profile-scraper-no-cookies/api/python)

---

## 🔄 Changelog

- **10 Gen 2026:** Creazione documento iniziale con analisi comparativa completa
- Basato su ricerca web e documentazione Apify Gennaio 2026

---

## ✅ Decisione Approvata

**Actor:** `supreme_coder/linkedin-profile-scraper`
**Stato:** ✅ APPROVATO per produzione
**Motivazione:** Miglior rapporto costo/beneficio, zero rischi, perfetto per CSV enrichment
**Costo:** $3/1000 profili (70% di risparmio vs API ufficiale)

**Alternative da considerare per ottimizzazioni future:**
- `dev_fusion` se serve email discovery integrata
- `bebity` per pay-per-result su dati incerti

---

*Documento creato come memo tecnico per decisioni architecture su LinkedIn scraping*
