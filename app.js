const EXCLUDED_REQUIRED_COLUMNS = ["acquired at facility", "aquired at facility"];

const EXPECTED_COLUMNS = {
  patient: ["Name"],
  wound: ["wound number"],
  acquiredAtFacility: ["Aquired at facility", "Acquired at facility"],
  woundType: ["wound type"],
  woundLocation: ["wound location"],
  date: ["wound assessment date"],
  progress: ["wound progress"],
  stage: ["stage"],
  size: ["size (lxwxd) cm"],
  exudate: ["exudate"],
  exudateAmount: ["exudate amount"],
};

const REQUIRED_KEYS = Object.keys(EXPECTED_COLUMNS);

const state = {
  mode: "splash",
  tabular: {
    workbook: null,
    sheetName: "",
    rows: [],
    columns: [],
    results: [],
    resolvedColumns: {},
  },
  graft: {
    workbook: null,
    sheetName: "",
    rows: [],
    columns: [],
    results: [],
    resolvedColumns: {},
  },
};

const els = {
  splashView: document.getElementById("splashView"),
  tabularView: document.getElementById("tabularView"),
  graftView: document.getElementById("graftView"),
  openTabularBtn: document.getElementById("openTabularBtn"),
  openGraftBtn: document.getElementById("openGraftBtn"),
  backFromTabularBtn: document.getElementById("backFromTabularBtn"),
  backFromGraftBtn: document.getElementById("backFromGraftBtn"),

  tabularFileInput: document.getElementById("tabularFileInput"),
  tabularSheetSelect: document.getElementById("tabularSheetSelect"),
  tabularFileMeta: document.getElementById("tabularFileMeta"),
  tabularSummary: document.getElementById("tabularSummary"),
  tabularRunBtn: document.getElementById("tabularRunBtn"),
  tabularExportBtn: document.getElementById("tabularExportBtn"),
  tabularResultsBody: document.querySelector("#tabularResultsTable tbody"),

  graftFileInput: document.getElementById("graftFileInput"),
  graftSheetSelect: document.getElementById("graftSheetSelect"),
  graftFileMeta: document.getElementById("graftFileMeta"),
  graftSummary: document.getElementById("graftSummary"),
  graftRunBtn: document.getElementById("graftRunBtn"),
  graftExportBtn: document.getElementById("graftExportBtn"),
  graftResultsBody: document.querySelector("#graftResultsTable tbody"),
};

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function displayValue(value) {
  return value == null ? "" : String(value);
}

