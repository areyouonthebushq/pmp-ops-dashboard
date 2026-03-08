// ============================================================
// FIELD CONFIG — drives form read/write, eliminates manual mapping
// ============================================================
const FIELD_MAP = [
  { id:'jCat',         key:'catalog',     type:'text',   transform:'upper' },
  { id:'jStat',        key:'status',      type:'select' },
  { id:'jArtist',      key:'artist',      type:'text' },
  { id:'jAlbum',       key:'album',       type:'text' },
  { id:'jInv',         key:'invoice',     type:'text' },
  { id:'jDue',         key:'due',         type:'date' },
  { id:'jPress',       key:'press',       type:'select' },
  { id:'jClient',      key:'client',      type:'text' },
  { id:'jEmail',       key:'email',       type:'text' },
  { id:'jLoc',         key:'location',    type:'text' },
  { id:'jLastContact', key:'lastContact', type:'date' },
  { id:'jFormat',      key:'format',      type:'select' },
  { id:'jVtype',       key:'vinylType',   type:'select' },
  { id:'jQty',         key:'qty',         type:'text' },
  { id:'jWt',          key:'weight',      type:'select' },
  { id:'jColor',       key:'color',       type:'text' },
  { id:'jSpec',        key:'specialty',   type:'select' },
  { id:'jLabel',       key:'labelType',   type:'select' },
  { id:'jSleeve',      key:'sleeve',      type:'select' },
  { id:'jJacket',      key:'jacket',      type:'select' },
  { id:'jOuter',       key:'outer_pkg',       type:'select' },
  { id:'jCPL',         key:'cpl',         type:'text' },
  { id:'jInvDate',     key:'invDate',     type:'date' },
  { id:'jDep',         key:'deposit',     type:'date' },
  { id:'jInv2',        key:'inv2',        type:'date' },
  { id:'jPay2',        key:'pay2',        type:'date' },
];

// ============================================================
// ASSET DEFINITIONS
// ============================================================
const ASSET_DEFS = [
  {key:'stampers',     label:'Stampers'},
  {key:'compound',     label:'Compound'},
  {key:'testPress',    label:'Test Press Complete'},
  {key:'testApproved', label:'Test Press Approved'},
  {key:'labels',       label:'Center Labels'},
  {key:'cut',          label:'Cut'},
  {key:'baked',        label:'Baked'},
  {key:'sleeves',      label:'Sleeves'},
  {key:'jackets',      label:'Jackets'},
  {key:'insert',       label:'Insert'},
  {key:'booklet',      label:'Booklet'},
  {key:'dlCard',       label:'Download Card'},
  {key:'mktSticker',   label:'Marketing Sticker'},
  {key:'upcSticker',   label:'UPC Sticker'},
  {key:'outer_pkg',     label:'Outer Packaging'},
];

const DEFAULT_PRESSES = [
  {id:'p1', name:'PRESS 1', type:'LP',  status:'online', job_id:null},
  {id:'p2', name:'PRESS 2', type:'LP',  status:'online', job_id:null},
  {id:'p3', name:'PRESS 3', type:'LP',  status:'online', job_id:null},
  {id:'p4', name:'7" PRESS',type:'7"',  status:'online', job_id:null},
];

const DEFAULT_TODOS = {
  daily:[
    {id:'d1', text:'Check stampers on all active presses', done:false, who:''},
    {id:'d2', text:'Log rejects — spindle/box check', done:false, who:''},
    {id:'d3', text:'Confirm stack qty matches PO', done:false, who:''},
    {id:'d4', text:'Visual QC pass on completed run', done:false, who:''},
    {id:'d5', text:'Verify compound supply', done:false, who:''},
  ],
  weekly:[
    {id:'w1', text:'Tues/Thurs — preventative maintenance check-in', done:false, who:''},
    {id:'w2', text:'Fri 3PM — NON-NEGOTIABLE full maintenance', done:false, who:''},
    {id:'w3', text:'Tues PM — Rip Cord assessment', done:false, who:''},
    {id:'w4', text:'Color needs heads up to team (Alex)', done:false, who:''},
    {id:'w5', text:'PO overage review — confirm clarity', done:false, who:''},
  ],
  standing:[
    {id:'s1', text:'No biscuits/rejects with flash', done:false, who:''},
    {id:'s2', text:'Untrimmed records FILE VERTICALLY', done:false, who:''},
    {id:'s3', text:'7" rejects — file vertically (Alex)', done:false, who:''},
    {id:'s4', text:'Clear stack #s on PO', done:false, who:''},
  ],
};

