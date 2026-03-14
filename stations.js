// ============================================================
// STATION CONTEXT — helpers for station-specific shells
// ============================================================
function getStationContext() {
  if (!S.stationType) return null;
  return {
    stationType: S.stationType,
    stationId: S.stationId || '',
    assignedPressId: S.assignedPressId || null,
  };
}

function isStationType(type) {
  return S.stationType === type;
}

/* PURGATORY: getStationPress() and getStationJob() removed (2026-03-06). Only used by Press Station. */

function setStationContext(opts) {
  S.stationType = opts.stationType ?? null;
  S.stationId = opts.stationId ?? '';
  S.assignedPressId = opts.assignedPressId ?? null;
}

// ============================================================
// SHELL VISIBILITY — admin vs station shells
// ============================================================
const STATION_SHELL_IDS = ['qcStationShell', 'floorManagerShell'];

/** Hide station shells only (no app/fab change). Use when returning to launcher. */
function hideStationShellsOnly() {
  STATION_SHELL_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('on');
  });
}

function hideAllShells() {
  const app = document.getElementById('app');
  if (app) app.style.display = 'block';
  hideStationShellsOnly();
  const fab = document.getElementById('fab');
  if (fab) fab.style.display = 'flex';
  const fabLabel = document.querySelector('.fab-label');
  if (fabLabel) fabLabel.style.display = 'block';
  const syncbar = document.querySelector('.syncbar');
  if (syncbar) syncbar.style.display = 'block';
}

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

function returnToAdmin() {
  setStationContext({});
  // Ensure admin shell mode and top bar state after leaving a station
  S.mode = 'admin';
  const badge = document.getElementById('modeBadge');
  if (badge) {
    badge.textContent = 'ADMIN';
    badge.className = 'bar-mode admin';
  }
  const backupBtn = document.getElementById('backupBtn');
  if (backupBtn) backupBtn.style.display = 'none';
  if (typeof _showAdminUtils === 'function') _showAdminUtils(true);
  hideAllShells();
  renderAll();
}

function isStationShellVisible() {
  return STATION_SHELL_IDS.some(id => {
    const el = document.getElementById(id);
    return el && el.classList.contains('on');
  });
}

// ============================================================
// AUTH ROLE — from profile when Supabase auth enabled
// ============================================================
function getAuthRole() {
  const p = window.PMP && window.PMP.userProfile;
  return (p && p.role) ? p.role : null;
}

function getAuthAssignedPressId() {
  const p = window.PMP && window.PMP.userProfile;
  return (p && p.assigned_press_id) ? p.assigned_press_id : null;
}

function updateSentryUserTag() {
  try {
    if (window.Sentry) {
      const role = getAuthRole();
      if (role) Sentry.setTag('user.role', role);
    }
  } catch (e) {}
}

function mayEnterStation(choice, pressId) {
  const role = getAuthRole();
  if (!role) return true;
  if (role === 'admin') return true;
  if (role === 'floor_manager') return choice === 'floor_manager';
  if (role === 'press') return choice === 'press' && !!pressId;
  if (role === 'qc') return choice === 'qc';
  return false;
}

