// Global error handler — catches unhandled errors and logs to Sentry
window.addEventListener('error', function (event) {
  console.error('[PMP] Unhandled error:', event.error);
  if (typeof toastError === 'function') toastError('Something went wrong. Error logged.');
});
window.addEventListener('unhandledrejection', function (event) {
  console.error('[PMP] Unhandled promise rejection:', event.reason);
  if (typeof toastError === 'function') toastError('Sync error. Will retry.');
});

// ============================================================
// MATRIX RAIN — Uses requestAnimationFrame, auto-pauses when hidden
// ============================================================
(() => {
  const c = document.getElementById('rain'), ctx = c.getContext('2d');
  const sz = () => { c.width = innerWidth; c.height = innerHeight; };
  sz(); addEventListener('resize', sz);
  const ch = 'アイウエオ01カキクケコ10サシスセソ';
  let drops = [];
  let lastCols = 0;
  function getRainCfg() {
    const party = document.body.classList.contains('tv-party');
    return {
      party,
      col: party ? 10 : 18,
      step: party ? 22 : 55,
      fade: party ? 0.035 : 0.06,
      font: party ? 17 : 13,
    };
  }
  const reset = () => {
    const cfg = getRainCfg();
    const cols = Math.max(1, Math.floor(c.width / cfg.col));
    lastCols = cols;
    drops = Array(cols).fill(0).map(() => Math.random() * c.height / cfg.col | 0);
  };
  reset(); addEventListener('resize', reset);

  let last = 0;
  function frame(ts) {
    const cfg = getRainCfg();
    const cols = Math.max(1, Math.floor(c.width / cfg.col));
    if (cols !== lastCols) reset();
    if (ts - last > cfg.step) {
      last = ts;
      ctx.fillStyle = `rgba(6,8,6,${cfg.fade})`;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#00e676';
      ctx.font = `${cfg.font}px monospace`;
      drops.forEach((y, i) => {
        const x = i * cfg.col;
        const yy = y * cfg.col;
        const head = ch[Math.random() * ch.length | 0];
        ctx.fillStyle = '#00e676';
        ctx.fillText(head, x, yy);
        if (cfg.party) {
          ctx.globalAlpha = 0.85;
          ctx.fillText(ch[Math.random() * ch.length | 0], x, yy - cfg.col);
          ctx.globalAlpha = 0.5;
          ctx.fillText(ch[Math.random() * ch.length | 0], x, yy - cfg.col * 2);
          ctx.globalAlpha = 0.22;
          ctx.fillText(ch[Math.random() * ch.length | 0], x, yy - cfg.col * 3);
          ctx.globalAlpha = 0.1;
          ctx.fillText(ch[Math.random() * ch.length | 0], x, yy - cfg.col * 4);
          ctx.globalAlpha = 1;
        } else if (Math.random() > 0.8) {
          ctx.fillText(ch[Math.random() * ch.length | 0], x, yy + cfg.col);
        }
        if (yy > c.height && Math.random() > (cfg.party ? 0.94 : 0.97)) drops[i] = 0;
        else drops[i]++;
      });
    }
    rafId = requestAnimationFrame(frame);
  }
  let rafId = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(rafId); }
    else { last = 0; rafId = requestAnimationFrame(frame); }
  });
})();

// ============================================================
// IMAGE PIPELINE — client-side resize, file-size guard, dual output
// ============================================================
var IMG_LIMITS = { po: 10 * 1024 * 1024, crew: 5 * 1024 * 1024, compound: 5 * 1024 * 1024, note: 10 * 1024 * 1024 };
var IMG_FULL_MAX = 1200;
var IMG_THUMB_MAX = 200;
var IMG_FULL_QUALITY = 0.85;
var IMG_THUMB_QUALITY = 0.70;
var IMG_SKIP_THRESHOLD = 200 * 1024;

function resizeImage(file, maxDim, quality) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      var w = img.naturalWidth, h = img.naturalHeight;
      if (Math.max(w, h) <= maxDim && file.size <= IMG_SKIP_THRESHOLD && maxDim === IMG_FULL_MAX) {
        resolve(file);
        return;
      }
      var scale = Math.min(maxDim / Math.max(w, h), 1);
      var nw = Math.round(w * scale), nh = Math.round(h * scale);
      var canvas = document.createElement('canvas');
      canvas.width = nw;
      canvas.height = nh;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, nw, nh);
      canvas.toBlob(function (blob) {
        if (!blob) { reject(new Error('Canvas export failed')); return; }
        resolve(blob);
      }, 'image/jpeg', quality);
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function checkImageSize(file, limitBytes, typeName) {
  if (file.size > limitBytes) {
    var maxMB = Math.round(limitBytes / (1024 * 1024));
    if (typeof toastError === 'function') toastError((typeName || 'Image') + ' exceeds ' + maxMB + 'MB limit');
    return false;
  }
  return true;
}

function processImage(file) {
  return Promise.all([
    resizeImage(file, IMG_FULL_MAX, IMG_FULL_QUALITY),
    resizeImage(file, IMG_THUMB_MAX, IMG_THUMB_QUALITY)
  ]).then(function (blobs) { return { full: blobs[0], thumb: blobs[1] }; });
}

// ============================================================
// THEME: MINIMAL — toggle + persist (localStorage)
// ============================================================
function applyMinimalThemeFromStorage() {
  try {
    if (localStorage.getItem('themeMinimal') === '1') document.body.classList.add('theme-minimal');
    else document.body.classList.remove('theme-minimal');
  } catch (e) {}
}
function toggleMinimalTheme() {
  document.body.classList.toggle('theme-minimal');
  const on = document.body.classList.contains('theme-minimal');
  try { localStorage.setItem('themeMinimal', on ? '1' : '0'); } catch (e) {}
  const btn = document.getElementById('minimalThemeBtn');
  if (btn) btn.classList.toggle('bar-min-on', on);
}
applyMinimalThemeFromStorage();
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('minimalThemeBtn');
  if (btn && document.body.classList.contains('theme-minimal')) btn.classList.add('bar-min-on');
});

// ============================================================
// STATE
// ============================================================
let S = {
  jobs: [],
  presses: JSON.parse(JSON.stringify(DEFAULT_PRESSES)),
  todos: JSON.parse(JSON.stringify(DEFAULT_TODOS)),
  qcLog: [],
  devNotes: [],
  compounds: [],
  notesChannels: { '!TEAM': [], '!ALERT': [] },
  mode: 'floor',
  editId: null,
  qcSelectedJob: null,
  pressLogSelectedJob: null,
  logSelectedJob: null,
  floorCardJobId: null,
  floorCardEditMode: false,
  stationType: null,
  stationId: '',
  assignedPressId: null,
  dataChangedWhileEditing: false,
  offlineMode: false,
  lastLocalWriteAt: 0,
  panelOpenedAt: 0,
  floorSortBy: 'catalog',
  floorSortDir: 'asc',
  jobsSortBy: 'catalog',
  jobsSortDir: 'asc',
  crewSortBy: 'name',
  crewSortDir: 'asc',
  floorStatFilter: null,
  notesComposerOpen: false,
  notesUtilityOpen: null, // 'add' | 'search' | null
  compoundEditId: null,
  employees: [],
  employeeEditId: null,
  scheduleEntries: [],
  scheduleEntryEditId: null,
  importSession: null, // { type, sourceRef, status, extractedRows } when CSV/Photo/PDF review is open
};
let saveTimer = null;
let curAssets = {};
let panelOpen = false;
let panelEditMode = false;

// ============================================================
// LOAD ALL — fetches from Storage, applies to S, renderAll
// ============================================================
async function loadAll() {
  console.log('[PMP] loadAll start');
  if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'loadAll', level: 'info' });
  setSyncState('loading');
  try {
    const data = await Storage.loadAllData();
    if (data.presses) normalizeLegacyPresses(data.presses);

    if (data.jobs && data.jobs.length > 0) {
      const now = Date.now();
      const conflicts = [];
      data.jobs.forEach(serverJob => {
        const pending = pendingWrites.get(serverJob.id);
        if (!pending) return;
        if (now - pending.timestamp > CONFLICT_WINDOW_MS) {
          pendingWrites.delete(serverJob.id);
          return;
        }
        const serverHash = jobFieldsHash(serverJob);
        if (serverHash !== pending.hash) {
          conflicts.push({ id: serverJob.id, catalog: serverJob.catalog || serverJob.artist || serverJob.id });
        }
      });
      if (conflicts.length > 0) {
        const names = conflicts.map(c => c.catalog).join(', ');
        if (typeof toast === 'function') toast(`⚠ ${conflicts.length === 1 ? names + ' was' : names + ' were'} updated on another device`);
        console.warn('[PMP] Conflict detected:', conflicts);
        conflicts.forEach(c => pendingWrites.delete(c.id));
      }
      S.jobs = data.jobs;
    } else if (S.jobs.length === 0 && data.jobs) {
      S.jobs = data.jobs;
    }

    if (data.presses && data.presses.length > 0) {
      const now = Date.now();
      data.presses.forEach(sp => {
        const pending = pendingPressWrites.get(sp.id);
        if (pending && now - pending.timestamp < CONFLICT_WINDOW_MS) {
          if (sp.job_id !== pending.job_id || sp.status !== pending.status) {
            console.warn('[PMP] Press conflict:', sp.name, '— server:', sp.job_id, sp.status, '— local:', pending.job_id, pending.status);
          }
        }
      });
      pendingPressWrites.clear();
      S.presses = data.presses;
    } else {
      pendingPressWrites.clear();
      S.presses = data.presses && data.presses.length > 0 ? data.presses : JSON.parse(JSON.stringify(DEFAULT_PRESSES));
    }
    S.todos = data.todos || S.todos;
    if (data.qcLog && data.qcLog.length > 0) {
      S.qcLog = data.qcLog;
    } else if (S.qcLog.length === 0 && data.qcLog) {
      S.qcLog = data.qcLog;
    }
    if (data.jobs && data.jobs.length === 0 && S.jobs.length > 0) {
      console.warn('[PMP] Supabase returned 0 jobs but local state has', S.jobs.length, '— keeping local state (possible transient failure)');
    }
    if (data.lastReset) S._lastReset = data.lastReset;
    if (Array.isArray(data.devNotes)) {
      S.devNotes = data.devNotes;
    } else if (!Array.isArray(S.devNotes)) {
      S.devNotes = [];
    }
    if (Array.isArray(data.compounds)) {
      S.compounds = typeof sortCompoundsByNumber === 'function' ? sortCompoundsByNumber(data.compounds) : data.compounds;
    } else if (!Array.isArray(S.compounds)) {
      S.compounds = [];
    }
    if (Array.isArray(data.employees)) {
      S.employees = data.employees;
    } else if (!Array.isArray(S.employees)) {
      S.employees = [];
    }
    if (Array.isArray(data.scheduleEntries)) {
      S.scheduleEntries = data.scheduleEntries;
    } else if (!Array.isArray(S.scheduleEntries)) {
      S.scheduleEntries = [];
    }
    if (data.notesChannels && typeof data.notesChannels === 'object') {
      S.notesChannels = data.notesChannels;
    }
    if (!S.notesChannels || typeof S.notesChannels !== 'object') {
      S.notesChannels = {};
    }
    if (!Array.isArray(S.notesChannels['!TEAM'])) S.notesChannels['!TEAM'] = [];
    if (!Array.isArray(S.notesChannels['!ALERT'])) S.notesChannels['!ALERT'] = [];
    S.jobs.forEach(ensureJobProgressLog);
    syncJobPressFromPresses();
    checkTodoReset();
    if (S.todos) Storage.saveTodos(S.todos);
    S.offlineMode = false;
    setSyncState('synced');
    if (useSupabase()) setOfflineSnapshot(data);
    console.log('[PMP] loadAll finish (synced)');
  } catch (e) {
    console.error('[PMP] loadAll error', e);
    if (useSupabase()) {
      const snap = getOfflineSnapshot();
      if (snap && (snap.jobs || snap.presses)) {
        if (snap.jobs && snap.jobs.length) S.jobs = snap.jobs;
        if (snap.presses && snap.presses.length) {
          normalizeLegacyPresses(snap.presses);
          S.presses = snap.presses;
        }
        if (snap.todos) S.todos = snap.todos;
        if (snap.qcLog && snap.qcLog.length) S.qcLog = snap.qcLog;
        if (snap.lastReset) S._lastReset = snap.lastReset;
        if (Array.isArray(snap.employees)) S.employees = snap.employees;
        if (Array.isArray(snap.scheduleEntries)) S.scheduleEntries = snap.scheduleEntries;
        S.jobs.forEach(ensureJobProgressLog);
        syncJobPressFromPresses();
        S.offlineMode = true;
        setSyncState('offline');
        updateOfflineBanner();
      } else {
        setSyncState('local');
      }
    } else {
      setSyncState('local');
    }
  }
  renderAll();
  const syncEl = document.getElementById('syncStatus');
  if (syncEl && syncEl.textContent === 'loading') {
    setSyncState('synced');
  }
}

// ============================================================
// DEV PAGE — backstage product memory
// ============================================================

function currentDevPersonLabel() {
  const surface = window.PMP?.userProfile?.display_name || window.PMP?.userProfile?.email || '';
  if (!surface) return S.mode === 'admin' ? 'Admin' : 'Operator';
  return surface;
}

function addDevNote() {
  const areaEl = document.getElementById('devAreaSelect');
  const textEl = document.getElementById('devText');
  if (!areaEl || !textEl) return;
  const area = (areaEl.value || '').trim();
  const text = (textEl.value || '').trim();
  if (!text) return;
  const person = currentDevPersonLabel();
  const timestamp = new Date().toISOString();
  Storage.logDevNote({ area, text, person, timestamp })
    .then(() => {
      textEl.value = '';
      renderDevPage();
    })
    .catch(() => {});
}

function devComposerKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    addDevNote();
  }
}

function onDevAreaChange() {
  renderDevPage();
}