// STATUS FLOW — for tap-to-cycle
const STATUS_ORDER = ['queue','pressing','assembly','hold','done'];

// ============================================================
const PROGRESS_STAGES = ['pressed', 'qc_passed', 'rejected'];

const QC_TYPES = ['FLASH','BLEMISH','OFF-CENTER','AUDIO','UNTRIMMED','BISCUIT/FLASH'];

const FLOOR_COLUMNS = [
  { key: 'catalog', label: 'CATALOG' },
  { key: 'artistAlbum', label: 'ARTIST / ALBUM' },
  { key: 'format', label: 'FORMAT' },
  { key: 'color', label: 'COLOR' },
  { key: 'qty', label: 'QTY' },
  { key: 'status', label: 'STATUS' },
  { key: 'due', label: 'DUE' },
];

const JOBS_COLUMNS = [
  { key: 'catalog', label: 'CATALOG' },
  { key: 'artist', label: 'ARTIST' },
  { key: 'album', label: 'ALBUM' },
  { key: 'format', label: 'FORMAT' },
  { key: 'colorWt', label: 'COLOR / WT' },
  { key: 'qty', label: 'QTY' },
  { key: 'plus10', label: '+10%' },
  { key: 'status', label: 'STATUS' },
  { key: 'due', label: 'DUE' },
  { key: 'press', label: 'PRESS' },
  { key: 'assets', label: 'ASSETS' },
  { key: 'progress', label: 'PROGRESS' },
  { key: 'location', label: 'LOCATION' },
];

const PRESS_OPTS = ['', 'PRESS 1', 'PRESS 2', 'PRESS 3', '7" PRESS'];
const STATUS_OPTS = [
  { v: 'queue', l: 'Queued' },
  { v: 'pressing', l: 'Pressing' },
  { v: 'assembly', l: 'Assembly' },
  { v: 'hold', l: 'On Hold' },
  { v: 'done', l: 'Done' },
];

/** Debounce fn (no args) for use with search inputs — reduces re-renders on mobile. */
function debounce(fn, ms) {
  let t = null;
  return function () {
    if (t) clearTimeout(t);
    t = setTimeout(function () { t = null; fn(); }, ms);
  };
}

// Legacy compatibility: migrate cached press objects from `job` to `job_id` during hydration.
function normalizeLegacyPresses(presses) {
  if (!Array.isArray(presses)) return presses;
  presses.forEach(p => {
    if (p && p.job_id == null && p.job != null) {
      p.job_id = p.job;
    }
  });
  return presses;
}

function jobFieldsHash(job) {
  const parts = [
    (job.status || ''),
    (job.press || ''),
    (job.qty || ''),
    (job.notes || ''),
    (job.assembly || ''),
    (job.location || ''),
    (job.due || ''),
    ((job.progressLog || []).length).toString(),
  ];
  return parts.join('|');
}

function ensureJobProgressLog(job) {
  if (!job) return;
  if (!Array.isArray(job.progressLog)) job.progressLog = [];
}

function getJobProgress(job) {
  ensureJobProgressLog(job);
  const log = job.progressLog || [];
  const ordered = Math.max(0, parseInt(job.qty, 10) || 0);
  let pressed = 0, qcPassed = 0, rejected = 0;
  log.forEach(e => {
    const q = Math.max(0, parseInt(e.qty, 10) || 0);
    if (e.stage === 'pressed') pressed += q;
    else if (e.stage === 'qc_passed') qcPassed += q;
    else if (e.stage === 'rejected') rejected += q;
  });
  const pendingQC = Math.max(0, pressed - qcPassed - rejected);
  return { ordered, pressed, qcPassed, rejected, pendingQC };
}