// ============================================================
// STATION EDIT PERMISSIONS
// ============================================================
function getStationEditPermissions() {
  const role = getAuthRole();
  const ctx = getStationContext();

  if (!role) {
    if (!ctx) return { canUseFullPanel: true, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly','fulfillment_phase','caution'], canLogPressProgress: true, canLogQC: true };
    switch (ctx.stationType) {
      case 'floor_manager': return { canUseFullPanel: false, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly','fulfillment_phase','caution'], canLogPressProgress: false, canLogQC: false };
      case 'press': return { canUseFullPanel: false, canUseFloorCard: false, floorCardFields: [], canLogPressProgress: true, canLogQC: false };
      case 'qc': return { canUseFullPanel: false, canUseFloorCard: false, floorCardFields: [], canLogPressProgress: false, canLogQC: true };
      default: return { canUseFullPanel: true, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly','fulfillment_phase','caution'], canLogPressProgress: true, canLogQC: true };
    }
  }

  switch (role) {
    case 'admin':
      return { canUseFullPanel: true, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly','fulfillment_phase','caution'], canLogPressProgress: true, canLogQC: true };
    case 'floor_manager':
      return { canUseFullPanel: false, canUseFloorCard: true, floorCardFields: ['status','press','location','due','notes','assembly','fulfillment_phase','caution'], canLogPressProgress: false, canLogQC: false };
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

function canEditField(field) {
  const p = getStationEditPermissions();
  if (p.canUseFullPanel) return true;
  return p.floorCardFields.indexOf(field) !== -1;
}

// ============================================================
// PRESS ASSIGNMENT — canonical source: press.job_id
// ============================================================
function syncJobPressFromPresses() {
  S.jobs.forEach(j => {
    const presses = S.presses.filter(p => p.job_id === j.id);
    j.press = presses.length ? presses.map(p => p.name).join(', ') : '';
  });
}

function setAssignment(pressId, jobId) {
  const jobIdVal = jobId || null;
  const p = S.presses.find(x => x.id === pressId);
  if (p) {
    p.job_id = jobIdVal;
    p.status = jobIdVal ? 'online' : 'idle';
  }
  syncJobPressFromPresses();
}

function releasePressByJob(jobId) {
  S.presses.forEach(p => {
    if (p.job_id === jobId) {
      p.job_id = null;
      p.status = 'idle';
    }
  });
  syncJobPressFromPresses();
}

function blurPressGridSelectIfFocused() {
  const grid = document.getElementById('pressGrid');
  const active = document.activeElement;
  if (grid && active && active.tagName === 'SELECT' && grid.contains(active)) active.blur();
}

function assignJob(pid, jid) {
  const p = S.presses.find(x => x.id === pid);
  if (p) {
    setAssignment(pid, jid || null);
    Storage.savePresses(S.presses);
    blurPressGridSelectIfFocused();
    renderAll();
  }
}

/* PURGATORY: selectPressStationJob() removed (2026-03-06). Press assignment now via FLOOR admin controls only. */

function setPressOnDeck(pid, jobId) {
  const p = S.presses.find(x => x.id === pid);
  if (p) {
    p.on_deck_job_id = (jobId && jobId.trim()) ? jobId.trim() : null;
    Storage.savePresses(S.presses);
    blurPressGridSelectIfFocused();
    renderAll();
  }
}

function showOnDeckArrow(pressId) {
  S.pressOnDeckArrowPressId = pressId;
  renderAll();
}

function sendOnDeckToPress(pressId) {
  const p = S.presses.find(x => x.id === pressId);
  if (!p || !p.on_deck_job_id) return;
  const jobId = p.on_deck_job_id;
  setAssignment(pressId, jobId);
  p.on_deck_job_id = null;
  S.pressOnDeckArrowPressId = null;
  Storage.savePresses(S.presses);
  blurPressGridSelectIfFocused();
  renderAll();
  if (typeof toast === 'function') toast('Sent to press');
}

function setPressStatus(pid, st) {
  const p = S.presses.find(x => x.id === pid);
  if (p) {
    p.status = st;
    Storage.savePresses(S.presses);
    blurPressGridSelectIfFocused();
    renderAll();
  }
}

/* PURGATORY: Entire Press Station shell section removed (2026-03-06).
   Functions purged: openPressStation, exitPressStation, psNumpad*, renderPressStationShell,
   triggerPressStationRailGlow, updatePressStationProgress, pressStationLogPressed,
   pressStationHold, pressStationResume, pressStationSaveNote.
   LOG console now serves all counted movement. See docs/purgatory-protocol.md. */

// ============================================================
// QC STATION SHELL
// ============================================================
function openQCStation() {
  hideAllShells();
  goPg('log');
  renderAll();
}

function exitQCStation() {
  if (getAuthRole() === 'admin' || S.mode === 'admin') returnToAdmin();
  else doLogout();
}

function renderQCStationShell() {
  const today = new Date().toDateString();
  const todayLog = S.qcLog.filter(e => e.date === today);
  const pressing = sortJobsByCatalogAsc(S.jobs.filter(j => !isJobArchived(j) && ['pressing','assembly'].includes(j.status)));
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

  const totalRejects = S.jobs.reduce((sum, job) => {
    const log = job.progressLog || [];
    return sum + log.reduce((s, e) => (e.stage === 'rejected' && e.timestamp && new Date(e.timestamp).toDateString() === today ? s + (Math.max(0, parseInt(e.qty, 10) || 0)) : s), 0);
  }, 0);
  const counts = {};
  todayLog.forEach(e => counts[e.type] = (counts[e.type] || 0) + 1);
  summaryEl.innerHTML = totalRejects
    ? `<span style="color:var(--d2);margin-right:var(--space-sm)">${totalRejects} total</span>` +
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
// FLOOR MANAGER SHELL
// ============================================================
function openFloorManager() {
  setStationContext({ stationType: 'floor_manager', stationId: 'fm1', assignedPressId: null });
  showShell('floorManagerShell');
  renderAll();
}

function exitFloorManager() {
  if (getAuthRole() === 'admin' || S.mode === 'admin') returnToAdmin();
  else doLogout();
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

  pressEl.innerHTML = S.presses.map(p => {
    const main = buildPressCardHTML(p, 'floorCard', false);
    const onDeck = buildOnDeckCardHTML(p);
    return '<div class="press-card-wrap">' + main + onDeck + '</div>';
  }).join('');

  if (!jobs.length) {
    bodyEl.innerHTML = `<tr><td colspan="7" class="empty">${q ? 'NO MATCHES' : 'NO ACTIVE JOBS'}</td></tr>`;
    return;
  }
  bodyEl.innerHTML = jobs.map(j => floorTableRowHTML(j, { openBtnLabel: 'EDIT' })).join('');
}
