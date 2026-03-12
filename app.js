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
      col: party ? 14 : 18,
      step: party ? 42 : 55,
      fade: party ? 0.05 : 0.06,
      font: party ? 14 : 13,
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
        ctx.fillText(ch[Math.random() * ch.length | 0], x, yy);
        if (cfg.party && Math.random() > 0.8) ctx.fillText(ch[Math.random() * ch.length | 0], x, yy + cfg.col);
        if (yy > c.height && Math.random() > (cfg.party ? 0.965 : 0.97)) drops[i] = 0;
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
  try { localStorage.setItem('themeMinimal', document.body.classList.contains('theme-minimal') ? '1' : '0'); } catch (e) {}
}
applyMinimalThemeFromStorage();

// ============================================================
// STATE
// ============================================================
let S = {
  jobs: [],
  presses: JSON.parse(JSON.stringify(DEFAULT_PRESSES)),
  todos: JSON.parse(JSON.stringify(DEFAULT_TODOS)),
  qcLog: [],
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
  floorStatFilter: null,
  notesComposerOpen: false,
  notesUtilityOpen: null, // 'add' | 'search' | null
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

function checkTodoReset() {
  const today = new Date().toDateString();
  if (S._lastReset === today) return;
  S.todos.daily?.forEach(t => { t.done = false; t.who = ''; });
  if (new Date().getDay() === 1) S.todos.weekly?.forEach(t => { t.done = false; t.who = ''; });
  S._lastReset = today;
}

function logJobProgress(jobId, stage, qty, person) {
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
  const surface = (person != null && String(person).trim()) ? String(person).trim() : 'UNKNOWN';
  const who = (window.PMP?.userProfile?.display_name || window.PMP?.userProfile?.email || (S.mode === 'admin' ? 'Admin' : 'Operator') || '—');
  const personVal = surface.includes('·') ? surface : `${surface} · ${who}`;
  const timestamp = new Date().toISOString();
  job.progressLog.push({ qty: q, stage, person: personVal, timestamp });

  const isAssigned = S.presses.some(p => p.job_id === jobId);
  const suggestion = suggestedStatus(job, isAssigned);
  const prev = job.status;
  if (suggestion && (suggestion.suggested === 'pressing' || suggestion.suggested === 'done')) {
    job.status = suggestion.suggested;
  }
  let p = Storage.logProgress({ job_id: jobId, qty: q, stage, person: personVal, timestamp });
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
  }, 5000);
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
  if (editBtn) { editBtn.textContent = enabled ? 'EDITING' : 'EDIT'; editBtn.classList.toggle('editing', enabled); }

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
    if (j) updatePoImageUI(j);
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
  const exportBtn = document.getElementById('exportBtn');
  const backupBtn = document.getElementById('backupBtn');
  if (exportBtn) exportBtn.style.display = choice === 'admin' ? '' : 'none';
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
    const navAudit = document.getElementById('navAudit');
    if (navAudit) navAudit.style.display = getAuthRole() === 'admin' ? '' : 'none';
    renderAll();
    return;
  }
  if (appEl) appEl.style.display = 'block';
  const navAudit = document.getElementById('navAudit');
  if (navAudit) navAudit.style.display = 'none';
  if (choice === 'floor_manager') {
    setLastLauncherChoice({ stationType: 'floor_manager' });
    openFloorManager();
    return;
  }
  if (choice === 'press' && effectivePressId) {
    setLastLauncherChoice({ stationType: 'press', assignedPressId: effectivePressId });
    openPressStation(effectivePressId);
    return;
  }
  if (choice === 'qc') {
    setLastLauncherChoice({ stationType: 'qc' });
    setStationContext({});
    if (role === 'admin') {
      S.mode = 'admin';
      const badgeEl = document.getElementById('modeBadge');
      if (badgeEl) { badgeEl.textContent = 'ADMIN'; badgeEl.className = 'bar-mode admin'; }
      if (exportBtn) exportBtn.style.display = '';
      const navAuditEl = document.getElementById('navAudit');
      if (navAuditEl) navAuditEl.style.display = '';
    }
    hideAllShells();
    goPg('log');
    renderAll();
    return;
  }
}

