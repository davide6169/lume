# Workflow Engine Documentation

**Complete documentation for the Lume Workflow Engine**

---

## 📑 Documentation Structure

```
docs/workflow-engine/
├── README.md                    # This file - Documentation overview
├── INDEX.md                     # 🌟 START HERE - Complete blocks & workflows index
└── guides/                      # Detailed user guides (to be created)
    ├── getting-started.md
    ├── blocks-guide.md
    └── workflows-guide.md
```

---

## 🚀 Quick Start

### New to Workflow Engine?
Start here: **[INDEX.md](./INDEX.md)** - Complete overview of all blocks and workflows

### Want to Use the CLI?
Read: **[CLI Guide](../../lib/workflow-engine/CLI-GUIDE.md)**

### Developing Without API Keys?
Read: **[Mock Mode Guide](../../lib/workflow-engine/MOCK-MODE-GUIDE.md)**

### Building Custom Workflows?
Read: **[Workflow Building Guide](../../lib/workflow-engine/WORKFLOW-BUILDING-GUIDE.md)**

---

## 📚 Documentation by Topic

### Getting Started
- **[INDEX.md](./INDEX.md)** - All blocks and workflows catalog
- **[CLI Guide](../../lib/workflow-engine/CLI-GUIDE.md)** - Command-line interface reference
- **[Mock Mode Guide](../../lib/workflow-engine/MOCK-MODE-GUIDE.md)** - Development without API costs

### Blocks Documentation
- **[Blocks Quick Reference](../../lib/workflow-engine/BLOCKS-QUICK-REFERENCE.md)** - Block reference card
- **[Block Reusability Guide](../../lib/workflow-engine/BLOCK-REUSABILITY-GUIDE.md)** - Reuse blocks effectively

### Workflow Templates
- **[CSV Interest Quick Start](../../lib/workflow-engine/CSV-INTEREST-QUICK-START.md)** - CSV enrichment workflow
- **[Lead Enrichment Guide](../../lib/workflow-engine/LEAD-ENRICHMENT-GUIDE.md)** - Complete lead enrichment
- **[Workflow Building Guide](../../lib/workflow-engine/WORKFLOW-BUILDING-GUIDE.md)** - Build custom workflows

### Technical Documentation
- **[Project README](../../lib/workflow-engine/README.md)** - Technical overview
- **[Sprint Completions](../../lib/workflow-engine/)** - Implementation history

---

## 🎯 Common Tasks

### Test a Block
```bash
npm run workflow -- blocks test --type csv.interestEnrichment --mode demo
```

### Execute a Workflow
```bash
npm run workflow -- exec --id my-workflow --mode demo
```

### List All Blocks
```bash
npm run workflow -- blocks list
```

### List All Workflows
```bash
npm run workflow -- list
```

---

## 📖 Documentation Legend

- 🌟 **START HERE** - Begin with this document
- ⭐ **Beginner** - Easy to start with
- ⭐⭐ **Intermediate** - Some experience required
- ⭐⭐⭐ **Advanced** - Complex topics

---

## 🔧 File Organization

### User Documentation (`docs/`)
- **INDEX.md** - Central hub for all blocks and workflows
- **guides/** - Step-by-step tutorials (coming soon)

### Developer Documentation (`lib/workflow-engine/`)
- Technical implementation details
- Sprint completion reports
- Block source code
- API documentation

### CLI Documentation (`scripts/workflow-cli/`)
- CLI implementation
- Command reference
- Examples

---

## 💡 Tips for Navigating

1. **Looking for a specific block?** → Check [INDEX.md](./INDEX.md)
2. **Need to use the CLI?** → Check [CLI Guide](../../lib/workflow-engine/CLI-GUIDE.md)
3. **Building a workflow?** → Check [Workflow Building Guide](../../lib/workflow-engine/WORKFLOW-BUILDING-GUIDE.md)
4. **Developing blocks?** → Check [Block Reusability Guide](../../lib/workflow-engine/BLOCK-REUSABILITY-GUIDE.md)

---

## 📞 Need Help?

- **CLI Help:** `npm run workflow -- --help`
- **Command Help:** `npm run workflow -- <command> --help`
- **GitHub Issues:** https://github.com/davide6169/lume/issues

---

**Last Updated:** 2026-01-10
**Version:** 1.0.0
