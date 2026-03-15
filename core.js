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
  { id:'jFulfillment', key:'fulfillment_phase', type:'select' },
];

/** PO / CONTRACT — floor-critical packaging/assembly reference (Phase 1). Keys live on job.poContract. */
const PO_CONTRACT_FIELDS = [
  { id: 'jPoSleeveType',   key: 'sleeveType' },
  { id: 'jPoSleeveColor',  key: 'sleeveColor' },
  { id: 'jPoInsert',       key: 'insertDetails' },
  { id: 'jPoSticker',      key: 'stickerDetails' },
  { id: 'jPoPackaging',    key: 'packagingNotes' },
  { id: 'jPoAssembly',     key: 'specialAssemblyNotes' },
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

const PACK_DEFS = [
  {key:'sleeve',    label:'Sleeve'},
  {key:'jacket',    label:'Jacket'},
  {key:'insert',    label:'Insert / Extras'},
  {key:'wrap',      label:'Shrink Wrap / Poly'},
  {key:'sticker',   label:'Sticker'},
  {key:'box_label', label:'Box Label'},
  {key:'special',   label:'Special Handling'},
];

function getPackItemStatus(item) {
  if (!item || typeof item !== 'object') return '';
  var s = (item.status || '').toLowerCase().trim();
  if (s === 'ready' || s === 'na' || s === 'caution') return s;
  return '';
}

function packHealth(job) {
  var pc = (job && job.packCard) || {};
  var applicable = PACK_DEFS.filter(function (d) { return getPackItemStatus(pc[d.key]) !== 'na'; });
  var done = applicable.filter(function (d) { return getPackItemStatus(pc[d.key]) === 'ready'; });
  return { done: done.length, total: applicable.length, pct: applicable.length ? done.length / applicable.length : 0 };
}

function packBarSegmentedHTML(job) {
  var h = packHealth(job);
  if (!h.total) return '<div class="ph-bar ph-bar-seg"><div class="ph-seg" style="width:100%"></div></div>';
  var segPct = 100 / h.total;
  var segs = [];
  for (var i = 0; i < h.total; i++) {
    segs.push('<div class="ph-seg ' + (i < h.done ? 'ph-seg-done' : '') + '" style="width:' + segPct + '%"></div>');
  }
  return '<div class="ph-bar ph-bar-seg">' + segs.join('') + '</div>';
}

function packHealthHTML(job) {
  var h = packHealth(job);
  if (!h.total) return '<span class="ph-empty">—</span>';
  return '<div class="ph">' + packBarSegmentedHTML(job) + '</div>';
}

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
const PROGRESS_STAGES = ['pressed', 'qc_passed', 'rejected', 'packed', 'ready', 'shipped', 'picked_up', 'held'];

const QC_TYPES = ['FLASH','BLEMISH','OFF-CENTER','AUDIO','UNTRIMMED','BISCUIT/FLASH'];

const HELD_REASONS = ['BILLING HOLD','CUSTOMER HOLD','DAMAGE','SHORT COUNT','WRONG CONFIG','OTHER'];

const QUACK_ICON = '<svg class="quack-ico" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" style="vertical-align:-.125em"><path fill-rule="evenodd" d="M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm11 7h-5v2h5v-2zM12.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>';

const WRENCH_ICON = '<svg class="wrench-ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-.125em"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';

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
  { key: 'status', label: 'LIVE' },
  { key: 'due', label: 'DUE' },
  { key: 'press', label: 'PRESS' },
  { key: 'assets', label: 'ASSETS' },
  { key: 'packing', label: 'PACKING' },
  { key: 'location', label: 'LOCATION' },
];

const CREW_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'role', label: 'ROLE' },
  { key: 'specialty', label: 'SPECIALTY' },
  { key: 'phone', label: 'PHONE' },
  { key: 'email', label: 'EMAIL' },
  { key: 'notes', label: 'NOTES' },
];

const PRESS_OPTS = ['', 'PRESS 1', 'PRESS 2', 'PRESS 3', '7" PRESS'];
const STATUS_OPTS = [
  { v: 'queue', l: 'Queued' },
  { v: 'pressing', l: 'Pressing' },
  { v: 'assembly', l: 'Assembly' },
  { v: 'hold', l: 'On Hold' },
  { v: 'done', l: 'Done' },
];

const FULFILLMENT_PHASES = [
  { v: '',                    l: '—' },
  { v: 'awaiting_instructions', l: 'Awaiting Instructions' },
  { v: 'ready_for_pickup',    l: 'Ready for Pickup' },
  { v: 'ready_to_ship',       l: 'Ready to Ship' },
  { v: 'local_pickup',        l: 'Local Pickup' },
  { v: 'in_house_fulfillment', l: 'In-House Fulfillment' },
  { v: 'held_exception',      l: 'Held / Exception' },
  { v: 'shipped',             l: 'Shipped / Picked Up' },
];

