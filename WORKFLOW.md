# Lume Development Workflow

## Branch Structure

```
lume (GitHub)
├── main         → Production (stabile)
├── develop      → Sviluppo attivo
└── feature/*    → Nuove funzionalità (opzionale)
```

## Workflow Giornaliero

### 1. Sviluppo Nuova Funzionalità

```bash
# Svuota la cartella di lavoro se necessario
git checkout develop

# Apri il tuo editor e lavora
# Quando sei pronto a testare:
git add .
git commit -m "feat: descrizione della funzionalità"
git push origin develop
```

**Risultato:** Vercel crea automaticamente una **Preview Deployment** per il branch `develop`
- URL: `https://lume-git-develop-davide6169.vercel.app`
- Puoi testare tutte le modifiche prima di produzione

---

### 2. Quando la Funzionalità è Stabile

```bash
# Merge develop → main
git checkout main
git merge develop
git push origin main
```

**Risultato:** Vercel deploya automaticamente in **Production**
- URL: `https://lume-xyz123.vercel.app` (o il tuo dominio)

---

### 3. Sviluppo con Branch Feature (Opzionale)

Per funzionalità complesse che richiedono più giorni:

```bash
# Crea branch feature
git checkout develop
git checkout -b feature/nome-funzionalità

# Lavora e committa
git add .
git commit -m "feat: lavoro in corso"
git push origin feature/nome-funzionalità
```

**Risultato:** Vercel crea una Preview per ogni feature branch

Quando completato:
```bash
# Merge in develop
git checkout develop
git merge feature/nome-funzionalità
git push origin develop

# Elimina branch feature (opzionale)
git branch -d feature/nome-funzionalità
git push origin --delete feature/nome-funzionalità
```

---

## Configurazione Vercel

### Step 1: Cambia Repository collegato

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto
3. **Settings** → **Git**
4. **Edit Repository**
5. Cambia da `lume-app` a `lume`
6. Salva

### Step 2: Configura Production Branch

1. **Settings** → **Git**
2. **Production Branch** = `main`
3. **Ignore Build Step** → Aggiungi pattern se necessario (es: `**/*.md`)

### Step 3: Attiva Preview Deployments

1. **Settings** → **Git**
2. Assicurati che **Preview Deployments** sia attivo
3. Puoi limitare i branch che creano preview se necessario

---

## Comandi Utili

### Stato dei Branch
```bash
git branch -a              # Vedi tutti i branch
git status                 # Vedi stato corrente
git log --oneline --graph  # Vedi storia branch
```

### Sincronizzazione
```bash
git fetch origin           # Aggiorna stato remoto
git pull origin main       # Pull ultime modifiche main
git pull origin develop    # Pull ultime modifiche develop
```

### Merge con Conflict
```bash
# Quando c'è un conflitto durante merge
git status                  # Vedi file con conflitti
# Modifica i file, risolvi i conflitti (<<<<< ==== >>>>>)
git add <file>             # Mark as resolved
git commit                 # Completa merge
```

### Annullare Modifiche
```bash
git checkout -- <file>     # Annulla modifiche file locale
git reset HEAD <file>      # Rimuovi file da staging
git reset --soft HEAD~1    # Annulla ultimo commit (mantiene modifiche)
git reset --hard HEAD~1    # Annulla ultimo commit (perde modifiche)
```

---

## Best Practices

### Commit Messages
```bash
feat: aggiunge nuova funzionalità
fix: risolve bug
docs: aggiorna documentazione
style: formatta codice
refactor: refactoring codice
test: aggiunge test
chore: manutenzione
```

### Prima di Pushare
```bash
# 1. Controlla cosa stai pushando
git status
git diff

# 2. Esegui test se presenti
npm run test
npm run build

# 3. Poi pusha
git push origin <branch>
```

### Quando Usare Quale Branch
- **main**: Solo codice testato e stabile, pronto per produzione
- **develop**: Sviluppo attivo, può avere bug ma funziona
- **feature/***: Sviluppo sperimentale, non deve rompere nulla

---

## Debugging

### Vercel Deployment Fallito
1. Vai su Vercel Dashboard → Deployments
2. Clicca sul deployment fallito
3. Vedi "Build Logs" per errori
4. Correggi e pusha nuovamente

### Preview Deployment Non Funziona Come Atteso
- Ricontrolla variabili d'ambiente su Vercel per il branch
- Alcune env var potrebbero essere solo per Production

### Merge Difficile
```bash
# Se merge è troppo complicato, usa strategy
git merge develop --strategy-option theirs  # Prende versione develop
# oppure
git merge develop --strategy-option ours    # Mantiene versione main
```

---

## Riferimenti

- [Git Branching](https://www.atlassian.com/git/tutorials/using-branches)
- [Vercel Git Integration](https://vercel.com/docs/deployments/overview)
- [Conventional Commits](https://www.conventionalcommits.org/)