function exportDevNotes() {
  const notes = Array.isArray(S.devNotes) ? S.devNotes.slice() : [];
  if (!notes.length) return;
  const rows = [['channel', 'timestamp', 'person', 'text']];
  notes
    .slice()
    .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
    .forEach(n => {
      rows.push([
        (n.area || '').replace(/"/g, '""'),
        n.timestamp || '',
        (n.person || '').replace(/"/g, '""'),
        (n.text || '').replace(/"/g, '""'),
      ]);
    });
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pmp_dev_notes.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function checkTodoReset() {
  const today = new Date().toDateString();
  if (S._lastReset === today) return;
  S.todos.daily?.forEach(t => { t.done = false; t.who = ''; });
  if (new Date().getDay() === 1) S.todos.weekly?.forEach(t => { t.done = false; t.who = ''; });
  S._lastReset = today;
}

function logJobProgress(jobId, stage, qty, person, reason) {
  const job = S.jobs.find(j => j.id === jobId);
  if (!job) return Promise.resolve({ ok: false, error: 'Job not found' });
  ensureJobProgressLog(job);
  if (!PROGRESS_STAGES.includes(stage)) return Promise.resolve({ ok: false, error: 'INVALID STAGE' });
  const q = parseInt(qty, 10);
  if (!Number.isInteger(q) || q < 1) return Promise.resolve({ ok: false, error: 'qty must be a positive integer' });
  const cur = getJobProgress(job);
  const ordered = cur.ordered;
  if (stage === 'qc_passed') {
    const newQC = cur.qcPassed + q;
    if (newQC + cur.rejected > cur.pressed) return Promise.resolve({ ok: false, error: 'qc_passed + rejected cannot exceed pressed' });
  }
  if (stage === 'rejected') {
    const newRej = cur.rejected + q;
    if (newRej > ordered) return Promise.resolve({ ok: false, error: 'rejected cannot exceed ordered' });
  }
  if (stage === 'packed') {
    if (cur.packed + q > cur.qcPassed) return Promise.resolve({ ok: false, error: 'Packed cannot exceed QC passed' });
  }
  if (stage === 'ready') {
    if (cur.ready + q > cur.packed) return Promise.resolve({ ok: false, error: 'Ready cannot exceed packed' });
  }
  if (stage === 'shipped') {
    if (cur.shipped + cur.pickedUp + q > cur.ready) return Promise.resolve({ ok: false, error: 'Out cannot exceed ready' });
  }
  if (stage === 'held') {
    if (cur.shipped + cur.pickedUp + cur.held + q > cur.ready) return Promise.resolve({ ok: false, error: 'Out + held cannot exceed ready' });
  }
  const surface = (person != null && String(person).trim()) ? String(person).trim() : 'UNKNOWN';
  const who = (window.PMP?.userProfile?.display_name || window.PMP?.userProfile?.email || (S.mode === 'admin' ? 'Admin' : 'Operator') || '—');
  const personVal = surface.includes('·') ? surface : `${surface} · ${who}`;
  const timestamp = new Date().toISOString();
  const entry = { qty: q, stage, person: personVal, timestamp };
  if (reason) entry.reason = reason;
  job.progressLog.push(entry);

  const isAssigned = S.presses.some(p => p.job_id === jobId);
  const suggestion = suggestedStatus(job, isAssigned);
  const prev = job.status;
  if (suggestion && (suggestion.suggested === 'pressing' || suggestion.suggested === 'done')) {
    job.status = suggestion.suggested;
  }
  const logEntry = { job_id: jobId, qty: q, stage, person: personVal, timestamp };
  if (reason) logEntry.reason = reason;
  let p = Storage.logProgress(logEntry);
  if (suggestion && (suggestion.suggested === 'pressing' || suggestion.suggested === 'done')) {
    p = p.then(() => Storage.saveJob(job)).then(() => {
      if (prev !== suggestion.suggested) toast(`Status set to ${suggestion.suggested.toUpperCase()}`);
      return { ok: true };
    });
  } else {
    p = p.then(() => ({ ok: true }));
  }
  return p.catch((e) => {
    setSyncState('error', { toast: 'LOG FAILED' });
    return Promise.reject(e);
  });
}

// ============================================================
// DATA SYNC — Realtime when Supabase; else polling
// ============================================================
let pollTimer = null;
let realtimeUnsubscribe = null;
let realtimeApplyTimeout = null;

function stopDataSync() {
  clearInterval(pollTimer);
  pollTimer = null;
  if (realtimeApplyTimeout) {
    clearTimeout(realtimeApplyTimeout);
    realtimeApplyTimeout = null;
  }
  if (typeof realtimeUnsubscribe === 'function') {
    realtimeUnsubscribe();
    realtimeUnsubscribe = null;
    console.log('[PMP] Realtime unsubscribed');
  }
}

function startRealtime() {
  if (!window.PMP || !window.PMP.Supabase || !window.PMP.Supabase.subscribeRealtime) return;
  stopDataSync();
  realtimeUnsubscribe = window.PMP.Supabase.subscribeRealtime(() => {
    console.log('[PMP] Realtime event received');
    if (realtimeApplyTimeout) return;
    realtimeApplyTimeout = setTimeout(() => {
      realtimeApplyTimeout = null;
      if (Date.now() - (S.lastLocalWriteAt || 0) < 1000) {
        console.log('[PMP] Realtime event ignored (self-echo)');
        return;
      }
      if (panelOpen) {
        const panelJustOpened = Date.now() - (S.panelOpenedAt || 0) < 2500;
        if (panelJustOpened) {
          console.log('[PMP] Realtime event ignored (panel just opened)');
          return;
        }
        S.dataChangedWhileEditing = true;
        console.log('[PMP] Realtime event → showDataChangedNotice');
        showDataChangedNotice();
      } else if ((typeof psNumpadValue !== 'undefined' && psNumpadValue !== '0') ||
                 (typeof logNumpadValue !== 'undefined' && logNumpadValue !== '0')) {
        console.log('[PMP] Realtime event → loadAll (numpad active, renderAll will skip re-render)');
        loadAll();
      } else {
        console.log('[PMP] Realtime event → loadAll');
        loadAll();
      }
    }, 300);
  });
  console.log('[PMP] Realtime started');
}

function startPollInterval() {
  stopDataSync();
  pollTimer = setInterval(async () => {
    if (panelOpen) return;
    if (saveInFlight) return;
    await loadAll();
  }, 30000);
}

function startPolling() {
  stopDataSync();
  if (useSupabase()) startRealtime();
  else startPollInterval();
}

function showDataChangedNotice() {
  console.log('[PMP] showDataChangedNotice');
  const el = document.getElementById('dataChangedNotice');
  if (el) el.style.display = 'flex';
}

function hideDataChangedNotice() {
  const el = document.getElementById('dataChangedNotice');
  if (el) el.style.display = 'none';
  S.dataChangedWhileEditing = false;
}

function dismissDataChangedNotice() {
  loadAll();
  hideDataChangedNotice();
}

function closePanel() {
  document.getElementById('overlay').classList.remove('open');
  panelOpen = false;
  hideDataChangedNotice();
}

function setPanelEditMode(enabled) {
  panelEditMode = enabled;
  const body = document.getElementById('panelBody');
  if (!body) return;

  body.querySelectorAll('input, select, textarea').forEach(el => {
    if (enabled) {
      el.removeAttribute('disabled');
      el.style.opacity = '';
      el.style.pointerEvents = '';
    } else {
      el.setAttribute('disabled', 'true');
      el.style.opacity = '0.8';
      el.style.pointerEvents = 'none';
    }
  });

  const foot = document.querySelector('.panel-foot');
  if (foot) foot.style.display = enabled ? 'flex' : 'none';

  const editBtn = document.getElementById('panelEditBtn');
  if (editBtn) { editBtn.textContent = '+'; editBtn.classList.toggle('editing', enabled); }

  body.querySelectorAll('button.btn.go').forEach(el => {
    if (enabled) {
      el.removeAttribute('disabled');
      el.style.opacity = '';
      el.style.pointerEvents = '';
    } else {
      el.setAttribute('disabled', 'true');
      el.style.opacity = '0.8';
      el.style.pointerEvents = 'none';
    }
  });

  if (!enabled) {
    const assetList = document.getElementById('assetList');
    if (assetList) {
      assetList.querySelectorAll('.asset-row, .na-btn').forEach(el => {
        el.style.pointerEvents = 'none';
        el.style.opacity = '0.8';
      });
    }
  } else {
    const assetList = document.getElementById('assetList');
    if (assetList) {
      assetList.querySelectorAll('.asset-row, .na-btn').forEach(el => {
        el.style.pointerEvents = '';
        el.style.opacity = '';
      });
    }
  }
  if (S.editId) {
    const j = S.jobs.find(x => x.id === S.editId);
    if (j) {
      updatePoImageUI(j);
      updatePanelPoStar(j);
    }
  }
}

function panelEditToggle() {
  if (panelEditMode) {
    saveJob();
  } else {
    setPanelEditMode(true);
  }
}

// ============================================================
// LAUNCHER — single entry point, persist last choice
// ============================================================
const LAUNCHER_STORAGE_KEY = 'pmp_launcher_last';

function getLastLauncherChoice() {
  try {
    const raw = localStorage.getItem(LAUNCHER_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || (o.stationType !== null && typeof o.stationType !== 'string')) return null;
    return { stationType: o.stationType ?? null, assignedPressId: o.assignedPressId ?? null };
  } catch { return null; }
}

function setLastLauncherChoice(obj) {
  try {
    localStorage.setItem(LAUNCHER_STORAGE_KEY, JSON.stringify({
      stationType: obj.stationType ?? null,
      assignedPressId: obj.assignedPressId ?? null,
    }));
  } catch {}
}

function enterByLauncher(choice, pressId) {
  const role = getAuthRole();
  const effectivePressId = (role === 'press' && choice === 'press') ? pressId : (role === 'press' ? getAuthAssignedPressId() : pressId);
  if (!mayEnterStation(choice, effectivePressId)) {
    if (typeof toast === 'function') toast('Not allowed for your role.');
    return;
  }
  hideLauncherPressPicker();
  const modeScreen = document.getElementById('modeScreen');
  if (modeScreen) modeScreen.style.display = 'none';
  history.pushState({ station: choice }, '', '');
  S.mode = choice === 'admin' ? 'admin' : 'floor';
  const badge = document.getElementById('modeBadge');
  if (badge) { badge.textContent = (choice === 'admin' ? 'ADMIN' : 'OPERATOR'); badge.className = 'bar-mode ' + (choice === 'admin' ? 'admin' : 'floor'); }
  const backupBtn = document.getElementById('backupBtn');
  if (backupBtn) backupBtn.style.display = 'none';
  updateFAB();
  loadAll();
  startPolling();

  const appEl = document.getElementById('app');
  if (appEl) appEl.style.display = 'block';

  if (choice === 'admin') {
    setStationContext({});
    hideAllShells();
    setLastLauncherChoice({ stationType: null });
    const isAdminRole = getAuthRole() === 'admin';
    _showAdminUtils(isAdminRole);
    renderAll();
    return;
  }
  if (appEl) appEl.style.display = 'block';
  _showAdminUtils(false);
  if (choice === 'floor_manager') {
    setLastLauncherChoice({ stationType: 'floor_manager' });
    openFloorManager();
    return;
  }
  /* PURGATORY: Press Station launcher entry removed (2026-03-06). */
  if (choice === 'qc') {
    setLastLauncherChoice({ stationType: 'qc' });
    setStationContext({});
    if (role === 'admin') {
      S.mode = 'admin';
      const badgeEl = document.getElementById('modeBadge');
      if (badgeEl) { badgeEl.textContent = 'ADMIN'; badgeEl.className = 'bar-mode admin'; }
      _showAdminUtils(true);
    }
    hideAllShells();
    goPg('log');
    renderAll();
    return;
  }
}

/* PURGATORY: toggleLauncherPressPicker / hideLauncherPressPicker removed (2026-03-06). */
function hideLauncherPressPicker() {} // no-op stub; called by enterByLauncher cleanup path

function openLastLauncherChoice() {
  const last = getLastLauncherChoice();
  if (!last) return;
  if (last.stationType === null) {
    enterByLauncher('admin');
    return;
  }
  if (last.stationType === 'floor_manager') {
    enterByLauncher('floor_manager');
    return;
  }
  /* PURGATORY: Press Station last-launcher-choice branch removed (2026-03-06). */
  if (last.stationType === 'qc') {
    enterByLauncher('qc');
    return;
  }
}

/** Try to restore last launcher choice (skip choose-station). Returns true if we entered a station, false otherwise. */
function tryRestoreLastLauncherChoice() {
  const last = getLastLauncherChoice();
  if (!last) return false;
  const choice = last.stationType === null ? 'admin' : last.stationType;
  const pressId = last.assignedPressId || null;
  if (typeof mayEnterStation !== 'function' || !mayEnterStation(choice, pressId)) return false;
  openLastLauncherChoice();
  return true;
}

function renderLauncherLast() {
  const row = document.getElementById('launcherLastRow');
  const label = document.getElementById('launcherLastLabel');
  if (!row || !label) return;
  const last = getLastLauncherChoice();
  if (!last) {
    row.classList.remove('on');
    return;
  }
  let text = 'Last: ';
  if (last.stationType === null) text += 'Admin';
  else if (last.stationType === 'floor_manager') text += 'Floor Manager';
  else if (last.stationType === 'press' && last.assignedPressId) {
    const names = { p1: 'Press 1', p2: 'Press 2', p3: 'Press 3', p4: '7" Press' };
    text += names[last.assignedPressId] || last.assignedPressId;
  } else if (last.stationType === 'qc') text += 'QC Station';
  else { row.classList.remove('on'); return; }
  label.textContent = text;
  row.classList.add('on');
}
renderLauncherLast();

// ============================================================
// AUTH — Supabase email/password; launcher only after login
// ============================================================
function authRequired() {
  return !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY);
}

function getLoginEl() { return document.getElementById('loginScreen'); }
function getModeScreenEl() { return document.getElementById('modeScreen'); }

function showLoginScreen(showLoading) {
  const login = getLoginEl();
  const modeScreen = getModeScreenEl();
  if (login) {
    login.style.display = 'flex';
    const form = document.getElementById('loginForm');
    const err = document.getElementById('loginError');
    const submitBtn = document.getElementById('loginSubmit');
    if (form) form.style.display = showLoading ? 'none' : 'block';
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    if (submitBtn) submitBtn.disabled = !!showLoading;
    if (showLoading) {
      const wrap = login.querySelector('.auth-wrap');
      const loading = wrap && wrap.querySelector('.auth-loading');
      if (loading) loading.style.display = 'block';
      else if (wrap) {
        const div = document.createElement('div');
        div.className = 'auth-loading';
        div.setAttribute('aria-live', 'polite');
        div.textContent = 'Checking session…';
        div.style.cssText = 'padding: var(--space-lg); text-align: center; color: var(--d3); font-size: 13px;';
        wrap.appendChild(div);
      }
    } else {
      const loading = login.querySelector('.auth-loading');
      if (loading) loading.style.display = 'none';
    }
  }
  if (modeScreen) modeScreen.style.display = 'none';
}

function hideLoginScreen() {
  const login = getLoginEl();
  if (login) {
    login.style.display = 'none';
    const loading = login.querySelector('.auth-loading');
    if (loading) loading.style.display = 'none';
  }
}

/** @param {boolean} [skipRestore] - If true, show choose-station only (e.g. after user clicked BACK). If false, try restore last or default to floor. */
function showLauncher(skipRestore) {
  hideLoginScreen();
  const banner = document.getElementById('localModeBanner');
  if (banner) banner.style.display = 'none';
  if (!skipRestore) {
    if (tryRestoreLastLauncherChoice()) return;
    const last = getLastLauncherChoice();
    if (!last && typeof mayEnterStation === 'function' && mayEnterStation('floor_manager', null)) {
      enterByLauncher('floor_manager');
      return;
    }
  }
  const modeScreen = getModeScreenEl();
  if (modeScreen) modeScreen.style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  applyLauncherByRole();
}

function applyLauncherByRole() {
  const role = getAuthRole();
  const adminBtn = document.querySelector('.launcher-btn.admin');
  const fmBtn = document.querySelector('.launcher-btn.fm');
  const qcBtn = document.querySelector('.launcher-btn.qc');
  const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };
  const noRoleEl = document.getElementById('launcherNoRole');
  if (noRoleEl) noRoleEl.style.display = 'none';

  const hasProfileNoRole = !!(window.PMP && window.PMP.userProfile && window.PMP.userProfile.role == null);
  if (!role && !hasProfileNoRole) {
    show(adminBtn, true);
    show(fmBtn, false);
    show(qcBtn, true);
    return;
  }
  if (hasProfileNoRole) {
    show(adminBtn, false);
    show(fmBtn, false);
    show(qcBtn, false);
    if (noRoleEl) noRoleEl.style.display = 'block';
    return;
  }
  switch (role) {
    case 'admin':
      show(adminBtn, true);
      show(fmBtn, false);
      show(qcBtn, true);
      break;
    case 'floor_manager':
      show(adminBtn, true);
      show(fmBtn, false);
      show(qcBtn, true);
      break;
    case 'press':
      /* PURGATORY: 'press' role users currently see no station. They need role reassignment or LOG access. */
      show(adminBtn, false);
      show(fmBtn, false);
      show(qcBtn, false);
      break;
    case 'qc':
      show(adminBtn, false);
      show(fmBtn, false);
      show(qcBtn, true);
      break;
    default:
      show(adminBtn, true);
      show(fmBtn, false);
      show(qcBtn, true);
  }
}

function showLauncherWithLocalBanner() {
  showLauncher();
  const banner = document.getElementById('localModeBanner');
  if (banner) banner.style.display = 'block';
  if (typeof toast === 'function') toast('Local mode — Supabase unavailable. Data not synced.');
}

async function fetchAndStoreProfile(userId) {
  if (!window.PMP || !window.PMP.Supabase || !window.PMP.Supabase.getProfile) return;
  const { data } = await window.PMP.Supabase.getProfile(userId);
  window.PMP.userProfile = data || null;
  updateSentryUserTag();
}

async function authBootstrap() {
  if (!authRequired()) {
    showLauncher();
    return;
  }
  showLoginScreen(true);
  const inited = window.PMP && window.PMP.Supabase && window.PMP.Supabase.initSupabase();
  if (!inited) {
    showLauncherWithLocalBanner();
    return;
  }
  window.PMP.Supabase.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      window.PMP.userProfile = null;
      updateSentryUserTag();
      showLoginScreen(false);
    } else if (event === 'SIGNED_IN' && session) {
      fetchAndStoreProfile(session.user.id).then(() => {
        const appEl = document.getElementById('app');
        const inApp = appEl && appEl.style.display !== 'none';
        const inStation = typeof isStationShellVisible === 'function' && isStationShellVisible();
        if (!inApp && !inStation) showLauncher();
      });
    }
  });

  const { data: { session }, error: sessionError } = await window.PMP.Supabase.getSession();
  if (sessionError) {
    console.error('[PMP] Auth session check failed:', sessionError);
    showLoginScreen(false);
    wireLoginForm();
    return;
  }
  if (session) {
    await fetchAndStoreProfile(session.user.id);
    showLauncher();
    return;
  }
  showLoginScreen(false);
  wireLoginForm();
}

function wireLoginForm() {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailEl = document.getElementById('loginEmail');
      const passwordEl = document.getElementById('loginPassword');
      const errorEl = document.getElementById('loginError');
      const submitBtn = document.getElementById('loginSubmit');
      const email = emailEl && emailEl.value ? emailEl.value.trim() : '';
      const password = passwordEl ? passwordEl.value : '';
      if (!email || !password) {
        if (errorEl) { errorEl.textContent = 'Email and password required.'; errorEl.style.display = 'block'; }
        return;
      }
      if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
      if (submitBtn) submitBtn.disabled = true;
      try {
        const { data, error } = await window.PMP.Supabase.signInWithPassword(email, password);
        if (error) throw error;
        await fetchAndStoreProfile(data.user.id);
        showLauncher();
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err && err.message ? err.message : 'Sign in failed.';
          errorEl.style.display = 'block';
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

authBootstrap();

function enterGuestDemo() {
  window.PMP_GUEST_MODE = true;
  window.PMP = window.PMP || {};
  window.PMP.userProfile = { role: 'admin' };
  updateSentryUserTag();
  showLauncher();
}

window.addEventListener('online', onOnline);

window.addEventListener('popstate', () => {
  if (document.body.classList.contains('tv')) {
    exitTV();
  }
});

// ============================================================
// APP ENTRY
// ============================================================
function enterApp(mode) {
  S.mode = mode;
  document.getElementById('modeScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  const badge = document.getElementById('modeBadge');
  badge.textContent = mode === 'admin' ? 'ADMIN' : 'OPERATOR';
  badge.className = 'bar-mode ' + mode;
  if (mode === 'floor') {
    const bb = document.getElementById('backupBtn'); if (bb) bb.style.display = 'none';
  }
  updateFAB();
  loadAll();
  startPolling();
}

function doLogout() {
  setStationContext({});
  if (typeof hideStationShellsOnly === 'function') hideStationShellsOnly();
  hideLauncherPressPicker();
  renderLauncherLast();
  document.getElementById('app').style.display = 'none';
  document.getElementById('fab').style.display = 'none';
  document.body.classList.remove('tv');
  stopDataSync();
  showLauncher(true);
}

async function signOutFully() {
  if (window.PMP_GUEST_MODE) {
    window.PMP_GUEST_MODE = false;
    window.PMP.userProfile = null;
    setStationContext({});
    document.getElementById('app').style.display = 'none';
    document.getElementById('fab').style.display = 'none';
    document.body.classList.remove('tv');
    stopDataSync();
    showLoginScreen(false);
    return;
  }
  setStationContext({});
  hideLauncherPressPicker();
  renderLauncherLast();
  document.getElementById('app').style.display = 'none';
  document.getElementById('fab').style.display = 'none';
  document.body.classList.remove('tv');
  stopDataSync();
  if (window.PMP?.Supabase?.getClientOrNull?.()) {
    try {
      await window.PMP.Supabase.signOut();
    } catch (e) {
      console.error('[PMP] Sign out error:', e);
    }
    window.PMP.userProfile = null;
    showLoginScreen(false);
  } else {
    showLauncher();
  }
}

// ============================================================
// CLOCK
// ============================================================
function tick() {
  const n = new Date();
  const t = n.toLocaleTimeString('en-US', {hour12:false});
  const d = n.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
  const cl = document.getElementById('clock');
  if (cl) cl.textContent = `${d} · ${t}`;
  const fmCl = document.getElementById('fmClock');
  if (fmCl) fmCl.textContent = `${d} · ${t}`;
  const tv = document.getElementById('tvClock');
  if (tv) tv.textContent = t;
  const td = document.getElementById('tvDate');
  if (td) td.textContent = d;
}
setInterval(tick, 1000); tick();

// ============================================================
// NAV
// ============================================================
let currentPage = 'floor';

function goPg(id) {
  currentPage = id;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('on'));
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  const navEl = document.querySelector(`[data-pg="${id}"]`);
  if (navEl) navEl.classList.add('on');
  const pgEl = document.getElementById('pg-' + id);
  if (pgEl) pgEl.classList.add('on');
  updateFAB();
  if (id === 'audit') loadAuditPage();
  else renderAll();
}

function _showAdminUtils(show) {
  const d = show ? '' : 'none';
  const utilDev = document.getElementById('utilDev');
  if (utilDev) utilDev.style.display = d;
}

function goPgUtil(id) {
  closeUtilMenu();
  goPg(id);
}
function toggleUtilMenu() {
  const m = document.getElementById('utilMenu');
  if (!m) return;
  const open = m.classList.toggle('open');
  if (open) {
    setTimeout(() => document.addEventListener('click', _closeUtilOnOutside, { once: true }), 0);
  }
}
function closeUtilMenu() {
  const m = document.getElementById('utilMenu');
  if (m) m.classList.remove('open');
}
function _closeUtilOnOutside(e) {
  const wrap = document.querySelector('.bar-util-wrap');
  if (wrap && !wrap.contains(e.target)) closeUtilMenu();
  else if (document.getElementById('utilMenu')?.classList.contains('open')) {
    setTimeout(() => document.addEventListener('click', _closeUtilOnOutside, { once: true }), 0);
  }
}

function updateFAB() {
  const fab = document.getElementById('fab');
  const label = document.getElementById('fabLabel');
  if (!fab) return;

  if (currentPage === 'floor' || currentPage === 'jobs') {
    fab.style.display = 'flex';
    fab.textContent = '+';
    if (label) { label.textContent = 'NEW JOB [N]'; }
  } else if (currentPage === 'audit' || currentPage === 'crew') {
    fab.style.display = 'none';
  } else {
    fab.style.display = 'none';
  }
}

function fabAction() {
  if (currentPage === 'floor' || currentPage === 'jobs') {
    openNewJobChooser();
  }
}

// ============================================================
// TV MODE (entry/exit — renderTV in render.js)
// ============================================================
function enterTV() {
  history.pushState({ tv: true }, '', '');
  document.body.classList.add('tv');
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tvParty') === '1') document.body.classList.add('tv-party');
  renderTV();
  updatePizzazButtonState();
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

function exitTV() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
  document.body.classList.remove('tv');
  document.body.classList.remove('tv-party');
}

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && !document.webkitFullscreenElement && document.body.classList.contains('tv')) {
    document.body.classList.remove('tv');
    document.body.classList.remove('tv-party');
  }
});
document.addEventListener('webkitfullscreenchange', () => {
  if (!document.fullscreenElement && !document.webkitFullscreenElement && document.body.classList.contains('tv')) {
    document.body.classList.remove('tv');
    document.body.classList.remove('tv-party');
  }
});

function updatePizzazButtonState() {
  const btn = document.getElementById('tvPizzazBtn');
  if (!btn) return;
  const on = document.body.classList.contains('tv-party');
  btn.textContent = on ? '◇ PIZZAZ ON' : '◇ PIZZAZ';
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  btn.title = on ? 'Diagnostic show mode on — click to turn off' : 'Turn on matrix / diagnostic show mode';
}

function toggleTVParty() {
  document.body.classList.toggle('tv-party');
  try { sessionStorage.setItem('tvParty', document.body.classList.contains('tv-party') ? '1' : '0'); } catch (e) {}
  if (document.body.classList.contains('tv-party')) {
    document.body.classList.add('tv-pizzaz-enter');
    setTimeout(function () { document.body.classList.remove('tv-pizzaz-enter'); }, 650);
  }
  // Rain burst — replicate the escape-from-PIZZAZ matrix rain flash on every toggle
  var rain = document.getElementById('rain');
  if (rain) {
    rain.style.transition = 'none';
    rain.style.opacity = '0.85';
    requestAnimationFrame(function () {
      rain.style.transition = 'opacity 0.6s ease-out';
      rain.style.opacity = '';
      setTimeout(function () { rain.style.transition = ''; }, 650);
    });
  }
  updatePizzazButtonState();
}

