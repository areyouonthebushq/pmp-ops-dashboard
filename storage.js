// ============================================================
// STORAGE — unified on window.storage, no localStorage split
// ============================================================
const STORE_KEY = 'pmp_ops_data';
const NOTES_CHANNELS_KEY = 'pmp_notes_channels';

async function safeGet(k) {
  try {
    if (window.storage && typeof window.storage.get === 'function') {
      const r = await window.storage.get(k, true);
      return r ? r.value : null;
    }
  } catch {}
  try {
    const v = localStorage.getItem(k);
    return v || null;
  } catch { return null; }
}

const LS_SAFE_CEILING = 4_500_000;

async function safeSet(k, v) {
  const data = JSON.stringify(v);
  var sizeKB = Math.round(data.length / 1024);
  var success = false;

  if (data.length > LS_SAFE_CEILING) {
    if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'localStorage write SKIPPED — over ceiling', level: 'warning', data: { key: k, sizeKB: sizeKB } });
    console.warn('[PMP] localStorage write skipped — payload ' + sizeKB + 'KB exceeds ' + Math.round(LS_SAFE_CEILING / 1024) + 'KB ceiling (' + k + ')');
    return false;
  }

  try {
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(k, data, true);
      success = true;
    }
  } catch (e) {
    console.warn('[PMP] window.storage.set failed for ' + k, e);
  }

  if (!success) {
    try {
      localStorage.setItem(k, data);
      success = true;
    } catch (e) {
      console.warn('[PMP] localStorage.setItem failed for ' + k, e);
    }
  }

  if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'localStorage write', level: success ? 'info' : 'warning', data: { key: k, sizeKB: sizeKB, success: success } });
  return success;
}

function pruneForQuota(payload) {
  var steps = [];
  var cutoff30d = new Date(Date.now() - 30 * 86400000).toISOString();
  var cutoff7d = new Date(Date.now() - 7 * 86400000).toISOString();

  try { localStorage.removeItem(OFFLINE_SNAPSHOT_KEY); steps.push('offline_snapshot'); } catch (e) {}

  if (Array.isArray(payload.qcLog) && payload.qcLog.length) {
    var before = payload.qcLog.length;
    payload.qcLog = payload.qcLog.filter(function (e) { return e.timestamp >= cutoff30d; });
    if (payload.qcLog.length < before) steps.push('qcLog_30d');
  }

  if (Array.isArray(payload.devNotes) && payload.devNotes.length) {
    var before2 = payload.devNotes.length;
    payload.devNotes = payload.devNotes.filter(function (e) { return e.timestamp >= cutoff30d; });
    if (payload.devNotes.length < before2) steps.push('devNotes_30d');
  }

  if (Array.isArray(payload.jobs)) {
    payload.jobs.forEach(function (j) {
      if (j.archived_at && Array.isArray(j.progressLog) && j.progressLog.length) {
        j.progressLog = [];
        if (steps.indexOf('archived_progressLog') === -1) steps.push('archived_progressLog');
      }
    });
  }

  if (Array.isArray(payload.scheduleEntries) && payload.scheduleEntries.length) {
    var before3 = payload.scheduleEntries.length;
    payload.scheduleEntries = payload.scheduleEntries.filter(function (e) { return (e.date || e.timestamp || '') >= cutoff30d; });
    if (payload.scheduleEntries.length < before3) steps.push('scheduleEntries_30d');
  }

  if (payload.notesChannels && typeof payload.notesChannels === 'object') {
    Object.keys(payload.notesChannels).forEach(function (ch) {
      var arr = payload.notesChannels[ch];
      if (Array.isArray(arr) && arr.length) {
        var before4 = arr.length;
        payload.notesChannels[ch] = arr.filter(function (e) { return (e.timestamp || '') >= cutoff7d; });
        if (payload.notesChannels[ch].length < before4 && steps.indexOf('notesChannels_7d') === -1) steps.push('notesChannels_7d');
      }
    });
  }

  if (steps.length) console.log('[PMP] Pruned for quota:', steps.join(', '));
  if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'pruneForQuota', level: 'info', data: { steps: steps } });
  return { payload: payload, steps: steps };
}

function useSupabase() {
  if (window.PMP_SUPABASE_INITIALIZED) return window.PMP_USE_SUPABASE;
  window.PMP_SUPABASE_INITIALIZED = true;
  window.PMP_USE_SUPABASE = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.PMP?.Supabase?.initSupabase?.());
  return window.PMP_USE_SUPABASE;
}

