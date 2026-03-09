// ============================================================
// STORAGE — unified on window.storage, no localStorage split
// ============================================================
const STORE_KEY = 'pmp_ops_data';

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

async function safeSet(k, v) {
  const data = JSON.stringify(v);
  try {
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(k, data, true);
      return;
    }
  } catch {}
  try {
    localStorage.setItem(k, data);
  } catch {}
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
  try {
    if (!data) return;
    const payload = { jobs: data.jobs || [], presses: data.presses || [], todos: data.todos || null, qcLog: data.qcLog || [], lastReset: data.lastReset || null, fetchedAt: new Date().toISOString() };
    localStorage.setItem(OFFLINE_SNAPSHOT_KEY, JSON.stringify(payload));
  } catch {}
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
    loadAll().then(() => replayQueue()).then(() => loadAll());
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
    if (!raw) return { jobs: [], presses: [], todos: JSON.parse(JSON.stringify(DEFAULT_TODOS)), qcLog: [], lastReset: null };
    const data = JSON.parse(raw);
    return {
      jobs: data.jobs || [],
      presses: data.presses || [],
      todos: data.todos || { daily: [], weekly: [], standing: [] },
      qcLog: data.qcLog || [],
      lastReset: data.lastReset || null,
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
          if (S._pressStationWrite) S._pressStationWrite = false;
          setTimeout(function () { pendingWrites.delete(job.id); }, 6000);
        })
        .catch(function (e) {
          console.error(e);
          if (S._pressStationWrite) {
            console.error('[PMP] Press Station saveJob Supabase error:', { code: e?.code, message: e?.message, details: e?.details }, e);
            S._pressStationWrite = false;
          }
          pendingWrites.delete(job.id);
          setSyncState('error', { toast: 'SAVE FAILED' });
          return Promise.reject(e);
        })
        .finally(function () { saveInFlight = false; });
    }
    pendingWrites.delete(job.id);
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
          if (S._pressStationWrite) {
            console.error('[PMP] Press Station logProgress Supabase error:', { code: e?.code, message: e?.message, details: e?.details }, e);
            S._pressStationWrite = false;
          }
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

function flushLocalSave() {
  if (useSupabase()) return Promise.resolve();
  setSyncState('saving');
  clearTimeout(saveTimer);
  saveTimer = null;
  const payload = {
    jobs: S.jobs,
    presses: S.presses,
    todos: S.todos,
    qcLog: S.qcLog,
    lastReset: S._lastReset || new Date().toDateString(),
  };
  return safeSet(STORE_KEY, payload).then(() => setSyncState('synced'));
}

function scheduleSave() {
  if (useSupabase()) return;
  setSyncState('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await safeSet(STORE_KEY, {
      jobs: S.jobs,
      presses: S.presses,
      todos: S.todos,
      qcLog: S.qcLog,
      lastReset: S._lastReset || new Date().toDateString(),
    });
    setSyncState('synced');
  }, 800);
}