function fulfillmentPhasePill(phase) {
  if (!phase) return '';
  const map = {
    awaiting_instructions: '<span class="pill warn">AWAITING INSTRUCTIONS</span>',
    ready_for_pickup:      '<span class="pill go">READY FOR PICKUP</span>',
    ready_to_ship:         '<span class="pill go">READY TO SHIP</span>',
    local_pickup:          '<span class="pill queue">LOCAL PICKUP</span>',
    in_house_fulfillment:  '<span class="pill queue">IN-HOUSE FULFILLMENT</span>',
    held_exception:        '<span class="pill red">HELD / EXCEPTION</span>',
    shipped:               '<span class="pill done">SHIPPED / PICKED UP</span>',
  };
  return map[phase] || `<span class="pill queue">${(phase || '').toUpperCase()}</span>`;
}

function fulfillmentPhaseLabel(phase) {
  if (!phase) return '';
  const f = FULFILLMENT_PHASES.find(function (x) { return x.v === phase; });
  return f ? f.l : phase;
}

// ============================================================
// JOB-LEVEL WRENCH — process exception overlay (intervention taxonomy)
// ============================================================
const CAUTION_REASONS = [
  { v: '',           l: '— None' },
  { v: 'customer',   l: 'Customer' },
  { v: 'commercial', l: 'Commercial' },
  { v: 'internal',   l: 'Internal' },
  { v: 'mismatch',   l: 'Mismatch' },
  { v: 'external',   l: 'External' },
  { v: 'review',     l: 'Review' },
  { v: 'other',      l: 'Other' },
];

const _LEGACY_REASON_LABELS = {
  stuck: 'Stuck', billing: 'Billing Issue', traffic_jam: 'Traffic Jam',
  special: 'Special Handling', achtung: 'Achtung',
};

function isJobCautioned(job) {
  return !!(job && job.caution && job.caution.reason);
}

function isWrenchReason(reason) {
  if (!reason) return false;
  return CAUTION_REASONS.some(function (x) { return x.v === reason && x.v !== ''; });
}

function isJobWrench(job) {
  return isJobCautioned(job) && isWrenchReason(job.caution.reason);
}

function cautionReasonLabel(reason) {
  if (!reason) return '';
  var r = CAUTION_REASONS.find(function (x) { return x.v === reason; });
  if (r) return r.l;
  return _LEGACY_REASON_LABELS[reason] || reason;
}

