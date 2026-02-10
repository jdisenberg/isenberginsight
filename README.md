# Isenberg Insight- Wound Report Checker

This app now starts with a splash page and includes two tools:

1. `Tabular Report`
2. `Graft Candidate Checker`

## Run

1. Open `/Users/jamesisenberg/Downloads/Report checker/index.html` in your browser.
2. Pick a tool from the splash page.
3. Upload your report and run checks.

## Input Report Columns

Both tools expect the same report layout:
- `Name`
- `wound number`
- `Aquired at facility` (or `Acquired at facility`)
- `wound type`
- `wound location`
- `wound assessment date`
- `wound progress`
- `stage`
- `size (lxwxd) cm`
- `exudate`
- `exudate amount`

Other columns (including `provider recommendations`) are ignored by current logic.

## Tabular Report

Runs discrepancy checks and exports CSV results.

Note:
- Rows where `wound progress` contains `resolved` are excluded from Tabular Report findings.
- Rows where `wound type` contains `no wound` or `resolved` are excluded.
- Rows where calculated area from `length x width` is `0` are excluded.

## Graft Candidate Checker

Logic:
1. For each patient + wound, find the latest visit.
2. Find the visit closest to 30 days before that latest visit.
3. Calculate area from `size (lxwxd) cm` using `length * width`.
4. Compute `% area decrease = ((priorArea - latestArea) / priorArea) * 100`.
5. Flag as candidate if decrease is `< 40%`.

Output behavior:
- Area is always calculated from `length x width` only (depth is ignored).
- `% Area Change` is shown as a positive value with a separate `Trend` column:
  - `Increased`
  - `Decreased`
  - `No Change`

Export:
- Exports `graft-candidates.xlsx` with patient name, wound number, prior/latest dates and areas, percent decrease, and total area in sq cm.