// Sync state: single place for loading | saving | synced | error | local | offline | stale
const SYNC_STATES = {
  loading: { text: 'loading', class: 'sync-save' },
  saving: { text: '● SAVING…', class: 'sync-save' },
  synced: { text: '● SYNCED', class: 'sync-ok' },
  error: { text: '● ERR', class: 'sync-err' },
  quota: { text: '● STORAGE FULL', class: 'sync-err' },
  local: { text: '● LOCAL', class: 'sync-ok' },
  offline: { text: '● OFFLINE', class: 'sync-err' },
  stale: { text: '● STALE', class: 'sync-save' },
};

function setSyncState(state, opts = {}) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  const s = SYNC_STATES[state];
  if (s) {
    el.textContent = s.text;
    el.className = s.class;
  }
  if (state === 'error') {
    if (opts.toastError) toastError(opts.toastError);
    else if (opts.toast) toast(opts.toast);
  }
}

const OFFLINE_SNAPSHOT_KEY = 'pmp_offline_snapshot';
const OFFLINE_QUEUE_KEY = 'pmp_offline_queue';
const OFFLINE_QUEUE_MAX = 100;

function isOffline() {
  return !navigator.onLine || S.offlineMode;
}

function getOfflineSnapshot() {
  try {
    const raw = localStorage.getItem(OFFLINE_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setOfflineSnapshot(data) {
  if (!data) return;
  var payload = {
    jobs: data.jobs || [],
    presses: data.presses || [],
    todos: data.todos || null,
    qcLog: data.qcLog || [],
    devNotes: data.devNotes || [],
    compounds: data.compounds || [],
    employees: data.employees || [],
    scheduleEntries: data.scheduleEntries || [],
    lastReset: data.lastReset || null,
    fetchedAt: new Date().toISOString(),
  };
  var serialized = JSON.stringify(payload);
  var sizeKB = Math.round(serialized.length / 1024);

  var usedEstimate = 0;
  try {
    var primary = localStorage.getItem(STORE_KEY);
    if (primary) usedEstimate = primary.length;
  } catch (e) {}

  var pressureThreshold = LS_SAFE_CEILING * 0.8;
  if (usedEstimate + serialized.length > pressureThreshold) {
    if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'Skipping offline snapshot — storage pressure', level: 'warning', data: { primaryKB: Math.round(usedEstimate / 1024), snapshotKB: sizeKB } });
    console.log('[PMP] Skipping offline snapshot write — storage pressure (' + sizeKB + 'KB snapshot, ' + Math.round(usedEstimate / 1024) + 'KB primary)');
    return;
  }

  try {
    localStorage.setItem(OFFLINE_SNAPSHOT_KEY, serialized);
    if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'offline snapshot written', level: 'info', data: { sizeKB: sizeKB } });
  } catch (e) {
    console.warn('[PMP] Offline snapshot write failed', e);
    if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'offline snapshot write FAILED', level: 'warning', data: { sizeKB: sizeKB } });
  }
}

function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function setOfflineQueue(queue) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-OFFLINE_QUEUE_MAX)));
  } catch {}
}

function pushToOfflineQueue(type, payload) {
  const queue = getOfflineQueue();
  const id = 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  queue.push({ id, type, payload, createdAt: new Date().toISOString() });
  setOfflineQueue(queue);
  updateOfflineBanner();
}

function updateOfflineBanner() {
  const el = document.getElementById('offlineBanner');
  const textEl = document.getElementById('offlineBannerText');
  const queueEl = document.getElementById('offlineBannerQueue');
  if (!el) return;
  if (!S.offlineMode) {
    el.style.display = 'none';
    return;
  }
  el.style.display = 'flex';
  if (textEl) textEl.textContent = 'Offline — showing cached data.';
  const q = getOfflineQueue();
  if (queueEl) queueEl.textContent = q.length ? q.length + ' change(s) queued.' : '';
}

/** Run a Supabase write once; on failure retry once after delay (helps flaky mobile networks). */
function supabaseWithRetry(fn, retryMs) {
  retryMs = retryMs || 1500;
  return fn().catch(function (e) {
    console.warn('[PMP] Write failed, retrying in ' + retryMs + 'ms…', e);
    return new Promise(function (resolve, reject) {
      setTimeout(function () { fn().then(resolve).catch(reject); }, retryMs);
    });
  });
}

const pendingWrites = new Map();
const pendingPressWrites = new Map();
const CONFLICT_WINDOW_MS = 10000;
let saveInFlight = false;

