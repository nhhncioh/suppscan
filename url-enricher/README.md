
# Supplements URL Enricher

Fills `canonical_product_url`, `review_url_1`, `review_url_2` for a large product CSV.

## What it does
1. Builds search queries from `brand`, `product_name`, `variant_generic`, `brand_domain`, `source_priority`.
2. Queries DuckDuckGo HTML results (no API key).
3. Scores candidate URLs by domain preference.
4. Fetches candidate pages, validates with Product JSON-LD (`@type: "Product"`) and brand/product name similarity.
5. Writes a new CSV with URLs and `last_verified_utc`.

## Usage

```bash
# 1) Ensure Node 18+
node -v

# 2) Install deps
npm i

# 3) Build
npm run build

# 4) Enrich
node dist/enrich.js --in ../supplements_registry_1200_simple.csv --out ../supplements_registry_1200_enriched.csv --concurrency 5 --only-missing
```

Flags:
- `--in` (required): path to input CSV
- `--out` (required): output CSV path
- `--concurrency` (default 5)
- `--only-missing` (optional): only fill rows where `canonical_product_url` is empty
- `--limit N` (optional): process only the first N rows for testing

Notes:
- Respects domain preference via `source_priority` if your CSV includes it; otherwise prefers brand domain then common retailers.
- For brand pages that host reviews on the same page, `review_url_1` equals `canonical_product_url`.