function progressDisplay(job) {
  const p = getJobProgress(job);
  const ordered = p.ordered;
  const main = `${p.pressed.toLocaleString()} / ${ordered.toLocaleString()}`;
  const parts = [];
  parts.push(p.qcPassed.toLocaleString() + ' QC passed');
  if (p.rejected > 0) parts.push(p.rejected.toLocaleString() + ' REJ');
  if (p.pendingQC > 0) parts.push(p.pendingQC.toLocaleString() + ' PENDING');
  const sub = parts.length === 1 && p.qcPassed === 0 ? '0 QC passed' : parts.join(' · ');
  const pressedPct = ordered ? Math.min(100, (p.pressed / ordered) * 100) : 0;
  const qcPassedPct = ordered ? Math.min(100, (p.qcPassed / ordered) * 100) : 0;
  return { main, sub, overQty: p.pressed > ordered, pressedPct, qcPassedPct, p };
}

function progressDualBarHTML(pressedPct, qcPassedPct) {
  return `<div class="dl-bar-pressed" style="width:${pressedPct}%"></div><div class="dl-bar-qc" style="width:${qcPassedPct}%"></div>`;
}

function ensureNotesLog(job) {
  if (!job) return;
  if (!Array.isArray(job.notesLog)) job.notesLog = [];
  if (!Array.isArray(job.assemblyLog)) job.assemblyLog = [];
  if (job.notes && job.notesLog.length === 0) {
    job.notesLog.push({ text: job.notes, person: 'Migrated', timestamp: new Date().toISOString() });
  }
  if (job.assembly && job.assemblyLog.length === 0) {
    job.assemblyLog.push({ text: job.assembly, person: 'Migrated', timestamp: new Date().toISOString() });
  }
}

function findDuplicateJob(jobs, catalog, artist, album, excludeId) {
  return jobs.filter(j => {
    if (excludeId && j.id === excludeId) return false;
    if (catalog && j.catalog && j.catalog.toUpperCase() === catalog.toUpperCase()) return true;
    if (artist && album && j.artist && j.album && j.artist.toLowerCase() === artist.toLowerCase() && j.album.toLowerCase() === album.toLowerCase()) return true;
    return false;
  });
}

function assetHealth(job, assetDefs) {
  const defs = assetDefs != null ? assetDefs : ASSET_DEFS;
  const applicable = defs.filter(a => !job.assets || job.assets[a.key]?.na !== true);
  const done = applicable.filter(a => job.assets && job.assets[a.key]?.received);
  return { done: done.length, total: applicable.length, pct: applicable.length ? done.length / applicable.length : 0 };
}

function ahHTML(job) {
  const {done, total, pct} = assetHealth(job);
  const cls = pct >= 1 ? 'full' : pct >= 0.7 ? 'most' : pct >= 0.4 ? 'half' : 'low';
  return `<div class="ah">
    <div class="ah-bar"><div class="ah-fill ${cls}" style="width:${Math.round(pct*100)}%"></div></div>
    <span style="color:${pct >= 1 ? 'var(--g)' : pct >= 0.5 ? 'var(--w)' : 'var(--r)'}">${done}/${total}</span>
  </div>`;
}

function dueClass(due) {
  if (!due) return '';
  const d = Math.ceil((new Date(due) - Date.now()) / 864e5);
  return d < 0 ? 'due-over' : d <= 7 ? 'due-soon' : 'due-ok';
}

function dueLabel(due) {
  if (!due) return '—';
  const d = Math.ceil((new Date(due) - Date.now()) / 864e5);
  if (d < 0) return `${due} ⚠`;
  if (d === 0) return 'TODAY';
  if (d <= 7) return `${due} (${d}d)`;
  return due;
}

function statusPill(s) {
  const map = {
    pressing: '<span class="pill go">PRESSING</span>',
    queue:    '<span class="pill queue">QUEUED</span>',
    assembly: '<span class="pill warn">ASSEMBLY</span>',
    hold:     '<span class="pill red">ON HOLD</span>',
    done:     '<span class="pill done">DONE</span>',
  };
  return map[s] || `<span class="pill queue">${(s||'?').toUpperCase()}</span>`;
}

function statusTapClass(s) {
  return {pressing:'go', queue:'queue', assembly:'warn', hold:'red', done:'done'}[s] || 'queue';
}

function escapeHtml(s) {
  if (s == null) return '';
  const t = document.createElement('textarea');
  t.textContent = s;
  return t.innerHTML;
}

function nextStatus(current) {
  const cur = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(cur + 1) % STATUS_ORDER.length];
}

/**
 * Suggest a status based on progress and whether the job is assigned to a press.
 * @param {object} job - Job with progressLog, qty, status
 * @param {boolean} isAssignedToPress - True if any press has job_id === job.id
 * @returns {{ suggested: string, reason: string } | null} - Suggested status and short reason, or null
 */