// ============================================================
// GLOBAL FULLSCREEN TOGGLE (independent of TV mode)
// ============================================================
function toggleFullscreen() {
  const isFs = document.fullscreenElement || document.webkitFullscreenElement;
  const el = document.documentElement;
  if (!isFs) {
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}

// ============================================================
// AUDIT PAGE
// ============================================================
async function loadAuditPage() {
  const hintEl = document.getElementById('auditHint');
  const bodyEl = document.getElementById('auditBody');
  const emptyEl = document.getElementById('auditEmpty');
  if (!bodyEl) return;
  if (!useSupabase() || getAuthRole() !== 'admin') {
    if (hintEl) hintEl.textContent = 'Audit requires Supabase and admin role.';
    bodyEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (hintEl) hintEl.textContent = 'Loading…';
  if (emptyEl) emptyEl.style.display = 'none';
  const limitEl = document.getElementById('auditLimit');
  const limit = limitEl ? Math.min(500, Math.max(1, parseInt(limitEl.value, 10) || 100)) : 100;
  try {
    const rows = await window.PMP.Supabase.getAuditLog({ limit });
    if (hintEl) hintEl.textContent = rows.length ? `${rows.length} entries` : 'No entries';
    if (!rows.length) {
      bodyEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    bodyEl.innerHTML = rows.map(r => {
      const when = r.occurred_at ? new Date(r.occurred_at).toLocaleString() : '—';
      const by = (r.changed_by_display_name || r.changed_by_email || (r.changed_by ? (r.changed_by).slice(0, 8) + '…' : '')).trim() || '—';
      const fields = (r.changed_fields && r.changed_fields.length) ? r.changed_fields.join(', ') : '—';
      return `<tr><td>${when}</td><td>${escapeHtml(r.table_name)}</td><td>${escapeHtml(String(r.entity_id))}</td><td>${escapeHtml(r.action)}</td><td>${escapeHtml(by)}</td><td>${escapeHtml(fields)}</td></tr>`;
    }).join('');
  } catch (e) {
    console.error(e);
    if (hintEl) hintEl.textContent = 'Error: ' + (e.message || 'Failed to load');
    bodyEl.innerHTML = '';
    if (emptyEl) { emptyEl.textContent = 'Error loading audit log.'; emptyEl.style.display = 'block'; }
  }
}

// ============================================================
// SLIDE PANEL — open, clearFields, calcOv
// ============================================================
function openPanel(id) {
  const perm = getStationEditPermissions();
  if (id && id !== 'null' && !perm.canUseFullPanel) {
    openFloorCard(id);
    return;
  }
  S.editId = id && id !== 'null' ? id : null;
  if (S.editId) {
    const j = S.jobs.find(x => x.id === S.editId);
    if (!j) return;
  }
  const ov = document.getElementById('overlay');
  ov.classList.add('open');
  panelOpen = true;
  S.panelOpenedAt = Date.now();
  hideDataChangedNotice();
  panelEditMode = false;
  curAssets = {};

  if (S.editId) {
    const j = S.jobs.find(x => x.id === S.editId);
    document.getElementById('panelId').textContent = j.catalog || j.artist || 'Job';
    document.getElementById('panelSub').textContent = `${j.artist || ''} · ${j.album || ''}`;
    document.getElementById('delBtn').style.display = S.mode === 'admin' ? '' : 'none';
    const archiveBtn = document.getElementById('archiveBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    if (archiveBtn) archiveBtn.style.display = (j && !j.archived_at) ? '' : 'none';
    if (restoreBtn) restoreBtn.style.display = (j && j.archived_at) ? '' : 'none';

    FIELD_MAP.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;
      const val = j[f.key];
      el.value = (val != null && val !== '') ? String(val) : '';
    });
    const pressEl = document.getElementById('jPress');
    if (pressEl) {
      if (j.press && String(j.press).includes(',')) {
        const first = j.press.split(',')[0].trim();
        pressEl.value = first || '';
      } else {
        pressEl.value = (j.press != null && j.press !== '') ? String(j.press) : '';
      }
    }
    document.getElementById('jOv').value = j.qty ? Math.ceil(parseInt(j.qty, 10) * 1.1).toLocaleString() : '';
    curAssets = j.assets ? JSON.parse(JSON.stringify(j.assets)) : {};
    const po = j.poContract && typeof j.poContract === 'object' ? j.poContract : {};
    if (typeof PO_CONTRACT_FIELDS !== 'undefined') {
      PO_CONTRACT_FIELDS.forEach(function (f) {
        const el = document.getElementById(f.id);
        if (el) el.value = (po[f.key] != null && po[f.key] !== '') ? String(po[f.key]) : '';
      });
    }
    updatePoImageUI(j);
    var cautionBtn = document.getElementById('panelCautionBtn');
    if (cautionBtn) {
      var hasCaution = isJobCautioned(j);
      var needsCautionNote = hasCaution && cautionNeedsNote(j);
      cautionBtn.classList.toggle('caution-active', hasCaution);
      cautionBtn.classList.toggle('caution-pulse', needsCautionNote);
    }
  } else {
    document.getElementById('panelId').textContent = 'NEW JOB';
    document.getElementById('panelSub').textContent = '';
    document.getElementById('delBtn').style.display = 'none';
    const archiveBtn = document.getElementById('archiveBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    if (archiveBtn) archiveBtn.style.display = 'none';
    if (restoreBtn) restoreBtn.style.display = 'none';
    clearFields();
    var cautionBtn = document.getElementById('panelCautionBtn');
    if (cautionBtn) { cautionBtn.classList.remove('caution-active'); cautionBtn.classList.remove('caution-pulse'); }
  }
  buildAssetList();
  renderProgressSection();
  if (S.editId) {
    const j = S.jobs.find(x => x.id === S.editId);
    const suggestionEl = document.getElementById('panelStatusSuggestion');
    if (j && suggestionEl) {
      const isAssigned = S.presses.some(p => p.job_id === j.id);
      const suggestion = suggestedStatus(j, isAssigned);
      const cur = (j.status || 'queue').toLowerCase();
      if (suggestion && suggestion.suggested !== cur) {
        suggestionEl.style.display = '';
        suggestionEl.innerHTML = `<span class="panel-status-suggestion-text">Suggested: <strong>${suggestion.suggested.toUpperCase()}</strong> — ${suggestion.reason}</span> <button type="button" class="btn ghost panel-status-apply" onclick="applySuggestedStatus('${j.id}')">Apply</button>`;
      } else {
        suggestionEl.style.display = 'none';
        suggestionEl.innerHTML = '';
      }
    } else if (suggestionEl) {
      suggestionEl.style.display = 'none';
      suggestionEl.innerHTML = '';
    }
  }
  if (S.editId) {
    const j = S.jobs.find(x => x.id === S.editId);
    if (j) {
      ensureNotesLog(j);
      renderNotesSection();
      const jNotesInput = document.getElementById('jNotesInput');
      const jAssemblyInput = document.getElementById('jAssemblyInput');
      if (jNotesInput) jNotesInput.value = (j.notes != null && j.notes !== '') ? String(j.notes) : '';
      if (jAssemblyInput) jAssemblyInput.value = (j.assembly != null && j.assembly !== '') ? String(j.assembly) : '';
    }
  } else {
    const notesLogList = document.getElementById('notesLogList');
    const assemblyLogList = document.getElementById('assemblyLogList');
    if (notesLogList) notesLogList.innerHTML = '<div class="progress-empty">No notes yet.</div>';
    if (assemblyLogList) assemblyLogList.innerHTML = '<div class="progress-empty">No notes yet.</div>';
    const jNotesInput = document.getElementById('jNotesInput');
    const jAssemblyInput = document.getElementById('jAssemblyInput');
    if (jNotesInput) jNotesInput.value = '';
    if (jAssemblyInput) jAssemblyInput.value = '';
    if (typeof PO_CONTRACT_FIELDS !== 'undefined') {
      PO_CONTRACT_FIELDS.forEach(function (f) {
        const el = document.getElementById(f.id);
        if (el) el.value = '';
      });
    }
    updatePoImageUI(null);
  }

  document.getElementById('panelBody').scrollTop = 0;

  const billingBody = document.getElementById('billingBody');
  const billingToggle = document.getElementById('billingToggle');
  if (billingBody && billingToggle) {
    billingBody.classList.remove('open');
    billingToggle.classList.remove('open');
    if (S.editId) {
      requestAnimationFrame(checkBillingExpand);
    }
  }

  if (!S.editId) {
    setPanelEditMode(true);
    const editBtn = document.getElementById('panelEditBtn');
    if (editBtn) editBtn.style.display = 'none';
  } else {
    setPanelEditMode(false);
    const editBtn = document.getElementById('panelEditBtn');
    if (editBtn) editBtn.style.display = '';
  }
  if (S.editId) {
    const j = S.jobs.find(x => x.id === S.editId);
    if (j) updatePoImageUI(j);
  }
}

function updatePoImageUI(job) {
  const placeholder = document.getElementById('poImagePlaceholder');
  const preview = document.getElementById('poImagePreview');
  const uploadBtn = document.getElementById('poImageUploadBtn');
  const replaceBtn = document.getElementById('poImageReplaceBtn');
  const removeBtn = document.getElementById('poImageRemoveBtn');
  const input = document.getElementById('jPoImageInput');
  const actionsEl = document.querySelector('.po-image-actions');
  if (!placeholder || !preview || !uploadBtn || !replaceBtn || !removeBtn || !input) return;
  const fullUrl = job && job.poContract && job.poContract.imageUrl;
  const thumbPo = job && job.poContract && job.poContract.thumbUrl;
  if (fullUrl) {
    placeholder.style.display = 'none';
    preview.style.display = 'block';
    preview.src = thumbPo || fullUrl;
    preview.classList.add('po-image-clickable');
    preview.onclick = function () { openPoImageLightbox(fullUrl); };
    if (actionsEl) actionsEl.style.display = panelEditMode ? '' : 'none';
    uploadBtn.style.display = 'none';
    replaceBtn.style.display = panelEditMode ? '' : 'none';
    removeBtn.style.display = panelEditMode ? '' : 'none';
  } else {
    placeholder.style.display = 'block';
    preview.style.display = 'none';
    preview.removeAttribute('src');
    preview.onclick = null;
    preview.classList.remove('po-image-clickable');
    if (actionsEl) actionsEl.style.display = panelEditMode ? '' : 'none';
    uploadBtn.style.display = panelEditMode ? '' : 'none';
    replaceBtn.style.display = 'none';
    removeBtn.style.display = 'none';
  }
  input.value = '';
}

function updatePanelPoStar(job) {
  const btn = document.getElementById('panelPoStarBtn');
  if (!btn) return;
  const hasImage = !!(job && job.poContract && job.poContract.imageUrl);
  btn.textContent = hasImage ? '★' : '☆';
  btn.title = hasImage ? 'View PO / contract image' : 'Add PO / contract image';
}

function panelPoStarClick() {
  const jobId = S.editId;
  if (!jobId) return;
  const j = S.jobs.find(function (x) { return x.id === jobId; });
  if (!j) return;
  const hasImage = !!(j.poContract && j.poContract.imageUrl);
  if (hasImage) {
    openPoImageLightbox(j.poContract.imageUrl);
  } else {
    openPoUploadPrompt();
  }
}

function triggerPoFileInput() {
  var input = document.getElementById('jPoImageInput');
  if (!input) return;
  input.removeAttribute('disabled');
  input.style.pointerEvents = '';
  input.click();
}

function openPoUploadPrompt() {
  var el = document.getElementById('poUploadPrompt');
  if (!el) {
    el = document.createElement('div');
    el.id = 'poUploadPrompt';
    el.className = 'po-upload-prompt';
    el.innerHTML =
      '<div class="po-upload-prompt-card">' +
        '<div class="po-upload-prompt-title">Source of Truth</div>' +
        '<div class="po-upload-prompt-sub">Add official Job PO only</div>' +
        '<button type="button" class="po-upload-prompt-btn" onclick="closePoUploadPrompt(); triggerPoFileInput();">Upload Image</button>' +
        '<button type="button" class="po-upload-prompt-cancel" onclick="closePoUploadPrompt()">Cancel</button>' +
      '</div>';
    el.onclick = function (e) { if (e.target === el) closePoUploadPrompt(); };
    document.body.appendChild(el);
  }
  el.classList.add('open');
}

function closePoUploadPrompt() {
  var el = document.getElementById('poUploadPrompt');
  if (el) el.classList.remove('open');
}

// ============================================================
// PVC — operational compound library; Add New Compound (rhymes with Add New Job)
// ============================================================

function openCompoundWizard() {
  S.compoundEditId = null;
  S.compoundWizardData = { number: '', code_name: '', amount_on_hand: '', color: '', notes: '' };
  renderCompoundWizard();
  const wrap = document.getElementById('compoundWizardWrap');
  if (wrap) wrap.classList.add('on');
}

function closeCompoundWizard() {
  const wrap = document.getElementById('compoundWizardWrap');
  if (wrap) wrap.classList.remove('on');
  S.compoundEditId = null;
  renderCompoundsPage();
}

function renderCompoundWizard() {
  const titleEl = document.getElementById('compoundWizardTitle');
  const bodyEl = document.getElementById('compoundWizardBody');
  const footEl = document.getElementById('compoundWizardFoot');
  if (!bodyEl || !footEl) return;
  const data = S.compoundWizardData || { number: '', code_name: '', amount_on_hand: '', color: '', notes: '' };
  const isEdit = !!S.compoundEditId;
  if (titleEl) titleEl.textContent = isEdit ? 'Edit Compound' : 'New Compound';
  bodyEl.innerHTML = [
    '<div class="fg"><label class="fl">Number</label><input class="fi" id="cWizNumber" placeholder="e.g. 001" value="' + (data.number || '').replace(/"/g, '&quot;') + '"></div>',
    '<div class="fg"><label class="fl">Code name</label><input class="fi" id="cWizCodeName" placeholder="Code name" value="' + (data.code_name || '').replace(/"/g, '&quot;') + '"></div>',
    '<div class="fg"><label class="fl">Amount on hand</label><input class="fi" id="cWizAmount" placeholder="e.g. 1/2 tote" value="' + (data.amount_on_hand || '').replace(/"/g, '&quot;') + '"></div>',
    '<div class="fg"><label class="fl">Color</label><input class="fi" id="cWizColor" placeholder="e.g. Black" value="' + (data.color || '').replace(/"/g, '&quot;') + '"></div>',
    '<div class="fg"><label class="fl">Notes</label><textarea class="fi fta" id="cWizNotes" rows="2" placeholder="Notes">' + (data.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea></div>',
  ].join('');
  footEl.innerHTML = '<div class="wizard-foot-inner"><button type="button" class="btn ghost" onclick="closeCompoundWizard()">Cancel</button><button type="button" class="btn go" onclick="compoundWizardSave()">' + (isEdit ? 'Save' : 'Add Compound') + '</button></div>';
}

function compoundWizardSave() {
  const numberEl = document.getElementById('cWizNumber');
  const codeNameEl = document.getElementById('cWizCodeName');
  const amountEl = document.getElementById('cWizAmount');
  const colorEl = document.getElementById('cWizColor');
  const notesEl = document.getElementById('cWizNotes');
  if (!codeNameEl) return;
  const number = (numberEl && numberEl.value) ? numberEl.value.trim() : '';
  const code_name = (codeNameEl.value || '').trim();
  const amount_on_hand = (amountEl && amountEl.value) ? amountEl.value.trim() : '';
  const color = (colorEl && colorEl.value) ? colorEl.value.trim() : '';
  const notes = (notesEl && notesEl.value) ? notesEl.value.trim() : '';
  const list = Array.isArray(S.compounds) ? S.compounds.slice() : [];
  if (S.compoundEditId) {
    const idx = list.findIndex(function (c) { return c.id === S.compoundEditId; });
    if (idx !== -1) {
      list[idx] = { ...list[idx], number, code_name, amount_on_hand, color, notes };
    }
  } else {
    const id = 'cmp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    list.push({ id, number, code_name, amount_on_hand, color, notes });
  }
  S.compounds = typeof sortCompoundsByNumber === 'function' ? sortCompoundsByNumber(list) : list;
  S.compoundEditId = null;
  Storage.saveCompounds(S.compounds).then(function () {
    closeCompoundWizard();
    renderCompoundsPage();
    if (typeof toast === 'function') toast('Compound saved.');
  }).catch(function () {});
}

function pvcThumbClick(compoundId, hasImage) {
  if (hasImage) {
    var c = (S.compounds || []).find(function (x) { return x.id === compoundId; });
    if (c && c.imageUrl) openPoImageLightbox(c.imageUrl, { compoundId: compoundId });
  } else {
    S.pvcUploadCompoundId = compoundId;
    var input = document.getElementById('pvcCompoundImageInput');
    if (input) input.click();
  }
}

async function onPvcCompoundImageSelected(input) {
  var file = input && input.files && input.files[0];
  input.value = '';
  var compoundId = S.pvcUploadCompoundId;
  S.pvcUploadCompoundId = null;
  if (!file || !compoundId) return;
  if (!checkImageSize(file, IMG_LIMITS.compound, 'Compound image')) return;
  if (!window.PMP || !window.PMP.Supabase || typeof window.PMP.Supabase.uploadCompoundImage !== 'function') {
    if (typeof toast === 'function') toast('Storage not available.');
    return;
  }
  try {
    var blobs = await processImage(file);
    var res = await window.PMP.Supabase.uploadCompoundImage(compoundId, blobs);
    var list = Array.isArray(S.compounds) ? S.compounds.slice() : [];
    var idx = list.findIndex(function (x) { return x.id === compoundId; });
    if (idx !== -1) {
      list[idx] = Object.assign({}, list[idx], { imageUrl: res.url });
      if (res.thumbUrl) list[idx].thumbUrl = res.thumbUrl;
      S.compounds = list;
      await Storage.saveCompounds(S.compounds);
      closePoImageLightbox();
      renderCompoundsPage();
      if (typeof toast === 'function') toast('Photo uploaded.');
    }
  } catch (e) {
    console.error('[PMP] Compound image upload failed', e);
    if (typeof toast === 'function') toast(e && e.message ? e.message : 'Upload failed.');
  }
}

function editCompound(id) {
  const c = (S.compounds || []).find(function (x) { return x.id === id; });
  if (!c) return;
  S.compoundEditId = id;
  S.compoundWizardData = {
    number: c.number || '',
    code_name: c.code_name || '',
    amount_on_hand: c.amount_on_hand || '',
    color: c.color || '',
    notes: c.notes || '',
  };
  renderCompoundWizard();
  const wrap = document.getElementById('compoundWizardWrap');
  if (wrap) wrap.classList.add('on');
}

// ============================================================
// CREW — operational directory; add/edit person
// ============================================================

function openEmployeeWizard() {
  S.employeeEditId = null;
  S.employeeWizardData = { name: '', role: '', phone: '', email: '', specialty: '', photo_url: '', notes: '' };
  renderEmployeeWizard();
  const wrap = document.getElementById('employeeWizardWrap');
  if (wrap) wrap.classList.add('on');
}

function closeEmployeeWizard() {
  const wrap = document.getElementById('employeeWizardWrap');
  if (wrap) wrap.classList.remove('on');
  S.employeeEditId = null;
  if (typeof renderCrewPage === 'function') renderCrewPage();
}

function renderEmployeeWizard() {
  const titleEl = document.getElementById('employeeWizardTitle');
  const bodyEl = document.getElementById('employeeWizardBody');
  const footEl = document.getElementById('employeeWizardFoot');
  if (!bodyEl || !footEl) return;
  const data = S.employeeWizardData || { name: '', role: '', phone: '', email: '', specialty: '', photo_url: '', notes: '' };
  const isEdit = !!S.employeeEditId;
  if (titleEl) titleEl.textContent = isEdit ? 'Edit Person' : 'New Person';
  function esc(v) { return (v || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  bodyEl.innerHTML = [
    '<div class="fg"><label class="fl">Name</label><input class="fi" id="eWizName" placeholder="Full name" value="' + esc(data.name) + '"></div>',
    '<div class="fg"><label class="fl">Role</label><input class="fi" id="eWizRole" placeholder="e.g. Press, QC, Floor Manager" value="' + esc(data.role) + '"></div>',
    '<div class="fg"><label class="fl">Phone</label><input class="fi" id="eWizPhone" placeholder="Phone" value="' + esc(data.phone) + '"></div>',
    '<div class="fg"><label class="fl">Email</label><input class="fi" id="eWizEmail" placeholder="Email" value="' + esc(data.email) + '"></div>',
    '<div class="fg"><label class="fl">Specialty / station</label><input class="fi" id="eWizSpecialty" placeholder="e.g. P1, QC, Shipping" value="' + esc(data.specialty) + '"></div>',
    '<div class="fg"><label class="fl">Photo URL</label><input class="fi" id="eWizPhotoUrl" placeholder="Optional image URL" value="' + esc(data.photo_url) + '"></div>',
    '<div class="fg"><label class="fl">Notes</label><textarea class="fi fta" id="eWizNotes" rows="2" placeholder="Optional notes">' + esc(data.notes) + '</textarea></div>',
  ].join('');
  footEl.innerHTML = '<div class="wizard-foot-inner"><button type="button" class="btn ghost" onclick="closeEmployeeWizard()">Cancel</button><button type="button" class="btn go" onclick="employeeWizardSave()">' + (isEdit ? 'Save' : 'Add') + '</button></div>';
}

function employeeWizardSave() {
  const nameEl = document.getElementById('eWizName');
  const roleEl = document.getElementById('eWizRole');
  const phoneEl = document.getElementById('eWizPhone');
  const emailEl = document.getElementById('eWizEmail');
  const specialtyEl = document.getElementById('eWizSpecialty');
  const photoUrlEl = document.getElementById('eWizPhotoUrl');
  const notesEl = document.getElementById('eWizNotes');
  if (!nameEl) return;
  const name = (nameEl.value || '').trim();
  if (!name) {
    if (typeof toast === 'function') toast('Name is required.');
    return;
  }
  const role = (roleEl && roleEl.value) ? roleEl.value.trim() : '';
  const phone = (phoneEl && phoneEl.value) ? phoneEl.value.trim() : '';
  const email = (emailEl && emailEl.value) ? emailEl.value.trim() : '';
  const specialty = (specialtyEl && specialtyEl.value) ? specialtyEl.value.trim() : '';
  const photo_url = (photoUrlEl && photoUrlEl.value) ? photoUrlEl.value.trim() : '';
  const notes = (notesEl && notesEl.value) ? notesEl.value.trim() : '';
  const list = Array.isArray(S.employees) ? S.employees.slice() : [];
  if (S.employeeEditId) {
    const idx = list.findIndex(function (e) { return e.id === S.employeeEditId; });
    if (idx !== -1) {
      list[idx] = { ...list[idx], name, role, phone, email, specialty, photo_url, notes };
    }
  } else {
    const id = 'emp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    list.push({ id, name, role, phone, email, specialty, photo_url, notes, active: true });
  }
  S.employees = list.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
  S.employeeEditId = null;
  Storage.saveEmployees(S.employees).then(function () {
    closeEmployeeWizard();
    if (typeof renderCrewPage === 'function') renderCrewPage();
    if (typeof toast === 'function') toast('Saved.');
  }).catch(function () {
    if (typeof toast === 'function') toast('Save failed.');
  });
}

function editEmployee(id) {
  const e = (S.employees || []).find(function (x) { return x.id === id; });
  if (!e) return;
  S.employeeEditId = id;
  S.employeeWizardData = {
    name: e.name || '',
    role: e.role || '',
    phone: e.phone || '',
    email: e.email || '',
    specialty: e.specialty || '',
    photo_url: e.photo_url || '',
    notes: e.notes || '',
  };
  renderEmployeeWizard();
  const wrap = document.getElementById('employeeWizardWrap');
  if (wrap) wrap.classList.add('on');
}

// ============================================================
// CREW — photo upload (pfp circle)
// ============================================================
function crewThumbClick(employeeId, hasImage) {
  if (hasImage) {
    var e = (S.employees || []).find(function (x) { return x.id === employeeId; });
    if (e && e.photo_url) openPoImageLightbox(e.photo_url, { employeeId: employeeId });
  } else {
    S.crewUploadEmployeeId = employeeId;
    var input = document.getElementById('crewPhotoInput');
    if (input) input.click();
  }
}

async function onCrewPhotoSelected(input) {
  var file = input && input.files && input.files[0];
  input.value = '';
  var employeeId = S.crewUploadEmployeeId;
  S.crewUploadEmployeeId = null;
  if (!file || !employeeId) return;
  if (!checkImageSize(file, IMG_LIMITS.crew, 'Crew photo')) return;
  if (!window.PMP || !window.PMP.Supabase || typeof window.PMP.Supabase.uploadCrewPhoto !== 'function') {
    if (typeof toast === 'function') toast('Storage not available.');
    return;
  }
  try {
    var blobs = await processImage(file);
    var res = await window.PMP.Supabase.uploadCrewPhoto(employeeId, blobs);
    var list = Array.isArray(S.employees) ? S.employees.slice() : [];
    var idx = list.findIndex(function (x) { return x.id === employeeId; });
    if (idx !== -1) {
      list[idx] = Object.assign({}, list[idx], { photo_url: res.url });
      if (res.thumbUrl) list[idx].thumb_url = res.thumbUrl;
      S.employees = list;
      try {
        await Storage.saveEmployees(S.employees);
        closePoImageLightbox();
        renderCrewPage();
        if (typeof toast === 'function') toast('Photo uploaded.');
      } catch (_) {
        renderCrewPage();
        if (typeof toast === 'function') toast('Photo saved locally.');
      }
    }
  } catch (err) {
    if (typeof toastError === 'function') toastError('Upload failed: ' + (err.message || err));
    else if (typeof toast === 'function') toast('Upload failed.');
  }
}

// ============================================================
// CREW — CSV import (directory)
// ============================================================
function mapCrewCsvHeaderToKey(h) {
  var t = (h || '').trim().replace(/^\uFEFF/, '').toLowerCase().replace(/\s+/g, ' ');
  var map = {
    name: 'name', 'full name': 'name', employee: 'name', 'employee name': 'name',
    email: 'email', 'e-mail': 'email', 'email address': 'email',
    role: 'role', title: 'role', position: 'role', 'job title': 'role',
    phone: 'phone', 'phone number': 'phone', tel: 'phone', telephone: 'phone', mobile: 'phone', cell: 'phone',
    specialty: 'specialty', station: 'specialty', 'specialty / station': 'specialty',
    notes: 'notes', note: 'notes', comments: 'notes', comment: 'notes',
    photo: 'photo_url', 'photo url': 'photo_url', photo_url: 'photo_url', image: 'photo_url',
  };
  return map[t] || null;
}

function parseCrewCsv(text) {
  var lines = typeof parseCSVLines === 'function' ? parseCSVLines(text) : [];
  if (lines.length < 2) return [];
  var headerRowIndex = -1;
  for (var h = 0; h < Math.min(5, lines.length); h++) {
    if (!lines[h] || !lines[h].length) continue;
    for (var c = 0; c < lines[h].length; c++) {
      if (mapCrewCsvHeaderToKey((lines[h][c] || '').trim())) { headerRowIndex = h; break; }
    }
    if (headerRowIndex >= 0) break;
  }
  if (headerRowIndex < 0) return [];
  var headers = lines[headerRowIndex].map(function (h) { return (h || '').trim(); });
  var keyToCol = {};
  headers.forEach(function (h, i) { var k = mapCrewCsvHeaderToKey(h); if (k && keyToCol[k] === undefined) keyToCol[k] = i; });
  if (keyToCol.name === undefined && keyToCol.email === undefined) return [];
  var out = [];
  var baseId = 'emp_csv_' + Date.now();
  for (var i = headerRowIndex + 1; i < lines.length; i++) {
    var v = lines[i];
    var name = (keyToCol.name !== undefined && v[keyToCol.name] != null) ? String(v[keyToCol.name]).trim() : '';
    var email = (keyToCol.email !== undefined && v[keyToCol.email] != null) ? String(v[keyToCol.email]).trim() : '';
    if (!name && !email) continue;
    if (!name) name = email.split('@')[0] || email;
    out.push({
      id: baseId + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
      name: name,
      email: email,
      role: (keyToCol.role !== undefined && v[keyToCol.role] != null) ? String(v[keyToCol.role]).trim() : '',
      phone: (keyToCol.phone !== undefined && v[keyToCol.phone] != null) ? String(v[keyToCol.phone]).trim() : '',
      specialty: (keyToCol.specialty !== undefined && v[keyToCol.specialty] != null) ? String(v[keyToCol.specialty]).trim() : '',
      photo_url: (keyToCol.photo_url !== undefined && v[keyToCol.photo_url] != null) ? String(v[keyToCol.photo_url]).trim() : '',
      notes: (keyToCol.notes !== undefined && v[keyToCol.notes] != null) ? String(v[keyToCol.notes]).trim() : '',
      active: true,
    });
  }
  return out;
}

function onCrewCsvSelected(input) {
  var file = input && input.files && input.files[0];
  input.value = '';
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var text = e.target && e.target.result;
    var people = typeof text === 'string' ? parseCrewCsv(text) : [];
    if (!people.length) { toast('No rows found. Ensure CSV has a name or email column.'); return; }
    var list = Array.isArray(S.employees) ? S.employees.slice() : [];
    var dupes = 0;
    people.forEach(function (p) {
      var exists = list.some(function (x) {
        return (p.email && x.email && x.email.toLowerCase() === p.email.toLowerCase()) ||
               (p.name && x.name && x.name.toLowerCase() === p.name.toLowerCase());
      });
      if (exists) { dupes++; return; }
      list.push(p);
    });
    S.employees = list.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    if (typeof renderCrewPage === 'function') renderCrewPage();
    var importCount = people.length - dupes;
    Storage.saveEmployees(S.employees).then(function () {
      var msg = importCount + ' person' + (importCount !== 1 ? 's' : '') + ' imported';
      if (dupes) msg += ' (' + dupes + ' duplicate' + (dupes !== 1 ? 's' : '') + ' skipped)';
      toast(msg);
    }).catch(function (err) {
      console.error('Crew CSV save error:', err);
      var detail = (err && (err.message || err.error)) ? String(err.message || err.error) : '';
      toast('Save failed' + (detail ? ': ' + detail : '') + ' — data loaded locally');
    });
  };
  reader.readAsText(file);
}

function getTodayDateISO() {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// SCHEDULE ENTRY (TODAY add/edit)
// ============================================================

function openScheduleEntryWizard() {
  S.scheduleEntryEditId = null;
  S.scheduleEntryWizardData = { employee_id: '', shift_label: '', area: '', notes: '' };
  S.scheduleEntryWizardDate = getTodayDateISO();
  renderScheduleEntryWizard();
  const wrap = document.getElementById('scheduleEntryWizardWrap');
  if (wrap) wrap.classList.add('on');
}

function closeScheduleEntryWizard() {
  const wrap = document.getElementById('scheduleEntryWizardWrap');
  if (wrap) wrap.classList.remove('on');
  S.scheduleEntryEditId = null;
  if (typeof renderCrewPage === 'function') renderCrewPage();
}

function renderScheduleEntryWizard() {
  const titleEl = document.getElementById('scheduleEntryWizardTitle');
  const bodyEl = document.getElementById('scheduleEntryWizardBody');
  const footEl = document.getElementById('scheduleEntryWizardFoot');
  if (!bodyEl || !footEl) return;
  const data = S.scheduleEntryWizardData || { employee_id: '', shift_label: '', area: '', notes: '' };
  const isEdit = !!S.scheduleEntryEditId;
  const todayStr = S.scheduleEntryWizardDate || getTodayDateISO();
  if (titleEl) titleEl.textContent = isEdit ? 'Edit entry' : 'Add to today';
  function esc(v) { return (v || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  const employees = Array.isArray(S.employees) ? S.employees : [];
  const options = employees.map(function (e) {
    var sel = e.id === data.employee_id ? ' selected' : '';
    return '<option value="' + (e.id || '').replace(/"/g, '&quot;') + '"' + sel + '>' + esc(e.name || '—') + '</option>';
  }).join('');
  const employeeSelect = '<div class="fg"><label class="fl">Employee</label><select class="fi fs" id="sWizEmployeeId">' +
    '<option value="">Select…</option>' + options + '</select></div>';
  bodyEl.innerHTML = [
    employeeSelect,
    '<div class="fg"><label class="fl">Shift / time</label><input class="fi" id="sWizShift" placeholder="e.g. 8–4, AM, 9–5" value="' + esc(data.shift_label) + '"></div>',
    '<div class="fg"><label class="fl">Area / station</label><input class="fi" id="sWizArea" placeholder="e.g. Press 1, QC, Floor" value="' + esc(data.area) + '"></div>',
    '<div class="fg"><label class="fl">Note</label><textarea class="fi fta" id="sWizNotes" rows="2" placeholder="Optional short note">' + esc(data.notes) + '</textarea></div>',
    '<div class="fg"><label class="fl">Date</label><input class="fi" id="sWizDate" type="date" value="' + esc(todayStr) + '"></div>',
  ].join('');
  footEl.innerHTML = '<div class="wizard-foot-inner"><button type="button" class="btn ghost" onclick="closeScheduleEntryWizard()">Cancel</button><button type="button" class="btn go" onclick="scheduleEntryWizardSave()">' + (isEdit ? 'Save' : 'Add') + '</button></div>';
}

function scheduleEntryWizardSave() {
  const employeeEl = document.getElementById('sWizEmployeeId');
  const shiftEl = document.getElementById('sWizShift');
  const areaEl = document.getElementById('sWizArea');
  const notesEl = document.getElementById('sWizNotes');
  const dateEl = document.getElementById('sWizDate');
  if (!employeeEl) return;
  const employee_id = (employeeEl.value || '').trim();
  if (!employee_id) {
    if (typeof toast === 'function') toast('Select an employee.');
    return;
  }
  const shift_label = (shiftEl && shiftEl.value) ? shiftEl.value.trim() : '';
  const area = (areaEl && areaEl.value) ? areaEl.value.trim() : '';
  const notes = (notesEl && notesEl.value) ? notesEl.value.trim() : '';
  const dateStr = (dateEl && dateEl.value) ? dateEl.value.trim().slice(0, 10) : getTodayDateISO();
  const list = Array.isArray(S.scheduleEntries) ? S.scheduleEntries.slice() : [];
  if (S.scheduleEntryEditId) {
    const idx = list.findIndex(function (s) { return s.id === S.scheduleEntryEditId; });
    if (idx !== -1) {
      list[idx] = { ...list[idx], employee_id, shift_label, area, notes, date: dateStr };
    }
  } else {
    const id = 'sched_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    list.push({ id, employee_id, date: dateStr, shift_label, area, notes, sort_order: list.length });
  }
  S.scheduleEntries = list;
  S.scheduleEntryEditId = null;
  Storage.saveScheduleEntries(S.scheduleEntries).then(function () {
    closeScheduleEntryWizard();
    if (typeof renderCrewPage === 'function') renderCrewPage();
    if (typeof toast === 'function') toast('Saved.');
  }).catch(function () {
    if (typeof toast === 'function') toast('Save failed.');
  });
}

function editScheduleEntry(id) {
  const s = (S.scheduleEntries || []).find(function (x) { return x.id === id; });
  if (!s) return;
  S.scheduleEntryEditId = id;
  S.scheduleEntryWizardData = {
    employee_id: s.employee_id || '',
    shift_label: s.shift_label || '',
    area: s.area || '',
    notes: s.notes || '',
  };
  S.scheduleEntryWizardDate = s.date || getTodayDateISO();
  renderScheduleEntryWizard();
  const wrap = document.getElementById('scheduleEntryWizardWrap');
  if (wrap) wrap.classList.add('on');
}

// ============================================================
// SCHEDULE — CSV import (today entries)
// ============================================================
function mapScheduleCsvHeaderToKey(h) {
  var t = (h || '').trim().replace(/^\uFEFF/, '').toLowerCase().replace(/\s+/g, ' ');
  var map = {
    name: 'name', 'full name': 'name', employee: 'name', 'employee name': 'name',
    email: 'email', 'e-mail': 'email', 'email address': 'email',
    shift: 'shift_label', 'shift label': 'shift_label', time: 'shift_label', hours: 'shift_label', 'shift / time': 'shift_label',
    area: 'area', station: 'area', 'area / station': 'area', location: 'area',
    note: 'notes', notes: 'notes', comment: 'notes', comments: 'notes',
    date: 'date', day: 'date',
  };
  return map[t] || null;
}

function parseScheduleCsv(text) {
  var lines = typeof parseCSVLines === 'function' ? parseCSVLines(text) : [];
  if (lines.length < 2) return [];
  var headerRowIndex = -1;
  for (var h = 0; h < Math.min(5, lines.length); h++) {
    if (!lines[h] || !lines[h].length) continue;
    for (var c = 0; c < lines[h].length; c++) {
      if (mapScheduleCsvHeaderToKey((lines[h][c] || '').trim())) { headerRowIndex = h; break; }
    }
    if (headerRowIndex >= 0) break;
  }
  if (headerRowIndex < 0) return [];
  var headers = lines[headerRowIndex].map(function (h) { return (h || '').trim(); });
  var keyToCol = {};
  headers.forEach(function (h, i) { var k = mapScheduleCsvHeaderToKey(h); if (k && keyToCol[k] === undefined) keyToCol[k] = i; });
  if (keyToCol.name === undefined && keyToCol.email === undefined) return [];
  var out = [];
  for (var i = headerRowIndex + 1; i < lines.length; i++) {
    var v = lines[i];
    var name = (keyToCol.name !== undefined && v[keyToCol.name] != null) ? String(v[keyToCol.name]).trim() : '';
    var email = (keyToCol.email !== undefined && v[keyToCol.email] != null) ? String(v[keyToCol.email]).trim() : '';
    if (!name && !email) continue;
    var shift_label = (keyToCol.shift_label !== undefined && v[keyToCol.shift_label] != null) ? String(v[keyToCol.shift_label]).trim() : '';
    var area = (keyToCol.area !== undefined && v[keyToCol.area] != null) ? String(v[keyToCol.area]).trim() : '';
    var notes = (keyToCol.notes !== undefined && v[keyToCol.notes] != null) ? String(v[keyToCol.notes]).trim() : '';
    var date = (keyToCol.date !== undefined && v[keyToCol.date] != null) ? String(v[keyToCol.date]).trim() : '';
    out.push({ name: name, email: email, shift_label: shift_label, area: area, notes: notes, date: date });
  }
  return out;
}

function onScheduleCsvSelected(input) {
  var file = input && input.files && input.files[0];
  input.value = '';
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var text = e.target && e.target.result;
    var rows = typeof text === 'string' ? parseScheduleCsv(text) : [];
    if (!rows.length) { toast('No rows found. Ensure CSV has a name or email column.'); return; }
    var employees = Array.isArray(S.employees) ? S.employees : [];
    var todayISO = getTodayDateISO();
    var list = Array.isArray(S.scheduleEntries) ? S.scheduleEntries.slice() : [];
    var added = 0;
    var autoCreated = 0;
    var baseId = 'sched_csv_' + Date.now();
    rows.forEach(function (r, ri) {
      var emp = null;
      if (r.email) emp = employees.find(function (x) { return x.email && x.email.toLowerCase() === r.email.toLowerCase(); });
      if (!emp && r.name) emp = employees.find(function (x) { return x.name && x.name.toLowerCase() === r.name.toLowerCase(); });
      if (!emp) {
        var newId = 'emp_csv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        emp = { id: newId, name: r.name || (r.email ? r.email.split('@')[0] : 'Unknown'), email: r.email || '', role: '', phone: '', specialty: '', photo_url: '', notes: '', active: true };
        employees.push(emp);
        autoCreated++;
      }
      var dateStr = r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : todayISO;
      list.push({
        id: baseId + '_' + ri + '_' + Math.random().toString(36).slice(2, 6),
        employee_id: emp.id,
        date: dateStr,
        shift_label: r.shift_label || '',
        area: r.area || '',
        notes: r.notes || '',
        sort_order: list.length,
      });
      added++;
    });
    S.employees = employees.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    S.scheduleEntries = list;
    if (typeof renderCrewPage === 'function') renderCrewPage();
    Promise.all([
      Storage.saveEmployees(S.employees),
      Storage.saveScheduleEntries(S.scheduleEntries),
    ]).then(function () {
      var msg = added + ' entr' + (added !== 1 ? 'ies' : 'y') + ' imported';
      if (autoCreated) msg += ' (' + autoCreated + ' new person' + (autoCreated !== 1 ? 's' : '') + ' created)';
      toast(msg);
    }).catch(function (err) {
      console.error('Schedule CSV save error:', err);
      var detail = (err && (err.message || err.error)) ? String(err.message || err.error) : '';
      toast('Save failed' + (detail ? ': ' + detail : '') + ' — data loaded locally');
    });
  };
  reader.readAsText(file);
}

// PVC CSV import — template: number, code name, amount on hand, color, notes
// Also maps common spreadsheet headers: No., Compound Name, Stock/Status, Description/Notes
function mapPvcCsvHeaderToKey(h) {
  const t = (h || '').trim().replace(/^\uFEFF/, '').toLowerCase().replace(/\s+/g, ' ');
  const map = {
    number: 'number',
    no: 'number',
    'no.': 'number',
    'code name': 'code_name',
    'compound name': 'code_name',
    code_name: 'code_name',
    codename: 'code_name',
    'amount on hand': 'amount_on_hand',
    'stock / status': 'amount_on_hand',
    'stock/status': 'amount_on_hand',
    stock: 'amount_on_hand',
    status: 'amount_on_hand',
    amount_on_hand: 'amount_on_hand',
    amount: 'amount_on_hand',
    color: 'color',
    notes: 'notes',
    'description / notes': 'notes',
    'description/notes': 'notes',
    description: 'notes',
  };
  return map[t] || null;
}

function parsePvcCsvToCompounds(text) {
  const lines = typeof parseCSVLines === 'function' ? parseCSVLines(text) : [];
  if (lines.length < 2) return [];
  // Find first row that has at least one recognized header (skip title/blank rows)
  var headerRowIndex = -1;
  for (var h = 0; h < Math.min(5, lines.length); h++) {
    var row = lines[h];
    if (!row || !row.length) continue;
    for (var c = 0; c < row.length; c++) {
      if (mapPvcCsvHeaderToKey((row[c] || '').trim())) {
        headerRowIndex = h;
        break;
      }
    }
    if (headerRowIndex >= 0) break;
  }
  if (headerRowIndex < 0) return [];
  const headers = (lines[headerRowIndex] || []).map(function (h) { return (h || '').trim(); });
  const keyToCol = {};
  headers.forEach(function (h, i) {
    var k = mapPvcCsvHeaderToKey(h);
    if (k && keyToCol[k] === undefined) keyToCol[k] = i;
  });
  const out = [];
  var baseId = 'cmp_csv_' + Date.now();
  for (var i = headerRowIndex + 1; i < lines.length; i++) {
    var vals = lines[i];
    var number = (keyToCol.number !== undefined && vals[keyToCol.number] != null) ? String(vals[keyToCol.number]).trim() : '';
    var code_name = (keyToCol.code_name !== undefined && vals[keyToCol.code_name] != null) ? String(vals[keyToCol.code_name]).trim() : '';
    var amount_on_hand = (keyToCol.amount_on_hand !== undefined && vals[keyToCol.amount_on_hand] != null) ? String(vals[keyToCol.amount_on_hand]).trim() : '';
    var color = (keyToCol.color !== undefined && vals[keyToCol.color] != null) ? String(vals[keyToCol.color]).trim() : '';
    var notes = (keyToCol.notes !== undefined && vals[keyToCol.notes] != null) ? String(vals[keyToCol.notes]).trim() : '';
    if (!number && !code_name && !amount_on_hand && !color && !notes) continue;
    out.push({
      id: baseId + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
      number: number,
      code_name: code_name,
      amount_on_hand: amount_on_hand,
      color: color,
      notes: notes,
    });
  }
  return out;
}

function onPvcCsvSelected(input) {
  var file = input && input.files && input.files[0];
  input.value = '';
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var text = e.target && e.target.result;
    var compounds = typeof text === 'string' ? parsePvcCsvToCompounds(text) : [];
    if (!compounds.length) {
      if (typeof toast === 'function') toast('No rows to import.');
      return;
    }
    var list = Array.isArray(S.compounds) ? S.compounds.slice() : [];
    compounds.forEach(function (c) { list.push(c); });
    S.compounds = typeof sortCompoundsByNumber === 'function' ? sortCompoundsByNumber(list) : list;
    Storage.saveCompounds(S.compounds).then(function () {
      renderCompoundsPage();
      if (typeof toast === 'function') toast(compounds.length + ' compound' + (compounds.length !== 1 ? 's' : '') + ' imported.');
    }).catch(function () {
      if (typeof toast === 'function') toast('Import failed.');
    });
  };
  reader.onerror = function () {
    if (typeof toast === 'function') toast('Could not read file.');
  };
  reader.readAsText(file);
}

function openPoImageLightbox(src, opts) {
  if (!src) return;
  var el = document.getElementById('poImageLightbox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'poImageLightbox';
    el.className = 'po-image-lightbox';
    el.innerHTML = '<button type="button" class="po-image-lightbox-close" aria-label="Close" onclick="closePoImageLightbox()">&times;</button><img alt="Image" /><button type="button" class="po-image-lightbox-replace" id="poImageLightboxReplace" style="display:none;">Replace</button>';
    el.onclick = function (e) { if (e.target === el) closePoImageLightbox(); };
    el.querySelector('img').onclick = function (e) { e.stopPropagation(); };
    document.body.appendChild(el);
  }
  var img = el.querySelector('img');
  if (img) img.src = src;
  var replaceBtn = document.getElementById('poImageLightboxReplace');
  if (replaceBtn) {
    if (opts && opts.compoundId) {
      el.dataset.compoundId = opts.compoundId;
      el.dataset.employeeId = '';
      replaceBtn.style.display = 'block';
      replaceBtn.onclick = function (e) {
        e.stopPropagation();
        var cid = el.dataset.compoundId;
        if (cid) {
          S.pvcUploadCompoundId = cid;
          var input = document.getElementById('pvcCompoundImageInput');
          if (input) input.click();
        }
      };
    } else if (opts && opts.employeeId) {
      el.dataset.employeeId = opts.employeeId;
      el.dataset.compoundId = '';
      replaceBtn.style.display = 'block';
      replaceBtn.onclick = function (e) {
        e.stopPropagation();
        var eid = el.dataset.employeeId;
        if (eid) {
          S.crewUploadEmployeeId = eid;
          var input = document.getElementById('crewPhotoInput');
          if (input) input.click();
        }
      };
    } else {
      el.dataset.compoundId = '';
      el.dataset.employeeId = '';
      replaceBtn.style.display = 'none';
    }
  }
  el.classList.add('open');
  var esc = function (e) { if (e.key === 'Escape') closePoImageLightbox(); };
  el._esc = esc;
  document.addEventListener('keydown', esc);
}

function closePoImageLightbox() {
  const el = document.getElementById('poImageLightbox');
  if (el) {
    if (el._esc) document.removeEventListener('keydown', el._esc);
    el._esc = null;
    el.classList.remove('open');
  }
}

async function onPoImageFileSelected(input) {
  const file = input && input.files && input.files[0];
  if (!file) return;
  if (!checkImageSize(file, IMG_LIMITS.po, 'PO image')) { input.value = ''; return; }
  const jobId = S.editId;
  if (!jobId) {
    if (typeof toast === 'function') toast('Save the job first to add a PO image.');
    input.value = '';
    return;
  }
  if (!window.PMP || !window.PMP.Supabase || typeof window.PMP.Supabase.uploadPoImage !== 'function') {
    if (typeof toast === 'function') toast('Storage not available.');
    input.value = '';
    return;
  }
  try {
    const j = S.jobs.find(function (x) { return x.id === jobId; });
    if (!j) { input.value = ''; return; }
    if (j.poContract && j.poContract.imagePath && window.PMP.Supabase.deletePoImage) {
      try { await window.PMP.Supabase.deletePoImage(j.poContract.imagePath); } catch (_) {}
    }
    var blobs = await processImage(file);
    const res = await window.PMP.Supabase.uploadPoImage(jobId, blobs);
    if (!j.poContract || typeof j.poContract !== 'object') j.poContract = {};
    j.poContract.imageUrl = res.url;
    j.poContract.imagePath = res.path;
    if (res.thumbUrl) j.poContract.thumbUrl = res.thumbUrl;
    j.poContract.uploadedAt = new Date().toISOString();
    await Storage.saveJob(j);
    updatePoImageUI(j);
    updatePanelPoStar(j);
    if (typeof toast === 'function') toast('PO image uploaded');
  } catch (e) {
    console.error('[PMP] PO image upload failed', e);
    if (typeof toastError === 'function') toastError(e && e.message ? e.message : 'Upload failed');
  }
  input.value = '';
}

async function removePoImage() {
  const jobId = S.editId;
  if (!jobId) return;
  const j = S.jobs.find(function (x) { return x.id === jobId; });
  if (!j || !j.poContract || !j.poContract.imagePath) return;
  const path = j.poContract.imagePath;
  try {
    if (window.PMP && window.PMP.Supabase && typeof window.PMP.Supabase.deletePoImage === 'function') {
      await window.PMP.Supabase.deletePoImage(path);
    }
    delete j.poContract.imageUrl;
    delete j.poContract.imagePath;
    await Storage.saveJob(j);
    updatePoImageUI(j);
    updatePanelPoStar(j);
    if (typeof toast === 'function') toast('PO image removed');
  } catch (e) {
    console.error('[PMP] PO image remove failed', e);
    if (typeof toastError === 'function') toastError(e && e.message ? e.message : 'Remove failed');
  }
}

function clearFields() {
  FIELD_MAP.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el) return;
    if (f.type === 'select') el.selectedIndex = 0;
    else el.value = '';
  });
  document.getElementById('jOv').value = '';
  if (typeof PO_CONTRACT_FIELDS !== 'undefined') {
    PO_CONTRACT_FIELDS.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) el.value = '';
    });
  }
}

function calcOv() {
  const v = parseInt(document.getElementById('jQty').value) || 0;
  document.getElementById('jOv').value = v ? Math.ceil(v * 1.1).toLocaleString() : '';
}

// ============================================================
// SAVE JOB — use findDuplicateJob from core
// ============================================================
async function saveJob() {
  const cat = document.getElementById('jCat').value.trim().toUpperCase();
  const artist = document.getElementById('jArtist').value.trim();
  const album = document.getElementById('jAlbum') ? document.getElementById('jAlbum').value.trim() : '';
  if (!cat && !artist) { toast('CATALOG # OR ARTIST REQUIRED'); return; }

  if (!S.editId) {
    const dupes = findDuplicateJob(S.jobs.filter(j => !isJobArchived(j)), cat, artist, album, S.editId || undefined);
    if (dupes.length > 0) {
      const existing = dupes[0];
      openConfirm(
        'JOB ALREADY EXISTS',
        `${existing.catalog || ''} · ${existing.artist || ''} · ${existing.album || ''} is already in the system (status: ${(existing.status || 'unknown').toUpperCase()}).`,
        () => {
          closeConfirm();
          openPanel(existing.id);
        }
      );
      const confOk = document.getElementById('confOk');
      if (confOk) confOk.textContent = 'OPEN EXISTING';
      return;
    }
  }

  const job = { id: S.editId || 'j' + Date.now() };

  FIELD_MAP.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el) return;
    let val = el.value;
    if (f.type === 'text' && f.transform === 'upper') val = val.trim().toUpperCase();
    else if (f.type === 'text') val = val.trim();
    job[f.key] = val;
  });

  job.assets = JSON.parse(JSON.stringify(curAssets));

  job.poContract = {};
  if (typeof PO_CONTRACT_FIELDS !== 'undefined') {
    PO_CONTRACT_FIELDS.forEach(function (f) {
      const el = document.getElementById(f.id);
      if (el && el.value !== undefined) job.poContract[f.key] = el.value.trim() || '';
    });
  }
  // Preserve PO image reference so it is not lost on panel save
  if (S.editId) {
    const existingForPo = S.jobs.find(j => j.id === S.editId);
    if (existingForPo && existingForPo.poContract && (existingForPo.poContract.imagePath != null || existingForPo.poContract.imageUrl != null)) {
      if (existingForPo.poContract.imagePath != null) job.poContract.imagePath = existingForPo.poContract.imagePath;
      if (existingForPo.poContract.imageUrl != null) job.poContract.imageUrl = existingForPo.poContract.imageUrl;
    }
  }

  if (S.editId) {
    const existing = S.jobs.find(j => j.id === S.editId);
    job.progressLog = (existing && Array.isArray(existing.progressLog)) ? existing.progressLog : [];
    if (existing) {
      job.archived_at = existing.archived_at || null;
      job.archived_by = existing.archived_by || null;
      job.archive_reason = existing.archive_reason || null;
      if (!job.fulfillment_phase) job.fulfillment_phase = existing.fulfillment_phase || null;
      job.caution = existing.caution || null;
      job.packCard = existing.packCard || null;
    }
    const notesEl = document.getElementById('jNotesInput');
    const assemblyEl = document.getElementById('jAssemblyInput');
    job.notes = (notesEl && notesEl.value !== undefined) ? notesEl.value.trim() : (existing && existing.notes != null ? existing.notes : job.notes);
    job.assembly = (assemblyEl && assemblyEl.value !== undefined) ? assemblyEl.value.trim() : (existing && existing.assembly != null ? existing.assembly : job.assembly);
    /* Preserve append-only logs so notes/assembly persist across panel save */
    job.notesLog = (existing && Array.isArray(existing.notesLog)) ? existing.notesLog : [];
    job.assemblyLog = (existing && Array.isArray(existing.assemblyLog)) ? existing.assemblyLog : [];
    const i = S.jobs.findIndex(j => j.id === S.editId);
    if (i >= 0) S.jobs[i] = job;
  } else {
    job.progressLog = [];
    job.notesLog = [];
    job.assemblyLog = [];
    S.jobs.unshift(job);
  }
  ensureJobProgressLog(job);

  if (job.press && String(job.press).trim()) {
    const matchPress = S.presses.find(p => p.name === (job.press || '').trim());
    if (matchPress) setAssignment(matchPress.id, job.id);
  } else {
    releasePressByJob(job.id);
  }

  try {
    await Promise.all([Storage.savePresses(S.presses), Storage.saveJob(job)]);
    closePanel();
    renderAll();
    toast(S.editId ? 'JOB UPDATED' : 'JOB ADDED');
  } catch (e) {
    if (typeof toastError === 'function') toastError(e && (e.message || e.error) ? String(e.message || e.error) : 'Save failed');
    else toast('Save failed');
  }
}

// ============================================================
// RSP Icon Zone — WRENCH popup (job-level process exception)
// ============================================================
function togglePanelCaution() {
  var jobId = S.editId;
  if (!jobId) return;
  var j = S.jobs.find(function (x) { return x.id === jobId; });
  if (!j) return;
  openCautionPopup(j.id);
}

function openCautionPopup(jobId) {
  var el = document.getElementById('cautionPopup');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cautionPopup';
    el.className = 'caution-popup';
    el.innerHTML = '<div class="caution-popup-card"></div>';
    el.onclick = function (e) { if (e.target === el) closeCautionPopup(); };
    document.body.appendChild(el);
  }
  var opts = CAUTION_REASONS.filter(function (r) { return r.v !== ''; }).map(function (r) {
    return '<option value="' + r.v + '">' + r.l + '</option>';
  }).join('');
  var card = el.querySelector('.caution-popup-card');
  card.innerHTML =
    '<div class="caution-popup-header" id="cautionPopupHeaderLink" role="button" tabindex="0" title="View in NOTES">' +
      '<span class="caution-popup-tri">' + WRENCH_ICON + '</span>' +
      '<span class="caution-popup-title">WRENCH</span>' +
    '</div>' +
    '<div class="caution-popup-sub">Flag this job for intervention</div>' +
    '<select class="caution-popup-select" id="cautionPopupReason">' + opts + '</select>' +
    '<input class="caution-popup-input" id="cautionPopupText" placeholder="Context note (optional)">' +
    '<button type="button" class="caution-popup-btn" id="cautionPopupAdd">ADD</button>' +
    '<button type="button" class="caution-popup-cancel" onclick="closeCautionPopup()">Cancel</button>';
  el.dataset.jobId = jobId;
  var headerLink = document.getElementById('cautionPopupHeaderLink');
  if (headerLink) headerLink.onclick = function () { closeCautionPopup(); closePanel(); goToNotesWithFilter(jobId); };
  var reasonEl = document.getElementById('cautionPopupReason');
  var textEl = document.getElementById('cautionPopupText');
  if (reasonEl) reasonEl.selectedIndex = 0;
  if (textEl) textEl.value = '';
  var addBtn = document.getElementById('cautionPopupAdd');
  if (addBtn) addBtn.onclick = function () { submitCautionPopup(); };
  if (textEl) textEl.onkeydown = function (e) { if (e.key === 'Enter') submitCautionPopup(); };
  el.classList.add('open');
  if (reasonEl) reasonEl.focus();
}

function closeCautionPopup() {
  var el = document.getElementById('cautionPopup');
  if (el) el.classList.remove('open');
}

function submitCautionPopup() {
  var el = document.getElementById('cautionPopup');
  if (!el) return;
  var jobId = el.dataset.jobId;
  var reasonEl = document.getElementById('cautionPopupReason');
  var textEl = document.getElementById('cautionPopupText');
  var reason = reasonEl ? reasonEl.value : '';
  var text = textEl ? textEl.value.trim() : '';
  if (!reason) { toast('Select a reason'); return; }
  setCaution(jobId, reason, text);
  closeCautionPopup();
  closePanel();
  goToNotesWithFilter(jobId);
}

// ============================================================
// JOB-LEVEL WRENCH — set / clear process exception overlay
// ============================================================
async function setCaution(jobId, reason, text) {
  const j = S.jobs.find(function (x) { return x.id === jobId; });
  if (!j) return;
  if (!reason) {
    j.caution = null;
    try { await Storage.saveJob(j); } catch (e) { toastError('Caution save failed'); }
    renderAll();
    toast('WRENCH cleared');
    return;
  }
  var ts = new Date().toISOString();
  var trimmed = (text || '').trim();
  j.caution = { reason: reason, since: ts, text: trimmed };
  if (trimmed) {
    ensureNotesLog(j);
    var person = window.PMP?.userProfile?.display_name || (S.mode === 'admin' ? 'Admin' : 'Operator');
    j.notesLog.push({ text: trimmed, person: person, timestamp: ts, cautionContext: true, wrenchReason: reason, wrenchLabel: cautionReasonLabel(reason).toUpperCase() });
  }
  try { await Storage.saveJob(j); } catch (e) { toastError('Caution save failed'); }
  renderAll();
  toast('WRENCH: ' + cautionReasonLabel(reason));
}

function clearCaution(jobId) {
  setCaution(jobId, '', '');
}

/* PURGATORY: toggleShipAchtung, showShipAchtungComposer, hideShipAchtungComposer,
   confirmShipAchtung, cancelShipAchtung removed (2026-03-06).
   WRENCH popup (RSP) replaces this flow. See docs/purgatory-protocol.md. */
function hideShipAchtungComposer() {} // no-op stub; called from setLogMode cleanup path

// ============================================================
// FULFILLMENT PHASE — set from RSP panel dropdown
// ============================================================
async function setFulfillmentPhase(jobId, phase) {
  const j = S.jobs.find(function (x) { return x.id === jobId; });
  if (!j) return;
  j.fulfillment_phase = phase || null;
  try { await Storage.saveJob(j); } catch (e) { toastError('Phase save failed'); }
  renderAll();
  toast(phase ? fulfillmentPhaseLabel(phase) : 'Phase cleared');
}

// ============================================================
// ARCHIVE — soft remove from active views
// ============================================================
async function archiveJob() {
  const j = S.jobs.find(x => x.id === S.editId);
  if (!j) return;
  if (j.archived_at) { toast('Job is already archived'); return; }
  const who = (typeof getAuthRole === 'function' && window.PMP?.userProfile?.email) ? window.PMP.userProfile.email : (window.PMP?.userProfile?.display_name || 'unknown');
  const payload = Object.assign({}, j, {
    archived_at: new Date().toISOString(),
    archived_by: who,
    archive_reason: ''
  });
  try {
    await Storage.saveJob(payload);
    j.archived_at = payload.archived_at;
    j.archived_by = payload.archived_by;
    j.archive_reason = payload.archive_reason;
    if (typeof releasePressByJob === 'function') releasePressByJob(j.id);
    if (S.presses && S.presses.length) await Storage.savePresses(S.presses);
    closePanel();
    renderAll();
    toast('Job archived');
  } catch (e) {
    console.error('[PMP] Archive failed', e);
    if (typeof setSyncState === 'function') setSyncState('error', { toast: 'ARCHIVE FAILED' });
    if (typeof toastError === 'function') toastError(e?.message || 'Archive failed. Ensure DB has archived_at, archived_by, archive_reason columns.');
  }
}

// ============================================================
// RESTORE — un-archive job (clear archive fields)
// ============================================================
async function restoreJob() {
  const j = S.jobs.find(x => x.id === S.editId);
  if (!j) return;
  if (!j.archived_at) { toast('Job is not archived'); return; }
  const payload = Object.assign({}, j, { archived_at: null, archived_by: null, archive_reason: null });
  try {
    await Storage.saveJob(payload);
    j.archived_at = null;
    j.archived_by = null;
    j.archive_reason = null;
    if (S.presses && S.presses.length) await Storage.savePresses(S.presses);
    closePanel();
    renderAll();
    toast('Job restored');
  } catch (e) {
    console.error('[PMP] Restore failed', e);
    if (typeof setSyncState === 'function') setSyncState('error', { toast: 'RESTORE FAILED' });
    if (typeof toastError === 'function') toastError(e?.message || 'Restore failed.');
  }
}

// ============================================================
// DELETE — confirm dialog (admin-only, hard delete)
// ============================================================
let confCb = null;

function confirmDel() {
  const j = S.jobs.find(x => x.id === S.editId);
  openConfirm('DELETE JOB?', `REMOVE ${j?.catalog || 'this job'} — ${j?.artist || ''}? CANNOT BE UNDONE.`, async () => {
    const id = S.editId;
    try {
      await Storage.deleteJob(id);
      releasePressByJob(id);
      S.jobs = S.jobs.filter(x => x.id !== id);
      closePanel();
      renderAll();
      toast('JOB DELETED');
    } catch (e) {
      if (typeof toastError === 'function') toastError(e?.message || 'Delete failed');
      throw e;
    }
  });
}

function openConfirm(title, msg, cb) {
  document.getElementById('confTitle').textContent = title;
  document.getElementById('confMsg').textContent = msg;
  confCb = cb;
  document.getElementById('confirmWrap').classList.add('open');
}

function closeConfirm() {
  document.getElementById('confirmWrap').classList.remove('open');
  confCb = null;
  const confOk = document.getElementById('confOk');
  if (confOk) confOk.textContent = 'CONFIRM';
}
document.getElementById('confOk').addEventListener('click', () => {
  if (confCb) Promise.resolve(confCb()).then(() => closeConfirm()).catch((e) => {
    if (typeof toastError === 'function') toastError(e?.message || 'Action failed');
  });
});

// ============================================================
// NEW JOB CHOOSER (FAB +)
// ============================================================
function openNewJobChooser() {
  const wrap = document.getElementById('newJobChooserWrap');
  if (wrap) wrap.classList.add('on');
}
function closeNewJobChooser() {
  const wrap = document.getElementById('newJobChooserWrap');
  if (wrap) wrap.classList.remove('on');
}

// ============================================================
// IMPORT JOB ENTRY (CSV / Photo / PDF → review shell)
// ============================================================
// Phase 1 review fields (key = job field, label = display). Order matches review table.
const IMPORT_REVIEW_FIELDS = [
  { key: 'catalog', label: 'Catalog' },
  { key: 'artist', label: 'Artist' },
  { key: 'album', label: 'Album / Title' },
  { key: 'qty', label: 'Quantity' },
  { key: 'format', label: 'Format' },
  { key: 'color', label: 'Color' },
  { key: 'weight', label: 'Weight' },
  { key: 'sleeve', label: 'Sleeve Type' },
  { key: 'jacket', label: 'Jacket Type' },
  { key: 'cpl', label: 'UPC' },
  { key: 'due', label: 'Due Date' },
  { key: 'location', label: 'Shipping / Destination' },
];

// Status: found | needs_review | not_found | conflict
// Row action: create | update. When update, updateJobId must be set for confirm.
function buildEmptyExtractedRow(rowIndex) {
  const fields = {};
  IMPORT_REVIEW_FIELDS.forEach(({ key }) => {
    fields[key] = { value: '', status: 'not_found', ignored: false, userEdited: false };
  });
  return { rowIndex, includeInCreate: true, action: 'create', updateJobId: null, fields };
}

// Phase 1: best-effort extraction from raw text (PDF/OCR). Conservative: prefer needs_review.
// Returns { [fieldKey]: { value, status } } for fields that were extracted. Does not write to job.
function extractFieldsFromText(text) {
  const out = {};
  if (typeof text !== 'string' || !text.trim()) return out;
  const t = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = t.split(/\n/).map(l => l.trim()).filter(Boolean);

  function matchLine(patterns, key, status) {
    for (const line of lines) {
      for (const { regex, group } of patterns) {
        const m = line.match(regex);
        if (m && m[group]) {
          out[key] = { value: (m[group] || '').trim(), status: status || 'needs_review' };
          return;
        }
      }
    }
  }

  // Catalog: label then value (needs_review)
  matchLine(
    [
      { regex: /catalog\s*#?\s*:?\s*(.+)/i, group: 1 },
      { regex: /cat\.?\s*:?\s*(.+)/i, group: 1 },
    ],
    'catalog',
    'needs_review'
  );
  // Artist (needs_review)
  matchLine([{ regex: /artist\s*:?\s*(.+)/i, group: 1 }], 'artist', 'needs_review');
  // Album / title (needs_review)
  matchLine(
    [
      { regex: /album\s*\/?\s*title\s*:?\s*(.+)/i, group: 1 },
      { regex: /title\s*:?\s*(.+)/i, group: 1 },
      { regex: /album\s*:?\s*(.+)/i, group: 1 },
    ],
    'album',
    'needs_review'
  );
  // Quantity (needs_review)
  matchLine(
    [
      { regex: /qty\.?\s*:?\s*(\d+)/i, group: 1 },
      { regex: /quantity\s*:?\s*(\d+)/i, group: 1 },
    ],
    'qty',
    'needs_review'
  );
  // Format (needs_review)
  matchLine(
    [{ regex: /format\s*:?\s*(\S+)/i, group: 1 }, { regex: /(\d+LP|LP\s*\d+)/i, group: 1 }],
    'format',
    'needs_review'
  );
  // Color (needs_review)
  matchLine([{ regex: /color\s*:?\s*(\S+)/i, group: 1 }, { regex: /colour\s*:?\s*(\S+)/i, group: 1 }], 'color', 'needs_review');
  // Weight (needs_review)
  matchLine(
    [
      { regex: /weight\s*:?\s*(\d+\s*g(?:ram)?s?)/i, group: 1 },
      { regex: /(\d+)\s*g(?:ram)?s?(?=\s|$|,)/i, group: 1 },
    ],
    'weight',
    'needs_review'
  );
  // Sleeve (needs_review)
  matchLine([{ regex: /sleeve\s*:?\s*(\S+)/i, group: 1 }], 'sleeve', 'needs_review');
  // Jacket (needs_review)
  matchLine([{ regex: /jacket\s*:?\s*(\S+)/i, group: 1 }], 'jacket', 'needs_review');
  // UPC / barcode: prefer labeled; 12–14 digits (found when labeled, else needs_review)
  for (const line of lines) {
    const labeled = line.match(/(?:upc|barcode|cpl)\s*:?\s*(\d{12,14})/i);
    if (labeled && labeled[1]) {
      out.cpl = { value: labeled[1].trim(), status: 'found' };
      break;
    }
    const bare = line.match(/\b(\d{12,14})\b/);
    if (bare && bare[1]) {
      out.cpl = { value: bare[1].trim(), status: 'needs_review' };
      break;
    }
  }
  // Due date (needs_review)
  matchLine(
    [
      { regex: /due\s*(?:date)?\s*:?\s*([\d/\-]+)/i, group: 1 },
      { regex: /due\s*:?\s*(.+?)(?=\s|$)/i, group: 1 },
    ],
    'due',
    'needs_review'
  );
  // Shipping / destination (needs_review)
  matchLine(
    [
      { regex: /shipping\s*:?\s*(.+)/i, group: 1 },
      { regex: /destination\s*:?\s*(.+)/i, group: 1 },
      { regex: /ship\s*to\s*:?\s*(.+)/i, group: 1 },
    ],
    'location',
    'needs_review'
  );

  return out;
}

// Build one extracted row from parsed fields (from extractFieldsFromText). Missing keys = not_found.
function buildExtractedRowFromParsedFields(parsed, rowIndex) {
  const fields = {};
  IMPORT_REVIEW_FIELDS.forEach(({ key }) => {
    const p = parsed[key];
    if (p && (p.value || '').trim() !== '') {
      fields[key] = { value: String(p.value).trim(), status: p.status || 'needs_review', ignored: false, userEdited: false };
    } else {
      fields[key] = { value: '', status: 'not_found', ignored: false, userEdited: false };
    }
  });
  return { rowIndex: rowIndex ?? 0, includeInCreate: true, action: 'create', updateJobId: null, fields };
}

// Lazy-load a script by URL; resolves when loaded, rejects on error. Caches the promise.
var _scriptCache = {};
function loadScript(url) {
  if (_scriptCache[url]) return _scriptCache[url];
  _scriptCache[url] = new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = url;
    s.onload = resolve;
    s.onerror = function () { delete _scriptCache[url]; reject(new Error('Failed to load ' + url)); };
    document.head.appendChild(s);
  });
  return _scriptCache[url];
}

