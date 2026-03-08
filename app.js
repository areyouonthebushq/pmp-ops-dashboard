    // ============================================================
    // MATRIX RAIN — Uses requestAnimationFrame, auto-pauses when hidden
    // ============================================================
    (()=>{
    const c = document.getElementById('rain'), ctx = c.getContext('2d');
    const sz = () => { c.width = innerWidth; c.height = innerHeight; };
    sz(); addEventListener('resize', sz);
    const ch = 'アイウエオ01カキクケコ10サシスセソ';
    let drops = [];
    const reset = () => {
        drops = Array(Math.floor(c.width / 18)).fill(0).map(() => Math.random() * c.height / 18 | 0);
    };
    reset(); addEventListener('resize', reset);

    let last = 0;
    function frame(ts) {
        if (ts - last > 55) {
        last = ts;
        ctx.fillStyle = 'rgba(6,8,6,0.06)';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#00e676';
        ctx.font = '13px monospace';
        drops.forEach((y, i) => {
            ctx.fillText(ch[Math.random() * ch.length | 0], i * 18, y * 18);
            if (y * 18 > c.height && Math.random() > 0.97) drops[i] = 0;
            else drops[i]++;
        });
        }
        rafId = requestAnimationFrame(frame);
    }
    let rafId = requestAnimationFrame(frame);

    // Pause when tab hidden
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
    // SAMPLE DATA — empty defaults; Supabase seed.sql is the source of demo data
    // ============================================================
    const SAMPLE_JOBS = [];

    const SAMPLE_QC = [];

    const SAMPLE_PRESSES = [
    {id:'p1', name:'PRESS 1', type:'LP',  status:'idle', job_id:null},
    {id:'p2', name:'PRESS 2', type:'LP',  status:'idle', job_id:null},
    {id:'p3', name:'PRESS 3', type:'LP',  status:'idle', job_id:null},
    {id:'p4', name:'7" PRESS',type:'7"',  status:'idle', job_id:null},
    ];

    // ============================================================
    // STATE — seeded with sample data for first run
    // ============================================================
    let S = {
    jobs: [],
    presses: JSON.parse(JSON.stringify(SAMPLE_PRESSES)),
    todos: JSON.parse(JSON.stringify(DEFAULT_TODOS)),
    qcLog: [],
    mode: 'floor',
    editId: null,
    qcSelectedJob: null,
    floorCardJobId: null,
    floorCardEditMode: false,
    // Station context (optional). When null/empty, app shows admin shell (#app).
    stationType: null,       // 'admin' | 'floor_manager' | 'press' | 'qc'
    stationId: '',
    assignedPressId: null,   // for stationType === 'press'
    dataChangedWhileEditing: false,
    offlineMode: false,
    lastLocalWriteAt: 0,
    };
    let saveTimer = null;

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

    // Legacy compatibility: migrate cached press objects from `job` to `job_id` during hydration. Remove after old local snapshots are no longer in use.
    function normalizeLegacyPresses(presses) {
    if (!Array.isArray(presses)) return presses;
    presses.forEach(p => {
        if (p && p.job_id == null && p.job != null) {
        p.job_id = p.job;
        }
    });
    return presses;
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
    let curAssets = {};
    let panelOpen = false;
    let panelEditMode = false;
    // Conflict detection: track jobs/presses modified locally since last poll
    const pendingWrites = new Map();
    const pendingPressWrites = new Map();
    const CONFLICT_WINDOW_MS = 10000;
    let saveInFlight = false;

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

    // ============================================================
    // STATION CONTEXT — helpers for future station-specific shells.
    // When no station is set, these return null/false; existing behavior unchanged.
    // ============================================================
    /** Returns current station context or null if not in station mode. */
    function getStationContext() {
    if (!S.stationType) return null;
    return {
        stationType: S.stationType,
        stationId: S.stationId || '',
        assignedPressId: S.assignedPressId || null,
    };
    }
    /** True if current station matches type (e.g. isStationType('press')). */
    function isStationType(type) {
    return S.stationType === type;
    }
    /** For press stations: the press object for assignedPressId, or null. */
    function getStationPress() {
    if (S.stationType !== 'press' || !S.assignedPressId) return null;
    return S.presses.find(p => p.id === S.assignedPressId) || null;
    }
    /** Job currently on this station's assigned press (press stations only). */
    function getStationJob() {
    const press = getStationPress();
    return press && press.job_id ? S.jobs.find(j => j.id === press.job_id) || null : null;
    }
    /** Set station context; call when entering a station shell (future). */
    function setStationContext(opts) {
    S.stationType = opts.stationType ?? null;
    S.stationId = opts.stationId ?? '';
    S.assignedPressId = opts.assignedPressId ?? null;
    }

    // ============================================================
    // SHELL VISIBILITY — one source for admin vs station shells
    // IDs of station shell elements (Press, QC, Floor Manager). Admin UI lives in #app.
    // ============================================================
    const STATION_SHELL_IDS = ['pressStationShell', 'qcStationShell', 'floorManagerShell'];

    /** Hide all station shells and show the admin shell (#app) and bar UI (fab, syncbar). */
    function hideAllShells() {
    const app = document.getElementById('app');
    if (app) app.style.display = 'block';
    STATION_SHELL_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('on');
    });
    const fab = document.getElementById('fab');
    if (fab) fab.style.display = 'flex';
    const fabLabel = document.querySelector('.fab-label');
    if (fabLabel) fabLabel.style.display = 'block';
    const syncbar = document.querySelector('.syncbar');
    if (syncbar) syncbar.style.display = 'block';
    }

    /** Show only the requested station shell; hide admin and other shells. Call after setStationContext. */
    function showShell(shellId) {
    hideAllShells();
    const app = document.getElementById('app');
    if (app) app.style.display = 'none';
    const el = document.getElementById(shellId);
    if (el) el.classList.add('on');
    const fab = document.getElementById('fab');
    if (fab) fab.style.display = 'none';
    const fabLabel = document.querySelector('.fab-label');
    if (fabLabel) fabLabel.style.display = 'none';
    const syncbar = document.querySelector('.syncbar');
    if (syncbar) syncbar.style.display = 'none';
    }

    /** Return to admin/launcher: clear station context, show admin shell, hide all station shells, re-render. */
    function returnToAdmin() {
    setStationContext({});
    hideAllShells();
    renderAll();
    }

    /** True if any station shell is currently visible (so admin shortcuts should be disabled). */
    function isStationShellVisible() {
    return STATION_SHELL_IDS.some(id => {
        const el = document.getElementById(id);
        return el && el.classList.contains('on');
    });
    }

    // ============================================================
    // AUTH ROLE — from profile when Supabase auth enabled; null in local mode
    // ============================================================
    function getAuthRole() {
    const p = window.PMP && window.PMP.userProfile;
    return (p && p.role) ? p.role : null;
    }
    function getAuthAssignedPressId() {
    const p = window.PMP && window.PMP.userProfile;
    return (p && p.assigned_press_id) ? p.assigned_press_id : null;
    }
    /** True if current user (by role) may enter this station type. */
    function mayEnterStation(choice, pressId) {
    const role = getAuthRole();
    if (!role) return true; // local mode: allow all
    if (role === 'admin') return true;
    if (role === 'floor_manager') return choice === 'floor_manager';
    if (role === 'press') return choice === 'press' && !!pressId;
    if (role === 'qc') return choice === 'qc';
    return false;
    }

    // ============================================================
    // STATION EDIT PERMISSIONS — derived from authenticated role when present
    // When no role (local mode), falls back to station context; DB enforces when Supabase used.
    // ============================================================
    function getStationEditPermissions() {
    const role = getAuthRole();
    const ctx = getStationContext();
    const assignedPress = getAuthAssignedPressId();

    if (!role) {
        if (!ctx) return { canUseFullPanel: true, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly'], canLogPressProgress: true, canLogQC: true };
        switch (ctx.stationType) {
            case 'floor_manager': return { canUseFullPanel: false, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly'], canLogPressProgress: false, canLogQC: false };
            case 'press': return { canUseFullPanel: false, canUseFloorCard: false, floorCardFields: [], canLogPressProgress: true, canLogQC: false };
            case 'qc': return { canUseFullPanel: false, canUseFloorCard: false, floorCardFields: [], canLogPressProgress: false, canLogQC: true };
            default: return { canUseFullPanel: true, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly'], canLogPressProgress: true, canLogQC: true };
        }
    }

    switch (role) {
        case 'admin':
            return { canUseFullPanel: true, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly'], canLogPressProgress: true, canLogQC: true };
        case 'floor_manager':
            return { canUseFullPanel: false, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly'], canLogPressProgress: false, canLogQC: false };
        case 'press': {
            const inPressStation = ctx && ctx.stationType === 'press';
            return { canUseFullPanel: false, canUseFloorCard: false, floorCardFields: [], canLogPressProgress: !!inPressStation, canLogQC: false };
        }
        case 'qc':
            return { canUseFullPanel: false, canUseFloorCard: false, floorCardFields: [], canLogPressProgress: false, canLogQC: true };
        default:
            return { canUseFullPanel: false, canUseFloorCard: false, floorCardFields: [], canLogPressProgress: false, canLogQC: false };
    }
    }

    /** True if current context may edit this floor-card field (or any field when in admin). */
    function canEditField(field) {
    const p = getStationEditPermissions();
    if (p.canUseFullPanel) return true;
    return p.floorCardFields.indexOf(field) !== -1;
    }

    // ============================================================
    // STORAGE — unified on window.storage, no localStorage split
    // ============================================================
    const STORE_KEY = 'pmp_ops_data';

    async function safeGet(k) {
    // Try window.storage first (Claude artifact environment)
    try {
        if (window.storage && typeof window.storage.get === 'function') {
        const r = await window.storage.get(k, true);
        return r ? r.value : null;
        }
    } catch {}
    // Fallback: localStorage (Vercel / standalone deployment)
    try {
        const v = localStorage.getItem(k);
        return v || null;
    } catch { return null; }
    }
    async function safeSet(k, v) {
    const data = JSON.stringify(v);
    // Try window.storage first (Claude artifact environment)
    try {
        if (window.storage && typeof window.storage.set === 'function') {
        await window.storage.set(k, data, true);
        return;
        }
    } catch {}
    // Fallback: localStorage
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

    async function loadAll() {
    console.log('[PMP] loadAll start');
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

    // ============================================================
    // PERSISTENCE LAYER — single interface; UI does not branch on backend
    // Supabase when available; otherwise window.storage / localStorage
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
          return window.PMP.Supabase.saveJob(job)
            .then(() => {
              S.lastLocalWriteAt = Date.now();
              setSyncState('synced');
              setTimeout(() => pendingWrites.delete(job.id), 6000);
            })
            .catch((e) => {
              console.error(e);
              pendingWrites.delete(job.id);
              setSyncState('error', { toast: 'SAVE FAILED' });
            })
            .finally(() => { saveInFlight = false; });
        }
        pendingWrites.delete(job.id);
        scheduleSave();
        return Promise.resolve();
      },
      /** Update only job assets (used by assets overlay to avoid full-row upsert). */
      updateJobAssets(jobId, assets) {
        if (useSupabase()) {
          if (isOffline()) {
            pushToOfflineQueue('job_assets', { jobId, assets });
            S.offlineMode = true;
            setSyncState('offline');
            return Promise.resolve();
          }
          return window.PMP.Supabase.updateJobAssets(jobId, assets)
            .then(() => { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
            .catch((e) => {
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
          return window.PMP.Supabase.deleteJob(id)
            .then(() => window.PMP.Supabase.savePresses(S.presses))
            .then(() => { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
            .catch((e) => { console.error(e); setSyncState('error', { toast: 'DELETE FAILED' }); })
            .finally(() => { saveInFlight = false; });
        }
        scheduleSave();
        return Promise.resolve();
      },
      savePresses(presses) {
        presses.forEach(p => {
          pendingPressWrites.set(p.id, { timestamp: Date.now(), job_id: p.job_id, status: p.status });
        });
        if (useSupabase()) {
          saveInFlight = true;
          return window.PMP.Supabase.savePresses(presses)
            .then(() => {
              S.lastLocalWriteAt = Date.now();
              setSyncState('synced');
              setTimeout(() => pendingPressWrites.clear(), 6000);
            })
            .catch(() => {
              pendingPressWrites.clear();
              setSyncState('error');
            })
            .finally(() => { saveInFlight = false; });
        }
        pendingPressWrites.clear();
        scheduleSave();
        return Promise.resolve();
      },
      saveTodos(todos) {
        if (useSupabase()) {
          return window.PMP.Supabase.saveTodos(todos).then(() => { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); }).catch(() => setSyncState('error'));
        }
        scheduleSave();
        return Promise.resolve();
      },
      logProgress(entry) {
        if (useSupabase()) {
          if (isOffline()) {
            pushToOfflineQueue('progress', entry);
            S.offlineMode = true;
            setSyncState('offline');
            return Promise.resolve();
          }
          saveInFlight = true;
          return window.PMP.Supabase.logProgress(entry)
            .then(() => { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
            .catch((e) => { console.error(e); setSyncState('error', { toastError: 'LOG FAILED' }); })
            .finally(() => { saveInFlight = false; });
        }
        scheduleSave();
        return Promise.resolve();
      },
      logQC(entry) {
        if (useSupabase()) {
          if (isOffline()) {
            pushToOfflineQueue('qc', entry);
            S.offlineMode = true;
            setSyncState('offline');
            return Promise.resolve();
          }
          saveInFlight = true;
          return window.PMP.Supabase.logQC(entry)
            .then(() => { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); })
            .catch((e) => { console.error(e); setSyncState('error', { toast: 'QC LOG FAILED' }); })
            .finally(() => { saveInFlight = false; });
        }
        scheduleSave();
        return Promise.resolve();
      },
      saveSnapshot() {
        if (!useSupabase()) scheduleSave();
      },
      saveJobs(jobs) {
        if (useSupabase()) {
          return Promise.all(jobs.map((j) => window.PMP.Supabase.saveJob(j))).then(() => { S.lastLocalWriteAt = Date.now(); setSyncState('synced'); });
        }
        scheduleSave();
        return Promise.resolve();
      },
    };

    function checkTodoReset() {
    const today = new Date().toDateString();
    if (S._lastReset === today) return;
    S.todos.daily?.forEach(t => { t.done = false; t.who = ''; });
    if (new Date().getDay() === 1) S.todos.weekly?.forEach(t => { t.done = false; t.who = ''; });
    S._lastReset = today;
    }

    // ============================================================
    const PROGRESS_STAGES = ['pressed', 'qc_passed', 'rejected'];

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

    function logJobProgress(jobId, stage, qty, person) {
    const job = S.jobs.find(j => j.id === jobId);
    if (!job) return { ok: false, error: 'Job not found' };
    ensureJobProgressLog(job);
    if (!PROGRESS_STAGES.includes(stage)) return { ok: false, error: 'INVALID STAGE' };
    const q = parseInt(qty, 10);
    if (!Number.isInteger(q) || q < 1) return { ok: false, error: 'qty must be a positive integer' };
    const cur = getJobProgress(job);
    if (stage === 'qc_passed' || stage === 'rejected') {
        const newQC = cur.qcPassed + (stage === 'qc_passed' ? q : 0);
        const newRej = cur.rejected + (stage === 'rejected' ? q : 0);
        if (newQC + newRej > cur.pressed) return { ok: false, error: 'qc_passed + rejected cannot exceed pressed' };
    }
    const personVal = (person != null && String(person).trim()) ? String(person).trim() : 'UNKNOWN';
    const timestamp = new Date().toISOString();
    job.progressLog.push({ qty: q, stage, person: personVal, timestamp });
    Storage.logProgress({ job_id: jobId, qty: q, stage, person: personVal, timestamp });
    return { ok: true };
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

    /** Progress detail overlay: bar from left (QC · pressed · remaining · rejected), same as press status bar. */
    function openProgressDetail(jobId) {
    const job = S.jobs.find(j => j.id === jobId);
    if (!job) return;
    const el = document.getElementById('progressDetailOverlay');
    if (!el) return;
    const p = getJobProgress(job);
    const ordered = p.ordered;
    const completePct = ordered ? Math.round((p.qcPassed / ordered) * 100) : 0;
    const rejectedPct = ordered ? (p.rejected / ordered) * 100 : 0;
    const qcPct = ordered ? (p.qcPassed / ordered) * 100 : 0;
    const pendingPct = ordered ? (p.pendingQC / ordered) * 100 : 0;
    const remainingPct = ordered ? Math.max(0, (ordered - p.pressed) / ordered) * 100 : 100;

    document.getElementById('progressDetailTitle').textContent = `${job.catalog || '—'} · ${job.artist || '—'}`;
    const rPct = ordered ? Math.round((p.rejected / ordered) * 100) : 0;
    const gPct = ordered ? Math.round((p.qcPassed / ordered) * 100) : 0;
    const yPct = ordered ? Math.round((p.pendingQC / ordered) * 100) : 0;
    const remPct = ordered ? Math.round(((ordered - p.pressed) / ordered) * 100) : 100;
    document.getElementById('progressDetailPct').textContent = `${completePct}% COMPLETE`;
    const pctBreakdown = document.getElementById('progressDetailPctBreakdown');
    if (pctBreakdown) pctBreakdown.textContent = `Pressed ${yPct}% · QC ${gPct}% · Rejected ${rPct}% · Remaining ${remPct}%`;
    // Bar segments left-to-right: QC (green), pressed (yellow), remaining (grey), rejected (red) — same origin as press status bar
    document.getElementById('progressDetailBar').innerHTML = [
        qcPct > 0 ? `<div class="pd-seg qc" style="width:${qcPct}%" title="QC passed: ${p.qcPassed.toLocaleString()}"></div>` : '',
        pendingPct > 0 ? `<div class="pd-seg pressed" style="width:${pendingPct}%" title="Pending QC: ${p.pendingQC.toLocaleString()}"></div>` : '',
        remainingPct > 0 ? `<div class="pd-seg remaining" style="width:${remainingPct}%"></div>` : '',
        rejectedPct > 0 ? `<div class="pd-seg rejected" style="width:${rejectedPct}%" title="Rejected: ${p.rejected.toLocaleString()}"></div>` : '',
    ].filter(Boolean).join('') || '<div class="pd-seg remaining" style="width:100%"></div>';
    document.getElementById('progressDetailLegend').innerHTML = [
        `<span><span class="pd-dot pressed"></span> Pressed (pending QC): ${p.pendingQC.toLocaleString()} (${yPct}%)</span>`,
        `<span><span class="pd-dot qc"></span> QC passed: ${p.qcPassed.toLocaleString()} (${gPct}%)</span>`,
        `<span><span class="pd-dot rejected"></span> Rejected: ${p.rejected.toLocaleString()} (${rPct}%)</span>`,
        `<span><span class="pd-dot remaining"></span> Remaining: ${(ordered - p.pressed).toLocaleString()} (${remPct}%)</span>`,
    ].join('');
    el.classList.add('on');
    }
    function closeProgressDetail() {
    const el = document.getElementById('progressDetailOverlay');
    if (el) el.classList.remove('on');
    }

    /** Assets overlay: editable checklist; syncs to job on SAVE. */
    let assetsOverlayState = null;
    function openAssetsOverlay(jobId) {
    const job = S.jobs.find(j => j.id === jobId);
    if (!job) return;
    assetsOverlayState = { jobId, data: JSON.parse(JSON.stringify(job.assets || {})) };
    document.getElementById('assetsOverlayTitle').textContent = `${job.catalog || '—'} · ${job.artist || '—'}`;
    renderAssetsOverlay();
    document.getElementById('assetsOverlay').classList.add('on');
    }
    function closeAssetsOverlay(skipSave) {
    if (!assetsOverlayState) {
      assetsOverlayState = null;
      const el = document.getElementById('assetsOverlay');
      if (el) el.classList.remove('on');
      return;
    }
    flushAssetsOverlayInputs();
    const job = S.jobs.find(j => j.id === assetsOverlayState.jobId);
    if (!job) {
      assetsOverlayState = null;
      const el = document.getElementById('assetsOverlay');
      if (el) el.classList.remove('on');
      return;
    }
    job.assets = JSON.parse(JSON.stringify(assetsOverlayState.data));
    if (skipSave) {
      assetsOverlayState = null;
      const el = document.getElementById('assetsOverlay');
      if (el) el.classList.remove('on');
      renderAll();
      return;
    }
    Storage.updateJobAssets(job.id, job.assets)
      .then(() => {
        assetsOverlayState = null;
        const el = document.getElementById('assetsOverlay');
        if (el) el.classList.remove('on');
        renderAll();
      })
      .catch(() => { /* toast already shown by Storage */ });
  }
    /** Read current values from open asset-detail inputs into state (so re-render or close doesn't lose edits). */
    function flushAssetsOverlayInputs() {
    if (!assetsOverlayState) return;
    ASSET_DEFS.forEach(a => {
        const detailEl = document.getElementById('ado-' + a.key);
        if (!detailEl || !detailEl.classList.contains('open')) return;
        const inputs = detailEl.querySelectorAll('input[type="date"], input[type="text"]');
        if (!assetsOverlayState.data[a.key]) assetsOverlayState.data[a.key] = { received: false, date: '', person: '', na: false, note: '' };
        if (inputs.length >= 1) assetsOverlayState.data[a.key].date = (inputs[0].value || '').trim();
        if (inputs.length >= 2) assetsOverlayState.data[a.key].person = (inputs[1].value || '').trim();
        if (inputs.length >= 3) assetsOverlayState.data[a.key].note = (inputs[2].value || '').trim();
    });
    }
    function renderAssetsOverlay() {
    if (!assetsOverlayState) return;
    const data = assetsOverlayState.data;
    const received = ASSET_DEFS.filter(a => data[a.key]?.received).length;
    const na = ASSET_DEFS.filter(a => data[a.key]?.na).length;
    const remaining = ASSET_DEFS.length - received - na;
    const allDone = remaining === 0;
    let summaryHTML = `<div class="asset-summary">
        <span class="as-received"><span class="as-num">${received}</span> received</span>
        <span class="as-na"><span class="as-num">${na}</span> N/A</span>
        <span class="as-remaining"><span class="as-num">${remaining}</span> remaining</span>
        ${allDone ? '<span class="as-complete">✓ ALL ASSETS READY</span>' : ''}
    </div>`;
    const listEl = document.getElementById('assetsOverlayList');
    if (!listEl) return;
    listEl.innerHTML = summaryHTML + ASSET_DEFS.map(a => {
        const d = data[a.key] || { received: false, date: '', person: '', note: '', na: false };
        return `
        <div>
            <div class="asset-row ${d.received ? 'got' : ''} ${d.na ? 'na' : ''}"
                onclick="${d.na ? '' : "toggleAssetsOverlayReceived('" + a.key + "')"}">
            <div class="acheck">${d.received ? '✓' : ''}</div>
            <div class="aname">${a.label}</div>
            <div class="adate">${d.date || ''}</div>
            <div style="display:flex;gap: var(--space-sm);align-items:center">
                <div class="awho">${d.person || ''}</div>
                <button class="na-btn" onclick="event.stopPropagation();toggleAssetsOverlayNA('${a.key}')">${d.na ? 'RESTORE' : 'N/A'}</button>
                ${d.received ? `<button class="na-btn" onclick="event.stopPropagation();toggleAssetsOverlayDetail('${a.key}')">▾</button>` : ''}
            </div>
            </div>
            <div class="asset-detail" id="ado-${a.key}">
            <div>
                <div class="adl">DATE RECEIVED</div>
                <input type="date" value="${d.date || ''}" onchange="updateAssetsOverlay('${a.key}','date',this.value)">
            </div>
            <div>
                <div class="adl">RECEIVED BY</div>
                <input type="text" value="${escapeHtml(d.person || '')}" placeholder="Name" onchange="updateAssetsOverlay('${a.key}','person',this.value)">
            </div>
            <div style="grid-column:1/-1">
                <div class="adl">NOTE</div>
                <input type="text" value="${escapeHtml(d.note || '')}" placeholder="Note…" onchange="updateAssetsOverlay('${a.key}','note',this.value)">
            </div>
            </div>
        </div>
        `;
    }).join('');
    }
    function toggleAssetsOverlayReceived(key) {
    if (!assetsOverlayState) return;
    flushAssetsOverlayInputs();
    const d = assetsOverlayState.data[key] || { received: false, date: '', person: '', na: false, note: '' };
    assetsOverlayState.data[key] = { ...d, received: !d.received, na: d.na ? false : d.na };
    if (assetsOverlayState.data[key].received && !assetsOverlayState.data[key].date)
        assetsOverlayState.data[key].date = new Date().toISOString().split('T')[0];
    renderAssetsOverlay();
    }
    function toggleAssetsOverlayNA(key) {
    if (!assetsOverlayState) return;
    flushAssetsOverlayInputs();
    const d = assetsOverlayState.data[key] || { received: false, date: '', person: '', na: false, note: '' };
    assetsOverlayState.data[key] = { ...d, na: !d.na, received: d.na ? d.received : false };
    renderAssetsOverlay();
    }
    function toggleAssetsOverlayDetail(key) {
    const el = document.getElementById('ado-' + key);
    if (el) el.classList.toggle('open');
    }
    function updateAssetsOverlay(key, field, val) {
    if (!assetsOverlayState) return;
    if (!assetsOverlayState.data[key]) assetsOverlayState.data[key] = { received: false, date: '', person: '', na: false, note: '' };
    assetsOverlayState.data[key][field] = val;
    }
    function saveAssetsOverlay() {
    if (!assetsOverlayState) return;
    flushAssetsOverlayInputs();
    const job = S.jobs.find(j => j.id === assetsOverlayState.jobId);
    if (!job) { closeAssetsOverlay(true); return; }
    job.assets = JSON.parse(JSON.stringify(assetsOverlayState.data));
    Storage.updateJobAssets(job.id, job.assets)
      .then(() => {
        assetsOverlayState = null;
        const el = document.getElementById('assetsOverlay');
        if (el) el.classList.remove('on');
        renderAll();
        if (typeof toast === 'function') toast('ASSETS SAVED');
      })
      .catch(() => { /* toast already shown by Storage */ });
  }

    // Link QC reject to production progress: 1 defect log = 1 rejected unit when possible.
    // Keeps displayed rejected totals aligned with QC log without breaking progress rules.
    function tryAddQCRejectToProgress(jobId) {
    if (!jobId) return { applied: false };
    const result = logJobProgress(jobId, 'rejected', 1, 'QC');
    return result.ok ? { applied: true } : { applied: false, error: result.error };
    }

    // Data sync: Supabase Realtime when active, else 15s polling. Single path; no duplicate subscriptions.
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
                S.dataChangedWhileEditing = true;
                console.log('[PMP] Realtime event → showDataChangedNotice');
                showDataChangedNotice();
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
    if (editBtn) editBtn.textContent = enabled ? 'VIEWING' : 'EDIT';

    if (!enabled) {
        const progressForm = body.querySelector('.progress-log-form');
        if (progressForm) {
        progressForm.querySelectorAll('input, select, button').forEach(el => {
            el.removeAttribute('disabled');
            el.style.opacity = '';
            el.style.pointerEvents = '';
        });
        }
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
    }

    // ============================================================
    // STATION LAUNCHER — single entry point, persist last choice
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

    /** Enter app from launcher: admin | floor_manager | press | qc. For press, pass pressId (e.g. p1). Role enforced; press role uses assigned_press_id. */
    function enterByLauncher(choice, pressId) {
    const role = getAuthRole();
    const effectivePressId = (role === 'press' && choice === 'press') ? pressId : (role === 'press' ? getAuthAssignedPressId() : pressId);
    if (!mayEnterStation(choice, effectivePressId)) {
        if (typeof toast === 'function') toast('Not allowed for your role.');
        return;
    }
    hideLauncherPressPicker();
    document.getElementById('modeScreen').style.display = 'none';
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

    if (choice === 'admin') {
        setStationContext({});
        hideAllShells();
        setLastLauncherChoice({ stationType: null });
        const navAudit = document.getElementById('navAudit');
        if (navAudit) navAudit.style.display = getAuthRole() === 'admin' ? '' : 'none';
        renderAll();
        return;
    }
    document.getElementById('app').style.display = 'block';
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
        hideAllShells();
        goPg('qc');
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
    renderLauncherLast(); // show "Last: …" on load if persisted

    // ============================================================
    // AUTH — Supabase email/password; launcher only after login when auth enabled
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

    /** Show/hide launcher buttons by authenticated role. No role = show all (local mode). */
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
        show(fmBtn, true);
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
            show(fmBtn, true);
            show(pressBtn, true);
            if (pressBtn) pressBtn.onclick = toggleLauncherPressPicker;
            if (pressRow) { pressRow.querySelectorAll('.launcher-press-btn').forEach(b => { b.style.display = ''; }); pressRow.style.display = 'none'; }
            show(qcBtn, true);
            break;
        case 'floor_manager':
            show(adminBtn, false);
            show(fmBtn, true);
            show(pressBtn, false);
            showRow(pressRow, false);
            show(qcBtn, false);
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
            show(fmBtn, true);
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
            showLoginScreen(false);
        } else if (event === 'SIGNED_IN' && session) {
            fetchAndStoreProfile(session.user.id).then(() => showLauncher());
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
    showLauncher();
    }

    window.addEventListener('online', onOnline);

    window.addEventListener('popstate', () => {
    if (document.body.classList.contains('tv')) {
        exitTV();
    }
    // Do not reset to station-select on popstate: switching tabs / refocusing can fire popstate
    // on some browsers and would incorrectly send the user back to the launcher.
    });

    // ============================================================
    // APP ENTRY — enterApp still used internally; launcher is primary entry
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

    /** Exit station: return to launcher. Does NOT clear auth session. */
    function doLogout() {
    setStationContext({});
    hideLauncherPressPicker();
    renderLauncherLast();
    document.getElementById('app').style.display = 'none';
    document.getElementById('fab').style.display = 'none';
    document.body.classList.remove('tv');
    stopDataSync();
    showLauncher();
    }

    /** Sign out of auth entirely: clear session. onAuthStateChange(SIGNED_OUT) will show login. Call from launcher only. */
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
    // NAV — also updates FAB visibility per page context
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

    // FAB: context-aware visibility and action
    function updateFAB() {
    const fab = document.getElementById('fab');
    const label = document.getElementById('fabLabel');
    if (!fab) return;

    // Show FAB only on pages where "create new" makes sense
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
        openPanel(null);
    }
    }

    // ============================================================
    // AUDIT PAGE (admin only; RLS enforces)
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
    function escapeHtml(s) {
    if (s == null) return '';
    const t = document.createElement('textarea');
    t.textContent = s;
    return t.innerHTML;
    }

    // ============================================================
    // HELPERS
    // ============================================================
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

    function assetHealth(job) {
    const applicable = ASSET_DEFS.filter(a => !job.assets || job.assets[a.key]?.na !== true);
    const done = applicable.filter(a => job.assets && job.assets[a.key]?.received);
    return {done:done.length, total:applicable.length, pct:applicable.length ? done.length / applicable.length : 0};
    }

    function ahHTML(job) {
    const {done, total, pct} = assetHealth(job);
    const cls = pct >= 1 ? 'full' : pct >= 0.7 ? 'most' : pct >= 0.4 ? 'half' : 'low';
    return `<div class="ah">
        <div class="ah-bar"><div class="ah-fill ${cls}" style="width:${Math.round(pct*100)}%"></div></div>
        <span style="color:${pct >= 1 ? 'var(--g)' : pct >= 0.5 ? 'var(--w)' : 'var(--r)'}">${done}/${total}</span>
    </div>`;
    }

    // ============================================================
    // SHARED DATA & RENDER HELPERS — single source for floor/stats/press
    // All shells (Admin, Floor Manager, Press, QC) use these; no forked logic.
    // ============================================================
    /** Returns the five floor stats (presses, active, queued, overdue, total). */
    function getFloorStats() {
    const active = S.jobs.filter(j => ['pressing','assembly'].includes(j.status));
    const overdue = S.jobs.filter(j => j.due && j.status !== 'done' && new Date(j.due) < Date.now());
    const online = S.presses.filter(p => p.status === 'online').length;
    return [
        { v: `${online}/${S.presses.length}`, l: 'PRESSES', s: 'online', c: online < S.presses.length ? 'warn' : '' },
        { v: active.length, l: 'ACTIVE', s: 'pressing/assembly', c: '' },
        { v: S.jobs.filter(j => j.status === 'queue').length, l: 'QUEUED', s: 'waiting', c: '' },
        { v: overdue.length, l: 'OVERDUE', s: 'past due date', c: overdue.length ? 'red' : '' },
        { v: S.jobs.filter(j => j.status !== 'done').length, l: 'TOTAL OPEN', s: 'jobs in system', c: '' },
    ];
    }

    /** Active jobs (not done), optionally filtered by query. Returns { jobs, total }. */
    function getFloorJobs(query) {
    const q = (query || '').toLowerCase().trim();
    const total = S.jobs.filter(j => j.status !== 'done').length;
    let jobs = S.jobs.filter(j => j.status !== 'done');
    if (q) {
        jobs = jobs.filter(j =>
            (j.catalog || '').toLowerCase().includes(q) ||
            (j.artist || '').toLowerCase().includes(q) ||
            (j.album || '').toLowerCase().includes(q) ||
            (j.location || '').toLowerCase().includes(q)
        );
    }
    return { jobs, total };
    }

    /** One active-orders table row. Uses progressDisplay, dueClass, dueLabel, ahHTML, statusTapClass. */
    function floorTableRowHTML(j, opts) {
    const prog = progressDisplay(j);
    const statusId = (opts && opts.statusCellId) ? ` id="st-${j.id}"` : '';
    return `
    <tr>
    <td style="color:var(--w);font-weight:700">${j.catalog || '—'}</td>
    <td class="floor-card-trigger" onclick="openFloorCard('${j.id}')" title="Open floor statboard">
        <div style="color:var(--d)">${j.artist || '—'}</div>
        <div style="color:var(--d3);font-size:11px">${j.album || ''}</div>
    </td>
    <td>${j.format ? `<span class="pill ${j.format.includes('7"') ? 'seven' : 'go'}">${j.format}</span>` : '—'}</td>
    <td>
        <div class="status-tap ${statusTapClass(j.status)}"${statusId} onclick="cycleStatus('${j.id}')" title="Tap to change status">
        ${(j.status || 'queue').toUpperCase()}
        </div>
    </td>
    <td class="${dueClass(j.due)}">${dueLabel(j.due)}</td>
    <td class="assets-tap" onclick="openAssetsOverlay('${j.id}')" title="View and edit assets">${ahHTML(j)}</td>
    <td class="td-progress progress-tap" onclick="openProgressDetail('${j.id}')" title="View progress breakdown">
        <div class="progress-main">${prog.main}</div>
        <div class="dl-bar td">${progressDualBarHTML(prog.pressedPct, prog.qcPassedPct)}</div>
        <div class="progress-sub">${prog.sub}</div>
    </td>
    <td>${j.location ? `<span class="loc">${j.location}</span>` : '—'}</td>
    <td><button class="open-btn" onclick="openPanel('${j.id}')">${(opts && opts.openBtnLabel) || 'OPEN →'}</button></td>
    </tr>`;
    }

    /** One press card HTML. linkTo: 'panel' | 'floorCard' | 'pressStation'. showControls: show assign/status/STATION (admin only). */
    function buildPressCardHTML(p, linkTo, showControls) {
    const job = p.job_id ? S.jobs.find(j => j.id === p.job_id) : null;
    const ah = job ? assetHealth(job) : { done: 0, total: 0, pct: 0 };
    const prog = job ? progressDisplay(job) : null;
    const segs = ASSET_DEFS.slice(0, 8).map(a => {
        const got = job && job.assets && job.assets[a.key]?.received;
        return `<div class="abar-seg ${got ? 'done' : ''}"></div>`;
    }).join('');
    const isPressStation = linkTo === 'pressStation';
    // Admin: press name → station; job/band block → job panel. Else: one action for whole card.
    const jobBlockClick = (isPressStation && showControls && job) ? `openPanel('${job.id}')` : (linkTo === 'floorCard' ? `openFloorCard('${job?.id}')` : linkTo === 'pressStation' ? `openPressStation('${p.id}')` : `openPanel('${job?.id}')`);
    const hint = linkTo === 'floorCard' ? 'TAP → STATBOARD' : linkTo === 'pressStation' ? (showControls ? 'TAP → JOB PANEL' : 'TAP → STATION') : 'TAP TO OPEN →';
    const nameClick = isPressStation ? ` onclick="openPressStation('${p.id}')" style="cursor:pointer" title="Open Press Station"` : '';
    return `
    <div class="press-card ${p.status}">
        <div class="pc-head">
        <div class="pc-name ${p.type === '7"' ? 'seven' : ''}"${nameClick}>${p.name}</div>
        <div class="pc-status">
            <div class="psdot ${p.status}"></div>
            <span style="color:${p.status === 'online' ? 'var(--g)' : p.status === 'warning' ? 'var(--w)' : 'var(--r)'}">${p.status.toUpperCase()}</span>
        </div>
        </div>
        ${job ? `
        <div class="pc-job-link" onclick="${jobBlockClick}" title="${linkTo === 'floorCard' ? 'Open statboard' : (isPressStation && showControls ? 'Open job panel' : 'Open job')}">
            <div class="pc-job"><span class="job-id">${job.catalog || '—'}</span> — ${job.artist || ''}</div>
            <div class="pc-meta">${job.format || ''} · ${job.color || 'Black'} · ${job.weight || ''}</div>
            <div class="pc-meta">Qty: ${job.qty ? parseInt(job.qty).toLocaleString() : '—'}</div>
            <div class="pc-due ${dueClass(job.due)}">${dueLabel(job.due)}</div>
            <div class="pc-job-hint">${hint}</div>
        </div>
        <div class="pc-progress" onclick="event.stopPropagation(); openProgressDetail('${job.id}')" style="cursor:pointer" title="View progress breakdown">
            <div class="pc-progress-label">PROGRESS <span class="pc-progress-num">${prog.main}</span></div>
            <div class="pc-progress-bar-outer dl-bar pc">${progressDualBarHTML(prog.pressedPct, prog.qcPassedPct)}</div>
            <div class="pc-progress-sub">${prog.sub}</div>
            ${prog.overQty ? '<div class="pc-progress-over">OVER QTY</div>' : ''}
        </div>
        <div class="pc-assets pc-assets-demoted" onclick="event.stopPropagation(); openAssetsOverlay('${job.id}')" style="cursor:pointer" title="View and edit assets">
            <div class="pc-assets-label">Assets ${ah.done}/${ah.total}</div>
            <div class="abar abar-thin">${segs}</div>
        </div>
        ` : (isPressStation ? `<div class="pc-job-link" onclick="openPressStation('${p.id}')" title="Open Press Station" style="cursor:pointer"><div class="pc-idle-msg">NO JOB ASSIGNED</div></div>` : '<div class="pc-idle-msg">NO JOB ASSIGNED</div>')}
        ${showControls ? `
        <div class="pc-controls" onclick="event.stopPropagation()">
            <select class="pc-select" onchange="assignJob('${p.id}',this.value)">
            <option value="">— ASSIGN JOB</option>
            ${S.jobs.filter(j => j.status !== 'done').map(j => `<option value="${j.id}" ${p.job_id === j.id ? 'selected' : ''}>${j.catalog || j.id} · ${j.artist || ''}</option>`).join('')}
            </select>
            <select class="pc-select" style="max-width:110px" onchange="setPressStatus('${p.id}',this.value)">
            <option value="online"  ${p.status === 'online'  ? 'selected' : ''}>Online</option>
            <option value="warning" ${p.status === 'warning' ? 'selected' : ''}>Warning</option>
            <option value="offline" ${p.status === 'offline' ? 'selected' : ''}>Offline</option>
            <option value="idle"    ${p.status === 'idle'    ? 'selected' : ''}>Idle</option>
            </select>
            <button type="button" class="pc-station-btn" onclick="openPressStation('${p.id}')" title="Open as Press Station (single-press view)">STATION</button>
        </div>
        ` : ''}
    </div>`;
    }

    // ============================================================
    // RENDER ALL — single entry; all shells read from S and shared helpers
    // Admin, Floor Manager, Press Station, QC Station: same S.jobs, S.presses, S.qcLog;
    // getFloorStats, getFloorJobs, floorTableRowHTML, buildPressCardHTML, progressDisplay, assetHealth, etc.
    // ============================================================
    function renderAll() {
    const ctx = getStationContext();
    if (ctx && isStationType('press')) {
        renderPressStationShell();
        return;
    }
    if (ctx && isStationType('floor_manager')) {
        renderFloorManagerShell();
        return;
    }
    renderAdminShell();
    }

    // ============================================================
    // ADMIN SHELL — full workspace: nav, Floor / Jobs / Todos / QC, panel, TV.
    // #app is the admin shell container. Other shells (e.g. press, qc) use same data.
    // ============================================================
    function renderAdminShell() {
    renderStats();
    renderPresses();
    renderFloor();
    renderJobs();
    renderTodos();
    renderQC();
    renderTV();
    }

    // ============================================================
    // PRESS STATION SHELL (v1) — single-press workstation
    // ============================================================
    /** Open the Press Station view for a specific press. Call from admin (e.g. STATION on press card). */
    function openPressStation(pressId) {
    const p = S.presses.find(x => x.id === pressId);
    if (!p) return;
    setStationContext({ stationType: 'press', stationId: pressId, assignedPressId: pressId });
    showShell('pressStationShell');
    renderAll();
    }

    function exitPressStation() {
    doLogout();
    }

    function renderPressStationShell() {
    const press = getStationPress();
    const job = getStationJob();
    const nameEl = document.getElementById('psPressName');
    const contentEl = document.getElementById('pressStationContent');
    const logEl = document.getElementById('pressStationLog');
    if (!nameEl || !contentEl || !logEl) return;

    nameEl.textContent = press ? press.name : '—';
    nameEl.classList.toggle('seven', press && press.type === '7"');

    if (!job) {
        contentEl.innerHTML = `<div class="ps-v1-idle">NO JOB ASSIGNED</div><p style="color:var(--d3);margin-top:var(--space-sm)">Assign a job from Admin to start logging.</p>`;
        logEl.innerHTML = '';
        return;
    }

    const prog = getJobProgress(job);
    const ordered = prog.ordered;
    const pressed = prog.pressed;
    const remaining = Math.max(0, ordered - pressed);
    const pct = ordered ? Math.min(100, (pressed / ordered) * 100) : 0;
    const blocked = [];
    if (job.status === 'hold') blocked.push('Job on hold');
    if (remaining <= 0 && ordered > 0) blocked.push('Order complete');

    /* Order: JOB → PROGRESS → LOG PRESSED (primary action) → CONTROLS (hold/note secondary) */
    contentEl.innerHTML = `
    <div class="ps-v1-sec">JOB</div>
    <div class="ps-v1-job-title">${(job.catalog || '—')} · ${(job.artist || '—')}</div>
    <div class="ps-v1-job-meta">${job.album || ''} ${job.format ? ' · ' + job.format : ''}</div>
    <div class="ps-v1-sec">PROGRESS</div>
    <div class="ps-v1-stat-block">
        <div class="ps-v1-stat-row">
            <div class="ps-v1-stat"><span class="num">${ordered.toLocaleString()}</span> <span class="lbl">ORDERED</span></div>
            <div class="ps-v1-stat"><span class="num">${pressed.toLocaleString()}</span> <span class="lbl">PRESSED</span></div>
        </div>
        <div class="ps-v1-remaining">${remaining.toLocaleString()} REMAINING</div>
        <div class="ps-v1-bar"><div class="ps-v1-bar-fill" style="width:${pct}%"></div></div>
        ${blocked.length ? `<div class="ps-v1-blocked">${blocked.join(' · ')}</div>` : ''}
    </div>
    ${remaining > 0 ? `
    <div class="ps-v1-sec">LOG PRESSED</div>
    <div class="ps-v1-log-btns">
        <button type="button" class="ps-v1-log-btn" onclick="pressStationLogPressed(10)">+10</button>
        <button type="button" class="ps-v1-log-btn" onclick="pressStationLogPressed(25)">+25</button>
        <button type="button" class="ps-v1-log-btn" onclick="pressStationLogPressed(50)">+50</button>
        <button type="button" class="ps-v1-log-btn" onclick="pressStationLogPressed(100)">+100</button>
    </div>
    ` : ''}
    <div class="ps-v1-sec">CONTROLS</div>
    <div class="ps-v1-edit">
        <div class="ps-v1-edit-label">HOLD / NOTE</div>
        ${job.status === 'hold' ?
            `<button type="button" class="ps-v1-hold-btn resume" onclick="pressStationResume()">RESUME JOB</button>` :
            `<button type="button" class="ps-v1-hold-btn hold" onclick="pressStationHold()">HOLD JOB</button>`}
        <div class="ps-v1-edit-label" style="margin-top:var(--space-md)">Press note</div>
        <textarea class="ps-v1-note" id="psStationNote" placeholder="Note for this run…"></textarea>
        <div class="ps-v1-edit-actions">
            <button type="button" class="ps-v1-save-note" onclick="pressStationSaveNote()">SAVE NOTE</button>
        </div>
    </div>
    `;
    const noteEl = document.getElementById('psStationNote');
    if (noteEl) noteEl.value = job.notes || '';

    logEl.innerHTML = '';
    }

    function pressStationLogPressed(qty) {
    if (!getStationEditPermissions().canLogPressProgress) return;
    const job = getStationJob();
    if (!job) return;
    const result = logJobProgress(job.id, 'pressed', qty, 'Press Station');
    if (result.ok) {
        Storage.saveJob(job); // persist updated progressLog (Supabase or local)
        renderPressStationShell();
        toast(`+${qty} logged`);
    } else {
        toastError(result.error || 'Log failed');
    }
    }

    function pressStationHold() {
    const job = getStationJob();
    if (!job) return;
    job.status = 'hold';
    Storage.saveJob(job);
    renderPressStationShell();
    toast('Job on hold');
    }

    function pressStationResume() {
    const job = getStationJob();
    if (!job) return;
    job.status = 'pressing';
    Storage.saveJob(job);
    renderPressStationShell();
    toast('Job resumed');
    }

    function pressStationSaveNote() {
    const job = getStationJob();
    if (!job) return;
    const el = document.getElementById('psStationNote');
    if (el) job.notes = el.value.trim();
    Storage.saveJob(job);
    renderPressStationShell();
    toast('Note saved');
    }

    // ============================================================
    // QC STATION SHELL (v1) — rapid reject logging
    // ============================================================
    /** Open the QC Log page (same as Admin QC Log). Used by bar QC button and launcher QC Station. */
    function openQCStation() {
    hideAllShells();
    goPg('qc');
    renderAll();
    }

    function exitQCStation() {
    doLogout();
    }

    function renderQCStationShell() {
    const today = new Date().toDateString();
    const todayLog = S.qcLog.filter(e => e.date === today);
    const pressing = S.jobs.filter(j => ['pressing','assembly'].includes(j.status));
    const selectedJob = S.qcSelectedJob ? S.jobs.find(j => j.id === S.qcSelectedJob) : null;

    const currentEl = document.getElementById('qcStationCurrent');
    const jobsEl = document.getElementById('qcStationJobs');
    const btnsEl = document.getElementById('qcStationRejectBtns');
    const summaryEl = document.getElementById('qcStationSummary');
    const logEl = document.getElementById('qcStationLog');
    if (!currentEl || !jobsEl || !btnsEl || !summaryEl || !logEl) return;

    currentEl.innerHTML = selectedJob
        ? `${selectedJob.catalog || '—'} · ${selectedJob.artist || '—'}`
        : '<span class="none">Select a job below</span>';

    jobsEl.innerHTML = pressing.length
        ? pressing.map(j => `
            <button type="button" class="qcs-v1-job-btn ${S.qcSelectedJob === j.id ? 'active' : ''}" onclick="selectQCJob('${j.id}')">
            ${j.catalog || '—'} · ${j.artist || '—'}
            </button>
        `).join('')
        : '<span style="color:var(--d3);font-size:14px">No jobs pressing / in assembly</span>';

    const qcIcons = { FLASH:'⚡', BLEMISH:'◉', 'OFF-CENTER':'⊕', AUDIO:'♫', UNTRIMMED:'⬡', 'BISCUIT/FLASH':'✕' };
    btnsEl.innerHTML = QC_TYPES.map(t => `
        <button type="button" class="qcs-v1-reject-btn" onclick="qcStationLogReject('${t.replace(/'/g, "\\'")}')">
        <span class="qi">${qcIcons[t] || ''}</span>
        <span>${t}</span>
        </button>
    `).join('');

    const counts = {};
    todayLog.forEach(e => counts[e.type] = (counts[e.type] || 0) + 1);
    summaryEl.innerHTML = todayLog.length
        ? `<span style="color:var(--d2);margin-right:var(--space-sm)">${todayLog.length} total</span>` +
          Object.entries(counts).map(([t, n]) => `<div class="qcs-v1-sum-pill"><span class="n">${n}</span><span class="l">${t}</span></div>`).join('')
        : '<span style="color:var(--d3);font-size:13px">No rejects today</span>';

    logEl.innerHTML = todayLog.length
        ? todayLog.slice(0, 30).map(e => `
            <div class="qcs-v1-entry">
            <span class="t">${e.time}</span>
            <span class="type">${e.type}</span>
            <span class="job">${e.job}</span>
            </div>
        `).join('')
        : '<span style="color:var(--d3);font-size:13px">No entries today</span>';
    }

    function qcStationLogReject(type) {
    logQC(type);
    renderQC();
    }

    // ============================================================
    // FLOOR MANAGER SHELL — operations overview, scan-first
    // ============================================================
    /** Open the Floor Manager view. Scan-first: presses, active orders, floor card for inspect + quick edit. */
    function openFloorManager() {
    setStationContext({ stationType: 'floor_manager', stationId: 'fm1', assignedPressId: null });
    showShell('floorManagerShell');
    renderAll();
    }

    function exitFloorManager() {
    doLogout();
    }

    function renderFloorManagerShell() {
    const statsEl = document.getElementById('fmStatsRow');
    const pressEl = document.getElementById('fmPressGrid');
    const bodyEl = document.getElementById('fmFloorBody');
    const countEl = document.getElementById('fmFloorCount');
    const searchEl = document.getElementById('fmFloorSearch');
    if (!statsEl || !pressEl || !bodyEl) return;

    const q = searchEl?.value || '';
    const { jobs, total } = getFloorJobs(q);
    if (countEl) countEl.textContent = q ? `${jobs.length} of ${total}` : `${jobs.length} jobs`;

    const statItems = getFloorStats();
    statsEl.innerHTML = statItems.map(i => `
        <div class="stat"><div class="sv ${i.c}">${i.v}</div><div class="sl">${i.l}</div><div class="ss">${i.s}</div></div>
    `).join('');

    pressEl.innerHTML = S.presses.map(p => buildPressCardHTML(p, 'floorCard', false)).join('');

    if (!jobs.length) {
        bodyEl.innerHTML = `<tr><td colspan="9" class="empty">${q ? 'NO MATCHES' : 'NO ACTIVE JOBS'}</td></tr>`;
        return;
    }
    bodyEl.innerHTML = jobs.map(j => floorTableRowHTML(j, { openBtnLabel: 'EDIT' })).join('');
    }

    // ============================================================
    // STATS
    // ============================================================
    function renderStats() {
    const el = document.getElementById('statsRow');
    if (!el) return;
    const items = getFloorStats();
    el.innerHTML = items.map(i => `
        <div class="stat">
        <div class="sv ${i.c}">${i.v}</div>
        <div class="sl">${i.l}</div>
        <div class="ss">${i.s}</div>
        </div>
    `).join('');
    }

    // ============================================================
    // PRESSES — single source of truth: press.job_id references job.id
    // ============================================================
    function renderPresses() {
    const el = document.getElementById('pressGrid');
    if (!el) return;
    const isAdmin = S.mode === 'admin';
    el.innerHTML = S.presses.map(p => buildPressCardHTML(p, isAdmin ? 'pressStation' : 'panel', isAdmin)).join('');
    }

    function assignJob(pid, jid) {
    const p = S.presses.find(x => x.id === pid);
    if (p) {
        setAssignment(pid, jid || null);
        Storage.savePresses(S.presses);
        renderAll();
    }
    }

    function setPressStatus(pid, st) {
    const p = S.presses.find(x => x.id === pid);
    if (p) {
        p.status = st;
        Storage.savePresses(S.presses);
        renderAll();
    }
    }

    // Canonical source of truth: press.job_id. job.press is derived for display (may list multiple presses).
    function syncJobPressFromPresses() {
    S.jobs.forEach(j => {
        const presses = S.presses.filter(p => p.job_id === j.id);
        j.press = presses.length ? presses.map(p => p.name).join(', ') : '';
    });
    }

    // Set which job is on this press (or clear). A job may be on multiple presses; a press has at most one job.
    function setAssignment(pressId, jobId) {
    const jobIdVal = jobId || null;
    const p = S.presses.find(x => x.id === pressId);
    if (p) {
        p.job_id = jobIdVal;
        p.status = jobIdVal ? 'online' : 'idle';
    }
    syncJobPressFromPresses();
    }

    // Release any press that has this job assigned — sets press to idle, then syncs job.press
    function releasePressByJob(jobId) {
    S.presses.forEach(p => {
        if (p.job_id === jobId) {
        p.job_id = null;
        p.status = 'idle';
        }
    });
    syncJobPressFromPresses();
    }

    // ============================================================
    // FLOOR TABLE — tap-to-cycle status, text search filtering
    // ============================================================
    function renderFloor() {
    const el = document.getElementById('floorBody');
    if (!el) return;
    const q = document.getElementById('floorSearch')?.value || '';
    const { jobs, total } = getFloorJobs(q);
    const countEl = document.getElementById('floorCount');
    if (countEl) countEl.textContent = q ? `${jobs.length} of ${total}` : `${total} jobs`;

    if (!jobs.length) {
        el.innerHTML = `<tr><td colspan="9" class="empty">${q ? 'NO MATCHES FOR "' + q + '"' : 'NO ACTIVE JOBS'}</td></tr>`;
        return;
    }
    el.innerHTML = jobs.map(j => floorTableRowHTML(j, { statusCellId: true })).join('');

    // Recently completed — shows last 5 "done" jobs so they don't vanish
    const doneEl = document.getElementById('recentDone');
    if (doneEl) {
        const doneJobs = S.jobs.filter(j => j.status === 'done').slice(0, 5);
        if (doneJobs.length) {
        doneEl.innerHTML = `
            <div class="sec" style="color:var(--d3)">RECENTLY COMPLETED</div>
            ${doneJobs.map(j => `
            <div class="recent-done-item">
                <span class="rd-check">✓</span>
                <span class="rd-cat">${j.catalog || '—'}</span>
                <span class="rd-artist">${j.artist || '—'} · ${j.album || ''}</span>
                <button class="rd-open" onclick="openPanel('${j.id}')">VIEW</button>
            </div>
            `).join('')}
        `;
        } else {
        doneEl.innerHTML = '';
        }
    }
    }

    // ============================================================
    // FLOOR CARD — full-screen statboard (artist/album click on Floor)
    // ============================================================
    const PRESS_OPTS = ['', 'PRESS 1', 'PRESS 2', 'PRESS 3', '7" PRESS'];
    const STATUS_OPTS = [
        { v: 'queue', l: 'Queued' },
        { v: 'pressing', l: 'Pressing' },
        { v: 'assembly', l: 'Assembly' },
        { v: 'hold', l: 'On Hold' },
        { v: 'done', l: 'Done' },
    ];

    function openFloorCard(jobId) {
    S.floorCardJobId = jobId;
    S.floorCardEditMode = false;
    const ov = document.getElementById('floorCardOverlay');
    if (ov) ov.classList.add('on');
    renderFloorCard();
    }

    function closeFloorCard() {
    S.floorCardJobId = null;
    S.floorCardEditMode = false;
    const ov = document.getElementById('floorCardOverlay');
    if (ov) ov.classList.remove('on');
    const btn = document.getElementById('floorCardQuickEditBtn');
    if (btn) { btn.textContent = 'QUICK EDIT'; btn.classList.remove('edit-mode'); }
    }

    function toggleFloorCardEdit() {
    S.floorCardEditMode = !S.floorCardEditMode;
    const btn = document.getElementById('floorCardQuickEditBtn');
    if (btn) {
        btn.textContent = S.floorCardEditMode ? 'DONE' : 'QUICK EDIT';
        btn.classList.toggle('edit-mode', S.floorCardEditMode);
    }
    renderFloorCard();
    }

    function saveFloorCardQuickEdit() {
    const j = S.jobs.find(x => x.id === S.floorCardJobId);
    if (!j) return;
    const get = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    if (canEditField('status')) j.status = get('fcStatus') || j.status;
    if (canEditField('press')) j.press = get('fcPress') || j.press;
    if (canEditField('location')) j.location = get('fcLocation') || j.location;
    if (canEditField('due')) j.due = get('fcDue') || j.due;
    if (canEditField('notes')) j.notes = get('fcNotes') || j.notes;
    if (canEditField('assembly')) j.assembly = get('fcAssembly') || j.assembly;
    Storage.saveJob(j);
    S.floorCardEditMode = false;
    const btn = document.getElementById('floorCardQuickEditBtn');
    if (btn) { btn.textContent = 'QUICK EDIT'; btn.classList.remove('edit-mode'); }
    renderFloorCard();
    if (getStationContext() && isStationType('floor_manager')) renderFloorManagerShell();
    else { renderFloor(); renderPresses(); }
    }

    function renderFloorCard() {
    const content = document.getElementById('floorCardContent');
    if (!content) return;
    const j = S.jobs.find(x => x.id === S.floorCardJobId);
    if (!j) {
        content.innerHTML = '<p>Job not found.</p>';
        return;
    }
    const prog = progressDisplay(j);
    const ah = assetHealth(j);
    const edit = S.floorCardEditMode;

    if (edit) {
        const perm = getStationEditPermissions();
        const getRow = (field, label, html) => canEditField(field) ? `<div class="fc-edit-row">${label}${html}</div>` : '';
        const rows = [
            getRow('status', '<label>Status</label>', `<select id="fcStatus">${STATUS_OPTS.map(o => `<option value="${o.v}" ${j.status === o.v ? 'selected' : ''}>${o.l}</option>`).join('')}</select>`),
            getRow('press', '<label>Press assigned</label>', `<select id="fcPress">${PRESS_OPTS.map(o => `<option value="${o}" ${(j.press || '') === o ? 'selected' : ''}>${o || '— Unassigned'}</option>`).join('')}</select>`),
            getRow('location', '<label>Location</label>', `<input type="text" id="fcLocation" value="${(j.location || '').replace(/"/g, '&quot;')}" placeholder="Rack, bay...">`),
            getRow('due', '<label>Due date</label>', `<input type="date" id="fcDue" value="${j.due || ''}">`),
            getRow('notes', '<label>Production notes</label>', `<textarea id="fcNotes" rows="3">${(j.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>`),
            getRow('assembly', '<label>Assembly / location notes</label>', `<textarea id="fcAssembly" rows="2">${(j.assembly || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>`),
        ].join('');
        content.innerHTML = `
        <div class="fc-header">
            <div class="fc-catalog">${(j.catalog || j.matrix || '—')}</div>
            <div class="fc-artist">${(j.artist || '—')}</div>
            <div class="fc-album">${j.album || ''}</div>
        </div>
        ${rows}
        ${perm.canUseFloorCard ? `<div class="fc-edit-actions">
            <button type="button" class="btn go" onclick="saveFloorCardQuickEdit()">SAVE</button>
            <button type="button" class="btn ghost" onclick="toggleFloorCardEdit()">CANCEL</button>
        </div>` : ''}
        `;
        const qeBtn = document.getElementById('floorCardQuickEditBtn');
        if (qeBtn) qeBtn.style.display = perm.canUseFloorCard ? '' : 'none';
        return;
    }

    const sec = [];
    if (j.format) sec.push(j.format);
    if (j.vinylType || j.color || j.weight) sec.push([j.vinylType, j.color, j.weight].filter(Boolean).join(' · '));
    if (j.client || j.label) sec.push((j.client || '') + (j.label ? ' · ' + j.label : ''));
    const secLine = sec.length ? sec.join(' · ') : '—';
    const notes = [j.notes, j.assembly].filter(Boolean).join('\n');

    content.innerHTML = `
    <div class="fc-header">
        <div class="fc-catalog">${(j.catalog || j.matrix || '—')}</div>
        <div class="fc-artist">${(j.artist || '—')}</div>
        <div class="fc-album">${j.album || ''}</div>
    </div>
    <div class="fc-strip">
        <span class="fc-status">${statusPill(j.status)}</span>
        <span class="fc-press">${j.press ? j.press : '—'}</span>
        <span class="fc-due ${dueClass(j.due)}">Due: ${dueLabel(j.due)}</span>
        <span class="fc-loc">${j.location ? '📍 ' + j.location : '—'}</span>
    </div>
    <div class="fc-qty-strip">
        <span>Ordered: <strong>${(prog.p.ordered || 0).toLocaleString()}</strong></span>
        <span>Pressed: <strong>${(prog.p.pressed || 0).toLocaleString()}</strong></span>
        <span>QC passed: <strong>${(prog.p.qcPassed || 0).toLocaleString()}</strong></span>
        <span>Rejected: <strong>${(prog.p.rejected || 0).toLocaleString()}</strong></span>
        <span>Pending QC: <strong>${(prog.p.pendingQC || 0).toLocaleString()}</strong></span>
    </div>
    <div class="fc-progress-bar">
        <div class="bar-wrap"><div class="bar-fill" style="width:${prog.pressedPct}%"></div></div>
        <div class="bar-label">${prog.main} pressed · ${prog.sub}</div>
    </div>
    <div class="fc-asset">Assets: ${ah.done}/${ah.total} ${ah.total ? (ah.pct >= 1 ? '✓' : '') : ''}</div>
    <div class="fc-secondary">${secLine}</div>
    ${notes ? `<div class="fc-notes">${notes.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
    `;
    const perm = getStationEditPermissions();
    const qeBtn = document.getElementById('floorCardQuickEditBtn');
    if (qeBtn) qeBtn.style.display = perm.canUseFloorCard ? '' : 'none';
    }

    // Tap-to-cycle with undo support
    // When status changes, shows a toast with UNDO for 5 seconds
    let undoTimer = null;
    let undoData = null;

    function cycleStatus(jid) {
    if (!canEditField('status')) return;
    const j = S.jobs.find(x => x.id === jid);
    if (!j) return;
    const prevStatus = j.status;
    const cur = STATUS_ORDER.indexOf(j.status);
    const next = (cur + 1) % STATUS_ORDER.length;
    j.status = STATUS_ORDER[next];

    // If job just left "pressing" status, release its press (syncs job.press)
    if (prevStatus === 'pressing' && j.status !== 'pressing') {
        releasePressByJob(j.id);
        Storage.savePresses(S.presses);
    }
    // If job just entered "pressing" and has press(es) assigned, set each
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

    // Trigger flash animation
    requestAnimationFrame(() => {
        const pill = document.getElementById('st-' + jid);
        if (pill) {
        pill.classList.add('flash');
        pill.addEventListener('animationend', () => pill.classList.remove('flash'), {once:true});
        }
    });
    }

    function showUndoToast(msg, undoFn) {
    // Remove any existing undo toast
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
    // JOBS PAGE
    // ============================================================
    function renderJobs() {
    const filter = document.getElementById('jobFilter')?.value || '';
    const q = (document.getElementById('jobSearch')?.value || '').toLowerCase().trim();
    let jobs = filter ? S.jobs.filter(j => j.status === filter) : S.jobs;

    // Text search
    if (q) {
        jobs = jobs.filter(j =>
        (j.catalog || '').toLowerCase().includes(q) ||
        (j.artist || '').toLowerCase().includes(q) ||
        (j.album || '').toLowerCase().includes(q) ||
        (j.color || '').toLowerCase().includes(q) ||
        (j.client || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q)
        );
    }

    // Update count
    const countEl = document.getElementById('jobCount');
    if (countEl) {
        countEl.textContent = `${jobs.length} of ${S.jobs.length}`;
    }

    const tbody = document.getElementById('jobsBody');
    const cards = document.getElementById('jobCards');
    const empty = document.getElementById('jobsEmpty');
    if (!jobs.length) {
        if (tbody) tbody.innerHTML = '';
        if (cards) cards.innerHTML = '';
        if (empty) { empty.style.display = 'block'; empty.textContent = q ? `NO MATCHES FOR "${q}"` : 'NO JOBS IN SYSTEM · TAP + TO ADD'; }
        return;
    }
    if (empty) empty.style.display = 'none';

    // Desktop table
    if (tbody) {
        tbody.innerHTML = jobs.map(j => {
        const ah = assetHealth(j);
        const prog = progressDisplay(j);
        return `<tr>
            <td style="color:var(--w);font-weight:700">${j.catalog || '—'}</td>
            <td style="color:var(--d)">${j.artist || '—'}</td>
            <td style="color:var(--d2);font-size:12px">${j.album || '—'}</td>
            <td>${j.format ? `<span class="pill ${j.format.includes('7"') ? 'seven' : 'go'}">${j.format}</span>` : '—'}</td>
            <td><span style="color:var(--d)">${j.color || 'Black'}</span> ${j.weight ? `<span style="color:var(--d3)">${j.weight}</span>` : ''}</td>
            <td>${j.qty ? parseInt(j.qty).toLocaleString() : '—'}</td>
            <td style="color:var(--d3)">${j.qty ? Math.ceil(parseInt(j.qty) * 1.1).toLocaleString() : '—'}</td>
            <td>${statusPill(j.status)}</td>
            <td class="${dueClass(j.due)}">${dueLabel(j.due)}</td>
            <td style="color:var(--d3);font-size:12px">${j.press || '—'}</td>
            <td class="assets-tap" onclick="event.stopPropagation(); openAssetsOverlay('${j.id}')" title="View and edit assets">${ahHTML(j)}</td>
            <td class="td-progress progress-tap" onclick="event.stopPropagation(); openProgressDetail('${j.id}')" title="View progress breakdown">
            <div class="progress-main">${prog.main}</div>
            <div class="dl-bar td">${progressDualBarHTML(prog.pressedPct, prog.qcPassedPct)}</div>
            <div class="progress-sub">${prog.sub}</div>
            </td>
            <td>${j.location ? `<span class="loc">${j.location}</span>` : '—'}</td>
            <td><button class="open-btn" onclick="openPanel('${j.id}')">OPEN</button></td>
        </tr>`;
        }).join('');
    }

    // Mobile cards — same data, touch-friendly layout
    if (cards) {
        cards.innerHTML = jobs.map(j => {
        const ah = assetHealth(j);
        const prog = progressDisplay(j);
        return `
            <div class="job-card st-${j.status}" onclick="openPanel('${j.id}')">
            <div class="jc-top">
                <div>
                <div class="jc-cat">${j.catalog || '—'}</div>
                <div class="jc-artist">${j.artist || '—'}</div>
                <div class="jc-album">${j.album || ''}</div>
                </div>
                ${statusPill(j.status)}
            </div>
            <div class="jc-row">
                ${j.format ? `<span class="pill ${j.format.includes('7"') ? 'seven' : 'go'}">${j.format}</span>` : ''}
                <span class="jc-detail">${j.color || 'Black'} <span>${j.weight || ''}</span></span>
                <span class="jc-detail">Qty: ${j.qty ? parseInt(j.qty).toLocaleString() : '—'}</span>
            </div>
            <div class="jc-row">
                <span class="jc-detail ${dueClass(j.due)}">Due: ${dueLabel(j.due)}</span>
                ${ahHTML(j)}
                ${j.press ? `<span class="jc-detail">⬡ ${j.press}</span>` : ''}
                ${j.location ? `<span class="loc">${j.location}</span>` : ''}
            </div>
            <div class="jc-progress">
                <span class="jc-progress-main">Progress: ${prog.main}</span>
                <div class="dl-bar jc">${progressDualBarHTML(prog.pressedPct, prog.qcPassedPct)}</div>
                <span class="jc-progress-sub">${prog.sub}</span>
            </div>
            </div>
        `;
        }).join('');
    }
    }

    // ============================================================
    // TODOS
    // ============================================================
    function renderTodos() {
    const el = document.getElementById('todoCols');
    if (!el) return;
    const cols = [
        {key:'daily',   label:'DAILY TASKS',  sub:'Resets midnight',        cls:''},
        {key:'weekly',  label:'WEEKLY TASKS', sub:'Resets Monday',          cls:''},
        {key:'standing',label:'STANDING',     sub:'Persistent reminders',   cls:'standing'},
    ];
    el.innerHTML = cols.map(c => {
        const todos = S.todos[c.key] || [];
        const done = todos.filter(t => t.done).length;
        return `
        <div class="todo-col">
            <div class="todo-col-head ${c.cls}">
            <span>${c.label} <span style="font-size:13px;color:var(--d3)">(${done}/${todos.length})</span></span>
            <span class="reset-tag">${c.sub}</span>
            </div>
            ${todos.map((t, i) => `
            <div class="todo-item ${t.done ? 'done' : ''}" onclick="toggleTodo('${c.key}',${i})">
                <div class="tcheck">${t.done ? '✓' : ''}</div>
                <div style="flex:1">
                <div class="ttext">${t.text}</div>
                ${t.who ? `<div class="twho">— ${t.who}</div>` : ''}
                </div>
                ${S.mode === 'admin' ? `<button class="tdel" onclick="event.stopPropagation();removeTodo('${c.key}',${i})">✕</button>` : ''}
            </div>
            `).join('')}
            <div class="todo-add">
            <input id="ta-${c.key}" placeholder="ADD TASK…" onkeydown="if(event.key==='Enter')addTodo('${c.key}')">
            <button class="todo-add-btn" onclick="addTodo('${c.key}')">+</button>
            </div>
        </div>
        `;
    }).join('');
    }

    function toggleTodo(key, idx) {
    const t = S.todos[key][idx];
    t.done = !t.done;
    t.who = t.done ? (S.mode === 'admin' ? 'Admin' : 'Operator') : '';
    Storage.saveTodos(S.todos);
    renderTodos();
    }
    function removeTodo(key, idx) {
    S.todos[key].splice(idx, 1);
    Storage.saveTodos(S.todos);
    renderTodos();
    }
    function addTodo(key) {
    const el = document.getElementById('ta-' + key);
    const text = el.value.trim();
    if (!text) return;
    S.todos[key].push({id:'u' + Date.now(), text, done:false, who:''});
    el.value = '';
    Storage.saveTodos(S.todos);
    renderTodos();
    }

    // ============================================================
    // QC — with job picker + date-navigable history
    // ============================================================
    let qcViewDate = new Date().toDateString(); // which day's log we're viewing

    function logQC(type) {
    if (!getStationEditPermissions().canLogQC) return;
    const time = new Date().toLocaleTimeString('en-US', {hour12:false});
    const date = new Date().toDateString();

    // Resolve job for this reject: selected job or first pressing/assembly job
    const active = S.jobs.filter(j => ['pressing','assembly'].includes(j.status));
    const jobId = S.qcSelectedJob || (active.length ? active[0].id : null);
    let job = '—';
    if (jobId) {
        const j = S.jobs.find(x => x.id === jobId);
        if (j) job = j.catalog || j.artist || '—';
    }

    S.qcLog.unshift({time, type, job, date});
    if (S.qcLog.length > 1000) S.qcLog.splice(1000);

    Storage.logQC({ time, type, job, date });
    const progressResult = tryAddQCRejectToProgress(jobId);
    if (!progressResult.applied && progressResult.error) {
        toast('DEFECT LOGGED. REJECTED COUNT NOT UPDATED (CHECK PRESSED TOTAL).');
    } else {
        toast(`${type} → ${job}`);
    }
    qcViewDate = date;
    renderQC();
    }

    function selectQCJob(jid) {
    S.qcSelectedJob = S.qcSelectedJob === jid ? null : jid;
    renderQC();
    }

    // Get all unique dates in the QC log, sorted newest first
    function getQCDates() {
    const dates = [...new Set(S.qcLog.map(e => e.date))];
    dates.sort((a, b) => new Date(b) - new Date(a));
    return dates;
    }

    function qcDateStep(dir) {
    const dates = getQCDates();
    if (!dates.length) return;
    const curIdx = dates.indexOf(qcViewDate);
    if (curIdx === -1) {
        // Current view date has no data — jump to nearest
        qcViewDate = dates[0];
    } else {
        const newIdx = curIdx - dir; // -dir because dates are newest-first
        if (newIdx >= 0 && newIdx < dates.length) {
        qcViewDate = dates[newIdx];
        }
    }
    renderQC();
    }

    function qcDateToday() {
    qcViewDate = new Date().toDateString();
    renderQC();
    }

    function renderQC() {
    const today = new Date().toDateString();
    const isToday = qcViewDate === today;
    const viewLog = S.qcLog.filter(e => e.date === qcViewDate);
    const todayLog = isToday ? viewLog : S.qcLog.filter(e => e.date === today);

    // Badge — always shows today's count
    const badge = document.getElementById('qcBadge');
    if (badge) {
        badge.textContent = todayLog.length;
        badge.classList.toggle('show', todayLog.length > 0);
    }

    // Job picker
    const picker = document.getElementById('qcJobPicker');
    if (picker) {
        const pressing = S.jobs.filter(j => ['pressing','assembly'].includes(j.status));
        picker.innerHTML = `
        <div class="qc-job-picker-label">SELECT JOB FOR THIS REJECT</div>
        ${pressing.length ? pressing.map(j => `
            <button class="qc-job-btn ${S.qcSelectedJob === j.id ? 'active' : ''}" onclick="selectQCJob('${j.id}')">
            ${j.catalog || '—'} · ${j.artist || '—'}
            </button>
        `).join('') : '<span style="color:var(--d3);font-size:12px">NO JOBS PRESSING</span>'}
        `;
    }

    // Summary — shows viewed date's data
    const sumEl = document.getElementById('qcSummary');
    if (sumEl) {
        const counts = {};
        viewLog.forEach(e => counts[e.type] = (counts[e.type] || 0) + 1);
        const totalRejects = viewLog.length;
        sumEl.innerHTML = (totalRejects ? `<span style="color:var(--d2);font-size:12px;margin-right: var(--space-sm)">${totalRejects} total</span>` : '') +
        Object.entries(counts).map(([t, n]) => `
            <div class="qc-sum-pill">
            <span class="qsp-n">${n}</span>
            <span class="qsp-l">${t}</span>
            </div>
        `).join('') || '<span style="color:var(--d3);font-size:12px">NO REJECTS THIS DAY</span>';
    }

    // Date label
    const dateLabel = document.getElementById('qcDateLabel');
    if (dateLabel) {
        const d = new Date(qcViewDate);
        const formatted = d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric', year:'numeric'});
        dateLabel.innerHTML = formatted + (isToday ? '<span class="qdl-today">TODAY</span>' : '');
    }

    // Log
    const logEl = document.getElementById('qcLog');
    if (!logEl) return;
    if (!viewLog.length) {
        logEl.innerHTML = `<div class="empty">No rejects logged ${isToday ? 'today' : 'on this date'}</div>`;
        return;
    }
    logEl.innerHTML = viewLog.map(e => `
        <div class="qc-entry">
        <span class="qt">${e.time}</span>
        <span class="qtype">${e.type}</span>
        <span class="qjob">${e.job}</span>
        </div>
    `).join('');
    }

    // ============================================================
    // TV MODE
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

    function renderTV() {
    const pe = document.getElementById('tvPresses');
    if (pe) pe.innerHTML = S.presses.map(p => {
        const j = p.job_id ? S.jobs.find(x => x.id === p.job_id) : null;
        const ah = j ? assetHealth(j) : {done:0, total:0, pct:0};
        const prog = j ? progressDisplay(j) : null;
        return `
        <div class="tv-press ${p.status}">
            <div class="tv-pname ${p.type === '7"' ? 'seven' : ''}">${p.name}</div>
            ${j ? `
            <div class="tv-pjob">${j.catalog || '—'} · ${j.artist || ''}</div>
            <div class="tv-pmeta">${j.format || ''} · ${j.color || 'Black'} · Qty ${j.qty ? parseInt(j.qty).toLocaleString() : '—'}</div>
            <div class="tv-progress">
                <div class="tv-progress-label">PROGRESS <span class="tv-progress-num">${prog.main}</span></div>
                <div class="tv-dl-bar dl-bar tv">${progressDualBarHTML(prog.pressedPct, prog.qcPassedPct)}</div>
                <div class="tv-progress-sub">${prog.sub}</div>
                ${prog.overQty ? '<div class="tv-progress-over">OVER QTY</div>' : ''}
            </div>
            <div class="tv-assets-demoted">Assets ${ah.done}/${ah.total}</div>
            ` : `<div class="tv-pmeta" style="color:var(--d3);margin-top: var(--space-xs)">Idle</div>`}
        </div>
        `;
    }).join('');

    const qe = document.getElementById('tvBody');
    if (qe) {
        const active = S.jobs.filter(j => j.status !== 'done');
        qe.innerHTML = active.map(j => {
        const ah = assetHealth(j);
        return `<tr>
            <td class="tc">${j.catalog || '—'}</td>
            <td class="ta">${j.artist || '—'}</td>
            <td>${j.format || '—'}</td>
            <td>${statusPill(j.status)}</td>
            <td class="${dueClass(j.due)}">${dueLabel(j.due)}</td>
            <td style="color:${ah.pct >= 1 ? 'var(--g)' : ah.pct >= 0.5 ? 'var(--w)' : 'var(--r)'}">${ah.done}/${ah.total}</td>
        </tr>`;
        }).join('');
    }

    const ti = document.getElementById('tvTicker');
    if (ti) {
        const parts = S.jobs.filter(j => j.status !== 'done')
        .map(j => `★ ${j.catalog || '—'} · ${j.artist || ''} · ${j.format || ''} · Due: ${j.due || 'TBD'}`);
        ti.textContent = parts.join('    ') || '★ NO ACTIVE JOBS ★';
    }
    }

    // ============================================================
    // SLIDE PANEL — unified single-scroll form
    // ============================================================
    function openPanel(id) {
    const perm = getStationEditPermissions();
    if (id && id !== 'null' && !perm.canUseFullPanel) {
        openFloorCard(id);
        return;
    }
    const ov = document.getElementById('overlay');
    ov.classList.add('open');
    panelOpen = true;
    panelEditMode = false;
    S.editId = id && id !== 'null' ? id : null;
    curAssets = {};

    if (S.editId) {
        const j = S.jobs.find(x => x.id === S.editId);
        if (!j) return;
        document.getElementById('panelId').textContent = j.catalog || j.artist || 'Job';
        document.getElementById('panelSub').textContent = `${j.artist || ''} · ${j.album || ''}`;
        document.getElementById('delBtn').style.display = S.mode === 'admin' ? '' : 'none';

        // Data-driven field population
        FIELD_MAP.forEach(f => {
        const el = document.getElementById(f.id);
        if (el && j[f.key] != null) el.value = j[f.key];
        });
        // Press may list multiple; dropdown is single-select — show first so something is selected
        const pressEl = document.getElementById('jPress');
        if (pressEl && j.press && j.press.includes(',')) {
        const first = j.press.split(',')[0].trim();
        if (first) pressEl.value = first;
        }
        document.getElementById('jOv').value = j.qty ? Math.ceil(parseInt(j.qty) * 1.1).toLocaleString() : '';
        curAssets = j.assets ? JSON.parse(JSON.stringify(j.assets)) : {};
    } else {
        document.getElementById('panelId').textContent = 'NEW JOB';
        document.getElementById('panelSub').textContent = '';
        document.getElementById('delBtn').style.display = 'none';
        clearFields();
    }
    buildAssetList();
    renderProgressSection();
    if (S.editId) {
        const j = S.jobs.find(x => x.id === S.editId);
        if (j) { ensureNotesLog(j); renderNotesSection(); }
    } else {
        const notesLogList = document.getElementById('notesLogList');
        const assemblyLogList = document.getElementById('assemblyLogList');
        if (notesLogList) notesLogList.innerHTML = '<div class="progress-empty">No notes yet.</div>';
        if (assemblyLogList) assemblyLogList.innerHTML = '<div class="progress-empty">No notes yet.</div>';
        const jNotesInput = document.getElementById('jNotesInput');
        const jAssemblyInput = document.getElementById('jAssemblyInput');
        if (jNotesInput) jNotesInput.value = '';
        if (jAssemblyInput) jAssemblyInput.value = '';
    }

    // Scroll to top
    document.getElementById('panelBody').scrollTop = 0;

    // Billing: collapse for new jobs, auto-expand if editing job has billing data
    const billingBody = document.getElementById('billingBody');
    const billingToggle = document.getElementById('billingToggle');
    if (billingBody && billingToggle) {
        billingBody.classList.remove('open');
        billingToggle.classList.remove('open');
        if (S.editId) {
        // Defer so field values are populated first
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
    }

    function clearFields() {
    FIELD_MAP.forEach(f => {
        const el = document.getElementById(f.id);
        if (!el) return;
        if (f.type === 'select') el.selectedIndex = 0;
        else el.value = '';
    });
    document.getElementById('jOv').value = '';
    }

    function calcOv() {
    const v = parseInt(document.getElementById('jQty').value) || 0;
    document.getElementById('jOv').value = v ? Math.ceil(v * 1.1).toLocaleString() : '';
    }

    // ============================================================
    // ASSET LIST
    // ============================================================
    function buildAssetList() {
    const el = document.getElementById('assetList');
    if (!el) return;

    // Calculate summary
    const received = ASSET_DEFS.filter(a => curAssets[a.key]?.received).length;
    const na = ASSET_DEFS.filter(a => curAssets[a.key]?.na).length;
    const remaining = ASSET_DEFS.length - received - na;
    const allDone = remaining === 0;

    // Summary bar
    let summaryHTML = `<div class="asset-summary">
        <span class="as-received"><span class="as-num">${received}</span> received</span>
        <span class="as-na"><span class="as-num">${na}</span> N/A</span>
        <span class="as-remaining"><span class="as-num">${remaining}</span> remaining</span>
        ${allDone ? '<span class="as-complete">✓ ALL ASSETS READY</span>' : ''}
    </div>`;

    el.innerHTML = summaryHTML + ASSET_DEFS.map(a => {
        const d = curAssets[a.key] || {received:false, date:'', person:'', note:'', na:false};
        return `
        <div>
            <div class="asset-row ${d.received ? 'got' : ''} ${d.na ? 'na' : ''}" id="ar-${a.key}"
                onclick="${d.na ? '' : "toggleAsset('" + a.key + "')"}">
            <div class="acheck">${d.received ? '✓' : ''}</div>
            <div class="aname">${a.label}</div>
            <div class="adate">${d.date || ''}</div>
            <div style="display:flex;gap: var(--space-sm);align-items:center">
                <div class="awho">${d.person || ''}</div>
                <button class="na-btn" onclick="event.stopPropagation();toggleNA('${a.key}')">${d.na ? 'RESTORE' : 'N/A'}</button>
                ${d.received ? `<button class="na-btn" onclick="event.stopPropagation();toggleDetail('${a.key}')">▾</button>` : ''}
            </div>
            </div>
            <div class="asset-detail" id="ad-${a.key}">
            <div>
                <div class="adl">DATE RECEIVED</div>
                <input type="date" value="${d.date || ''}" onchange="updateAsset('${a.key}','date',this.value)">
            </div>
            <div>
                <div class="adl">RECEIVED BY</div>
                <input type="text" value="${d.person || ''}" placeholder="Name" onchange="updateAsset('${a.key}','person',this.value)">
            </div>
            <div style="grid-column:1/-1">
                <div class="adl">NOTE</div>
                <input type="text" value="${d.note || ''}" placeholder="Note…" onchange="updateAsset('${a.key}','note',this.value)">
            </div>
            </div>
        </div>
        `;
    }).join('');
    }

    function toggleAsset(key) {
    if (!curAssets[key]) curAssets[key] = {received:false, date:'', person:'', na:false, note:''};
    curAssets[key].received = !curAssets[key].received;
    if (curAssets[key].received && !curAssets[key].date)
        curAssets[key].date = new Date().toISOString().split('T')[0];
    buildAssetList();
    }
    function toggleNA(key) {
    if (!curAssets[key]) curAssets[key] = {received:false, date:'', person:'', na:false, note:''};
    curAssets[key].na = !curAssets[key].na;
    if (curAssets[key].na) curAssets[key].received = false;
    buildAssetList();
    }
    function toggleDetail(key) {
    const el = document.getElementById('ad-' + key);
    if (el) el.classList.toggle('open');
    }
    function updateAsset(key, field, val) {
    if (!curAssets[key]) curAssets[key] = {received:false, date:'', person:'', na:false, note:''};
    curAssets[key][field] = val;
    }

    // ============================================================
    // PROGRESS SECTION (job panel only)
    // ============================================================
    function renderProgressSection() {
    const summaryEl = document.getElementById('progressSummary');
    const barEl = document.getElementById('progressBarWrap');
    const recentEl = document.getElementById('progressRecent');
    const section = document.getElementById('progressSection');
    const form = section ? section.querySelector('.progress-log-form') : null;
    const logBtn = document.getElementById('progressLogBtn');
    if (!summaryEl || !barEl || !recentEl) return;

    if (!S.editId) {
        summaryEl.innerHTML = '<div class="progress-empty" style="grid-column:1/-1">SAVE JOB FIRST TO LOG PROGRESS.</div>';
        barEl.innerHTML = '';
        recentEl.innerHTML = '';
        if (form) form.style.display = 'none';
        if (logBtn) logBtn.disabled = true;
        return;
    }

    const job = S.jobs.find(j => j.id === S.editId);
    if (!job) return;
    if (form) form.style.display = '';
    if (logBtn) logBtn.disabled = false;

    const p = getJobProgress(job);
    const ordered = p.ordered;
    const pressed = p.pressed;
    const qcPassed = p.qcPassed;
    const rejected = p.rejected;
    const pendingQC = p.pendingQC;

    summaryEl.innerHTML = `
        <div class="ps-cell"><span class="ps-val">${ordered.toLocaleString()}</span>ORDERED</div>
        <div class="ps-cell"><span class="ps-val">${pressed.toLocaleString()}</span>PRESSED</div>
        <div class="ps-cell"><span class="ps-val">${qcPassed.toLocaleString()}</span>QC PASSED</div>
        <div class="ps-cell"><span class="ps-val">${rejected.toLocaleString()}</span>REJECTED</div>
        <div class="ps-cell"><span class="ps-val">${pendingQC.toLocaleString()}</span>PENDING QC</div>
    `;

    const completionRatio = ordered > 0 ? Math.min(1, qcPassed / ordered) : 0;
    const barPct = Math.round(completionRatio * 100);
    const overQty = pressed > ordered;
    barEl.innerHTML = `
        <div class="progress-bar-outer">
        <div class="progress-bar-fill" style="width:${barPct}%"></div>
        </div>
        <div class="progress-bar-text">QC: ${qcPassed.toLocaleString()} / ${ordered.toLocaleString()} ORDERED · PRESSED: ${pressed.toLocaleString()}</div>
        ${overQty ? '<div class="progress-over-qty">OVER QTY</div>' : ''}
    `;

    ensureJobProgressLog(job);
    const log = (job.progressLog || []).slice().reverse();
    if (!log.length) {
        recentEl.innerHTML = '<div class="progress-empty">NO ENTRIES YET.</div>';
    } else {
        recentEl.innerHTML = log.slice(0, 20).map(e => {
        const time = new Date(e.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const stageLabel = (e.stage === 'pressed' ? 'PRESSED' : e.stage === 'qc_passed' ? 'QC PASSED' : 'REJECTED');
        return `<div class="progress-entry ${e.stage}">+${e.qty} ${stageLabel} · ${(e.person || 'UNKNOWN')} · ${time}</div>`;
        }).join('');
    }
    }

    function submitProgressLog() {
    if (!S.editId) return;
    const personEl = document.getElementById('progressPerson');
    const stageEl = document.getElementById('progressStage');
    const qtyEl = document.getElementById('progressQty');
    const person = personEl ? personEl.value : '';
    const stage = stageEl ? stageEl.value : '';
    const qty = qtyEl ? qtyEl.value : '';
    const result = logJobProgress(S.editId, stage, qty, person);
    if (result.ok) {
        renderProgressSection();
        if (qtyEl) qtyEl.value = '';
    } else {
        toastError(result.error || 'Invalid');
    }
    }

    // ============================================================
    // NOTES SECTION — append-only production & assembly logs
    // ============================================================
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
    function renderNotesSection() {
    const job = S.jobs.find(j => j.id === S.editId);
    if (!job) return;
    ensureNotesLog(job);
    const prodEl = document.getElementById('notesLogList');
    if (prodEl) {
        prodEl.innerHTML = (job.notesLog || []).slice().reverse().map(e => {
            const time = new Date(e.timestamp).toLocaleString();
            return `<div class="progress-entry"><strong>${escapeHtml(e.person || 'Unknown')}</strong> · ${escapeHtml(time)}<br>${escapeHtml(e.text)}</div>`;
        }).join('') || '<div class="progress-empty">No notes yet.</div>';
    }
    const asmEl = document.getElementById('assemblyLogList');
    if (asmEl) {
        asmEl.innerHTML = (job.assemblyLog || []).slice().reverse().map(e => {
            const time = new Date(e.timestamp).toLocaleString();
            return `<div class="progress-entry"><strong>${escapeHtml(e.person || 'Unknown')}</strong> · ${escapeHtml(time)}<br>${escapeHtml(e.text)}</div>`;
        }).join('') || '<div class="progress-empty">No notes yet.</div>';
    }
    }
    function addProductionNote() {
    const job = S.jobs.find(j => j.id === S.editId);
    if (!job) return;
    const el = document.getElementById('jNotesInput');
    const text = el && el.value ? el.value.trim() : '';
    if (!text) return;
    ensureNotesLog(job);
    const person = S.mode === 'admin' ? 'Admin' : 'Operator';
    job.notesLog.push({ text, person, timestamp: new Date().toISOString() });
    job.notes = text;
    if (el) el.value = '';
    Storage.saveJob(job);
    renderNotesSection();
    toast('NOTE LOGGED');
    }
    function addAssemblyNote() {
    const job = S.jobs.find(j => j.id === S.editId);
    if (!job) return;
    const el = document.getElementById('jAssemblyInput');
    const text = el && el.value ? el.value.trim() : '';
    if (!text) return;
    ensureNotesLog(job);
    const person = S.mode === 'admin' ? 'Admin' : 'Operator';
    job.assemblyLog.push({ text, person, timestamp: new Date().toISOString() });
    job.assembly = text;
    if (el) el.value = '';
    Storage.saveJob(job);
    renderNotesSection();
    toast('NOTE LOGGED');
    }

    // ============================================================
    // SAVE JOB — data-driven from FIELD_MAP
    // ============================================================
    function saveJob() {
    const cat = document.getElementById('jCat').value.trim().toUpperCase();
    const artist = document.getElementById('jArtist').value.trim();
    const album = document.getElementById('jAlbum') ? document.getElementById('jAlbum').value.trim() : '';
    if (!cat && !artist) { toast('CATALOG # OR ARTIST REQUIRED'); return; }

    if (!S.editId) {
        const dupes = S.jobs.filter(j => {
            if (cat && j.catalog && j.catalog.toUpperCase() === cat) return true;
            if (artist && album && j.artist && j.album &&
                j.artist.toLowerCase() === artist.toLowerCase() &&
                j.album.toLowerCase() === album.toLowerCase()) return true;
            return false;
        });
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

    // Read all fields from config
    FIELD_MAP.forEach(f => {
        const el = document.getElementById(f.id);
        if (!el) return;
        let val = el.value;
        if (f.type === 'text' && f.transform === 'upper') val = val.trim().toUpperCase();
        else if (f.type === 'text') val = val.trim();
        job[f.key] = val;
    });

    job.assets = JSON.parse(JSON.stringify(curAssets));

    if (S.editId) {
        const existing = S.jobs.find(j => j.id === S.editId);
        job.progressLog = (existing && Array.isArray(existing.progressLog)) ? existing.progressLog : [];
        job.notes = existing && existing.notes != null ? existing.notes : job.notes;
        job.assembly = existing && existing.assembly != null ? existing.assembly : job.assembly;
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

    // Apply assignment from form; canonical source is press.job_id, then we derive job.press
    if (job.status === 'pressing' && job.press) {
        const matchPress = S.presses.find(p => p.name === job.press);
        if (matchPress) setAssignment(matchPress.id, job.id);
    } else {
        releasePressByJob(job.id);
    }

    closePanel();
    Storage.savePresses(S.presses);
    Storage.saveJob(job);
    renderAll();
    toast(S.editId ? 'JOB UPDATED' : 'JOB ADDED');
    }

    // ============================================================
    // DELETE
    // ============================================================
    let confCb = null;
    function confirmDel() {
    const j = S.jobs.find(x => x.id === S.editId);
    openConfirm('DELETE JOB?', `REMOVE ${j?.catalog || 'this job'} — ${j?.artist || ''}? CANNOT BE UNDONE.`, async () => {
        const id = S.editId;
        releasePressByJob(id);
        S.jobs = S.jobs.filter(x => x.id !== id);
        closePanel();
        await Storage.deleteJob(id);
        renderAll();
        toast('JOB DELETED');
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
    document.getElementById('confOk').addEventListener('click', () => { if (confCb) confCb(); closeConfirm(); });

    // ============================================================
    // BACKUP EXPORT (admin) — full operational data as JSON
    // ============================================================
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
    // CSV EXPORT
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

    // ============================================================
    // CSV IMPORT — proper quoted field parsing
    // ============================================================
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
            const existingCat = row.catalog ? S.jobs.find(j => j.catalog && j.catalog.toUpperCase() === (row.catalog || '').toUpperCase()) : null;
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
        Storage.saveJobs(toSave)
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
    // Last row
    row.push(field);
    if (row.some(f => f.trim())) lines.push(row);
    return lines;
    }

    // ============================================================
    // BILLING TOGGLE — collapses invoice/payment fields
    // Auto-opens when editing a job that has billing data filled in
    // ============================================================
    function toggleBilling() {
    const toggle = document.getElementById('billingToggle');
    const body = document.getElementById('billingBody');
    if (!toggle || !body) return;
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open');
    toggle.classList.toggle('open');
    }

    // Auto-expand billing if any billing fields have data
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
    // KEYBOARD — Escape, QC shortcuts (1-6), search focus (/)
    // ============================================================
    const QC_TYPES = ['FLASH','BLEMISH','OFF-CENTER','AUDIO','UNTRIMMED','BISCUIT/FLASH'];

    document.addEventListener('keydown', e => {
    // Don't intercept if user is typing in an input or textarea
    const tag = document.activeElement?.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    const stationVisible = isStationShellVisible();

    if (e.key === 'Escape') {
        // When a station shell is open, Escape returns to role select (launcher)
        if (stationVisible) {
        doLogout();
        e.preventDefault();
        return;
        }
        if (document.getElementById('confirmWrap').classList.contains('open')) closeConfirm();
        else if (panelOpen) closePanel();
        else if (document.body.classList.contains('tv')) exitTV();
        // Also clear search on Escape if a search input is focused
        if (isTyping && document.activeElement.classList.contains('search-input')) {
        document.activeElement.value = '';
        document.activeElement.blur();
        renderFloor(); renderJobs();
        }
        return;
    }

    // Admin-only shortcuts: do not run when a station shell is visible (admin UI is hidden)
    if (!isTyping && !panelOpen && !stationVisible) {
        const qcPage = document.getElementById('pg-qc');
        if (qcPage && qcPage.classList.contains('on')) {
        const n = parseInt(e.key);
        if (n >= 1 && n <= 6) {
            logQC(QC_TYPES[n - 1]);
            return;
        }
        }

        // / to focus search (like GitHub, Gmail)
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

        // N for new job (only on pages where FAB is visible)
        if ((e.key === 'n' || e.key === 'N') && (currentPage === 'floor' || currentPage === 'jobs')) {
        openPanel(null);
        }
    }
    });