async function replayQueue() {
  const queue = getOfflineQueue();
  if (!queue.length || !window.PMP || !window.PMP.Supabase) return;
  setSyncState('stale');
  const remaining = [];
  for (const item of queue) {
    try {
      if (item.type === 'progress') {
        await window.PMP.Supabase.logProgress(item.payload);
      } else if (item.type === 'qc') {
        await window.PMP.Supabase.logQC(item.payload);
      } else if (item.type === 'job_status') {
        const job = S.jobs.find((j) => j.id === item.payload.jobId);
        if (job) {
          job.status = item.payload.status;
          await window.PMP.Supabase.saveJob(job);
        }
      } else if (item.type === 'job_assets') {
        const job = S.jobs.find((j) => j.id === item.payload.jobId);
        if (job && item.payload.assets != null) {
          job.assets = item.payload.assets;
          await window.PMP.Supabase.updateJobAssets(item.payload.jobId, item.payload.assets);
        }
      }
    } catch (e) {
      console.warn('[PMP] Replay failed for', item.type, e);
      remaining.push(item);
      break;
    }
  }
  setOfflineQueue(remaining);
  if (remaining.length === 0) S.offlineMode = false;
  updateOfflineBanner();
  setSyncState('synced');
}

function onOnline() {
  if (!useSupabase()) return;
  const appEl = document.getElementById('app');
  if (appEl && appEl.style.display === 'none') return;
  if (getOfflineQueue().length > 0 || S.offlineMode) {
    setSyncState('loading');
    loadAll().then(() => replayQueue()).then(() => loadAll()).catch((e) => {
      console.error('[PMP] Reconnect sync failed', e);
      setSyncState('error', { toast: 'Sync failed after reconnect' });
    });
  }
}