// Extract raw text from PDF (first page only in phase 1). Lazy-loads pdf.js on demand.
function extractTextFromPdf(file) {
  if (!file) return Promise.resolve('');
  var pdfUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
  return loadScript(pdfUrl)
    .then(function () {
      var lib = window.pdfjsLib;
      if (!lib) return '';
      if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      }
      return file.arrayBuffer().then(function (buf) {
        return lib.getDocument(buf).promise;
      }).then(function (doc) {
        return doc.getPage(1);
      }).then(function (page) {
        return page.getTextContent();
      }).then(function (content) {
        var items = (content && content.items) || [];
        return items.map(function (i) { return i.str || ''; }).join(' ');
      });
    })
    .catch(function () { return ''; });
}

// Extract text from image via OCR (Tesseract). Lazy-loads tesseract.js on demand.
function extractTextFromImage(file) {
  if (!file) return Promise.resolve('');
  var tessUrl = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  return loadScript(tessUrl)
    .then(function () {
      var T = window.Tesseract;
      if (!T) return '';
      return T.recognize(file).then(function (r) {
        return (r && r.data && r.data.text) ? r.data.text : '';
      });
    })
    .catch(function () { return ''; });
}

// CSV header (lowercase) -> job field key
function mapCsvHeaderToKey(h) {
  const t = (h || '').trim().toLowerCase();
  const map = {
    catalog: 'catalog', matrix: 'catalog', cat: 'catalog',
    artist: 'artist', 'artist name': 'artist',
    album: 'album', title: 'album', 'album/title': 'album',
    qty: 'qty', quantity: 'qty', 'qty ordered': 'qty',
    format: 'format', 'vinyl format': 'format',
    color: 'color', colour: 'color',
    weight: 'weight',
    sleeve: 'sleeve', 'sleeve type': 'sleeve',
    jacket: 'jacket', 'jacket type': 'jacket',
    upc: 'cpl', cpl: 'cpl', barcode: 'cpl',
    due: 'due', 'due date': 'due',
    location: 'location', shipping: 'location', destination: 'location',
  };
  return map[t] || null;
}

