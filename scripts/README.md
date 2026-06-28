# antenna-tracker scripts

Two helper scripts for keeping static data files fresh.

## generate_banner_report.py

Reads `app/_data/market.json`, computes weekly insights, writes back to:

- `app/_data/market.json` (updates `weekly_banner` field)
- `docs/market-weekly.md` (full report)

```bash
# Preview
python scripts/generate_banner_report.py --dry-run

# Generate
python scripts/generate_banner_report.py
```

Runs automatically every Monday 09:00 Beijing via `.github/workflows/market-weekly.yml`.

## kg_import.py

Reads `data/entities.csv` + `data/relations.csv`, appends to `app/_data/knowledge-graph.json`.

```bash
# Preview
python scripts/kg_import.py --dry-run

# Apply
python scripts/kg_import.py
```

### CSV formats

**entities.csv** (required columns): `id, type, name, description`
- Optional: `source_sectors` (semicolon-separated), `stock_code`, `location`, `is_key`

**relations.csv** (required columns): `source, target, relation`
- Optional: `confidence` (0.0-1.0 or 0-100), `evidence`

### Type whitelist

`company | technology | standard | material | event`

### Behavior

- **Append-only** — never deletes existing entries
- **Deduplication** — entities by `id`, relations by `(source, target, relation)` triple
- **Validation** — type whitelist, ID reference integrity, confidence normalization
- **Idempotent** — re-running produces 0 new entries once applied
- **`--strict`** — fail on validation errors (default: warn and skip)