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

function getStationPress() {
  if (S.stationType !== 'press' || !S.assignedPressId) return null;
  return S.presses.find(p => p.id === S.assignedPressId) || null;
}

function getStationJob() {
  const press = getStationPress();
  return press && press.job_id ? S.jobs.find(j => j.id === press.job_id) || null : null;
}

function setStationContext(opts) {
  S.stationType = opts.stationType ?? null;
  S.stationId = opts.stationId ?? '';
  S.assignedPressId = opts.assignedPressId ?? null;
}

// ============================================================
// SHELL VISIBILITY — admin vs station shells
// ============================================================
const STATION_SHELL_IDS = ['pressStationShell', 'qcStationShell', 'floorManagerShell'];

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

// ============================================================
// PRESS STATION SHELL
// ============================================================
function openPressStation(pressId) {
  const p = S.presses.find(x => x.id === pressId);
  if (!p) return;
  setStationContext({ stationType: 'press', stationId: pressId, assignedPressId: pressId });
  showShell('pressStationShell');
  renderAll();
}

function exitPressStation() {
  if (getAuthRole() === 'admin' || S.mode === 'admin') returnToAdmin();
  else doLogout();
}

let psNumpadValue = '0';

function psNumpadTap(digit) {
  if (psNumpadValue === '0') psNumpadValue = digit;
  else if (psNumpadValue.length < 5) psNumpadValue += digit;
  psNumpadUpdateDisplay();
}

function psNumpadClear() {
  psNumpadValue = '0';
  psNumpadUpdateDisplay();
}

function psNumpadBack() {
  psNumpadValue = psNumpadValue.length > 1 ? psNumpadValue.slice(0, -1) : '0';
  psNumpadUpdateDisplay();
}

function psNumpadSet(n) {
  psNumpadValue = String(n);
  psNumpadUpdateDisplay();
}

function psNumpadUpdateDisplay() {
  const el = document.getElementById('psNumpadDisplay');
  if (el) {
    const n = parseInt(psNumpadValue, 10) || 0;
    el.textContent = n.toLocaleString();
    el.classList.toggle('has-value', n > 0);
  }
  const btn = document.getElementById('psNumpadLog');
  if (btn) {
    const n = parseInt(psNumpadValue, 10) || 0;
    btn.disabled = n === 0;
    btn.textContent = n > 0 ? `LOG +${n.toLocaleString()} PRESSED` : 'LOG PRESSED';
  }
}

function psNumpadSubmit() {
  const n = parseInt(psNumpadValue, 10) || 0;
  if (n < 1) return;
  pressStationLogPressed(n);
  psNumpadValue = '0';
  psNumpadUpdateDisplay();
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
<div class="ps-numpad">
  <div class="ps-numpad-display" id="psNumpadDisplay">0</div>
  <div class="ps-numpad-grid">
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('7')">7</button>
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('8')">8</button>
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('9')">9</button>
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('4')">4</button>
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('5')">5</button>
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('6')">6</button>
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('1')">1</button>
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('2')">2</button>
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('3')">3</button>
    <button type="button" class="ps-numpad-btn ps-numpad-clear" onclick="psNumpadClear()">C</button>
    <button type="button" class="ps-numpad-btn" onclick="psNumpadTap('0')">0</button>
    <button type="button" class="ps-numpad-btn ps-numpad-back" onclick="psNumpadBack()">←</button>
  </div>
  <div class="ps-numpad-presets">
    <button type="button" class="ps-numpad-preset" onclick="psNumpadSet(25)">25</button>
    <button type="button" class="ps-numpad-preset" onclick="psNumpadSet(50)">50</button>
    <button type="button" class="ps-numpad-preset" onclick="psNumpadSet(100)">100</button>
  </div>
  <button type="button" class="ps-numpad-log" id="psNumpadLog" onclick="psNumpadSubmit()">
    LOG PRESSED
  </button>
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

  psNumpadValue = '0';
  requestAnimationFrame(() => psNumpadUpdateDisplay());

  logEl.innerHTML = '';
}

function pressStationLogPressed(qty) {
  if (!getStationEditPermissions().canLogPressProgress) return;
  const job = getStationJob();
  if (!job) return;
  const result = logJobProgress(job.id, 'pressed', qty, 'Press Station');
  if (result.ok) {
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
// QC STATION SHELL
// ============================================================
function openQCStation() {
  hideAllShells();
  goPg('qc');
  renderAll();
}

function exitQCStation() {
  if (getAuthRole() === 'admin' || S.mode === 'admin') returnToAdmin();
  else doLogout();
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

  pressEl.innerHTML = S.presses.map(p => buildPressCardHTML(p, 'floorCard', false)).join('');

  if (!jobs.length) {
    bodyEl.innerHTML = `<tr><td colspan="7" class="empty">${q ? 'NO MATCHES' : 'NO ACTIVE JOBS'}</td></tr>`;
    return;
  }
  bodyEl.innerHTML = jobs.map(j => floorTableRowHTML(j, { openBtnLabel: 'EDIT' })).join('');
}