function parseCSVToExtractedRows(text) {
  const lines = typeof parseCSVLines === 'function' ? parseCSVLines(text) : [];
  if (lines.length < 2) return [];
  const rawHeaders = lines[0].map(h => (h || '').trim());
  const keyToCol = {};
  rawHeaders.forEach((h, colIdx) => {
    const k = mapCsvHeaderToKey(h);
    if (k && keyToCol[k] === undefined) keyToCol[k] = colIdx;
  });
  const rows = [];
  const openJobs = (S.jobs || []).filter(j => !isJobArchived(j));
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i];
    const fields = {};
    IMPORT_REVIEW_FIELDS.forEach(({ key }) => {
      const colIdx = keyToCol[key];
      const raw = (colIdx >= 0 && vals[colIdx] != null ? String(vals[colIdx]) : '').trim();
      let status = raw ? 'found' : 'not_found';
      if (key === 'catalog' && raw && openJobs.some(j => (j.catalog || '').toUpperCase() === raw.toUpperCase())) status = 'conflict';
      fields[key] = { value: raw, status, ignored: false, userEdited: false };
    });
    rows.push({ rowIndex: i - 1, includeInCreate: true, action: 'create', updateJobId: null, fields });
  }
  return rows;
}

function triggerImportJobFile(type) {
  const id = type === 'csv' ? 'importJobCsvInput' : type === 'photo' ? 'importJobPhotoInput' : 'importJobPdfInput';
  const el = document.getElementById(id);
  if (el) el.click();
}