function toggleLauncherPressPicker() {
  const el = document.getElementById('launcherPressPicker');
  if (!el) return;
  el.classList.toggle('on');
  el.style.display = el.classList.contains('on') ? 'flex' : 'none';
}

function hideLauncherPressPicker() {
  const el = document.getElementById('launcherPressPicker');
  if (el) { el.classList.remove('on'); el.style.display = 'none'; }
}

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
  if (last.stationType === 'press' && last.assignedPressId) {
    enterByLauncher('press', last.assignedPressId);
    return;
  }
  if (last.stationType === 'qc') {
    enterByLauncher('qc');
    return;
  }
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

function showLauncher() {
  hideLoginScreen();
  const banner = document.getElementById('localModeBanner');
  if (banner) banner.style.display = 'none';
  const modeScreen = getModeScreenEl();
  if (modeScreen) modeScreen.style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  applyLauncherByRole();
}

function applyLauncherByRole() {
  const role = getAuthRole();
  const adminBtn = document.querySelector('.launcher-btn.admin');
  const fmBtn = document.querySelector('.launcher-btn.fm');
  const pressBtn = document.querySelector('.launcher-btn.press');
  const pressRow = document.getElementById('launcherPressPicker');
  const qcBtn = document.querySelector('.launcher-btn.qc');
  const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };
  const showRow = (el, on) => { if (el) el.style.display = on ? 'flex' : 'none'; };
  const noRoleEl = document.getElementById('launcherNoRole');
  if (noRoleEl) noRoleEl.style.display = 'none';

  const hasProfileNoRole = !!(window.PMP && window.PMP.userProfile && window.PMP.userProfile.role == null);
  if (!role && !hasProfileNoRole) {
    show(adminBtn, true);
    show(fmBtn, false);
    show(pressBtn, true);
    showRow(pressRow, false);
    show(qcBtn, true);
    return;
  }
  if (hasProfileNoRole) {
    show(adminBtn, false);
    show(fmBtn, false);
    show(pressBtn, false);
    showRow(pressRow, false);
    show(qcBtn, false);
    if (noRoleEl) noRoleEl.style.display = 'block';
    return;
  }
  switch (role) {
    case 'admin':
      show(adminBtn, true);
      show(fmBtn, false);
      show(pressBtn, true);
      if (pressBtn) pressBtn.onclick = toggleLauncherPressPicker;
      if (pressRow) { pressRow.querySelectorAll('.launcher-press-btn').forEach(b => { b.style.display = ''; }); pressRow.style.display = 'none'; }
      show(qcBtn, true);
      break;
    case 'floor_manager':
      show(adminBtn, true);
      show(fmBtn, false);
      show(pressBtn, true);
      showRow(pressRow, false);
      show(qcBtn, true);
      break;
    case 'press': {
      show(adminBtn, false);
      show(fmBtn, false);
      show(pressBtn, true);
      if (pressBtn) pressBtn.onclick = toggleLauncherPressPicker;
      if (pressRow) {
        pressRow.querySelectorAll('.launcher-press-btn').forEach(btn => { btn.style.display = ''; });
        pressRow.style.display = 'none';
      }
      show(qcBtn, false);
      break;
    }
    case 'qc':
      show(adminBtn, false);
      show(fmBtn, false);
      show(pressBtn, false);
      showRow(pressRow, false);
      show(qcBtn, true);
      break;
    default:
      show(adminBtn, true);
      show(fmBtn, false);
      show(pressBtn, true);
      showRow(pressRow, false);
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
    const eb = document.getElementById('exportBtn'); if (eb) eb.style.display = 'none';
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
  showLauncher();
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

function updateFAB() {
  const fab = document.getElementById('fab');
  const label = document.getElementById('fabLabel');
  if (!fab) return;

  if (currentPage === 'floor' || currentPage === 'jobs') {
    fab.style.display = 'flex';
    fab.textContent = '+';
    if (label) { label.textContent = 'NEW JOB [N]'; }
  } else if (currentPage === 'audit') {
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

function toggleTVParty() {
  document.body.classList.toggle('tv-party');
  try { sessionStorage.setItem('tvParty', document.body.classList.contains('tv-party') ? '1' : '0'); } catch (e) {}
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
  } else {
    document.getElementById('panelId').textContent = 'NEW JOB';
    document.getElementById('panelSub').textContent = '';
    document.getElementById('delBtn').style.display = 'none';
    const archiveBtn = document.getElementById('archiveBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    if (archiveBtn) archiveBtn.style.display = 'none';
    if (restoreBtn) restoreBtn.style.display = 'none';
    clearFields();
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
  const url = job && job.poContract && job.poContract.imageUrl;
  if (url) {
    placeholder.style.display = 'none';
    preview.style.display = 'block';
    preview.src = url;
    preview.classList.add('po-image-clickable');
    preview.onclick = function () { openPoImageLightbox(preview.src); };
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

function openPoImageLightbox(src) {
  if (!src) return;
  let el = document.getElementById('poImageLightbox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'poImageLightbox';
    el.className = 'po-image-lightbox';
    el.innerHTML = '<button type="button" class="po-image-lightbox-close" aria-label="Close" onclick="closePoImageLightbox()">&times;</button><img alt="PO reference" />';
    el.onclick = function (e) { if (e.target === el) closePoImageLightbox(); };
    el.querySelector('img').onclick = function (e) { e.stopPropagation(); };
    document.body.appendChild(el);
  }
  const img = el.querySelector('img');
  if (img) img.src = src;
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
    const { path, url } = await window.PMP.Supabase.uploadPoImage(jobId, file);
    if (!j.poContract || typeof j.poContract !== 'object') j.poContract = {};
    j.poContract.imageUrl = url;
    j.poContract.imagePath = path;
    await Storage.saveJob(j);
    updatePoImageUI(j);
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
function applySuggestedStatus(jobId) {
  const j = S.jobs.find(x => x.id === jobId);
  if (!j) return;
  const isAssigned = S.presses.some(p => p.job_id === j.id);
  const suggestion = suggestedStatus(j, isAssigned);
  if (!suggestion) return;
  j.status = suggestion.suggested;
  Storage.saveJob(j);
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

function applyStatusCycle(j, prevStatus, next, jid) {
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

  Storage.saveJob(j);
  renderAll();

  showUndoToast(
    `${j.catalog || j.artist || 'Job'} → ${j.status.toUpperCase()}`,
    () => {
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
      Storage.saveJob(j);
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
// EXPORT / IMPORT / BACKUP
// ============================================================
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
    S.notesChannels[jobId].push({ text, person, timestamp: new Date().toISOString() });
    if (textEl) textEl.value = '';
    await Storage.saveNotesChannels(S.notesChannels).catch(() => {});
    S.notesUtilityOpen = null;
    S.notesComposerOpen = false;
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
  job.notesLog.push({ text, person, timestamp: new Date().toISOString() });
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
  renderNotesPage();
  toast('NOTE LOGGED');
}

/** Asset-originated note: lands in NOTES (job.notesLog with asset tag) and LOG (progress_log asset_note). */
async function addAssetNoteFromOverlay(jobId, assetKey, assetLabel, text) {
  const job = S.jobs.find(j => j.id === jobId);
  if (!job || !(assetLabel && text)) return;
  const trimmed = String(text).trim();
  if (!trimmed) return;
  const ts = new Date().toISOString();
  ensureNotesLog(job);
  const person = window.PMP?.userProfile?.display_name || (S.mode === 'admin' ? 'Admin' : 'Operator');
  job.notesLog.push({ text: trimmed, person, timestamp: ts, assetLabel, assetKey });
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
  if (typeof closeAssetsOverlay === 'function') closeAssetsOverlay(true);
  goPg('notes');
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
    // 3. Assets overlay
    const assetsEl = document.getElementById('assetsOverlay');
    if (assetsEl && assetsEl.classList.contains('on')) {
      // Skip save on ESC; behave like click-outside cancel
      if (typeof closeAssetsOverlay === 'function') closeAssetsOverlay(true);
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

  if ((e.key === 'f' || e.key === 'F') && !isTyping) {
    e.preventDefault();
    toggleFullscreen();
    return;
  }

  if (!isTyping && !panelOpen && !stationVisible) {
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

    const chooserOrWizardOpen = document.getElementById('newJobChooserWrap')?.classList.contains('on') || document.getElementById('wizardWrap')?.classList.contains('on');
    if ((e.key === 'n' || e.key === 'N') && (currentPage === 'floor' || currentPage === 'jobs') && !chooserOrWizardOpen) {
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