function excelSerialToDate(serial) {
  if (typeof serial !== "number" || Number.isNaN(serial)) return null;
  if (serial <= 0) return null;
  const base = Date.UTC(1899, 11, 30);
  const millis = Math.round(serial * 24 * 60 * 60 * 1000);
  const dt = new Date(base + millis);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function parseDate(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") return excelSerialToDate(value);
  const asNumber = Number(String(value).trim());
  if (!Number.isNaN(asNumber) && String(value).trim() !== "") {
    const serialDate = excelSerialToDate(asNumber);
    if (serialDate) return serialDate;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return "";
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function displayAssessmentDate(value) {
  const parsed = parseDate(value);
  if (!parsed) return displayValue(value);
  return formatDate(parsed);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function parseSizeArea(sizeValue) {
  const text = String(sizeValue ?? "").trim();
  if (!text) return null;
  const matches = text.match(/\d+(\.\d+)?/g);
  if (!matches || matches.length < 2) return null;
  const nums = matches.map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length < 2) return null;
  // Area is square centimeters from length x width only. Depth is intentionally ignored.
  return nums[0] * nums[1];
}

function nonEmptyCellCount(row) {
  if (!Array.isArray(row)) return 0;
  return row.filter((cell) => normalize(cell) !== "").length;
}

function rowMatchScore(row) {
  if (!Array.isArray(row)) return 0;
  const rowValues = row.map((cell) => normalize(cell));
  let score = 0;
  Object.values(EXPECTED_COLUMNS).forEach((aliases) => {
    const matched = aliases.some((alias) => rowValues.includes(normalize(alias)));
    if (matched) score += 1;
  });
  return score;
}

function detectHeaderRow(grid) {
  const maxRowsToScan = Math.min(grid.length, 25);
  let bestIndex = -1;
  let bestScore = -1;
  let bestNonEmpty = -1;

  for (let i = 0; i < maxRowsToScan; i += 1) {
    const row = grid[i];
    const score = rowMatchScore(row);
    const nonEmpty = nonEmptyCellCount(row);
    if (score > bestScore || (score === bestScore && nonEmpty > bestNonEmpty)) {
      bestIndex = i;
      bestScore = score;
      bestNonEmpty = nonEmpty;
    }
  }
  if (bestScore > 0) return bestIndex;
  for (let i = 0; i < maxRowsToScan; i += 1) {
    if (nonEmptyCellCount(grid[i]) > 0) return i;
  }
  return -1;
}

function setMode(mode) {
  state.mode = mode;
  els.splashView.classList.toggle("hidden", mode !== "splash");
  els.tabularView.classList.toggle("hidden", mode !== "tabular");
  els.graftView.classList.toggle("hidden", mode !== "graft");
}

function findColumn(columns, aliases) {
  const normalizedColumns = columns.map((col) => ({ original: col, normalized: normalize(col) }));
  for (const alias of aliases) {
    const exact = normalizedColumns.find((c) => c.normalized === normalize(alias));
    if (exact) return exact.original;
  }
  return "";
}

function resolveColumns(columns) {
  const resolved = {};
  Object.keys(EXPECTED_COLUMNS).forEach((key) => {
    resolved[key] = findColumn(columns, EXPECTED_COLUMNS[key]);
  });
  return resolved;
}

function missingRequiredColumns(resolvedColumns) {
  return REQUIRED_KEYS.filter((key) => !resolvedColumns[key]);
}

function buildRowsFromSheet(ws) {
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headerRowIndex = detectHeaderRow(grid);
  const headerRow = headerRowIndex >= 0 && Array.isArray(grid[headerRowIndex]) ? grid[headerRowIndex] : [];
  const columns = headerRow.map((cell) => String(cell ?? "").trim()).filter((name) => name !== "");
  const dataRows = grid
    .slice(headerRowIndex + 1)
    .filter((row) => Array.isArray(row) && row.some((cell) => normalize(cell) !== ""));
  const rows = dataRows.map((row) => {
    const obj = {};
    columns.forEach((column, idx) => {
      obj[column] = row[idx] ?? "";
    });
    return obj;
  });
  return { columns, rows, headerRowIndex };
}

function populateSheetSelect(selectEl, workbook) {
  const names = workbook ? workbook.SheetNames : [];
  selectEl.innerHTML = '<option value="">Select sheet</option>';
  names.forEach((name) => {
    const op = document.createElement("option");
    op.value = name;
    op.textContent = name;
    selectEl.appendChild(op);
  });
  selectEl.disabled = names.length === 0;
}

function tabularIssue(row, rowIndex, check, column, value, text, resolvedColumns) {
  return {
    row: rowIndex + 2,
    patient: displayValue(row?.[resolvedColumns.patient]),
    assessmentDate: displayAssessmentDate(row?.[resolvedColumns.date]),
    check,
    column,
    value: displayValue(value),
    issue: text,
  };
}

function tabularGroupedRowsByPatientWound(rowItems, resolvedColumns) {
  const groups = new Map();
  rowItems.forEach(({ row, rowIndex }) => {
    const patient = normalize(row[resolvedColumns.patient]);
    const wound = normalize(row[resolvedColumns.wound]);
    if (!patient || !wound) return;
    const key = `${patient}::${wound}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ row, rowIndex });
  });
  return groups;
}

function runTabularChecks() {
  const tab = state.tabular;
  const missing = missingRequiredColumns(tab.resolvedColumns);
  if (missing.length > 0) {
    const labels = missing.map((key) => `"${EXPECTED_COLUMNS[key][0]}"`).join(", ");
    alert(`Missing expected report columns: ${labels}`);
    return;
  }

  const progressCol = tab.resolvedColumns.progress;
  const woundTypeCol = tab.resolvedColumns.woundType;
  const sizeCol = tab.resolvedColumns.size;
  const activeRows = tab.rows
    .map((row, rowIndex) => ({ row, rowIndex }))
    .filter(({ row }) => {
      const progressText = normalize(row[progressCol]);
      if (progressText.includes("resolved")) return false;

      const woundTypeText = normalize(row[woundTypeCol]);
      if (woundTypeText.includes("no wound") || woundTypeText.includes("resolved")) return false;

      const area = parseSizeArea(row[sizeCol]);
      if (area != null && area <= 0) return false;

      return true;
    });

  const results = [];
  activeRows.forEach(({ row, rowIndex }) => {
    tab.columns.forEach((column) => {
      if (EXCLUDED_REQUIRED_COLUMNS.includes(normalize(column))) return;
      if (normalize(row[column]) === "") {
        results.push(tabularIssue(row, rowIndex, "Required Field", column, row[column], "Required value is blank.", tab.resolvedColumns));
      }
    });
  });

  const groups = tabularGroupedRowsByPatientWound(activeRows, tab.resolvedColumns);
  groups.forEach((items) => {
    const sorted = [...items].sort((a, b) => {
      const da = parseDate(a.row[tab.resolvedColumns.date]);
      const db = parseDate(b.row[tab.resolvedColumns.date]);
      if (da && db) return da - db;
      return a.rowIndex - b.rowIndex;
    });

    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevArea = parseSizeArea(prev.row[tab.resolvedColumns.size]);
      const currArea = parseSizeArea(curr.row[tab.resolvedColumns.size]);
      if (prevArea == null || currArea == null) continue;
      const progressText = normalize(curr.row[tab.resolvedColumns.progress]);
      const patient = displayValue(curr.row[tab.resolvedColumns.patient]) || "Unknown patient";

      if (progressText.includes("improv") && currArea > prevArea) {
        results.push(
          tabularIssue(
            curr.row,
            curr.rowIndex,
            "Progress vs Size",
            tab.resolvedColumns.progress,
            curr.row[tab.resolvedColumns.progress],
            `${patient}: Progress says improving, but area increased (${prevArea.toFixed(2)} to ${currArea.toFixed(2)}).`,
            tab.resolvedColumns,
          ),
        );
      }
      if ((progressText.includes("wors") || progressText.includes("deterior")) && currArea < prevArea) {
        results.push(
          tabularIssue(
            curr.row,
            curr.rowIndex,
            "Progress vs Size",
            tab.resolvedColumns.progress,
            curr.row[tab.resolvedColumns.progress],
            `${patient}: Progress says worsening, but area decreased (${prevArea.toFixed(2)} to ${currArea.toFixed(2)}).`,
            tab.resolvedColumns,
          ),
        );
      }
    }

    const initialRows = sorted.filter(({ row }) => normalize(row[tab.resolvedColumns.progress]).includes("initial"));
    if (initialRows.length > 1) {
      initialRows.forEach(({ row, rowIndex }) => {
        results.push(
          tabularIssue(
            row,
            rowIndex,
            "Duplicate Initial Exam",
            tab.resolvedColumns.progress,
            row[tab.resolvedColumns.progress],
            "Same patient and wound marked as initial exam more than once.",
            tab.resolvedColumns,
          ),
        );
      });
    }
  });

  const seenSameDay = new Map();
  activeRows.forEach(({ row, rowIndex }) => {
    const patient = normalize(row[tab.resolvedColumns.patient]);
    const wound = normalize(row[tab.resolvedColumns.wound]);
    const date = normalize(row[tab.resolvedColumns.date]);
    if (!patient || !wound || !date) return;
    const key = `${patient}::${wound}::${date}`;
    const items = seenSameDay.get(key) || [];
    items.push({ row, rowIndex });
    seenSameDay.set(key, items);
  });
  seenSameDay.forEach((items) => {
    if (items.length <= 1) return;
    items.forEach(({ row, rowIndex }) => {
      results.push(
        tabularIssue(
          row,
          rowIndex,
          "Duplicate Same-Day Entry",
          tab.resolvedColumns.date,
          row[tab.resolvedColumns.date],
          "Same patient+wound has multiple entries on the same assessment date.",
          tab.resolvedColumns,
        ),
      );
    });
  });

  activeRows.forEach(({ row, rowIndex }) => {
    const dateRaw = row[tab.resolvedColumns.date];
    const parsedDate = parseDate(dateRaw);
    if (displayValue(dateRaw).trim() && !parsedDate) {
      results.push(
        tabularIssue(
          row,
          rowIndex,
          "Date Validity",
          tab.resolvedColumns.date,
          dateRaw,
          "Assessment date is not a valid date.",
          tab.resolvedColumns,
        ),
      );
    } else if (parsedDate && parsedDate > new Date()) {
      results.push(
        tabularIssue(
          row,
          rowIndex,
          "Date Validity",
          tab.resolvedColumns.date,
          dateRaw,
          "Assessment date is in the future.",
          tab.resolvedColumns,
        ),
      );
    }

    const exudateText = normalize(row[tab.resolvedColumns.exudate]);
    const amountText = normalize(row[tab.resolvedColumns.exudateAmount]);
    const saysNoExudate = exudateText.includes("none") || exudateText.includes("no exudate");
    const hasAmount =
      !!amountText &&
      !amountText.includes("none") &&
      !amountText.includes("n/a") &&
      !amountText.includes("na") &&
      !amountText.includes("0") &&
      !amountText.includes("zero");
    if (saysNoExudate && hasAmount) {
      results.push(
        tabularIssue(
          row,
          rowIndex,
          "Exudate Consistency",
          tab.resolvedColumns.exudateAmount,
          row[tab.resolvedColumns.exudateAmount],
          "Exudate is documented as none, but exudate amount is present.",
          tab.resolvedColumns,
        ),
      );
    }
  });

  state.tabular.results = results;
  renderTabularResults();
}

function renderTabularResults() {
  const results = state.tabular.results;
  els.tabularResultsBody.innerHTML = "";
  results.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.row}</td>
      <td>${escapeHtml(r.patient)}</td>
      <td>${escapeHtml(r.assessmentDate)}</td>
      <td>${escapeHtml(r.check)}</td>
      <td>${escapeHtml(r.column)}</td>
      <td>${escapeHtml(r.value)}</td>
      <td>${escapeHtml(r.issue)}</td>
    `;
    els.tabularResultsBody.appendChild(tr);
  });

  if (!results.length) {
    els.tabularSummary.textContent = `No discrepancies found across ${state.tabular.rows.length} rows.`;
  } else {
    const byCheck = results.reduce((acc, item) => {
      acc[item.check] = (acc[item.check] || 0) + 1;
      return acc;
    }, {});
    const parts = Object.entries(byCheck).map(([check, count]) => `${check}: ${count}`);
    els.tabularSummary.textContent = `Found ${results.length} discrepancies. ${parts.join(" | ")}`;
  }
  els.tabularExportBtn.disabled = results.length === 0;
}

function exportTabularCsv() {
  const results = state.tabular.results;
  if (!results.length) return;
  const header = ["Row", "Patient", "Assessment Date", "Check", "Column", "Value", "Issue"];
  const lines = [header.join(",")];
  results.forEach((r) => {
    lines.push([r.row, r.patient, r.assessmentDate, r.check, r.column, r.value, r.issue].map(csvEscape).join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tabular-report-results.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function runGraftCandidateChecks() {
  const graft = state.graft;
  const missing = missingRequiredColumns(graft.resolvedColumns);
  if (missing.length > 0) {
    const labels = missing.map((key) => `"${EXPECTED_COLUMNS[key][0]}"`).join(", ");
    alert(`Missing expected report columns: ${labels}`);
    return;
  }

  const patientCol = graft.resolvedColumns.patient;
  const woundCol = graft.resolvedColumns.wound;
  const dateCol = graft.resolvedColumns.date;
  const sizeCol = graft.resolvedColumns.size;

  const grouped = new Map();
  graft.rows.forEach((row) => {
    const patient = displayValue(row[patientCol]).trim();
    const wound = displayValue(row[woundCol]).trim();
    const date = parseDate(row[dateCol]);
    const area = parseSizeArea(row[sizeCol]);
    if (!patient || !wound || !date || area == null) return;
    const key = `${normalize(patient)}::${normalize(wound)}`;
    const item = { patient, wound, date, area };
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  });

  const results = [];
  grouped.forEach((items) => {
    if (items.length < 2) return;
    const sorted = [...items].sort((a, b) => a.date - b.date);
    const latest = sorted[sorted.length - 1];
    const targetTs = latest.date.getTime() - 30 * 24 * 60 * 60 * 1000;

    let prior = null;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const candidate = sorted[i];
      const diff = Math.abs(candidate.date.getTime() - targetTs);
      if (diff < bestDiff) {
        bestDiff = diff;
        prior = candidate;
      }
    }
    if (!prior || prior.area <= 0) return;

    const percentDecrease = ((prior.area - latest.area) / prior.area) * 100;
    if (percentDecrease >= 40) return;

    let trend = "No Change";
    let areaChangePercent = 0;
    if (latest.area > prior.area) {
      trend = "Increased";
      areaChangePercent = ((latest.area - prior.area) / prior.area) * 100;
    } else if (latest.area < prior.area) {
      trend = "Decreased";
      areaChangePercent = ((prior.area - latest.area) / prior.area) * 100;
    }

    results.push({
      patient: latest.patient,
      wound: latest.wound,
      priorDate: formatDate(prior.date),
      priorArea: Number(prior.area.toFixed(2)),
      latestDate: formatDate(latest.date),
      latestArea: Number(latest.area.toFixed(2)),
      areaChangePercent: Number(areaChangePercent.toFixed(2)),
      trend,
      status: "Candidate (<40% decrease)",
      totalAreaSqCm: Number(latest.area.toFixed(2)),
    });
  });

  state.graft.results = results;
  renderGraftResults();
}

function renderGraftResults() {
  const results = state.graft.results;
  els.graftResultsBody.innerHTML = "";
  results.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.patient)}</td>
      <td>${escapeHtml(r.wound)}</td>
      <td>${escapeHtml(r.priorDate)}</td>
      <td>${r.priorArea}</td>
      <td>${escapeHtml(r.latestDate)}</td>
      <td>${r.latestArea}</td>
      <td>${r.areaChangePercent}%</td>
      <td>${escapeHtml(r.trend)}</td>
      <td>${escapeHtml(r.status)}</td>
    `;
    els.graftResultsBody.appendChild(tr);
  });
  els.graftSummary.textContent = `Found ${results.length} graft candidates.`;
  els.graftExportBtn.disabled = results.length === 0;
}

function exportGraftXlsx() {
  const results = state.graft.results;
  if (!results.length) return;
  const exportRows = results.map((r) => ({
    "Patient Name": r.patient,
    "Wound Number": r.wound,
    "30-Day Prior Date": r.priorDate,
    "30-Day Prior Area (cm2)": r.priorArea,
    "Latest Date": r.latestDate,
    "Latest Area (cm2)": r.latestArea,
    "% Area Change": r.areaChangePercent,
    Trend: r.trend,
    Status: r.status,
    "Total Area (sq cm)": r.totalAreaSqCm,
  }));
  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Graft Candidates");
  XLSX.writeFile(wb, "graft-candidates.xlsx");
}

function loadSheetIntoTool(toolKey, ui) {
  const toolState = state[toolKey];
  if (!toolState.workbook || !toolState.sheetName) return;
  const ws = toolState.workbook.Sheets[toolState.sheetName];
  const parsed = buildRowsFromSheet(ws);
  toolState.columns = parsed.columns;
  toolState.rows = parsed.rows;
  toolState.resolvedColumns = resolveColumns(parsed.columns);

  const missing = missingRequiredColumns(toolState.resolvedColumns);
  if (toolKey === "tabular") {
    ui.runBtn.disabled = parsed.columns.length === 0;
    ui.fileMeta.textContent = `Detected ${parsed.columns.length} headers: ${parsed.columns.join(" | ") || "(none)"}`;
    ui.summary.textContent =
      missing.length > 0
        ? `Loaded ${parsed.rows.length} rows. Missing expected columns: ${missing.map((k) => EXPECTED_COLUMNS[k][0]).join(", ")}.`
        : `Loaded ${parsed.rows.length} rows. Ready to run checks.`;
  } else {
    ui.runBtn.disabled = parsed.columns.length === 0;
    ui.fileMeta.textContent = `Detected ${parsed.columns.length} headers: ${parsed.columns.join(" | ") || "(none)"}`;
    ui.summary.textContent =
      missing.length > 0
        ? `Loaded ${parsed.rows.length} rows. Missing expected columns: ${missing.map((k) => EXPECTED_COLUMNS[k][0]).join(", ")}.`
        : `Loaded ${parsed.rows.length} rows. Ready to run graft checks.`;
  }
}

function wireToolFileHandlers(toolKey, ui) {
  ui.fileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!window.XLSX) {
      ui.summary.textContent = "Excel parser failed to load. Refresh and try again.";
      return;
    }
    const data = await file.arrayBuffer();
    state[toolKey].workbook = XLSX.read(data, { type: "array" });
    populateSheetSelect(ui.sheetSelect, state[toolKey].workbook);
    state[toolKey].sheetName = state[toolKey].workbook.SheetNames[0] || "";
    ui.sheetSelect.value = state[toolKey].sheetName;
    loadSheetIntoTool(toolKey, ui);
    ui.fileMeta.textContent = `Loaded: ${file.name}. ${ui.fileMeta.textContent}`;
  });

  ui.sheetSelect.addEventListener("change", (event) => {
    state[toolKey].sheetName = event.target.value;
    loadSheetIntoTool(toolKey, ui);
  });
}

wireToolFileHandlers("tabular", {
  fileInput: els.tabularFileInput,
  sheetSelect: els.tabularSheetSelect,
  fileMeta: els.tabularFileMeta,
  summary: els.tabularSummary,
  runBtn: els.tabularRunBtn,
});

wireToolFileHandlers("graft", {
  fileInput: els.graftFileInput,
  sheetSelect: els.graftSheetSelect,
  fileMeta: els.graftFileMeta,
  summary: els.graftSummary,
  runBtn: els.graftRunBtn,
});

els.openTabularBtn.addEventListener("click", () => setMode("tabular"));
els.openGraftBtn.addEventListener("click", () => setMode("graft"));
els.backFromTabularBtn.addEventListener("click", () => setMode("splash"));
els.backFromGraftBtn.addEventListener("click", () => setMode("splash"));

els.tabularRunBtn.addEventListener("click", runTabularChecks);
els.tabularExportBtn.addEventListener("click", exportTabularCsv);
els.graftRunBtn.addEventListener("click", runGraftCandidateChecks);
els.graftExportBtn.addEventListener("click", exportGraftXlsx);

setMode("splash");