function onImportJobFileSelected(input, type) {
  const file = input && input.files && input.files[0];
  input.value = '';
  if (!file) return;
  startImportReview(type, file);
}

function startImportReview(type, file) {
  const sourceRef = {
    type,
    name: file.name || 'Unknown file',
    capturedAt: new Date().toISOString(),
  };
  if (type === 'csv') {
    const r = new FileReader();
    r.onload = function (e) {
      const text = e.target && e.target.result;
      const extractedRows = typeof text === 'string' ? parseCSVToExtractedRows(text) : [];
      S.importSession = { type, sourceRef, status: 'reviewing', extractedRows };
      openImportReview();
    };
    r.onerror = function () {
      if (typeof toast === 'function') toast('Could not read file.');
    };
    r.readAsText(file);
    return;
  }
  // Photo / PDF: best-effort extraction into review only (no direct job write)
  if (typeof toast === 'function') toast('Extracting…');
  const extractText = type === 'pdf' ? extractTextFromPdf(file) : extractTextFromImage(file);
  extractText
    .then(function (rawText) {
      const parsed = extractFieldsFromText(rawText);
      const row = Object.keys(parsed).length ? buildExtractedRowFromParsedFields(parsed, 0) : buildEmptyExtractedRow(0);
      S.importSession = {
        type,
        sourceRef,
        status: 'reviewing',
        extractedRows: [row],
      };
      openImportReview();
    })
    .catch(function () {
      S.importSession = {
        type,
        sourceRef,
        status: 'reviewing',
        extractedRows: [buildEmptyExtractedRow(0)],
      };
      openImportReview();
      if (typeof toast === 'function') toast('Could not extract text; add details manually.');
    });
}

function openImportReview() {
  const wrap = document.getElementById('importReviewWrap');
  if (wrap) wrap.classList.add('on');
  renderImportReview();
}

function closeImportReview() {
  const wrap = document.getElementById('importReviewWrap');
  if (wrap) wrap.classList.remove('on');
  S.importSession = null;
}

function setImportReviewFieldIgnore(rowIndex, fieldKey, ignored) {
  const session = S.importSession;
  if (!session || !session.extractedRows || !session.extractedRows[rowIndex]) return;
  const field = session.extractedRows[rowIndex].fields[fieldKey];
  if (field) field.ignored = !!ignored;
  renderImportReview();
}

function setImportReviewFieldValue(rowIndex, fieldKey, value) {
  const session = S.importSession;
  if (!session || !session.extractedRows || !session.extractedRows[rowIndex]) return;
  const field = session.extractedRows[rowIndex].fields[fieldKey];
  if (field) {
    field.value = value;
    field.userEdited = true;
  }
  renderImportReview();
}

function setImportReviewRowInclude(rowIndex, include) {
  const session = S.importSession;
  if (!session || !session.extractedRows || !session.extractedRows[rowIndex]) return;
  session.extractedRows[rowIndex].includeInCreate = !!include;
  renderImportReview();
}

function setImportReviewRowAction(rowIndex, action, updateJobId) {
  const session = S.importSession;
  if (!session || !session.extractedRows || !session.extractedRows[rowIndex]) return;
  session.extractedRows[rowIndex].action = action === 'update' ? 'update' : 'create';
  session.extractedRows[rowIndex].updateJobId = (action === 'update' && updateJobId) ? String(updateJobId) : null;
  renderImportReview();
}