// ============================================================
// PERSISTENCE LAYER — single interface; UI does not branch on backend
// ============================================================
const Storage = {
  async loadAllData() {
    if (useSupabase()) {
      const data = await window.PMP.Supabase.loadAllData();
      if (!data.presses || data.presses.length === 0) {
        data.presses = JSON.parse(JSON.stringify(DEFAULT_PRESSES));
        await window.PMP.Supabase.savePresses(data.presses).catch(() => {});
      }
      return data;
    }
    const raw = await safeGet(STORE_KEY);
    if (!raw) return { jobs: [], presses: [], todos: JSON.parse(JSON.stringify(DEFAULT_TODOS)), qcLog: [], devNotes: [], compounds: [], employees: [], scheduleEntries: [], lastReset: null, notesChannels: null };
    const data = JSON.parse(raw);
    return {
      jobs: data.jobs || [],
      presses: data.presses || [],
      todos: data.todos || { daily: [], weekly: [], standing: [] },
      qcLog: data.qcLog || [],
      devNotes: data.devNotes || [],
      compounds: data.compounds || [],
      employees: data.employees || [],
      scheduleEntries: data.scheduleEntries || [],
      lastReset: data.lastReset || null,
      notesChannels: data.notesChannels || null,
    };
  },
  saveJob(job) {
    if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'saveJob: ' + job.id, level: 'info' });
    pendingWrites.set(job.id, { timestamp: Date.now(), hash: jobFieldsHash(job) });
    if (useSupabase()) {
      if (isOffline()) {
        pushToOfflineQueue('job_status', { jobId: job.id, status: job.status });
        S.offlineMode = true;
        setSyncState('offline');
        pendingWrites.delete(job.id);
        return Promise.resolve();
      }
      saveInFlight = true;
      return supabaseWithRetry(function () { return window.PMP.Supabase.saveJob(job); })
        .then(function () {
          S.lastLocalWriteAt = Date.now();
          setSyncState('synced');
          setTimeout(function () { pendingWrites.delete(job.id); }, 6000);
        })
        .catch(function (e) {
          console.error(e);
          /* PURGATORY: Press Station error logging removed (2026-03-06). */
          pendingWrites.delete(job.id);
          setSyncState('error', { toast: 'SAVE FAILED' });
          return Promise.reject(e);
        })
        .finally(function () { saveInFlight = false; });
    }
    pendingWrites.delete(job.id);
    return flushLocalSave();
  },

  saveNotesChannels(channels) {
    const payload = channels && typeof channels === 'object' ? channels : { '!TEAM': [], '!ALERT': [] };
    if (useSupabase()) {
      return window.PMP.Supabase.saveNotesChannels(payload)
        .then(function () { S.notesChannels = payload; })
        .catch(function (e) { console.error('[PMP] saveNotesChannels Supabase error', e); });
    }
    S.notesChannels = payload;
    return flushLocalSave();
  },
  updateJobAssets(jobId, assets) {
    if (useSupabase()) {
      if (isOffline()) {
        pushToOfflineQueue('job_assets', { jobId, assets });
        S.offlineMode = true;
        setSyncState('offline');
        return Promise.resolve();
      }
      return supabaseWithRetry(function () { return window.PMP.Supabase.updateJobAssets(jobId, assets); })
        .then(function () { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
        .catch(function (e) {
          console.error('Assets save failed', e);
          setSyncState('error', { toast: 'SAVE FAILED' });
          return Promise.reject(e);
        });
    }
    scheduleSave();
    return Promise.resolve();
  },
  deleteJob(id) {
    if (useSupabase()) {
      saveInFlight = true;
      var deleteChain = function () {
        return window.PMP.Supabase.deleteJob(id).then(function () { return window.PMP.Supabase.savePresses(S.presses); });
      };
      return supabaseWithRetry(deleteChain)
        .then(function () { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
        .catch(function (e) { console.error(e); setSyncState('error', { toast: 'DELETE FAILED' }); return Promise.reject(e); })
        .finally(function () { saveInFlight = false; });
    }
    return flushLocalSave();
  },
  savePresses(presses) {
    presses.forEach(p => {
      pendingPressWrites.set(p.id, { timestamp: Date.now(), job_id: p.job_id, status: p.status });
    });
    if (useSupabase()) {
      saveInFlight = true;
      return supabaseWithRetry(function () { return window.PMP.Supabase.savePresses(presses); })
        .then(function () {
          S.lastLocalWriteAt = Date.now();
          setSyncState('synced');
          setTimeout(function () { pendingPressWrites.clear(); }, 6000);
        })
        .catch(function (e) {
          pendingPressWrites.clear();
          setSyncState('error', { toast: 'SAVE FAILED' });
          return Promise.reject(e);
        })
        .finally(function () { saveInFlight = false; });
    }
    pendingPressWrites.clear();
    return flushLocalSave();
  },
  saveTodos(todos) {
    const role = typeof getAuthRole === 'function' ? getAuthRole() : null;
    if (role !== 'admin' && role !== 'floor_manager') return Promise.resolve();
    if (useSupabase()) {
      return window.PMP.Supabase.saveTodos(todos)
        .then(() => { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
        .catch((e) => { setSyncState('error'); return Promise.reject(e); });
    }
    return flushLocalSave();
  },
  logProgress(entry) {
    if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'logProgress: ' + (entry.job_id || '?'), level: 'info' });
    if (useSupabase()) {
      if (isOffline()) {
        pushToOfflineQueue('progress', entry);
        S.offlineMode = true;
        setSyncState('offline');
        return Promise.resolve();
      }
      saveInFlight = true;
      return supabaseWithRetry(function () { return window.PMP.Supabase.logProgress(entry); })
        .then(function () { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
        .catch(function (e) {
          console.error(e);
          /* PURGATORY: Press Station error logging removed (2026-03-06). */
          setSyncState('error', { toastError: 'LOG FAILED' });
          return Promise.reject(e);
        })
        .finally(function () { saveInFlight = false; });
    }
    return flushLocalSave();
  },
  logQC(entry) {
    if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'logQC: ' + (entry.job || '?'), level: 'info' });
    if (useSupabase()) {
      if (isOffline()) {
        pushToOfflineQueue('qc', entry);
        S.offlineMode = true;
        setSyncState('offline');
        return Promise.resolve();
      }
      saveInFlight = true;
      return supabaseWithRetry(function () { return window.PMP.Supabase.logQC(entry); })
        .then(function () { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
        .catch(function (e) { console.error(e); setSyncState('error', { toast: 'QC LOG FAILED' }); return Promise.reject(e); })
        .finally(function () { saveInFlight = false; });
    }
    return flushLocalSave();
  },
  logDevNote(entry) {
    if (window.Sentry) Sentry.addBreadcrumb({ category: 'storage', message: 'logDevNote: ' + (entry.area || '?'), level: 'info' });
    const note = {
      area: entry.area || '',
      stage: entry.stage != null ? String(entry.stage) : '',
      type: entry.type != null ? String(entry.type) : '',
      entity: entry.entity != null ? String(entry.entity) : '',
      text: entry.text || '',
      person: entry.person || '',
      timestamp: entry.timestamp || new Date().toISOString(),
    };
    if (useSupabase()) {
      if (isOffline()) {
        // For phase 1, DEV notes written while offline are kept local only.
        if (!Array.isArray(S.devNotes)) S.devNotes = [];
        S.devNotes.push(note);
        S.offlineMode = true;
        setSyncState('offline');
        return Promise.resolve();
      }
      saveInFlight = true;
      return supabaseWithRetry(function () { return window.PMP.Supabase.logDevNote(note); })
        .then(function () {
          if (!Array.isArray(S.devNotes)) S.devNotes = [];
          S.devNotes.push(note);
          S.lastLocalWriteAt = Date.now();
          setSyncState('synced');
        })
        .catch(function (e) {
          console.error(e);
          setSyncState('error', { toast: 'DEV NOTE FAILED' });
          return Promise.reject(e);
        })
        .finally(function () { saveInFlight = false; });
    }
    if (!Array.isArray(S.devNotes)) S.devNotes = [];
    S.devNotes.push(note);
    return flushLocalSave();
  },
  saveCompounds(compounds) {
    const list = Array.isArray(compounds) ? compounds : [];
    if (useSupabase()) {
      saveInFlight = true;
      return supabaseWithRetry(function () { return window.PMP.Supabase.saveCompounds(list); })
        .then(function () {
          S.lastLocalWriteAt = Date.now();
          setSyncState('synced');
        })
        .catch(function (e) {
          console.error(e);
          setSyncState('error', { toast: 'SAVE FAILED' });
          return Promise.reject(e);
        })
        .finally(function () { saveInFlight = false; });
    }
    S.compounds = list;
    return flushLocalSave();
  },
  saveEmployees(employees) {
    const list = Array.isArray(employees) ? employees : [];
    if (useSupabase()) {
      saveInFlight = true;
      return supabaseWithRetry(function () { return window.PMP.Supabase.saveEmployees(list); })
        .then(function () {
          S.lastLocalWriteAt = Date.now();
          setSyncState('synced');
        })
        .catch(function (e) {
          console.error(e);
          setSyncState('error', { toast: 'SAVE FAILED' });
          return Promise.reject(e);
        })
        .finally(function () { saveInFlight = false; });
    }
    S.employees = list;
    return flushLocalSave();
  },
  saveScheduleEntries(entries) {
    const list = Array.isArray(entries) ? entries : [];
    if (useSupabase()) {
      saveInFlight = true;
      return supabaseWithRetry(function () { return window.PMP.Supabase.saveScheduleEntries(list); })
        .then(function () {
          S.lastLocalWriteAt = Date.now();
          setSyncState('synced');
        })
        .catch(function (e) {
          console.error(e);
          setSyncState('error', { toast: 'SAVE FAILED' });
          return Promise.reject(e);
        })
        .finally(function () { saveInFlight = false; });
    }
    S.scheduleEntries = list;
    return flushLocalSave();
  },
  saveSnapshot() {
    if (!useSupabase()) scheduleSave();
  },
  saveJobs(jobs) {
    if (useSupabase()) {
      return Promise.all(jobs.map((j) => window.PMP.Supabase.saveJob(j)))
        .then(() => { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
        .catch((e) => { setSyncState('error'); return Promise.reject(e); });
    }
    return flushLocalSave();
  },
};

function buildLocalPayload() {
  return {
    jobs: S.jobs,
    presses: S.presses,
    todos: S.todos,
    qcLog: S.qcLog,
    devNotes: S.devNotes || [],
    compounds: S.compounds || [],
    employees: S.employees || [],
    scheduleEntries: S.scheduleEntries || [],
    lastReset: S._lastReset || new Date().toDateString(),
    notesChannels: S.notesChannels || null,
  };
}

async function guardedLocalWrite() {
  var payload = buildLocalPayload();
  var ok = await safeSet(STORE_KEY, payload);
  if (ok) {
    setSyncState('synced');
    return true;
  }

  var pruned = pruneForQuota(JSON.parse(JSON.stringify(payload)));
  ok = await safeSet(STORE_KEY, pruned.payload);
  if (ok) {
    setSyncState('synced');
    if (typeof toast === 'function') toast('Storage recovered — some history pruned');
    return true;
  }

  setSyncState('quota');
  if (typeof toastError === 'function') toastError('Local storage full — data may not be saved');
  return false;
}

function flushLocalSave() {
  if (useSupabase()) return Promise.resolve();
  setSyncState('saving');
  clearTimeout(saveTimer);
  saveTimer = null;
  return guardedLocalWrite();
}

function scheduleSave() {
  if (useSupabase()) return;
  setSyncState('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () { guardedLocalWrite(); }, 800);
}