function cautionPill(job) {
  if (!isJobCautioned(job)) return '';
  var label = cautionReasonLabel(job.caution.reason).toUpperCase();
  var needs = cautionNeedsNote(job);
  var cls = 'pill caution-pill' + (needs ? ' caution-pill-pulse' : '');
  var tip = label;
  if (job.caution.text) tip += ' — ' + job.caution.text.replace(/"/g, '&quot;');
  if (job.caution.since) {
    var ms = Date.now() - new Date(job.caution.since).getTime();
    if (ms < 36e5) tip += ' (' + Math.max(1, Math.round(ms / 6e4)) + 'm ago)';
    else if (ms < 864e5) tip += ' (' + Math.round(ms / 36e5) + 'h ago)';
    else tip += ' (' + Math.round(ms / 864e5) + 'd ago)';
  }
  return '<span class="' + cls + '" onclick="event.stopPropagation();goToNotesWithFilter(\'' + job.id + '\')" style="cursor:pointer" title="' + tip + '">⚠ ' + label + '</span>';
}

// ============================================================
// DEV 2.0 — stage / work type / entity (three rails, see docs/dev-2.0-console-spec.md)
// ============================================================
const DEV_STAGES = [
  { key: 'note', label: 'NOTE', cls: 'dev-stage-note' },
  { key: 'playground', label: 'PLAYGROUND', cls: 'dev-stage-playground' },
  { key: 'testing', label: 'TESTING', cls: 'dev-stage-testing' },
  { key: 'live', label: 'LIVE', cls: 'dev-stage-live' },
  { key: 'the_shop', label: 'THE SHOP', cls: 'dev-stage-the-shop' },
  { key: 'purgatory', label: 'PURGATORY', cls: 'dev-stage-purgatory' },
];

const DEV_WORK_TYPES = [
  { key: 'bug', label: 'bug', cls: 'dev-type-bug' },
  { key: 'polish', label: 'polish', cls: 'dev-type-polish' },
  { key: 'think', label: 'think', cls: 'dev-type-think' },
  { key: 'tune_up', label: 'tune', cls: 'dev-type-tune-up' },
  { key: 'purge', label: 'purge', cls: 'dev-type-purge' },
  { key: 'debug', label: 'debug', cls: 'dev-type-debug' },
];

const DEV_ENTITIES = [
  { key: 'rsp', label: 'RSP', cls: 'dev-entity-rsp' },
  { key: 'card', label: 'CARD', cls: 'dev-entity-card' },
  { key: 'log', label: 'LOG', cls: 'dev-entity-log' },
  { key: 'notes', label: 'NOTES', cls: 'dev-entity-notes' },
  { key: 'floor', label: 'FLOOR', cls: 'dev-entity-floor' },
  { key: 'jobs', label: 'JOBS', cls: 'dev-entity-jobs' },
  { key: 'engine', label: 'ENGINE', cls: 'dev-entity-engine' },
  { key: 'dev', label: 'DEV', cls: 'dev-entity-dev' },
  { key: 'crew', label: 'CREW', cls: 'dev-entity-crew' },
  { key: 'pvc', label: 'PVC', cls: 'dev-entity-pvc' },
  { key: 'audit', label: 'AUDIT', cls: 'dev-entity-audit' },
];

function cautionNeedsNote(job) {
  if (!isJobCautioned(job)) return false;
  var since = job.caution.since;
  if (!since) return false;
  var notes = Array.isArray(job.notesLog) ? job.notesLog : [];
  return !notes.some(function (n) { return n.timestamp && n.timestamp >= since; });
}

/** @deprecated Dead code — ACHTUNG symbol now routes to NOTES directly. Kept temporarily for safety. */
function cautionNoteBtn(job) {
  if (!cautionNeedsNote(job)) return '';
  return '';
}

/** Debounce fn (no args) for use with search inputs — reduces re-renders on mobile. */
function debounce(fn, ms) {
  let t = null;
  return function () {
    if (t) clearTimeout(t);
    t = setTimeout(function () { t = null; fn(); }, ms);
  };
}

/** Sort job list by catalog number ascending; fallback empty string then artist. Stable. Used by all job dropdowns/pickers. */
function sortJobsByCatalogAsc(jobs) {
  if (!Array.isArray(jobs)) return [];
  return jobs.slice().sort((a, b) => {
    const ca = (a.catalog != null && a.catalog !== '') ? String(a.catalog) : '';
    const cb = (b.catalog != null && b.catalog !== '') ? String(b.catalog) : '';
    const c = ca.localeCompare(cb, undefined, { sensitivity: 'base' });
    if (c !== 0) return c;
    return (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' });
  });
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
    (job.fulfillment_phase || ''),
    (job.caution && job.caution.reason ? job.caution.reason : ''),
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
  let pressed = 0, qcPassed = 0, rejected = 0, packed = 0, ready = 0, shipped = 0, pickedUp = 0, held = 0;
  log.forEach(e => {
    const q = Math.max(0, parseInt(e.qty, 10) || 0);
    if (e.stage === 'pressed') pressed += q;
    else if (e.stage === 'qc_passed') qcPassed += q;
    else if (e.stage === 'rejected') rejected += q;
    else if (e.stage === 'packed') packed += q;
    else if (e.stage === 'ready') ready += q;
    else if (e.stage === 'shipped') shipped += q;
    else if (e.stage === 'picked_up') pickedUp += q;
    else if (e.stage === 'held') held += q;
  });
  const pendingQC = Math.max(0, pressed - qcPassed - rejected);
  return { ordered, pressed, qcPassed, rejected, pendingQC, packed, ready, shipped, pickedUp, held };
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

/** Shared status rail: ORDERED · PRESSED · REMAINING + bar. Used by LOG console and Press Station. */
function statusRailHTML(job) {
  if (!job) return statusRailPlaceholderHTML();
  const p = getJobProgress(job);
  const ordered = p.ordered;
  const pressed = p.pressed;
  const remaining = Math.max(0, ordered - pressed);
  const pct = ordered ? Math.min(100, (pressed / ordered) * 100) : 0;
  return `<div class="status-rail">
    <span class="status-rail-cell"><span class="status-rail-num">${ordered.toLocaleString()}</span> ORDERED</span>
    <span class="status-rail-cell"><span class="status-rail-num">${pressed.toLocaleString()}</span> PRESSED</span>
    <span class="status-rail-cell"><span class="status-rail-num">${remaining.toLocaleString()}</span> REMAINING</span>
    <div class="status-rail-bar"><div class="status-rail-bar-fill" style="width:${pct}%"></div></div>
  </div>`;
}

function statusRailPlaceholderHTML() {
  return `<div class="status-rail status-rail-placeholder">
    <span class="status-rail-cell"><span class="status-rail-num">—</span> ORDERED</span>
    <span class="status-rail-cell"><span class="status-rail-num">—</span> PRESSED</span>
    <span class="status-rail-cell"><span class="status-rail-num">—</span> REMAINING</span>
    <div class="status-rail-bar"><div class="status-rail-bar-fill" style="width:0%"></div></div>
  </div>`;
}

/** LOG console only: single compact % bar by mode. Supports PRESS + SHIP actions. */
function logConsoleRailHTML(job, mode) {
  if (!job) return logConsoleRailPlaceholderHTML();
  const p = getJobProgress(job);
  const ordered = p.ordered;
  let num, denom, modeClass;
  if (mode === 'packed')        { num = p.packed;   denom = ordered;  modeClass = 'mode-packed'; }
  else if (mode === 'ready')    { num = p.ready;    denom = ordered;  modeClass = 'mode-ready'; }
  else if (mode === 'shipped')  { num = p.shipped + p.pickedUp;  denom = ordered;  modeClass = 'mode-shipped'; }
  else if (mode === 'press')    { num = p.pressed;  denom = ordered;  modeClass = 'mode-press'; }
  else if (mode === 'qc_pass')  { num = p.qcPassed; denom = ordered;  modeClass = 'mode-qcpass'; }
  else                          { num = p.rejected; denom = ordered;  modeClass = 'mode-qcreject'; }
  const pct = denom ? Math.min(100, (num / denom) * 100) : 0;
  const pctText = Math.round(pct) + '%';
  return `<div class="log-rail-simple ${modeClass}">
    <div class="log-rail-bar"><div class="log-rail-fill" style="width:${pct}%"></div></div>
    <span class="log-rail-pct">${pctText}</span>
  </div>`;
}

function logConsoleRailPlaceholderHTML() {
  return `<div class="log-rail-simple log-rail-placeholder">
    <div class="log-rail-bar"><div class="log-rail-fill" style="width:0%"></div></div>
    <span class="log-rail-pct">—</span>
  </div>`;
}

/** ENGINE — aggregate progressLog across all active jobs for a date range. */
function getEngineData(jobs, periodStart, periodEnd) {
  var out = { pressed: 0, qcPassed: 0, rejected: 0, packed: 0, ready: 0, shipped: 0, pickedUp: 0, held: 0 };
  if (!Array.isArray(jobs)) return out;
  var ps = periodStart ? periodStart.getTime() : 0;
  var pe = periodEnd ? periodEnd.getTime() : Infinity;
  jobs.forEach(function (j) {
    if (!j || isJobArchived(j)) return;
    (j.progressLog || []).forEach(function (e) {
      if (!e || !e.timestamp) return;
      var t = new Date(e.timestamp).getTime();
      if (t < ps || t >= pe) return;
      var q = Math.max(0, parseInt(e.qty, 10) || 0);
      if (e.stage === 'pressed') out.pressed += q;
      else if (e.stage === 'qc_passed') out.qcPassed += q;
      else if (e.stage === 'rejected') out.rejected += q;
      else if (e.stage === 'packed') out.packed += q;
      else if (e.stage === 'ready') out.ready += q;
      else if (e.stage === 'shipped') out.shipped += q;
      else if (e.stage === 'picked_up') out.pickedUp += q;
      else if (e.stage === 'held') out.held += q;
    });
  });
  return out;
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

function isJobArchived(job) {
  return !!(job && job.archived_at);
}

function findDuplicateJob(jobs, catalog, artist, album, excludeId) {
  return jobs.filter(j => {
    if (excludeId && j.id === excludeId) return false;
    if (catalog && j.catalog && j.catalog.toUpperCase() === catalog.toUpperCase()) return true;
    if (artist && album && j.artist && j.album && j.artist.toLowerCase() === artist.toLowerCase() && j.album.toLowerCase() === album.toLowerCase()) return true;
    return false;
  });
}

/** Canonical asset status: received | na | caution (ACHTUNG) | '' (unset). Derives from legacy received/na when status not set. */
function getAssetStatus(asset) {
  if (!asset || typeof asset !== 'object') return '';
  const s = (asset.status || '').toLowerCase().trim();
  if (s === 'received' || s === 'na' || s === 'caution') return s;
  if (asset.received === true) return 'received';
  if (asset.na === true) return 'na';
  return '';
}

function assetHealth(job, assetDefs) {
  const defs = assetDefs != null ? assetDefs : ASSET_DEFS;
  const applicable = defs.filter(a => getAssetStatus(job.assets && job.assets[a.key]) !== 'na');
  const done = applicable.filter(a => getAssetStatus(job.assets && job.assets[a.key]) === 'received');
  return { done: done.length, total: applicable.length, pct: applicable.length ? done.length / applicable.length : 0 };
}

/** Segmented asset bar: one chunk per asset slot; first `done` filled, rest empty. Width-only rule (same family as progress bar). */
function assetBarSegmentedHTML(job) {
  const { done, total } = assetHealth(job);
  if (!total) {
    return `<div class="ah-bar ah-bar-seg"><div class="ah-seg" style="width:100%"></div></div>`;
  }
  const segPct = 100 / total;
  const segments = [];
  for (let i = 0; i < total; i++) {
    const filled = i < done;
    segments.push(`<div class="ah-seg ${filled ? 'ah-seg-done' : ''}" style="width:${segPct}%"></div>`);
  }
  return `<div class="ah-bar ah-bar-seg">${segments.join('')}</div>`;
}

function ahHTML(job) {
  return `<div class="ah">${assetBarSegmentedHTML(job)}</div>`;
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

function dueDelta(due) {
  if (!due) return '<span style="color:var(--d3)">—</span>';
  const d = Math.ceil((new Date(due) - Date.now()) / 864e5);
  if (d < 0) return '<span style="color:var(--r)">+' + Math.abs(d) + '</span>';
  if (d === 0) return '<span style="color:var(--r)">0</span>';
  return '<span style="color:var(--d3)">-' + d + '</span>';
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
  if (key === 'packing') return (packHealth(j).done || 0);
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

function getCrewSortValue(e, key) {
  if (key === 'name') return (e.name || '').toLowerCase();
  if (key === 'role') return (e.role || '').toLowerCase();
  if (key === 'specialty') return (e.specialty || '').toLowerCase();
  if (key === 'phone') return (e.phone || '').toLowerCase();
  if (key === 'email') return (e.email || '').toLowerCase();
  if (key === 'notes') return (e.notes || '').toLowerCase();
  return '';
}

function sortCrewList(employees) {
  const by = S.crewSortBy;
  const dir = S.crewSortDir === 'desc' ? -1 : 1;
  return employees.slice().sort((a, b) => {
    const va = getCrewSortValue(a, by);
    const vb = getCrewSortValue(b, by);
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return dir * (cmp || 0);
  });
}

function isJobOnPress(job) {
  if (!job || !Array.isArray(S.presses)) return false;
  return S.presses.some(p => p.job_id === job.id);
}

function jobPressInfo(job) {
  var out = { onPress: null, onDeck: null };
  if (!job || !Array.isArray(S.presses)) return out;
  for (var i = 0; i < S.presses.length; i++) {
    var p = S.presses[i];
    if (p.job_id === job.id) out.onPress = pressShortName(p.name);
    if (p.on_deck_job_id === job.id) out.onDeck = pressShortName(p.name);
  }
  return out;
}

function pressShortName(name) {
  if (!name) return name;
  return name.replace(/\bpress\s*/gi, '').trim() || name;
}

function isPoRecent(job, withinMs) {
  if (!job || !job.poContract || !job.poContract.imageUrl) return false;
  var ts = job.poContract.uploadedAt || job.poContract.imagePath;
  if (!ts) return false;
  if (job.poContract.uploadedAt) {
    return (Date.now() - new Date(job.poContract.uploadedAt).getTime()) < (withinMs || 3600000);
  }
  var match = typeof ts === 'string' && ts.match(/\/(\d+)[-_]/);
  if (match) {
    return (Date.now() - parseInt(match[1])) < (withinMs || 3600000);
  }
  return false;
}

function recentLogActivity(job, withinMs) {
  var out = { pressed: false, qc_passed: false, rejected: false, packed: false, ready: false, shipped: false };
  if (!job || !Array.isArray(job.progressLog)) return out;
  var cutoff = Date.now() - (withinMs || 3600000);
  for (var i = job.progressLog.length - 1; i >= 0; i--) {
    var e = job.progressLog[i];
    if (!e || !e.timestamp) continue;
    if (new Date(e.timestamp).getTime() < cutoff) break;
    if (out.hasOwnProperty(e.stage)) out[e.stage] = true;
  }
  return out;
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
    assetBarSegmentedHTML,
    STATUS_ORDER,
    nextStatus,
    suggestedStatus,
    ASSET_DEFS,
  };
}