function renderImportReview() {
  const titleEl = document.getElementById('importReviewTitle');
  const bodyEl = document.getElementById('importReviewBody');
  const btnEl = document.getElementById('importReviewConfirmBtn');
  if (!bodyEl) return;
  const session = S.importSession;
  if (!session) return;
  const typeLabel = session.type === 'csv' ? 'CSV' : session.type === 'photo' ? 'Photo' : 'PDF';
  if (titleEl) titleEl.textContent = 'Review import';
  const name = session.sourceRef && session.sourceRef.name ? session.sourceRef.name : '—';
  const rows = Array.isArray(session.extractedRows) ? session.extractedRows : [];
  const openJobs = typeof sortJobsByCatalogAsc === 'function'
    ? sortJobsByCatalogAsc((S.jobs || []).filter(function (j) { return !isJobArchived(j); }))
    : (S.jobs || []).filter(function (j) { return !isJobArchived(j); });
  const toProcess = rows.filter(function (r) {
    return r.includeInCreate && (r.action !== 'update' || r.updateJobId);
  });
  const hasIncompleteUpdate = rows.some(function (r) {
    return r.includeInCreate && r.action === 'update' && !r.updateJobId;
  });
  const createCount = toProcess.filter(function (r) { return r.action === 'create'; }).length;
  const updateCount = toProcess.filter(function (r) { return r.action === 'update'; }).length;

  let html = `
    <p class="import-review-sub">${typeLabel}: <strong>${escapeHtml(name)}</strong></p>
    <p class="import-review-msg">Review and edit values below. Choose Create new job or Update existing. Ignore fields you do not want applied. No changes are saved until you confirm.</p>
  `;
  rows.forEach(function (row, ri) {
    const action = row.action || 'create';
    const updateJobId = row.updateJobId || '';
    const existingJob = (action === 'update' && updateJobId) ? (S.jobs || []).find(function (j) { return j.id === updateJobId; }) : null;
    html += '<div class="import-review-row-block" data-row="' + ri + '">';
    html += '<div class="import-review-row-head">';
    html += '<label class="import-review-include-label"><input type="checkbox" class="import-review-include-cb" ' + (row.includeInCreate ? 'checked' : '') + ' onchange="setImportReviewRowInclude(' + ri + ', this.checked)"> Include this row</label>';
    html += '<span class="import-review-row-title">Row ' + (ri + 1) + '</span>';
    html += '<div class="import-review-row-action">';
    html += '<label class="import-review-action-option"><input type="radio" name="ir-action-' + ri + '" value="create" ' + (action === 'create' ? 'checked' : '') + ' onchange="setImportReviewRowAction(' + ri + ', \'create\', null)"> Create new job</label>';
    html += '<label class="import-review-action-option"><input type="radio" name="ir-action-' + ri + '" value="update" ' + (action === 'update' ? 'checked' : '') + ' onchange="setImportReviewRowAction(' + ri + ', \'update\', null)"> Update existing</label>';
    if (action === 'update') {
      html += '<select class="fi import-review-job-select" onchange="setImportReviewRowAction(' + ri + ', \'update\', this.value)">';
      html += '<option value="">Choose job…</option>';
      openJobs.forEach(function (j) {
        const lab = (j.catalog || '—') + ' · ' + (j.artist || '—');
        html += '<option value="' + escapeHtml(j.id) + '" ' + (j.id === updateJobId ? 'selected' : '') + '>' + escapeHtml(lab) + '</option>';
      });
      html += '</select>';
    }
    html += '</div></div>';
    html += '<table class="import-review-tbl"><thead><tr><th>Field</th><th>Value</th><th>Status</th><th></th></tr></thead><tbody>';
    IMPORT_REVIEW_FIELDS.forEach(function (_) {
      const key = _.key;
      const label = _.label;
      const f = row.fields[key];
      if (!f) return;
      const existingVal = existingJob ? String(existingJob[key] != null ? existingJob[key] : '') : '';
      const importedVal = (f.value || '').trim();
      const isConflict = action === 'update' && existingJob && (existingVal.trim() !== importedVal);
      const statusCls = isConflict ? 'ir-status-conflict' : (f.status === 'conflict' ? 'ir-status-conflict' : f.status === 'found' ? 'ir-status-found' : f.status === 'needs_review' ? 'ir-status-review' : 'ir-status-notfound');
      const statusLabel = isConflict ? 'Conflict' : (f.status === 'conflict' ? 'Conflict' : f.status === 'found' ? 'Found' : f.status === 'needs_review' ? 'Review' : 'Not found');
      const ignored = f.ignored;
      const inputVal = escapeHtml((f.value || '').replace(/"/g, '&quot;'));
      const existingLine = isConflict ? '<div class="import-review-existing">Existing: ' + escapeHtml(existingVal || '—') + '</div>' : '';
      html += '<tr class="' + (ignored ? 'import-review-row-ignored' : '') + '">';
      html += '<td class="import-review-label">' + escapeHtml(label) + '</td>';
      html += '<td><input type="text" class="fi import-review-input" value="' + inputVal + '" placeholder="—" onchange="setImportReviewFieldValue(' + ri + ', \'' + key + '\', this.value)" ' + (ignored ? 'readonly' : '') + '>' + existingLine + '</td>';
      html += '<td><span class="import-review-status ' + statusCls + '">' + statusLabel + '</span></td>';
      html += '<td><button type="button" class="btn ghost import-review-ignore-btn" onclick="setImportReviewFieldIgnore(' + ri + ', \'' + key + '\', ' + !ignored + ')">' + (ignored ? 'Use' : 'Ignore') + '</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  });
  bodyEl.innerHTML = html;

  if (btnEl) {
    btnEl.disabled = toProcess.length === 0 || hasIncompleteUpdate;
    if (hasIncompleteUpdate) {
      btnEl.textContent = 'Select job for update row(s)';
    } else if (toProcess.length === 0) {
      btnEl.textContent = 'CONFIRM (0 rows)';
    } else if (createCount && updateCount) {
      btnEl.textContent = 'CONFIRM (' + createCount + ' create, ' + updateCount + ' update)';
    } else if (updateCount) {
      btnEl.textContent = 'UPDATE ' + updateCount + ' JOB' + (updateCount !== 1 ? 'S' : '');
    } else {
      btnEl.textContent = 'CREATE ' + createCount + ' JOB' + (createCount !== 1 ? 'S' : '');
    }
  }
}

async function confirmImportReview() {
  const session = S.importSession;
  if (!session || !Array.isArray(session.extractedRows)) return;
  const toProcess = session.extractedRows.filter(function (r) {
    return r.includeInCreate && (r.action !== 'update' || r.updateJobId);
  });
  if (toProcess.length === 0) return;
  const openJobs = (S.jobs || []).filter(function (j) { return !isJobArchived(j); });
  let created = 0;
  let updated = 0;
  for (let i = 0; i < toProcess.length; i++) {
    const row = toProcess[i];
    if (row.action === 'update' && row.updateJobId) {
      const job = openJobs.find(function (j) { return j.id === row.updateJobId; });
      if (!job) continue;
      IMPORT_REVIEW_FIELDS.forEach(function (_) {
        const key = _.key;
        const f = row.fields[key];
        if (!f || f.ignored) return;
        const v = (f.value || '').trim();
        if (key === 'qty') job.qty = v;
        else if (key === 'due') job.due = v || null;
        else job[key] = v;
      });
      if (!job.poContract || typeof job.poContract !== 'object') job.poContract = {};
      job.poContract.sourceImport = session.sourceRef || {};
      try {
        await Storage.saveJob(job);
        updated++;
      } catch (e) {
        console.error('[PMP] Import update failed', e);
      }
      continue;
    }
    const job = {
      id: 'j' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 6),
      status: 'queue',
      press: '',
      notes: '',
      assembly: '',
      assets: {},
      progressLog: [],
      notesLog: [],
      assemblyLog: [],
    };
    IMPORT_REVIEW_FIELDS.forEach(function (_) {
      const key = _.key;
      const f = row.fields[key];
      if (!f || f.ignored) return;
      const v = (f.value || '').trim();
      if (key === 'qty') job.qty = v;
      else if (key === 'due') job.due = v || null;
      else job[key] = v;
    });
    if (!job.poContract || typeof job.poContract !== 'object') job.poContract = {};
    job.poContract.sourceImport = session.sourceRef || {};
    const cat = (job.catalog || '').toUpperCase();
    const dupes = openJobs.filter(function (j) { return (j.catalog || '').toUpperCase() === cat && cat; });
    if (dupes.length > 0 && !(job.artist || job.album)) continue;
    ensureJobProgressLog(job);
    S.jobs.unshift(job);
    try {
      await Storage.saveJob(job);
      created++;
    } catch (e) {
      console.error('[PMP] Import create failed', e);
    }
  }
  closeImportReview();
  var msg = [];
  if (created) msg.push(created + ' JOB' + (created !== 1 ? 'S' : '') + ' CREATED');
  if (updated) msg.push(updated + ' JOB' + (updated !== 1 ? 'S' : '') + ' UPDATED');
  if (typeof toast === 'function') toast(msg.length ? msg.join(' · ') : 'No changes saved.');
  if (created || updated) renderAll();
}

// ============================================================
// NEW JOB WIZARD
// ============================================================
const WIZARD_STEP_NAMES = ['Identity', 'Production', 'Spec', 'Ops', 'Review'];
let wizardStep = 1;
let wizardData = {};
let pendingWizardJob = null;
let duplicateExistingJob = null;

function openWizard() {
  wizardStep = 1;
  wizardData = {};
  pendingWizardJob = null;
  duplicateExistingJob = null;
  const wrap = document.getElementById('wizardWrap');
  if (wrap) wrap.classList.add('on');
  renderWizardStep();
}
function closeWizard() {
  const wrap = document.getElementById('wizardWrap');
  if (wrap) wrap.classList.remove('on');
}

function getWizardEl(id) { return document.getElementById(id); }
function getWizardVal(id) { const el = getWizardEl(id); return el ? el.value.trim() : ''; }

function renderWizardStep() {
  const titleEl = document.getElementById('wizardTitle');
  const bodyEl = document.getElementById('wizardBody');
  const footEl = document.getElementById('wizardFoot');
  if (!bodyEl || !footEl) return;
  if (titleEl) titleEl.textContent = 'Step ' + wizardStep + ' — ' + WIZARD_STEP_NAMES[wizardStep - 1];

  if (wizardStep === 1) {
    bodyEl.innerHTML = `
      <div class="frow c2">
        <div class="fg"><label class="fl">Catalog / Matrix #</label><input class="fi" id="wCatalog" placeholder="e.g. LUNLP3108" value="${(wizardData.catalog || '').replace(/"/g, '&quot;')}"></div>
        <div class="fg"><label class="fl">Artist</label><input class="fi" id="wArtist" placeholder="Artist name" value="${(wizardData.artist || '').replace(/"/g, '&quot;')}"></div>
      </div>
      <div class="fg"><label class="fl">Album</label><input class="fi" id="wAlbum" placeholder="Album title" value="${(wizardData.album || '').replace(/"/g, '&quot;')}"></div>
    `;
    footEl.innerHTML = '<div class="wizard-foot-inner"><button type="button" class="btn ghost" onclick="closeWizard()">Cancel</button><button type="button" class="btn go" onclick="wizardNext()">Next</button></div>';
  } else if (wizardStep === 2) {
    bodyEl.innerHTML = `
      <div class="frow c2">
        <div class="fg"><label class="fl">Status</label><select class="fs" id="wStatus">${STATUS_OPTS.map(o => `<option value="${o.v}" ${(wizardData.status || 'queue') === o.v ? 'selected' : ''}>${o.l}</option>`).join('')}</select></div>
        <div class="fg"><label class="fl">Press</label><select class="fs" id="wPress"><option value="">— Unassigned</option>${PRESS_OPTS.filter(p => p).map(p => `<option value="${p}" ${(wizardData.press || '') === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
      </div>
      <div class="frow c2">
        <div class="fg"><label class="fl">Order Qty</label><input class="fi" type="number" id="wQty" placeholder="500" value="${(wizardData.qty || '').replace(/"/g, '&quot;')}"></div>
        <div class="fg"><label class="fl">Format</label><select class="fs" id="wFormat"><option value="1LP">1LP</option><option value="2LP">2LP (Double)</option><option value='7"'>7" Single</option><option value='7" EP'>7" EP</option></select></div>
      </div>
    `;
    const fmtEl = bodyEl.querySelector('#wFormat');
    if (fmtEl && wizardData.format) fmtEl.value = wizardData.format;
    footEl.innerHTML = '<div class="wizard-foot-inner"><button type="button" class="btn ghost" onclick="wizardBack()">Back</button><button type="button" class="btn go" onclick="wizardNext()">Next</button></div>';
  } else if (wizardStep === 3) {
    bodyEl.innerHTML = `
      <div class="frow c2">
        <div class="fg"><label class="fl">Vinyl Type</label><select class="fs" id="wVinylType"><option value="Black">Black</option><option value="Color">Color</option></select></div>
        <div class="fg"><label class="fl">Color Spec</label><input class="fi" id="wColor" placeholder="e.g. Black" value="${(wizardData.color || '').replace(/"/g, '&quot;')}"></div>
      </div>
      <div class="frow c2">
        <div class="fg"><label class="fl">Weight</label><select class="fs" id="wWeight"><option value="140g">140g</option><option value="150g">150g</option><option value="180g">180g</option></select></div>
        <div class="fg"><label class="fl">Specialty</label><select class="fs" id="wSpecialty"><option value="">None</option><option value="Splatter">Splatter</option><option value="Marble">Marble</option><option value="Swirl">Swirl</option><option value="Picture Disc">Picture Disc</option><option value="Other">Other</option></select></div>
      </div>
    `;
    var v = bodyEl.querySelector('#wVinylType'); if (v && wizardData.vinylType) v.value = wizardData.vinylType;
    var w = bodyEl.querySelector('#wWeight'); if (w && wizardData.weight) w.value = wizardData.weight;
    var s = bodyEl.querySelector('#wSpecialty'); if (s && wizardData.specialty) s.value = wizardData.specialty;
    footEl.innerHTML = '<div class="wizard-foot-inner"><button type="button" class="btn ghost" onclick="wizardBack()">Back</button><button type="button" class="btn go" onclick="wizardNext()">Next</button></div>';
  } else if (wizardStep === 4) {
    bodyEl.innerHTML = `
      <div class="frow c2">
        <div class="fg"><label class="fl">Due Date</label><input class="fi" type="date" id="wDue" value="${(wizardData.due || '').replace(/"/g, '&quot;')}"></div>
        <div class="fg"><label class="fl">Location</label><input class="fi" id="wLocation" placeholder="e.g. Bay 3" value="${(wizardData.location || '').replace(/"/g, '&quot;')}"></div>
      </div>
      <div class="fg"><label class="fl">Client / Label</label><input class="fi" id="wClient" placeholder="Client name" value="${(wizardData.client || '').replace(/"/g, '&quot;')}"></div>
      <div class="fg"><label class="fl">Notes</label><textarea class="fi fta" id="wNotes" rows="2" placeholder="Production notes">${(wizardData.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea></div>
    `;
    footEl.innerHTML = '<div class="wizard-foot-inner"><button type="button" class="btn ghost" onclick="wizardBack()">Back</button><button type="button" class="btn go" onclick="wizardNext()">Next</button></div>';
  } else {
    const cat = wizardData.catalog || '—';
    const art = wizardData.artist || '—';
    const alb = wizardData.album || '—';
    const st = (wizardData.status || 'queue').toUpperCase();
    const pr = wizardData.press || '—';
    const qty = wizardData.qty || '—';
    const fmt = wizardData.format || '—';
    const vt = wizardData.vinylType || '—';
    const cl = wizardData.color || '—';
    const wt = wizardData.weight || '—';
    const spec = wizardData.specialty || '—';
    const due = wizardData.due || '—';
    const loc = wizardData.location || '—';
    const client = wizardData.client || '—';
    const notes = (wizardData.notes || '—').slice(0, 80) + ((wizardData.notes || '').length > 80 ? '…' : '');
    bodyEl.innerHTML = `
      <div class="wizard-review">
        <p><strong>Identity</strong> ${cat} · ${art} · ${alb}</p>
        <p><strong>Production</strong> ${st} · ${pr} · Qty ${qty} · ${fmt}</p>
        <p><strong>Spec</strong> ${vt} · ${cl} · ${wt} · ${spec}</p>
        <p><strong>Ops</strong> Due ${due} · ${loc} · ${client}</p>
        <p><strong>Notes</strong> ${notes}</p>
      </div>
    `;
    footEl.innerHTML = '<div class="wizard-foot-inner"><button type="button" class="btn ghost" onclick="wizardBack()">Back</button><button type="button" class="btn go" onclick="wizardSave()">Save Job</button></div>';
  }
}

function wizardCollectStep() {
  if (wizardStep === 1) {
    wizardData.catalog = getWizardVal('wCatalog');
    wizardData.artist = getWizardVal('wArtist');
    wizardData.album = getWizardVal('wAlbum');
  } else if (wizardStep === 2) {
    wizardData.status = getWizardVal('wStatus') || 'queue';
    wizardData.press = getWizardVal('wPress');
    wizardData.qty = getWizardVal('wQty');
    const fmtEl = getWizardEl('wFormat');
    wizardData.format = fmtEl ? fmtEl.value : '';
  } else if (wizardStep === 3) {
    wizardData.vinylType = getWizardEl('wVinylType') ? getWizardEl('wVinylType').value : '';
    wizardData.color = getWizardVal('wColor');
    wizardData.weight = getWizardEl('wWeight') ? getWizardEl('wWeight').value : '';
    wizardData.specialty = getWizardEl('wSpecialty') ? getWizardEl('wSpecialty').value : '';
  } else if (wizardStep === 4) {
    wizardData.due = getWizardVal('wDue');
    wizardData.location = getWizardVal('wLocation');
    wizardData.client = getWizardVal('wClient');
    wizardData.notes = getWizardEl('wNotes') ? getWizardEl('wNotes').value.trim() : '';
  }
}

function wizardNext() {
  wizardCollectStep();
  if (wizardStep === 1 && !wizardData.catalog && !wizardData.artist) {
    toast('Catalog # or Artist required');
    return;
  }
  if (wizardStep < 5) { wizardStep++; renderWizardStep(); }
}
function wizardBack() {
  if (wizardStep > 1) { wizardStep--; renderWizardStep(); }
}

function wizardSave() {
  wizardCollectStep();
  const cat = (wizardData.catalog || '').trim().toUpperCase();
  const artist = (wizardData.artist || '').trim();
  const album = (wizardData.album || '').trim();
  if (!cat && !artist) { toast('Catalog # or Artist required'); return; }
  const dupes = findDuplicateJob(S.jobs.filter(j => !isJobArchived(j)), cat, artist, album, undefined);
  if (dupes.length > 0) {
    const existing = dupes[0];
    duplicateExistingJob = existing;
    pendingWizardJob = buildWizardJob();
    document.getElementById('duplicateJobMsg').textContent = `${existing.catalog || ''} · ${existing.artist || ''} · ${existing.album || ''} is already in the system (status: ${(existing.status || 'unknown').toUpperCase()}).`;
    document.getElementById('duplicateOpenExistingBtn').onclick = () => { closeDuplicateModal(); closeWizard(); openPanel(duplicateExistingJob.id); };
    document.getElementById('duplicateCreateAnywayBtn').onclick = () => { const j = pendingWizardJob; closeDuplicateModal(); if (j) doWizardSave(j); };
    document.getElementById('duplicateJobWrap').classList.add('on');
    return;
  }
  doWizardSave(buildWizardJob());
}

function buildWizardJob() {
  wizardCollectStep();
  const cat = (wizardData.catalog || '').trim().toUpperCase();
  const artist = (wizardData.artist || '').trim();
  const album = (wizardData.album || '').trim();
  return {
    id: 'j' + Date.now(),
    catalog: cat,
    artist,
    album,
    status: (wizardData.status || 'queue').trim() || 'queue',
    press: (wizardData.press || '').trim(),
    qty: (wizardData.qty || '').trim(),
    format: (wizardData.format || '').trim(),
    vinylType: (wizardData.vinylType || '').trim(),
    color: (wizardData.color || '').trim(),
    weight: (wizardData.weight || '').trim(),
    specialty: (wizardData.specialty || '').trim(),
    due: (wizardData.due || '').trim(),
    location: (wizardData.location || '').trim(),
    client: (wizardData.client || '').trim(),
    notes: (wizardData.notes || '').trim(),
    assembly: '',
    assets: {},
    progressLog: [],
    notesLog: [],
    assemblyLog: [],
  };
}

async function doWizardSave(job) {
  if (!job) return;
  ensureJobProgressLog(job);
  if (job.press && String(job.press).trim()) {
    const matchPress = S.presses.find(p => p.name === (job.press || '').trim());
    if (matchPress) setAssignment(matchPress.id, job.id);
  } else {
    releasePressByJob(job.id);
  }
  S.jobs.unshift(job);
  try {
    await Promise.all([Storage.savePresses(S.presses), Storage.saveJob(job)]);
    closeWizard();
    renderAll();
    toast('JOB ADDED');
  } catch (e) {
    if (typeof toastError === 'function') toastError(e && (e.message || e.error) ? String(e.message || e.error) : 'Save failed');
    else toast('Save failed');
  }
}

function closeDuplicateModal() {
  document.getElementById('duplicateJobWrap').classList.remove('on');
  pendingWizardJob = null;
  duplicateExistingJob = null;
}

// ============================================================
// SUGGESTED STATUS — from progress; apply in panel
// ============================================================
async function applySuggestedStatus(jobId) {
  const j = S.jobs.find(x => x.id === jobId);
  if (!j) return;
  const isAssigned = S.presses.some(p => p.job_id === j.id);
  const suggestion = suggestedStatus(j, isAssigned);
  if (!suggestion) return;
  j.status = suggestion.suggested;
  try { await Storage.saveJob(j); } catch (e) { toastError('Status save failed'); }
  const sel = document.getElementById('jStat');
  if (sel) sel.value = suggestion.suggested;
  const suggestionEl = document.getElementById('panelStatusSuggestion');
  if (suggestionEl) { suggestionEl.style.display = 'none'; suggestionEl.innerHTML = ''; }
  renderAll();
  toast(`Status set to ${suggestion.suggested.toUpperCase()}`);
}

// ============================================================
// CYCLE STATUS — use nextStatus from core
// ============================================================
let undoTimer = null;
let undoData = null;

function cycleStatus(jid) {
  if (!canEditField('status')) return;
  const j = S.jobs.find(x => x.id === jid);
  if (!j) return;
  const prevStatus = j.status;
  const next = nextStatus(j.status);

  if (next === 'done') {
    const prog = getJobProgress(j);
    const incomplete = prog.ordered > 0 && (prog.pressed < prog.ordered || prog.qcPassed < prog.ordered);
    if (incomplete) {
      const msg = `Progress: ${prog.pressed.toLocaleString()}/${prog.ordered.toLocaleString()} pressed, ${prog.qcPassed.toLocaleString()} QC passed. Mark as DONE anyway?`;
      openConfirm('Mark as DONE?', msg, () => applyStatusCycle(j, prevStatus, next, jid));
      return;
    }
  }

  applyStatusCycle(j, prevStatus, next, jid);
}

async function applyStatusCycle(j, prevStatus, next, jid) {
  j.status = next;

  if (prevStatus === 'pressing' && j.status !== 'pressing') {
    releasePressByJob(j.id);
    Storage.savePresses(S.presses);
  }
  if (j.status === 'pressing' && j.press) {
    j.press.split(',').map(s => s.trim()).filter(Boolean).forEach(pressName => {
      const mp = S.presses.find(p => p.name === pressName);
      if (mp) setAssignment(mp.id, j.id);
    });
    Storage.savePresses(S.presses);
  }

  try { await Storage.saveJob(j); } catch (e) { toastError('Status save failed'); }
  renderAll();

  showUndoToast(
    `${j.catalog || j.artist || 'Job'} → ${j.status.toUpperCase()}`,
    async () => {
      j.status = prevStatus;
      if (prevStatus === 'pressing' && j.press) {
        j.press.split(',').map(s => s.trim()).filter(Boolean).forEach(pressName => {
          const mp = S.presses.find(p => p.name === pressName);
          if (mp) setAssignment(mp.id, j.id);
        });
      } else {
        releasePressByJob(j.id);
      }
      Storage.savePresses(S.presses);
      try { await Storage.saveJob(j); } catch (e) { toastError('Undo save failed'); }
      renderAll();
      toast('UNDONE');
    }
  );

  requestAnimationFrame(() => {
    const pill = document.getElementById('st-' + jid);
    if (pill) {
      pill.classList.add('flash');
      pill.addEventListener('animationend', () => pill.classList.remove('flash'), {once:true});
    }
  });
}

function showUndoToast(msg, undoFn) {
  clearTimeout(undoTimer);
  document.querySelectorAll('.toast-undo').forEach(t => t.remove());

  undoData = undoFn;
  const el = document.createElement('div');
  el.className = 'toast-undo';
  el.innerHTML = `
    <span class="tu-msg">${msg}</span>
    <button class="tu-btn" onclick="doUndo()">UNDO</button>
  `;
  document.body.appendChild(el);

  undoTimer = setTimeout(() => {
    el.remove();
    undoData = null;
  }, 5000);
}

function doUndo() {
  if (undoData) {
    undoData();
    undoData = null;
  }
  clearTimeout(undoTimer);
  document.querySelectorAll('.toast-undo').forEach(t => t.remove());
}

// ============================================================
// SEARCH TOGGLES
// ============================================================
function toggleJobsSearch() {
  const wrap = document.getElementById('jobsSearchWrap');
  const input = document.getElementById('jobSearch');
  if (!wrap) return;
  const showing = wrap.style.display !== 'none';
  wrap.style.display = showing ? 'none' : '';
  if (showing) {
    if (input) { input.value = ''; renderJobs(); }
  } else {
    if (input) input.focus();
  }
}

function togglePvcSearch() {
  const wrap = document.getElementById('pvcSearchWrap');
  const input = document.getElementById('pvcSearch');
  if (!wrap) return;
  const showing = wrap.style.display !== 'none';
  wrap.style.display = showing ? 'none' : '';
  if (showing) {
    if (input) { input.value = ''; renderCompoundsPage(); }
  } else {
    if (input) input.focus();
  }
}

// ============================================================
// EXPORT / IMPORT / BACKUP
// ============================================================
function exportPvcCSV() {
  const compounds = Array.isArray(S.compounds) ? S.compounds : [];
  if (!compounds.length) { toast('NO COMPOUNDS TO EXPORT'); return; }
  const h = ['NUMBER','CODE_NAME','COLOR','AMOUNT_ON_HAND','NOTES'];
  const rows = compounds.map(c => {
    return [
      c.number, c.code_name, c.color, c.amount_on_hand,
      (c.notes || '').replace(/"/g, '""')
    ].map(v => `"${v || ''}"`).join(',');
  });
  const csv = [h.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `PVC_${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); toast('PVC CSV EXPORTED');
}

function exportCSV() {
  const h = ['CATALOG','ARTIST','ALBUM','FORMAT','COLOR','WEIGHT','QTY','OVERAGE_10PCT','STATUS','PRESS','LOCATION','DUE','PRESSED','QC_PASSED','REJECTED','INVOICE','CLIENT','SPECIALTY','NOTES'];
  const rows = S.jobs.map(j => {
    const p = getJobProgress(j);
    return [
      j.catalog, j.artist, j.album, j.format, j.color, j.weight, j.qty,
      j.qty ? Math.ceil(parseInt(j.qty) * 1.1) : '',
      j.status, j.press, j.location, j.due,
      p.pressed, p.qcPassed, p.rejected,
      j.invoice, j.client, j.specialty,
      (j.notes || '').replace(/"/g, '""')
    ].map(v => `"${v || ''}"`).join(',');
  });
  const csv = [h.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `PMP_${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); toast('CSV EXPORTED');
}

function importCSV(input) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    const lines = parseCSVLines(e.target.result);
    if (lines.length < 2) { toast('EMPTY CSV'); return; }
    const hdrs = lines[0].map(h => h.trim().toLowerCase());
    let n = 0;
    const baseId = 'csv' + Date.now();
    lines.slice(1).forEach((vals, idx) => {
      const row = {};
      hdrs.forEach((h, i) => row[h] = (vals[i] || '').trim());
      if (row.catalog || row.artist) {
        const existingCat = row.catalog ? S.jobs.find(j => !isJobArchived(j) && j.catalog && j.catalog.toUpperCase() === (row.catalog || '').toUpperCase()) : null;
        if (existingCat) {
          console.warn('[PMP] CSV import skipped duplicate:', row.catalog);
          return;
        }
        S.jobs.push({
          id: baseId + '_' + idx + '_' + Math.random().toString(36).slice(2, 8),
          ...row,
          status: row.status || 'queue',
          assets: {},
          progressLog: [],
        });
        n++;
      }
    });
    const toSave = S.jobs.slice(-n);
    toSave.forEach(j => {
      if (j.press && String(j.press).trim()) {
        const mp = S.presses.find(p => p.name === (j.press || '').trim());
        if (mp) setAssignment(mp.id, j.id);
      }
    });
    Promise.all([Storage.saveJobs(toSave), Storage.savePresses(S.presses)])
      .then(() => { renderAll(); toast(`${n} JOBS IMPORTED`); })
      .catch((e) => {
        console.error('CSV import save failed', e);
        const msg = (e && (e.message || e.error?.message)) ? String(e.message || e.error.message) : 'SAVE FAILED';
        setSyncState('error', { toast: 'IMPORT FAILED: ' + msg.slice(0, 40) });
        renderAll();
      });
    input.value = '';
  };
  r.readAsText(f);
}

function exportBackup() {
  const progressLogFlat = [];
  (S.jobs || []).forEach((j) => {
    (j.progressLog || []).forEach((e) => {
      progressLogFlat.push({ job_id: j.id, qty: e.qty, stage: e.stage, person: e.person, timestamp: e.timestamp });
    });
  });
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    jobs: S.jobs || [],
    presses: S.presses || [],
    todos: S.todos || { daily: [], weekly: [], standing: [] },
    qc_log: S.qcLog || [],
    progress_log: progressLogFlat,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pmp-ops-backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  if (typeof toast === 'function') toast('BACKUP EXPORTED');
}

// ============================================================
// BILLING TOGGLE
// ============================================================
function toggleBilling() {
  const toggle = document.getElementById('billingToggle');
  const body = document.getElementById('billingBody');
  if (!toggle || !body) return;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open');
  toggle.classList.toggle('open');
}

function checkBillingExpand() {
  const fields = ['jInvDate', 'jDep', 'jInv2', 'jPay2'];
  const hasData = fields.some(id => {
    const el = document.getElementById(id);
    return el && el.value;
  });
  const body = document.getElementById('billingBody');
  const toggle = document.getElementById('billingToggle');
  if (hasData && body && !body.classList.contains('open')) {
    body.classList.add('open');
    if (toggle) toggle.classList.add('open');
  }
}

// ============================================================
// PROGRESS LOG & NOTES (panel)
// ============================================================
async function submitProgressLog() {
  if (!S.editId) return;
  const personEl = document.getElementById('progressPerson');
  const stageEl = document.getElementById('progressStage');
  const qtyEl = document.getElementById('progressQty');
  const person = personEl ? personEl.value : '';
  const stage = stageEl ? stageEl.value : '';
  const qty = qtyEl ? qtyEl.value : '';
  try {
    const result = await logJobProgress(S.editId, stage, qty, person);
    if (result.ok) {
      renderProgressSection();
      if (qtyEl) qtyEl.value = '';
    } else {
      toastError(result.error || 'Invalid');
    }
  } catch (e) {
    toastError(e?.message || 'Log failed');
  }
}

function addProductionNote() {}

// NOTE ATTACHMENT (phase 1 lightweight): optional image reference on a note.
// Shape: { attachment_url?, attachment_src?, attachment_name?, attachment_type?, attachment_thumb? }.
// Use attachment_url (or attachment_src) for the image URL; other fields optional. Existing notes without these fields remain valid.
function mergeNoteAttachment(entry, attachment) {
  if (!attachment || (!attachment.attachment_url && !attachment.attachment_src)) return entry;
  const url = attachment.attachment_url || attachment.attachment_src;
  const out = Object.assign({}, entry);
  out.attachment_url = url;
  if (attachment.attachment_name) out.attachment_name = attachment.attachment_name;
  if (attachment.attachment_type) out.attachment_type = attachment.attachment_type;
  if (attachment.attachment_thumb) out.attachment_thumb = attachment.attachment_thumb;
  if (attachment.attachment_thumb_url) out.attachment_thumb_url = attachment.attachment_thumb_url;
  return out;
}

function clearNotesComposerAttachment() {
  S.notesPendingAttachment = null;
  const hint = document.getElementById('notesAttachmentHint');
  if (hint) hint.textContent = '';
  const input = document.getElementById('notesAttachmentInput');
  if (input) input.value = '';
  const cell = document.getElementById('notesAttachCell');
  if (cell) cell.style.display = '';
}

async function onNotesAttachmentSelected(input) {
  const file = input && input.files && input.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  if (!checkImageSize(file, IMG_LIMITS.note, 'Note image')) { input.value = ''; return; }
  if (!window.PMP || !window.PMP.Supabase || typeof window.PMP.Supabase.uploadNoteAttachment !== 'function') {
    if (typeof toast === 'function') toast('Upload not available');
    input.value = '';
    return;
  }
  const progressEl = document.getElementById('notesAttachmentProgress');
  const btnEl = document.getElementById('notesAttachmentBtn');
  if (progressEl) progressEl.style.display = 'block';
  if (btnEl) btnEl.disabled = true;
  try {
    var blobs = await processImage(file);
    var res = await window.PMP.Supabase.uploadNoteAttachment(blobs);
    S.notesPendingAttachment = { attachment_url: res.url, attachment_name: file.name, attachment_type: 'image' };
    if (res.thumbUrl) S.notesPendingAttachment.attachment_thumb_url = res.thumbUrl;
    const hint = document.getElementById('notesAttachmentHint');
    if (hint) hint.textContent = '1 image';
    const cell = document.getElementById('notesAttachCell');
    if (cell) cell.style.display = 'none';
    input.value = '';
  } catch (e) {
    if (typeof toastError === 'function') toastError(e && e.message ? e.message : 'Upload failed');
    input.value = '';
  } finally {
    if (progressEl) progressEl.style.display = 'none';
    if (btnEl) btnEl.disabled = false;
  }
}

async function addNoteFromNotesPage() {
  const selEl = document.getElementById('notesJobSelect');
  const jobId = selEl && (selEl.value || '').trim();
  if (!jobId) return;
  if (jobId === '!TEAM' || jobId === '!ALERT') {
    const textEl = document.getElementById('notesNewText');
    const text = textEl && textEl.value ? textEl.value.trim() : '';
    if (!text) return;
    if (jobId === '!ALERT') {
      const role = (window.PMP?.userProfile?.role || '').toLowerCase();
      const ok = role === 'admin';
      if (!ok) return;
    }
    if (!S.notesChannels || typeof S.notesChannels !== 'object') S.notesChannels = { '!TEAM': [], '!ALERT': [] };
    if (!Array.isArray(S.notesChannels[jobId])) S.notesChannels[jobId] = [];
    const person = window.PMP?.userProfile?.display_name || (S.mode === 'admin' ? 'Admin' : 'Operator');
    let channelEntry = { text, person, timestamp: new Date().toISOString() };
    channelEntry = mergeNoteAttachment(channelEntry, S.notesPendingAttachment || null);
    if (S.notesPendingAttachment) S.notesPendingAttachment = null;
    S.notesChannels[jobId].push(channelEntry);
    if (textEl) textEl.value = '';
    await Storage.saveNotesChannels(S.notesChannels).catch(() => {});
    S.notesUtilityOpen = null;
    S.notesComposerOpen = false;
    clearNotesComposerAttachment();
    renderNotesPage();
    toast('NOTE LOGGED');
    return;
  }
  const job = S.jobs.find(j => j.id === jobId);
  if (!job) return;
  const textEl = document.getElementById('notesNewText');
  const text = textEl && textEl.value ? textEl.value.trim() : '';
  if (!text) return;
  ensureNotesLog(job);
  const person = S.mode === 'admin' ? 'Admin' : 'Operator';
  let entry = { text, person, timestamp: new Date().toISOString() };
  entry = mergeNoteAttachment(entry, S.notesPendingAttachment || null);
  if (S.notesPendingAttachment) S.notesPendingAttachment = null;
  job.notesLog.push(entry);
  job.notes = text;
  if (textEl) textEl.value = '';
  try {
    await Storage.saveJob(job);
  } catch (e) {
    if (typeof toastError === 'function') toastError(e && (e.message || e.error) ? String(e.message || e.error) : 'Save failed');
    return;
  }
  S.notesComposerOpen = false;
  S.notesUtilityOpen = null;
  clearNotesComposerAttachment();
  renderNotesPage();
  toast('NOTE LOGGED');
}

/** Asset-originated note: lands in NOTES (job.notesLog with asset tag) and LOG (progress_log asset_note). Optional attachmentOpts: { attachment_url?, attachment_src?, attachment_name?, attachment_type?, attachment_thumb? }. */
async function addAssetNoteFromOverlay(jobId, assetKey, assetLabel, text, attachmentOpts) {
  const job = S.jobs.find(j => j.id === jobId);
  if (!job || !(assetLabel && text)) return;
  const trimmed = String(text).trim();
  if (!trimmed) return;
  const ts = new Date().toISOString();
  ensureNotesLog(job);
  const person = window.PMP?.userProfile?.display_name || (S.mode === 'admin' ? 'Admin' : 'Operator');
  let entry = { text: trimmed, person, timestamp: ts, assetLabel, assetKey };
  entry = mergeNoteAttachment(entry, attachmentOpts || S.notesPendingAttachment || null);
  if (S.notesPendingAttachment) S.notesPendingAttachment = null;
  job.notesLog.push(entry);
  job.notes = trimmed;
  try {
    await Storage.saveJob(job);
  } catch (e) {
    if (typeof toastError === 'function') toastError(e?.message || 'Save failed');
    return;
  }
  if (typeof renderNotesPage === 'function' && currentPage === 'notes') {
    renderNotesPage();
  }
  if (typeof renderLog === 'function' && (currentPage === 'log' || currentPage === 'qc')) {
    renderLog();
  }
  if (typeof renderAssetsOverlay === 'function') renderAssetsOverlay();
  if (typeof renderPackCard === 'function') renderPackCard();
  if (typeof toast === 'function') toast('NOTE LOGGED');
}

/** Navigate to NOTES with job selected and search preloaded (e.g. for asset filter). */
function goToNotesWithFilter(jobId, assetKey) {
  let label = assetKey || '';
  if (typeof ASSET_DEFS !== 'undefined') {
    const adef = ASSET_DEFS.find(function (x) { return x.key === assetKey; });
    if (adef && adef.label) label = adef.label;
  }
  S.notesPreloadFilter = { jobId: jobId || '', search: label || '', assetLabel: label || '' };
  if (typeof closeCardZone === 'function') closeCardZone();
  goPg('notes');
}

/** Navigate from PACK CARD to NOTES with job pre-selected (read-only jump). */
function goToNotesFromPackCard() {
  var jobId = (typeof packCardState !== 'undefined' && packCardState) ? packCardState.jobId : '';
  if (typeof closeCardZone === 'function') closeCardZone();
  S.notesPreloadFilter = { jobId: jobId || '', search: '', assetLabel: '' };
  goPg('notes');
}

/** Save pack card, close it, then open NOTES with add-note composer ready. */
function addNoteFromPackCard() {
  if (!packCardState) return;
  if (typeof flushPackCardInputs === 'function') flushPackCardInputs();
  var jobId = packCardState.jobId;
  var job = S.jobs.find(function (j) { return j.id === jobId; });
  if (job) {
    job.packCard = JSON.parse(JSON.stringify(packCardState.data));
    Storage.saveJob(job).catch(function (e) { toastError('Pack card save failed'); });
  }
  packCardState = null;
  assetsOverlayState = null;
  if (S) S.assetsOverlayJobId = null;
  if (typeof clearAssetsOverlayPulseTimers === 'function') clearAssetsOverlayPulseTimers();
  var el = document.getElementById('cardZoneOverlay');
  if (el) el.classList.remove('on');
  renderAll();
  goToNotesAndOpenAdd(jobId);
}

// ============================================================
// CARD ACHTUNG POPUP — specialized composer for Card Zone caution notes
// ============================================================
function openCardAchtungPopup(jobId, itemKey, itemLabel, face) {
  var el = document.getElementById('cardAchtungPopup');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cardAchtungPopup';
    el.className = 'card-achtung-popup';
    el.innerHTML = '<div class="card-achtung-popup-card"></div>';
    el.onclick = function (e) { if (e.target === el) closeCardAchtungPopup(); };
    document.body.appendChild(el);
  }
  var card = el.querySelector('.card-achtung-popup-card');
  var faceName = face === 'pack' ? 'PACKING' : 'RECEIVING';
  card.innerHTML =
    '<div class="card-achtung-popup-header">' +
      '<span class="card-achtung-popup-tri">\u26A0\uFE0E</span>' +
      '<span class="card-achtung-popup-title">ACHTUNG</span>' +
    '</div>' +
    '<div class="card-achtung-popup-tag">' + escapeHtml(itemLabel) + ' <span class="card-achtung-popup-face">' + faceName + '</span></div>' +
    '<textarea class="card-achtung-popup-input" id="cardAchtungText" placeholder="What needs attention?" rows="3"></textarea>' +
    '<button type="button" class="card-achtung-popup-btn" id="cardAchtungAdd">ADD</button>' +
    '<button type="button" class="card-achtung-popup-cancel" onclick="closeCardAchtungPopup()">Cancel</button>';
  el.dataset.jobId = jobId;
  el.dataset.itemKey = itemKey;
  el.dataset.itemLabel = itemLabel;
  el.dataset.face = face || '';
  var textEl = document.getElementById('cardAchtungText');
  if (textEl) {
    textEl.value = '';
    textEl.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCardAchtungPopup(); } };
  }
  var addBtn = document.getElementById('cardAchtungAdd');
  if (addBtn) addBtn.onclick = function () { submitCardAchtungPopup(); };
  el.classList.add('open');
  setTimeout(function () { if (textEl) textEl.focus(); }, 80);
}

function closeCardAchtungPopup() {
  var el = document.getElementById('cardAchtungPopup');
  if (el) el.classList.remove('open');
}

async function submitCardAchtungPopup() {
  var el = document.getElementById('cardAchtungPopup');
  if (!el) return;
  var jobId = el.dataset.jobId;
  var itemKey = el.dataset.itemKey;
  var itemLabel = el.dataset.itemLabel;
  var textEl = document.getElementById('cardAchtungText');
  var text = textEl ? textEl.value.trim() : '';
  if (!text) { if (typeof toast === 'function') toast('Write a note'); return; }
  closeCardAchtungPopup();
  await addAssetNoteFromOverlay(jobId, itemKey, itemLabel, text);
}

/** Open inline asset-note composer for this asset row (called from Assets overlay). */
function openAssetNoteComposer(jobId, assetKey) {
  S.assetsOverlayAddingNoteKey = assetKey;
  S.assetsOverlayNoteJobId = jobId;
  const adef = typeof ASSET_DEFS !== 'undefined' ? ASSET_DEFS.find(function (x) { return x.key === assetKey; }) : null;
  S.assetsOverlayNoteLabel = (adef && adef.label) ? adef.label : assetKey;
  if (typeof renderAssetsOverlay === 'function') renderAssetsOverlay();
  setTimeout(function () {
    const el = document.getElementById('assetNoteComposerText');
    if (el) el.focus();
  }, 80);
}

/** Submit asset note from overlay composer; clears composer state. */
async function submitAssetNoteFromOverlay() {
  const textEl = document.getElementById('assetNoteComposerText');
  const text = textEl && textEl.value ? textEl.value.trim() : '';
  const jobId = S.assetsOverlayNoteJobId;
  const assetKey = S.assetsOverlayAddingNoteKey;
  const assetLabel = S.assetsOverlayNoteLabel || assetKey;
  S.assetsOverlayAddingNoteKey = null;
  S.assetsOverlayNoteJobId = null;
  S.assetsOverlayNoteLabel = null;
  if (!jobId || !assetKey || !text) {
    if (typeof renderAssetsOverlay === 'function') renderAssetsOverlay();
    return;
  }
  await addAssetNoteFromOverlay(jobId, assetKey, assetLabel, text);
  if (textEl) textEl.value = '';
  if (typeof renderAssetsOverlay === 'function') renderAssetsOverlay();
}

/** Clear any active asset-jump filter on NOTES and return to full board. */
function clearNotesAssetFilter() {
  S.notesActiveAssetFilter = null;
  S.notesPreloadFilter = null;
  const selEl = document.getElementById('notesJobSelect');
  const searchEl = document.getElementById('notesSearch');
  if (selEl) selEl.value = '';
  if (searchEl) searchEl.value = '';
  if (typeof renderNotesPage === 'function') renderNotesPage();
}

function addAssemblyNote() {}

function openNotesForCurrentJob() {
  if (!S.editId) return;
  S.notesPreloadFilter = { jobId: S.editId, search: '', assetLabel: '' };
  goPg('notes');
}

function notesComposerKeydown(e) {
  if (!e) return;
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    addNoteFromNotesPage();
    return;
  }
  if (e.key === 'Enter' && e.shiftKey) {
    const t = e.target;
    if (t && t.tagName === 'TEXTAREA') {
      setTimeout(function () {
        try {
          t.style.height = '38px';
          const h = Math.min(Math.max(38, t.scrollHeight), 120);
          t.style.height = h + 'px';
        } catch (_) {}
      }, 0);
    }
  }
}

function assetNoteComposerKeydown(e) {
  if (!e) return;
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitAssetNoteFromOverlay();
    return;
  }
}

function openPackNoteComposer(jobId, packKey) {
  S.packCardAddingNoteKey = packKey;
  S.packCardNoteJobId = jobId;
  var pdef = typeof PACK_DEFS !== 'undefined' ? PACK_DEFS.find(function (x) { return x.key === packKey; }) : null;
  S.packCardNoteLabel = (pdef && pdef.label) ? pdef.label : packKey;
  if (typeof renderPackCard === 'function') renderPackCard();
  setTimeout(function () {
    var el = document.getElementById('packNoteComposerText');
    if (el) el.focus();
  }, 80);
}

async function submitPackNoteFromOverlay() {
  var textEl = document.getElementById('packNoteComposerText');
  var text = textEl && textEl.value ? textEl.value.trim() : '';
  var jobId = S.packCardNoteJobId;
  var packKey = S.packCardAddingNoteKey;
  var packLabel = S.packCardNoteLabel || packKey;
  S.packCardAddingNoteKey = null;
  S.packCardNoteJobId = null;
  S.packCardNoteLabel = null;
  if (!jobId || !packKey || !text) {
    if (typeof renderPackCard === 'function') renderPackCard();
    return;
  }
  await addAssetNoteFromOverlay(jobId, packKey, packLabel, text);
  if (textEl) textEl.value = '';
  if (typeof renderPackCard === 'function') renderPackCard();
}

function packNoteComposerKeydown(e) {
  if (!e) return;
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitPackNoteFromOverlay();
    return;
  }
}

function toggleNotesUtility(which) {
  if (which !== 'add' && which !== 'search') return;
  const selEl = document.getElementById('notesJobSelect');
  const jobId = selEl && (selEl.value || '').trim();
  if (which === 'add' && !jobId) {
    pulseNotesJobSelect();
    return;
  }
  if (which === 'add' && jobId === '!ALERT') {
    const email = (window.PMP?.userProfile?.email || '').toLowerCase();
    const name = (window.PMP?.userProfile?.display_name || '').toLowerCase();
    const ok = email.includes('piper') || name.includes('piper');
    if (!ok) { pulseNotesJobSelect(); return; }
  }
  const next = (S.notesUtilityOpen === which) ? null : which;
  S.notesUtilityOpen = next;
  S.notesComposerOpen = (next === 'add');
  if (next !== 'search') {
    const s = document.getElementById('notesSearch');
    if (s) s.value = '';
  }
  if (next !== 'add') {
    const t = document.getElementById('notesNewText');
    if (t) t.value = '';
    clearNotesComposerAttachment();
  }
  renderNotesPage();
  if (next === 'add') {
    const t = document.getElementById('notesNewText');
    if (t) t.focus();
  } else if (next === 'search') {
    const s = document.getElementById('notesSearch');
    if (s) s.focus();
  }
}

function pulseNotesJobSelect() {
  const el = document.getElementById('notesJobSelect');
  if (!el) return;
  el.classList.remove('notes-select-glow');
  void el.offsetWidth; // restart animation
  el.classList.add('notes-select-glow');
  setTimeout(function () { el.classList.remove('notes-select-glow'); }, 750);
}

function notesSearchAction() {
  renderNotesPage();
  const s = document.getElementById('notesSearch');
  if (s) s.focus();
}

// ============================================================
// GLOBAL + / = SHORTCUTS — add action and search/inspect
// ============================================================

/** Job id to preselect when routing + to NOTES (panel edit, or Card Zone). */
function getContextJobIdForNotes() {
  const cardZoneOpen = document.getElementById('cardZoneOverlay')?.classList.contains('on');
  if (cardZoneOpen) {
    if (S.assetsOverlayJobId) return S.assetsOverlayJobId;
    if (typeof packCardState !== 'undefined' && packCardState) return packCardState.jobId;
  }
  if (panelOpen && S.editId) return S.editId;
  return null;
}

/** True if current page/surface has a visible + action we can trigger. */
function hasLocalPlusAction() {
  const chooserOrWizardOpen = document.getElementById('newJobChooserWrap')?.classList.contains('on') || document.getElementById('wizardWrap')?.classList.contains('on');
  if (chooserOrWizardOpen) return false;
  if (currentPage === 'floor' || currentPage === 'jobs') return true;
  if (currentPage === 'notes') return true;
  if (currentPage === 'crew') return true;
  if (currentPage === 'compounds') return true;
  return false;
}

/** Run the local + action for the current page. */
function triggerLocalPlusAction() {
  if (currentPage === 'floor' || currentPage === 'jobs') {
    openNewJobChooser();
    return;
  }
  if (currentPage === 'notes') {
    toggleNotesUtility('add');
    return;
  }
  if (currentPage === 'crew') {
    openEmployeeWizard();
    return;
  }
  if (currentPage === 'compounds') {
    openCompoundWizard();
    return;
  }
}

/** True if current page has a visible search / magnifying-glass action. */
function hasLocalSearchAction() {
  if (currentPage === 'notes') return true;
  if (currentPage === 'floor' && document.getElementById('floorSearch')) return true;
  if (currentPage === 'jobs' && document.getElementById('jobSearch')) return true;
  if (currentPage === 'crew' && document.getElementById('crewSearch')) return true;
  const fmShell = document.getElementById('floorManagerShell');
  if (fmShell && fmShell.classList.contains('on') && document.getElementById('fmFloorSearch')) return true;
  return false;
}

/** Run the local search/magnifying-glass action for the current page. */
function triggerLocalSearchAction() {
  if (currentPage === 'notes') {
    toggleNotesUtility('search');
    return;
  }
  const floorSearch = document.getElementById('floorSearch');
  const jobSearch = document.getElementById('jobSearch');
  const crewSearch = document.getElementById('crewSearch');
  const fmSearch = document.getElementById('fmFloorSearch');
  const floorPg = document.getElementById('pg-floor');
  const fmShell = document.getElementById('floorManagerShell');
  if (fmShell && fmShell.classList.contains('on') && fmSearch) {
    fmSearch.focus();
  } else if (floorPg && floorPg.classList.contains('on') && floorSearch) {
    floorSearch.focus();
  } else if (currentPage === 'jobs' && jobSearch) {
    jobSearch.focus();
  } else if (currentPage === 'crew' && crewSearch) {
    crewSearch.focus();
  } else if (floorSearch) {
    floorSearch.focus();
  } else if (jobSearch) {
    jobSearch.focus();
  }
}

/** Go to NOTES, preselect job if provided, and open the add-note utility. */
function goToNotesAndOpenAdd(contextJobId) {
  goPg('notes');
  setTimeout(function () {
    const selEl = document.getElementById('notesJobSelect');
    if (selEl && contextJobId) {
      selEl.value = contextJobId;
      if (typeof renderNotesPage === 'function') renderNotesPage();
    }
    if (contextJobId || (selEl && selEl.value)) {
      toggleNotesUtility('add');
    } else {
      S.notesUtilityOpen = 'add';
      S.notesComposerOpen = true;
      if (typeof renderNotesPage === 'function') renderNotesPage();
      const t = document.getElementById('notesNewText');
      if (t) t.focus();
    }
  }, 0);
}

// ============================================================
// TOAST
// ============================================================
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function toastError(msg) {
  const t = document.createElement('div');
  t.className = 'toast err'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ============================================================
// KEYBOARD — Escape, QC shortcuts (1-6), search focus (/), N new job
// ============================================================
document.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName;
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  const stationVisible = isStationShellVisible();

  if (e.key === 'Escape') {
    // 0. Close utility menu if open
    const utilOpen = document.getElementById('utilMenu')?.classList.contains('open');
    if (utilOpen) { closeUtilMenu(); e.preventDefault(); return; }
    // 1. Topmost full-screen / station shell
    if (stationVisible) {
      doLogout();
      e.preventDefault();
      return;
    }
    // 2. Highest-priority overlays / modals (new job chooser, wizard, confirm)
    const newJobOpen = document.getElementById('newJobChooserWrap')?.classList.contains('on');
    if (newJobOpen) {
      closeNewJobChooser();
      e.preventDefault();
      return;
    }
    const wizardOpen = document.getElementById('wizardWrap')?.classList.contains('on');
    if (wizardOpen) {
      closeWizard();
      e.preventDefault();
      return;
    }
    const compoundWizardOpen = document.getElementById('compoundWizardWrap')?.classList.contains('on');
    if (compoundWizardOpen) {
      closeCompoundWizard();
      e.preventDefault();
      return;
    }
    const employeeWizardOpen = document.getElementById('employeeWizardWrap')?.classList.contains('on');
    if (employeeWizardOpen) {
      closeEmployeeWizard();
      e.preventDefault();
      return;
    }
    const scheduleEntryWizardOpen = document.getElementById('scheduleEntryWizardWrap')?.classList.contains('on');
    if (scheduleEntryWizardOpen) {
      closeScheduleEntryWizard();
      e.preventDefault();
      return;
    }
    const importReviewOpen = document.getElementById('importReviewWrap')?.classList.contains('on');
    if (importReviewOpen) {
      closeImportReview();
      e.preventDefault();
      return;
    }
    const confirmEl = document.getElementById('confirmWrap');
    if (confirmEl && confirmEl.classList.contains('open')) {
      closeConfirm();
      e.preventDefault();
      return;
    }
    // Progress detail overlay (LOG/Floor/Jobs)
    const progDetailEl = document.getElementById('progressDetailOverlay');
    if (progDetailEl && progDetailEl.classList.contains('on')) {
      if (typeof closeProgressDetail === 'function') closeProgressDetail();
      e.preventDefault();
      return;
    }
    // 3a. LOG pickers (reject / exception reason)
    const rejectPicker = document.getElementById('logRejectPicker');
    if (rejectPicker && rejectPicker.style.display !== 'none') {
      if (typeof unifiedLogHideRejectPicker === 'function') unifiedLogHideRejectPicker();
      e.preventDefault();
      return;
    }
    // 3b. Engine detail overlay
    const engDetailEl = document.getElementById('engDetailOverlay');
    if (engDetailEl && engDetailEl.classList.contains('on')) {
      if (typeof closeEngineDetail === 'function') closeEngineDetail();
      e.preventDefault();
      return;
    }
    // 3c. Card Zone (ASSET CARD / PACK CARD)
    const cardZoneEl = document.getElementById('cardZoneOverlay');
    if (cardZoneEl && cardZoneEl.classList.contains('on')) {
      if (typeof closeCardZone === 'function') closeCardZone();
      e.preventDefault();
      return;
    }
    // 4. NOTES-specific transient state: asset filter, add/search utilities
    const notesPg = document.getElementById('pg-notes');
    if (notesPg && notesPg.classList.contains('on')) {
      // 4a. Clear asset jump filter
      if (S.notesActiveAssetFilter) {
        clearNotesAssetFilter();
        e.preventDefault();
        return;
      }
      // 4b. Close add/search utilities
      if (S.notesUtilityOpen === 'add' || S.notesUtilityOpen === 'search') {
        S.notesUtilityOpen = null;
        S.notesComposerOpen = false;
        const searchEl = document.getElementById('notesSearch');
        const textEl = document.getElementById('notesNewText');
        if (searchEl) searchEl.value = '';
        if (textEl) textEl.value = '';
        if (typeof renderNotesPage === 'function') renderNotesPage();
        e.preventDefault();
        return;
      }
      // 4c. Clear selected channel/job (return to full board)
      const selEl = document.getElementById('notesJobSelect');
      if (selEl && selEl.value) {
        selEl.value = '';
        const searchEl = document.getElementById('notesSearch');
        if (searchEl) searchEl.value = '';
        if (typeof renderNotesPage === 'function') renderNotesPage();
        e.preventDefault();
        return;
      }
    }
    // 5. Panel, then TV mode
    if (panelOpen) {
      closePanel();
      e.preventDefault();
      return;
    }
    if (document.body.classList.contains('tv')) {
      exitTV();
      e.preventDefault();
      return;
    }
    // 6. Focused search inputs (Jobs/Floor) — clear and reset lists
    if (isTyping && document.activeElement.classList.contains('search-input')) {
      document.activeElement.value = '';
      document.activeElement.blur();
      renderFloor(); renderJobs();
      e.preventDefault();
      return;
    }
    return;
  }

  function isBlockingSurfaceOpen() {
    var has = function (id, cls) { var el = document.getElementById(id); return el && el.classList.contains(cls || 'on'); };
    return !!(panelOpen ||
      has('cardZoneOverlay') ||
      has('floorCardOverlay') ||
      has('newJobChooserWrap') ||
      has('wizardWrap') ||
      has('compoundWizardWrap') ||
      has('employeeWizardWrap') ||
      has('scheduleEntryWizardWrap') ||
      has('importReviewWrap') ||
      has('confirmWrap', 'open') ||
      has('duplicateJobWrap') ||
      has('progressDetailOverlay') ||
      has('engDetailOverlay') ||
      has('cautionPopup', 'open') ||
      has('cardAchtungPopup', 'open') ||
      has('poImageLightbox', 'open') ||
      document.querySelector('.po-upload-prompt'));
  }

  if ((e.key === 'f' || e.key === 'F') && !isTyping && !isBlockingSurfaceOpen()) {
    e.preventDefault();
    toggleFullscreen();
    return;
  }
  if (!isTyping && !stationVisible && !isBlockingSurfaceOpen()) {
    const isPlusKey = (e.key === '+' || (e.key === '=' && e.shiftKey));
    const isEqualsKey = (e.key === '=' && !e.shiftKey);
    if (isPlusKey) {
      e.preventDefault();
      if (hasLocalPlusAction()) {
        triggerLocalPlusAction();
      } else {
        goToNotesAndOpenAdd(getContextJobIdForNotes());
      }
      return;
    }
    if (isEqualsKey) {
      e.preventDefault();
      if (hasLocalSearchAction()) {
        triggerLocalSearchAction();
      }
      return;
    }
  }

  if (!isTyping && !stationVisible && !isBlockingSurfaceOpen()) {
    const qcPage = document.getElementById('pg-qc');
    if (qcPage && qcPage.classList.contains('on')) {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 6) {
        logQC(QC_TYPES[n - 1]);
        return;
      }
    }

    if (e.key === '/') {
      e.preventDefault();
      const floorSearch = document.getElementById('floorSearch');
      const jobSearch = document.getElementById('jobSearch');
      const floorPg = document.getElementById('pg-floor');
      if (floorPg && floorPg.classList.contains('on') && floorSearch) {
        floorSearch.focus();
      } else if (jobSearch) {
        jobSearch.focus();
      }
    }

    if ((e.key === 'n' || e.key === 'N') && (currentPage === 'floor' || currentPage === 'jobs')) {
      openNewJobChooser();
    }
  }
});

// Debounced search
(function attachDebouncedSearch() {
  var floorEl = document.getElementById('floorSearch');
  if (floorEl) floorEl.addEventListener('input', debounce(renderFloor, 280));
  var jobEl = document.getElementById('jobSearch');
  if (jobEl) jobEl.addEventListener('input', debounce(renderJobs, 280));
  var fmEl = document.getElementById('fmFloorSearch');
  if (fmEl) fmEl.addEventListener('input', debounce(renderFloorManagerShell, 280));
})();