function suggestedStatus(job, isAssignedToPress) {
  if (!job) return null;
  if ((job.status || '').toLowerCase() === 'hold') return null;
  ensureJobProgressLog(job);
  const p = getJobProgress(job);
  const cur = (job.status || 'queue').toLowerCase();
  const { ordered, pressed, qcPassed } = p;

  if (ordered > 0 && pressed >= ordered && qcPassed >= ordered && cur !== 'done')
    return { suggested: 'done', reason: 'Order complete (pressed & QC at qty)' };
  if (pressed >= ordered && qcPassed < ordered && cur !== 'assembly')
    return { suggested: 'assembly', reason: 'Off press at qty; QC pending' };
  if (pressed > 0 && !isAssignedToPress && cur === 'pressing')
    return { suggested: 'assembly', reason: 'No longer on press' };
  if (pressed > 0 && isAssignedToPress && (cur === 'queue' || cur === 'assembly'))
    return { suggested: 'pressing', reason: 'On press with progress' };
  return null;
}

function getFloorSortValue(j, key) {
  if (key === 'catalog') return (j.catalog || '').toLowerCase();
  if (key === 'artistAlbum') return ((j.artist || '') + ' ' + (j.album || '')).toLowerCase();
  if (key === 'format') return (j.format || '').toLowerCase();
  if (key === 'status') return (j.status || '').toLowerCase();
  if (key === 'due') return (j.due || '') ? String(j.due) : '\uffff';
  if (key === 'color') return (j.color || '').toLowerCase();
  if (key === 'qty') return parseInt(j.qty, 10) || 0;
  return '';
}

function sortFloorJobs(jobs) {
  const by = S.floorSortBy;
  const dir = S.floorSortDir === 'desc' ? -1 : 1;
  return jobs.slice().sort((a, b) => {
    const va = getFloorSortValue(a, by);
    const vb = getFloorSortValue(b, by);
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true });
    return dir * (cmp || 0);
  });
}

function getJobsSortValue(j, key) {
  if (key === 'catalog') return (j.catalog || '').toLowerCase();
  if (key === 'artist') return (j.artist || '').toLowerCase();
  if (key === 'album') return (j.album || '').toLowerCase();
  if (key === 'format') return (j.format || '').toLowerCase();
  if (key === 'colorWt') return ((j.color || '') + ' ' + (j.weight || '')).toLowerCase();
  if (key === 'qty') return parseInt(j.qty, 10) || 0;
  if (key === 'plus10') return j.qty ? Math.ceil(parseInt(j.qty, 10) * 1.1) : 0;
  if (key === 'status') return (j.status || '').toLowerCase();
  if (key === 'due') return (j.due || '') ? String(j.due) : '\uffff';
  if (key === 'press') return (j.press || '').toLowerCase();
  if (key === 'assets') return (assetHealth(j).done || 0);
  if (key === 'progress') return getJobProgress(j).pressed || 0;
  if (key === 'location') return (j.location || '').toLowerCase();
  return '';
}

function sortJobsList(jobs) {
  const by = S.jobsSortBy;
  const dir = S.jobsSortDir === 'desc' ? -1 : 1;
  return jobs.slice().sort((a, b) => {
    const va = getJobsSortValue(a, by);
    const vb = getJobsSortValue(b, by);
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true });
    return dir * (cmp || 0);
  });
}

// Proper CSV parsing that handles quoted fields with commas
function parseCSVLines(text) {
  const lines = [];
  let row = [];
  let field = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i+1] === '"') { field += '"'; i++; }
        else inQuote = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') { inQuote = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i+1] === '\n') i++;
        row.push(field); field = '';
        if (row.some(f => f.trim())) lines.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  row.push(field);
  if (row.some(f => f.trim())) lines.push(row);
  return lines;
}

// Expose for Vitest (no-op in browser). Single source of truth: this file.
if (typeof globalThis !== 'undefined' && typeof document === 'undefined') {
  globalThis.__PMP_CORE__ = {
    getJobProgress,
    jobFieldsHash,
    findDuplicateJob,
    assetHealth,
    STATUS_ORDER,
    nextStatus,
    suggestedStatus,
    ASSET_DEFS,
  };
}
