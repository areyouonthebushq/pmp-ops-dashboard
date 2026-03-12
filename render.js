// ============================================================
// SHARED DATA & RENDER HELPERS — single source for floor/stats/press
// ============================================================
function getFloorStats() {
  const open = S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done');
  const active = open.filter(j => ['pressing','assembly'].includes(j.status));
  const overdue = open.filter(j => j.due && new Date(j.due) < Date.now());
  const online = S.presses.filter(p => p.status === 'online').length;
  const onPress = S.presses.filter(p => p.job_id).map(p => p.job_id);
  return [
    { key: 'presses', v: `${online}/${S.presses.length}`, l: 'PRESSES', s: 'online', c: online < S.presses.length ? 'warn' : '' },
    { key: 'active', v: active.length, l: 'ACTIVE', s: 'pressing/assembly', c: '' },
    { key: 'queued', v: open.filter(j => j.status === 'queue').length, l: 'QUEUED', s: 'waiting', c: '' },
    { key: 'overdue', v: overdue.length, l: 'OVERDUE', s: 'past due date', c: overdue.length ? 'red' : '' },
    { key: 'total', v: open.length, l: 'TOTAL OPEN', s: 'jobs in system', c: '' },
  ];
}

function getFloorJobs(query, statFilter) {
  const q = (query || '').toLowerCase().trim();
  const open = S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done');
  const total = open.length;
  let jobs = open.slice();
  if (statFilter === 'presses') {
    const onPress = S.presses.filter(p => p.job_id).map(p => p.job_id);
    jobs = jobs.filter(j => onPress.includes(j.id));
  } else if (statFilter === 'active') {
    jobs = jobs.filter(j => ['pressing','assembly'].includes(j.status));
  } else if (statFilter === 'queued') {
    jobs = jobs.filter(j => j.status === 'queue');
  } else if (statFilter === 'overdue') {
    jobs = jobs.filter(j => j.due && j.status !== 'done' && new Date(j.due) < Date.now());
  }
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

function setFloorStatFilter(key) {
  if (key == null || key === '') S.floorStatFilter = null;
  else S.floorStatFilter = S.floorStatFilter === key ? null : key;
  renderStats();
  renderFloor();
}

function floorTableHeaderHTML() {
  return FLOOR_COLUMNS.map(c => {
    const active = S.floorSortBy === c.key;
    const arrow = active ? (S.floorSortDir === 'asc' ? ' ▲' : ' ▼') : '';
    return `<th class="sortable-th ${active ? 'sort-' + S.floorSortDir : ''}" onclick="setFloorSort('${c.key}')" title="Sort by ${c.label}">${c.label}${arrow}</th>`;
  }).join('');
}

function floorTableRowHTML(j, opts) {
  const statusId = (opts && opts.statusCellId) ? ` id="st-${j.id}"` : '';
  return `
  <tr>
  <td class="panel-trigger" style="color:var(--w);font-weight:700;cursor:pointer" onclick="openPanel('${j.id}')" title="Open job">${j.catalog || '—'}</td>
  <td class="panel-trigger" onclick="openPanel('${j.id}')" title="Open job" style="cursor:pointer">
    <div style="color:var(--d)">${j.artist || '—'}</div>
    <div style="color:var(--d3);font-size:11px">${j.album || ''}</div>
  </td>
  <td>${j.format ? `<span class="pill ${j.format.includes('7"') ? 'seven' : 'go'}">${j.format}</span>` : '—'}</td>
  <td>${j.color ? `<span style="color:var(--d2)">${escapeHtml(j.color)}</span>` : '—'}</td>
  <td>${j.qty ? parseInt(j.qty, 10).toLocaleString() : '—'}</td>
  <td class="panel-trigger" onclick="openPanel('${j.id}')" title="Open job to change status" style="cursor:pointer">
    <div class="status-pill-readonly ${statusTapClass(j.status)}"${statusId}>
    ${(j.status || 'queue').toUpperCase()}
    </div>
  </td>
  <td class="${dueClass(j.due)}">${dueLabel(j.due)}</td>
  </tr>`;
}

function buildPressCardHTML(p, linkTo, showControls) {
  const job = p.job_id ? S.jobs.find(j => j.id === p.job_id) : null;
  const ah = job ? assetHealth(job) : { done: 0, total: 0, pct: 0 };
  const prog = job ? progressDisplay(job) : null;
  const isPressStation = linkTo === 'pressStation';
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
      ${assetBarSegmentedHTML(job)}
    </div>
    ` : (isPressStation ? `<div class="pc-job-link" onclick="openPressStation('${p.id}')" title="Open Press Station" style="cursor:pointer"><div class="pc-idle-msg">NO JOB ASSIGNED</div></div>` : '<div class="pc-idle-msg">NO JOB ASSIGNED</div>')}
    ${showControls ? `
    <div class="pc-controls" onclick="event.stopPropagation()">
      <select class="pc-select" onchange="assignJob('${p.id}',this.value)">
      <option value="">— ASSIGN JOB</option>
      ${sortJobsByCatalogAsc(S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done')).map(j => `<option value="${j.id}" ${p.job_id === j.id ? 'selected' : ''}>${j.catalog || j.id} · ${j.artist || ''}</option>`).join('')}
      </select>
      <select class="pc-select" style="max-width:110px" onchange="setPressStatus('${p.id}',this.value)">
      <option value="online"  ${p.status === 'online'  ? 'selected' : ''}>Online</option>
      <option value="warning" ${p.status === 'warning' ? 'selected' : ''}>Warning</option>
      <option value="offline" ${p.status === 'offline' ? 'selected' : ''}>Offline</option>
      <option value="idle"    ${p.status === 'idle'    ? 'selected' : ''}>Idle</option>
      </select>
    </div>
    ` : ''}
  </div>`;
}

// ============================================================
// RENDER ALL — single entry; all shells read from S and shared helpers
// ============================================================
function renderAll() {
  const ctx = getStationContext();
  if (ctx && isStationType('press')) {
    if (typeof psNumpadValue !== 'undefined' && psNumpadValue !== '0') {
      if (typeof updatePressStationProgress === 'function') updatePressStationProgress();
      return;
    }
    renderPressStationShell();
    return;
  }
  if (ctx && isStationType('floor_manager')) {
    renderFloorManagerShell();
    return;
  }
  if (typeof currentPage !== 'undefined' && currentPage === 'log' && typeof logNumpadValue !== 'undefined' && logNumpadValue !== '0') {
    return;
  }
  renderAdminShell();
}

function renderAdminShell() {
  renderStats();
  renderPresses();
  renderFloor();
  renderJobs();
  renderTodos();
  renderLog();
  renderNotesPage();
  renderCompoundsPage();
  renderDevPage();
  renderTV();
}

// ============================================================
// PVC — operational compound library (visual reference)
// ============================================================

function renderCompoundsPage() {
  const shell = document.getElementById('pg-compounds');
  if (!shell) return;
  const listEl = document.getElementById('compoundList');
  if (!listEl) return;

  const compounds = Array.isArray(S.compounds) ? S.compounds : [];

  if (!compounds.length) {
    listEl.innerHTML = '<div class="empty">NO COMPOUNDS YET · TAP + ADD COMPOUND</div>';
    return;
  }

  listEl.innerHTML = compounds.map((c) => {
    var imageUrl = (c.imageUrl || '').trim();
    var hasImage = !!imageUrl;
    var thumbStyle = hasImage ? ' style="background-image:url(\'' + imageUrl.replace(/'/g, "\\'") + '\')"' : '';
    var thumbClass = 'compound-thumb' + (hasImage ? ' compound-thumb-hasimg' : '');
    var thumbOnclick = 'event.stopPropagation();pvcThumbClick(\'' + c.id.replace(/'/g, "\\'") + '\',' + hasImage + ')';
    var thumb = '<div class="' + thumbClass + '"' + thumbStyle + ' onclick="' + thumbOnclick + '" role="button" aria-label="' + (hasImage ? 'View or replace photo' : 'Upload photo') + '" title="' + (hasImage ? 'View / Replace photo' : 'Upload photo') + '"></div>';
    var number = (c.number || '').trim();
    var codeName = (c.code_name || '').trim() || '—';
    var amount = (c.amount_on_hand || '').trim();
    var color = (c.color || '').trim();
    var notes = (c.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var metaParts = [];
    if (amount) metaParts.push('AMT · ' + amount);
    if (color) metaParts.push(color);
    var metaHtml = metaParts.length ? '<div class="compound-meta">' + metaParts.map(function (p) { return '<span class="compound-pill">' + escapeHtml(p) + '</span>'; }).join('') + '</div>' : '';
    return (
      '<div class="compound-card" onclick="editCompound(\'' + c.id.replace(/'/g, "\\'") + '\')">' +
      thumb +
      '<div class="compound-main">' +
      (number ? '<div class="compound-number">' + escapeHtml(number) + '</div>' : '') +
      '<div class="compound-name">' + escapeHtml(codeName) + '</div>' +
      metaHtml +
      (notes ? '<div class="compound-notes">' + notes + '</div>' : '') +
      '</div></div>'
    );
  }).join('');
}

// ============================================================
// DEV PAGE — backstage product memory
// ============================================================

const DEV_AREAS = [
  'JOBS',
  'FLOOR',
  'LOG',
  'NOTES',
  'AUDIT',
  'PANEL',
  'ASSETS',
  'TV',
  'AUTH / LAUNCHER',
  'DEV',
];

function getDevAreaFilter() {
  const sel = document.getElementById('devAreaSelect');
  if (!sel) return '';
  return sel.value || '';
}

function renderDevPage() {
  const shell = document.getElementById('pg-dev');
  if (!shell) return;
  const isAdmin = S.mode === 'admin';
  shell.style.display = isAdmin ? '' : 'none';

  const sel = document.getElementById('devAreaSelect');
  if (sel && !sel.dataset.bound) {
    sel.innerHTML = [''].concat(DEV_AREAS).map(v => {
      if (!v) return '<option value="">ALL CHANNELS</option>';
      return `<option value="${v}">${v}</option>`;
    }).join('');
    sel.dataset.bound = '1';
  }

  const feedEl = document.getElementById('devFeed');
  if (!feedEl) return;
  const filter = getDevAreaFilter();
  const notes = (Array.isArray(S.devNotes) ? S.devNotes : []).slice().sort((a, b) => {
    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
  });
  const filtered = filter ? notes.filter(n => (n.area || '') === filter) : notes;
  if (!filtered.length) {
    feedEl.innerHTML = '<div class="empty">NO DEV NOTES YET</div>';
    return;
  }
  feedEl.innerHTML = filtered.map(n => {
    const ts = n.timestamp ? new Date(n.timestamp).toLocaleString() : '';
    const area = n.area || '';
    const person = n.person || '';
    const text = (n.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <div class="dev-entry">
        <div class="dev-entry-head">
          <span class="dev-entry-area">${area}</span>
          <span class="dev-entry-meta">${person || '—'} · ${ts}</span>
        </div>
        <div class="dev-entry-text">${text.replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }).join('');
}

// ============================================================
// STATS
// ============================================================
function renderStats() {
  const el = document.getElementById('statsRow');
  if (!el) return;
  const items = getFloorStats();
  const activeKey = S.floorStatFilter;
  el.innerHTML = items.map(i => {
    const isActive = activeKey === i.key;
    return `<div class="stat stat-clickable ${isActive ? 'stat-active' : ''}" onclick="setFloorStatFilter('${i.key}')" title="Show jobs: ${i.s}">
    <div class="sv ${i.c}">${i.v}</div>
    <div class="sl">${i.l}</div>
    <div class="ss">${i.s}</div>
    </div>`;
  }).join('');
  const filterHint = document.getElementById('floorStatFilterHint');
  if (filterHint) {
    const label = { presses: 'On press', active: 'Active', queued: 'Queued', overdue: 'Overdue', total: 'Total open' }[activeKey];
    if (activeKey && label) {
      filterHint.innerHTML = `Showing: <strong>${label}</strong> <button type="button" class="floor-filter-clear" onclick="setFloorStatFilter(null)">clear</button>`;
      filterHint.style.display = '';
    } else {
      filterHint.innerHTML = '';
      filterHint.style.display = 'none';
    }
  }
}

// ============================================================
// PRESSES
// ============================================================
function renderPresses() {
  const el = document.getElementById('pressGrid');
  if (!el) return;
  const active = document.activeElement;
  if (active && active.tagName === 'SELECT' && el.contains(active)) return;
  const isAdmin = S.mode === 'admin';
  el.innerHTML = S.presses.map(p => buildPressCardHTML(p, isAdmin ? 'pressStation' : 'panel', isAdmin)).join('');
}

// ============================================================
// FLOOR TABLE
// ============================================================
var FLOOR_LIST_SECTION_LABELS = { presses: 'PRESSES', active: 'ACTIVE', queued: 'QUEUED', overdue: 'OVERDUE', total: 'TOTAL OPEN' };

function renderFloor() {
  const detailBlock = document.getElementById('floorDetailBlock');
  if (detailBlock) detailBlock.style.display = S.floorStatFilter == null ? 'none' : '';

  const el = document.getElementById('floorBody');
  if (!el) return;
  const secTitleEl = document.getElementById('floorListSecTitle');
  if (secTitleEl) secTitleEl.textContent = FLOOR_LIST_SECTION_LABELS[S.floorStatFilter] || '';

  const q = document.getElementById('floorSearch')?.value || '';
  const { jobs: rawJobs, total } = getFloorJobs(q, S.floorStatFilter);
  const jobs = sortFloorJobs(rawJobs);
  const countEl = document.getElementById('floorCount');
  const statFilterLabel = { presses: 'On press', active: 'Active', queued: 'Queued', overdue: 'Overdue', total: 'Total open' }[S.floorStatFilter] || '';
  if (countEl) countEl.textContent = statFilterLabel && !q ? `${jobs.length} ${statFilterLabel.toLowerCase()}` : q ? `${jobs.length} of ${total}` : `${total} jobs`;

  ensureFloorSortColumn();
  const table = el.closest('table');
  if (table) {
    const theadTr = table.querySelector('thead tr');
    if (theadTr) theadTr.innerHTML = floorTableHeaderHTML();
  }

  if (!jobs.length) {
    el.innerHTML = `<tr><td colspan="7" class="empty">${q ? 'NO MATCHES FOR "' + q + '"' : 'NO ACTIVE JOBS'}</td></tr>`;
    return;
  }
  el.innerHTML = jobs.map(j => floorTableRowHTML(j, { statusCellId: true })).join('');

  const doneEl = document.getElementById('recentDone');
  if (doneEl) {
    const doneJobs = S.jobs.filter(j => !isJobArchived(j) && j.status === 'done').slice(0, 5);
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
// FLOOR CARD — full-screen statboard
// ============================================================
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

// ============================================================
// PROGRESS DETAIL OVERLAY
// ============================================================
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
  document.getElementById('progressDetailBar').innerHTML = [
    rejectedPct > 0 ? `<div class="pd-seg rejected" style="width:${rejectedPct}%" title="Rejected: ${p.rejected.toLocaleString()}"></div>` : '',
    qcPct > 0 ? `<div class="pd-seg qc" style="width:${qcPct}%" title="QC passed: ${p.qcPassed.toLocaleString()}"></div>` : '',
    pendingPct > 0 ? `<div class="pd-seg pressed" style="width:${pendingPct}%" title="Pending QC: ${p.pendingQC.toLocaleString()}"></div>` : '',
    remainingPct > 0 ? `<div class="pd-seg remaining" style="width:${remainingPct}%"></div>` : '',
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

// ============================================================
// ASSETS OVERLAY (standalone modal)
// ============================================================
let assetsOverlayState = null;

function openAssetsOverlay(jobId) {
  clearAssetsOverlayPulseTimers();
  const job = S.jobs.find(j => j.id === jobId);
  if (!job) return;
  const raw = JSON.parse(JSON.stringify(job.assets || {}));
  ASSET_DEFS.forEach(a => {
    const d = raw[a.key] || {};
    const status = typeof getAssetStatus === 'function' ? getAssetStatus(d) : (d.received ? 'received' : d.na ? 'na' : '');
    raw[a.key] = { status, date: d.date || '', person: d.person || '', note: d.note || '', received: status === 'received', na: status === 'na', cautionSince: d.cautionSince || '' };
  });
  assetsOverlayState = { jobId, data: raw };
  document.getElementById('assetsOverlayTitle').textContent = `${job.catalog || '—'} · ${job.artist || '—'}`;
  renderAssetsOverlay();
  document.getElementById('assetsOverlay').classList.add('on');
}

function clearAssetsOverlayPulseTimers() {
  const timeouts = S.assetsOverlayPulseTimeouts;
  if (timeouts && typeof timeouts === 'object') {
    Object.keys(timeouts).forEach(function (k) {
      if (timeouts[k] != null) clearTimeout(timeouts[k]);
    });
  }
  if (S.assetsOverlayPulseTimeouts) S.assetsOverlayPulseTimeouts = {};
  if (S.assetsOverlayPulseKeys) S.assetsOverlayPulseKeys = {};
}

function closeAssetsOverlay(skipSave) {
  if (!assetsOverlayState) {
    assetsOverlayState = null;
    clearAssetsOverlayPulseTimers();
    const el = document.getElementById('assetsOverlay');
    if (el) el.classList.remove('on');
    return;
  }
  flushAssetsOverlayInputs();
  const job = S.jobs.find(j => j.id === assetsOverlayState.jobId);
  if (!job) {
    assetsOverlayState = null;
    clearAssetsOverlayPulseTimers();
    const el = document.getElementById('assetsOverlay');
    if (el) el.classList.remove('on');
    return;
  }
  job.assets = JSON.parse(JSON.stringify(assetsOverlayState.data));
  if (skipSave) {
    assetsOverlayState = null;
    clearAssetsOverlayPulseTimers();
    const el = document.getElementById('assetsOverlay');
    if (el) el.classList.remove('on');
    renderAll();
    return;
  }
  clearAssetsOverlayPulseTimers();
  Storage.updateJobAssets(job.id, job.assets)
    .then(() => {
      assetsOverlayState = null;
      const el = document.getElementById('assetsOverlay');
      if (el) el.classList.remove('on');
      renderAll();
    })
    .catch((e) => {
      if (typeof setSyncState === 'function') setSyncState('error', { toast: 'SAVE FAILED' });
      if (typeof toastError === 'function') toastError('Assets save failed');
    });
}

function flushAssetsOverlayInputs() {
  if (!assetsOverlayState) return;
  ASSET_DEFS.forEach(a => {
    const detailEl = document.getElementById('ado-' + a.key);
    if (!detailEl || !detailEl.classList.contains('open')) return;
    const inputs = detailEl.querySelectorAll('input[type="date"], input[type="text"]');
    if (!assetsOverlayState.data[a.key]) assetsOverlayState.data[a.key] = { status: '', date: '', person: '', note: '', received: false, na: false, cautionSince: '' };
    if (inputs.length >= 1) assetsOverlayState.data[a.key].date = (inputs[0].value || '').trim();
    if (inputs.length >= 2) assetsOverlayState.data[a.key].person = (inputs[1].value || '').trim();
    if (inputs.length >= 3) assetsOverlayState.data[a.key].note = (inputs[2].value || '').trim();
  });
}

function renderAssetsOverlay() {
  if (!assetsOverlayState) return;
  const data = assetsOverlayState.data;
  const getStatus = typeof getAssetStatus === 'function' ? getAssetStatus : function (d) { return d.received ? 'received' : d.na ? 'na' : ''; };
  const received = ASSET_DEFS.filter(a => getStatus(data[a.key]) === 'received').length;
  const na = ASSET_DEFS.filter(a => getStatus(data[a.key]) === 'na').length;
  const caution = ASSET_DEFS.filter(a => getStatus(data[a.key]) === 'caution').length;
  const remaining = ASSET_DEFS.filter(a => !getStatus(data[a.key]) || getStatus(data[a.key]) === '').length;
  const allDone = remaining === 0 && caution === 0;
  let summaryHTML = `<div class="asset-summary">
    <span class="as-received"><span class="as-num">${received}</span> received</span>
    <span class="as-na"><span class="as-num">${na}</span> N/A</span>
    <span class="as-caution"><span class="as-num">${caution}</span> caution</span>
    <span class="as-remaining"><span class="as-num">${remaining}</span> remaining</span>
    ${allDone ? '<span class="as-complete">✓ ALL ASSETS READY</span>' : ''}
  </div>`;
  const job = (S.jobs || []).find(function (j) { return j.id === assetsOverlayState.jobId; });
  const notesLog = (job && job.notesLog) || [];
  if (!S.assetsOverlayPulseKeys) S.assetsOverlayPulseKeys = {};
  if (!S.assetsOverlayPulseTimeouts) S.assetsOverlayPulseTimeouts = {};
  const pulseActive = {};
  const now = Date.now();
  ASSET_DEFS.forEach(function (a) {
    const d = data[a.key] || { status: '', date: '', person: '', note: '', received: false, na: false, cautionSince: '' };
    const status = getStatus(d);
    const cautionSince = (d.cautionSince || '').trim();
    const hasNewNoteSinceCaution = cautionSince && notesLog.some(function (n) { return n.assetKey === a.key && n.timestamp && n.timestamp >= cautionSince; });
    const cautionLocked = status === 'caution' && cautionSince && !hasNewNoteSinceCaution;
    if (cautionLocked) {
      const elapsed = now - new Date(cautionSince).getTime();
      if (elapsed >= 1500 || S.assetsOverlayPulseKeys[a.key]) {
        pulseActive[a.key] = true;
      } else {
        if (!S.assetsOverlayPulseTimeouts[a.key]) {
          S.assetsOverlayPulseTimeouts[a.key] = setTimeout(function () {
            S.assetsOverlayPulseKeys[a.key] = true;
            if (S.assetsOverlayPulseTimeouts) delete S.assetsOverlayPulseTimeouts[a.key];
            renderAssetsOverlay();
          }, 1500 - elapsed);
        }
      }
    } else {
      if (S.assetsOverlayPulseTimeouts[a.key]) {
        clearTimeout(S.assetsOverlayPulseTimeouts[a.key]);
        delete S.assetsOverlayPulseTimeouts[a.key];
      }
      delete S.assetsOverlayPulseKeys[a.key];
    }
  });
  const listEl = document.getElementById('assetsOverlayList');
  if (!listEl) return;
  listEl.innerHTML = summaryHTML + ASSET_DEFS.map(a => {
    const d = data[a.key] || { status: '', date: '', person: '', note: '', received: false, na: false, cautionSince: '' };
    const status = getStatus(d);
    const cautionSince = (d.cautionSince || '').trim();
    const hasNewNoteSinceCaution = cautionSince && notesLog.some(function (n) { return n.assetKey === a.key && n.timestamp && n.timestamp >= cautionSince; });
    const cautionLocked = status === 'caution' && cautionSince && !hasNewNoteSinceCaution;
    const showPulse = cautionLocked && (pulseActive[a.key] || S.assetsOverlayPulseKeys[a.key]);
    const rowClass = status === 'received' ? 'asset-row-received' : status === 'na' ? 'asset-row-na' : status === 'caution' ? 'asset-row-caution' : '';
    const lockedClass = cautionLocked ? ' asset-row-caution-locked' : '';
    const icon = status === 'received' ? '✓' : status === 'na' ? '−' : status === 'caution' ? '⚠' : '';
    const statClass = status === 'received' ? 'astat astat-received' : status === 'na' ? 'astat astat-na' : status === 'caution' ? 'astat astat-caution' : 'astat';
    const addingNote = S.assetsOverlayAddingNoteKey === a.key;
    const jobId = assetsOverlayState.jobId || '';
    const viewNotesBtn = cautionLocked
      ? '<button type="button" class="asset-row-btn asset-row-btn-disabled" disabled title="Add a note first (use +)">⌕</button>'
      : '<button type="button" class="asset-row-btn" onclick="event.stopPropagation();goToNotesWithFilter(\'' + jobId + '\',\'' + a.key + '\')" title="View notes for this asset">⌕</button>';
    const detailSection = cautionLocked
      ? ''
      : '<div class="asset-detail" id="ado-' + a.key + '">' +
      '<div><div class="adl">DATE RECEIVED</div><input type="date" value="' + (d.date || '') + '" onchange="updateAssetsOverlay(\'' + a.key + '\',\'date\',this.value)"></div>' +
      '<div><div class="adl">RECEIVED BY</div><input type="text" value="' + escapeHtml(d.person || '') + '" placeholder="Name" onchange="updateAssetsOverlay(\'' + a.key + '\',\'person\',this.value)"></div>' +
      '<div style="grid-column:1/-1"><div class="adl">NOTE</div><input type="text" value="' + escapeHtml(d.note || '') + '" placeholder="Note…" onchange="updateAssetsOverlay(\'' + a.key + '\',\'note\',this.value)"></div>' +
      '</div>';
    const addBtnClass = showPulse ? ' asset-row-btn-pulse' : '';
    return `
    <div>
      <div class="asset-row ${rowClass}${lockedClass}" onclick="cycleAssetsOverlayStatus('${a.key}')">
      <div class="${statClass}">${icon}</div>
      <div class="aname">${a.label}</div>
      <div class="adate">${d.date || ''}</div>
      <div style="display:flex;gap: var(--space-sm);align-items:center">
        <div class="awho">${d.person || ''}</div>
        <button type="button" class="asset-row-btn${addBtnClass}" onclick="event.stopPropagation();openAssetNoteComposer('${jobId}','${a.key}')" title="Add note">+</button>
        ${viewNotesBtn}
      </div>
      </div>
      ${addingNote ? `
      <div class="asset-note-composer">
        <textarea id="assetNoteComposerText" class="fta notes-textarea" placeholder="Add note (lands in NOTES)…" rows="2" onkeydown="assetNoteComposerKeydown(event)"></textarea>
        <button type="button" class="bar-btn notes-utility-action" onclick="submitAssetNoteFromOverlay()">ADD</button>
      </div>
      ` : ''}
      ${detailSection}
    </div>
    `;
  }).join('');
}

/** Cycle asset status: '' → received → na → caution → '' */
function cycleAssetsOverlayStatus(key) {
  if (!assetsOverlayState) return;
  flushAssetsOverlayInputs();
  const d = assetsOverlayState.data[key] || { status: '', date: '', person: '', note: '', received: false, na: false, cautionSince: '' };
  const getStatus = typeof getAssetStatus === 'function' ? getAssetStatus : function (x) { return x.received ? 'received' : x.na ? 'na' : ''; };
  const cur = getStatus(d);
  const next = cur === '' ? 'received' : cur === 'received' ? 'na' : cur === 'na' ? 'caution' : '';
  const cautionSince = next === 'caution' ? new Date().toISOString() : '';
  assetsOverlayState.data[key] = {
    ...d,
    status: next,
    received: next === 'received',
    na: next === 'na',
    cautionSince: cautionSince,
  };
  if (next === 'received' && !assetsOverlayState.data[key].date)
    assetsOverlayState.data[key].date = new Date().toISOString().split('T')[0];
  renderAssetsOverlay();
}

function toggleAssetsOverlayDetail(key) {
  const el = document.getElementById('ado-' + key);
  if (el) el.classList.toggle('open');
}

function updateAssetsOverlay(key, field, val) {
  if (!assetsOverlayState) return;
  if (!assetsOverlayState.data[key]) assetsOverlayState.data[key] = { status: '', date: '', person: '', note: '', received: false, na: false, cautionSince: '' };
  assetsOverlayState.data[key][field] = val;
}

async function saveAssetsOverlay() {
  if (!assetsOverlayState) return;
  flushAssetsOverlayInputs();
  // If an asset note composer is open with text, log that note before saving assets.
  if (S.assetsOverlayNoteJobId && S.assetsOverlayAddingNoteKey) {
    const textEl = document.getElementById('assetNoteComposerText');
    const text = textEl && textEl.value ? textEl.value.trim() : '';
    if (text) {
      const jobId = S.assetsOverlayNoteJobId;
      const assetKey = S.assetsOverlayAddingNoteKey;
      const assetLabel = S.assetsOverlayNoteLabel || assetKey;
      S.assetsOverlayAddingNoteKey = null;
      S.assetsOverlayNoteJobId = null;
      S.assetsOverlayNoteLabel = null;
      if (typeof addAssetNoteFromOverlay === 'function') {
        await addAssetNoteFromOverlay(jobId, assetKey, assetLabel, text);
      }
      if (textEl) textEl.value = '';
    }
  }
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
    .catch((e) => {
      if (typeof setSyncState === 'function') setSyncState('error', { toast: 'SAVE FAILED' });
      if (typeof toastError === 'function') toastError('Assets save failed');
    });
}

// ============================================================
// JOBS PAGE
// ============================================================
function ensureFloorSortColumn() {
  if (!FLOOR_COLUMNS.some(c => c.key === S.floorSortBy)) S.floorSortBy = 'catalog';
}

function setFloorSort(key) {
  if (S.floorSortBy === key) S.floorSortDir = S.floorSortDir === 'asc' ? 'desc' : 'asc';
  else { S.floorSortBy = key; S.floorSortDir = 'asc'; }
  renderFloor();
}

function setJobsSort(key) {
  if (S.jobsSortBy === key) S.jobsSortDir = S.jobsSortDir === 'asc' ? 'desc' : 'asc';
  else { S.jobsSortBy = key; S.jobsSortDir = 'asc'; }
  renderJobs();
}

const JOBS_TH_CLASS = { catalog: 'j-cat', artist: 'j-artist', album: 'j-album', format: 'j-spec', colorWt: 'j-spec', qty: 'j-spec', plus10: 'j-spec', status: 'j-state', due: 'j-state', press: 'j-support', assets: 'j-support', progress: 'j-support', location: 'j-support' };
function jobsTableHeaderHTML() {
  const ths = JOBS_COLUMNS.map(c => {
    const active = S.jobsSortBy === c.key;
    const arrow = active ? (S.jobsSortDir === 'asc' ? ' ▲' : ' ▼') : '';
    const colClass = JOBS_TH_CLASS[c.key] || '';
    return `<th class="sortable-th ${active ? 'sort-' + S.jobsSortDir : ''} ${colClass}" onclick="setJobsSort('${c.key}')" title="Sort by ${c.label}">${c.label}${arrow}</th>`;
  }).join('');
  return ths;
}

function renderJobs() {
  const filter = document.getElementById('jobFilter')?.value || '';
  const q = (document.getElementById('jobSearch')?.value || '').toLowerCase().trim();
  const activeJobs = S.jobs.filter(j => !isJobArchived(j));
  const archivedJobs = S.jobs.filter(j => isJobArchived(j));
  let jobs;
  let totalForCount;
  if (filter === 'archived') {
    jobs = archivedJobs.slice();
    totalForCount = archivedJobs.length;
  } else {
    jobs = filter ? activeJobs.filter(j => j.status === filter) : activeJobs.slice();
    totalForCount = activeJobs.length;
  }

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

  jobs = sortJobsList(jobs);

  const countEl = document.getElementById('jobCount');
  if (countEl) {
    countEl.textContent = `${jobs.length} of ${totalForCount}`;
  }

  const tbody = document.getElementById('jobsBody');
  const cards = document.getElementById('jobCards');
  const empty = document.getElementById('jobsEmpty');
  if (!jobs.length) {
    if (tbody) tbody.innerHTML = '';
    if (cards) cards.innerHTML = '';
    const emptyMsg = filter === 'archived'
      ? (q ? `NO ARCHIVED JOBS MATCH "${q}"` : 'NO ARCHIVED JOBS')
      : (q ? `NO MATCHES FOR "${q}"` : 'NO JOBS IN SYSTEM · TAP + TO ADD');
    if (empty) { empty.style.display = 'block'; empty.textContent = emptyMsg; }
    return;
  }
  if (empty) empty.style.display = 'none';

  const jobsTable = document.getElementById('jobsTbl');
  if (jobsTable) {
    const theadTr = jobsTable.querySelector('thead tr');
    if (theadTr) theadTr.innerHTML = jobsTableHeaderHTML();
  }

  if (tbody) {
    tbody.innerHTML = jobs.map(j => {
      const ah = assetHealth(j);
      const prog = progressDisplay(j);
      return `<tr data-status="${j.status || ''}">
        <td class="j-cat panel-trigger" onclick="openPanel('${j.id}')" title="Open job">${j.catalog || '—'}</td>
        <td class="j-artist panel-trigger" onclick="openPanel('${j.id}')" title="Open job">${j.artist || '—'}</td>
        <td class="j-album panel-trigger" onclick="openPanel('${j.id}')" title="Open job">${j.album || '—'}</td>
        <td class="j-spec">${j.format ? `<span class="pill ${j.format.includes('7"') ? 'seven' : 'go'}">${j.format}</span>` : '—'}</td>
        <td class="j-spec">${j.color || 'Black'}${j.weight ? ` <span class="j-wt">${j.weight}</span>` : ''}</td>
        <td class="j-spec">${j.qty ? parseInt(j.qty).toLocaleString() : '—'}</td>
        <td class="j-spec j-plus10">${j.qty ? Math.ceil(parseInt(j.qty) * 1.1).toLocaleString() : '—'}</td>
        <td class="j-state">${statusPill(j.status)}</td>
        <td class="j-state ${dueClass(j.due)}">${dueLabel(j.due)}</td>
        <td class="j-support">${j.press || '—'}</td>
        <td class="j-support assets-tap" onclick="event.stopPropagation(); openAssetsOverlay('${j.id}')" title="View and edit assets">${ahHTML(j)}</td>
        <td class="j-support td-progress progress-tap" onclick="event.stopPropagation(); openProgressDetail('${j.id}')" title="View progress breakdown">
        <div class="progress-main">${prog.main}</div>
        <div class="dl-bar td">${progressDualBarHTML(prog.pressedPct, prog.qcPassedPct)}</div>
        <div class="progress-sub">${prog.sub}</div>
        </td>
        <td class="j-support">${j.location ? `<span class="loc">${j.location}</span>` : '—'}</td>
      </tr>`;
    }).join('');
  }

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
// UNIFIED LOG — one page: job + action (PRESS / QC PASS / QC REJECT) + numpad + ENTER
// Replaces separate Press Log and QC Log entry surfaces.
// ============================================================
let logNumpadValue = '0';
let logAction = 'press';
let logViewDate = new Date().toDateString();
let pendingLogRejectQty = 0;

function tryAddQCRejectToProgress(jobId) {
  if (!jobId) return Promise.resolve({ applied: false });
  return logJobProgress(jobId, 'rejected', 1, 'QC')
    .then((r) => (r.ok ? { applied: true } : { applied: false, error: r.error }))
    .catch(() => ({ applied: false }));
}

function logNumpadTap(digit) {
  if (logNumpadValue === '0') logNumpadValue = digit;
  else if (logNumpadValue.length < 5) logNumpadValue += digit;
  logNumpadUpdateDisplay();
}
function logNumpadClear() { logNumpadValue = '0'; logNumpadUpdateDisplay(); }
function logNumpadBack() { logNumpadValue = logNumpadValue.length > 1 ? logNumpadValue.slice(0, -1) : '0'; logNumpadUpdateDisplay(); }
function logNumpadSet(n) { logNumpadValue = String(n); logNumpadUpdateDisplay(); }

function logNumpadUpdateDisplay() {
  const n = parseInt(logNumpadValue, 10) || 0;
  const el = document.getElementById('logNumpadDisplay');
  if (el) { el.textContent = n.toLocaleString(); el.classList.toggle('has-value', n > 0); }
  const enterBtn = document.getElementById('logEnterBtn');
  const hasJob = !!S.logSelectedJob;
  if (enterBtn) enterBtn.disabled = n === 0 || !hasJob;
}

function setLogAction(action) {
  logAction = action;
  renderLog();
}

function triggerLogRailGlow() {
  const el = document.getElementById('logConsoleRail');
  if (!el) return;
  const mode = logAction === 'press' ? 'press' : logAction === 'qc_pass' ? 'qcpass' : 'qcreject';
  el.classList.remove('rail-glow-press', 'rail-glow-qcpass', 'rail-glow-qcreject');
  el.classList.add('rail-glow-' + mode);
  setTimeout(function () {
    el.classList.remove('rail-glow-press', 'rail-glow-qcpass', 'rail-glow-qcreject');
  }, 750);
}

function selectLogJob(jobId) {
  S.logSelectedJob = (jobId && String(jobId).trim()) ? jobId : null;
  logNumpadValue = '0';
  logNumpadUpdateDisplay();
  renderLog();
}

async function unifiedLogEnter() {
  const n = parseInt(logNumpadValue, 10) || 0;
  if (n < 1 || !S.logSelectedJob) return;
  const job = S.jobs.find(j => j.id === S.logSelectedJob);
  const jobName = job ? (job.catalog || job.artist || '—') : '—';

  if (logAction === 'press') {
    try {
      const result = await logJobProgress(S.logSelectedJob, 'pressed', n, 'Log');
      if (!result.ok) {
        toastError(result.error || 'Log failed');
        return;
      }
      toast(`+${n.toLocaleString()} pressed → ${jobName}`);
      logNumpadValue = '0';
      logNumpadUpdateDisplay();
      renderLog();
      triggerLogRailGlow();
    } catch (e) {
      toastError(e?.message || 'Log failed');
    }
    return;
  }
  if (logAction === 'qc_pass') {
    try {
      const result = await logJobProgress(S.logSelectedJob, 'qc_passed', n, 'Log');
      if (!result.ok) {
        toastError(result.error || 'Log failed');
        return;
      }
      toast(`${n.toLocaleString()} QC passed → ${jobName}`);
      logNumpadValue = '0';
      logNumpadUpdateDisplay();
      renderLog();
      triggerLogRailGlow();
    } catch (e) {
      toastError(e?.message || 'Log failed');
    }
    return;
  }
  if (logAction === 'qc_reject') {
    pendingLogRejectQty = n;
    const titleEl = document.getElementById('logRejectPickerTitle');
    if (titleEl) titleEl.textContent = `REJECT ${n.toLocaleString()} — SELECT DEFECT TYPE`;
    document.getElementById('logRejectPicker').style.display = 'block';
  }
}

function unifiedLogHideRejectPicker() {
  document.getElementById('logRejectPicker').style.display = 'none';
  pendingLogRejectQty = 0;
}

async function unifiedLogRejectWithDefect(defectType) {
  const n = pendingLogRejectQty;
  if (n < 1 || !S.logSelectedJob) { unifiedLogHideRejectPicker(); return; }
  const job = S.jobs.find(j => j.id === S.logSelectedJob);
  const jobName = job ? (job.catalog || job.artist || '—') : '—';

  try {
    const result = await logJobProgress(S.logSelectedJob, 'rejected', n, 'Log');
    if (!result.ok) {
      toastError(result.error || 'Reject log failed');
      unifiedLogHideRejectPicker();
      return;
    }
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const date = new Date().toDateString();
    S.qcLog.unshift({ time, type: defectType, job: n > 1 ? `${jobName} (x${n})` : jobName, date });
    if (S.qcLog.length > 1000) S.qcLog.splice(1000);
    await Storage.logQC({ time, type: defectType, job: n > 1 ? `${jobName} (x${n})` : jobName, date });
    toast(`${n.toLocaleString()} ${defectType} → ${jobName}`);
    logNumpadValue = '0';
    pendingLogRejectQty = 0;
    unifiedLogHideRejectPicker();
    logNumpadUpdateDisplay();
    renderLog();
    triggerLogRailGlow();
  } catch (e) {
    toastError(e?.message || 'Reject log failed');
    unifiedLogHideRejectPicker();
  }
}

function getQCDates() {
  const dates = [...new Set(S.qcLog.map(e => e.date))];
  dates.sort((a, b) => new Date(b) - new Date(a));
  return dates;
}

function logDateStep(dir) {
  const dates = getQCDates();
  if (!dates.length) return;
  const curIdx = dates.indexOf(logViewDate);
  if (curIdx === -1) logViewDate = dates[0];
  else {
    const newIdx = curIdx - dir;
    if (newIdx >= 0 && newIdx < dates.length) logViewDate = dates[newIdx];
  }
  renderLog();
}

function logDateToday() {
  logViewDate = new Date().toDateString();
  renderLog();
}

function renderLog() {
  const today = new Date().toDateString();
  const isToday = logViewDate === today;
  const viewLog = S.qcLog.filter(e => e.date === logViewDate);
  const todayLog = isToday ? viewLog : S.qcLog.filter(e => e.date === today);

  function parseSurfaceWho(s) {
    const raw = (s || '').trim();
    if (!raw) return { surface: '—', who: '' };
    const parts = raw.split('·').map(x => x.trim()).filter(Boolean);
    if (parts.length <= 1) return { surface: raw, who: '' };
    return { surface: parts[0], who: parts.slice(1).join(' · ') };
  }

  const badge = document.getElementById('logBadge');
  if (badge) {
    badge.textContent = todayLog.length;
    badge.classList.toggle('show', todayLog.length > 0);
  }

  const picker = document.getElementById('logJobPicker');
  if (picker) {
    const active = document.activeElement;
    if (!(active && active.tagName === 'SELECT' && picker.contains(active))) {
      const allJobs = sortJobsByCatalogAsc(S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done'));
      const selectedId = S.logSelectedJob || '';
      picker.innerHTML = `
    <select class="qc-job-select" onchange="selectLogJob(this.value || null)">
    <option value="">Choose job</option>
    ${allJobs.map(j => `
      <option value="${j.id}" ${selectedId === j.id ? 'selected' : ''}>${(j.catalog || '—')} · ${j.artist || '—'} ${j.status ? '(' + j.status + ')' : ''}</option>
    `).join('')}
    </select>
    `;
    }
  }

  const jobLabel = document.getElementById('logNumpadJobLabel');
  if (jobLabel) {
    const sel = S.logSelectedJob ? S.jobs.find(j => j.id === S.logSelectedJob) : null;
    jobLabel.textContent = sel ? `${sel.catalog || '—'} · ${sel.artist || '—'}` : 'Select a job above';
  }

  const logConsoleRail = document.getElementById('logConsoleRail');
  if (logConsoleRail) {
    const job = S.logSelectedJob ? S.jobs.find(j => j.id === S.logSelectedJob) : null;
    logConsoleRail.innerHTML = job ? logConsoleRailHTML(job, logAction) : logConsoleRailPlaceholderHTML();
  }

  ['press', 'qc_pass', 'qc_reject'].forEach(a => {
    const btn = document.getElementById('logBtn' + (a === 'press' ? 'Press' : a === 'qc_pass' ? 'QcPass' : 'QcReject'));
    if (btn) btn.classList.toggle('active', logAction === a);
  });
  const enterBtn = document.getElementById('logEnterBtn');
  if (enterBtn) {
    enterBtn.textContent = logAction === 'press' ? 'LOG PRESS' : logAction === 'qc_pass' ? 'LOG PASS' : 'LOG REJECT';
    enterBtn.className = 'log-enter-btn log-enter-' + (logAction === 'press' ? 'press' : logAction === 'qc_pass' ? 'qcpass' : 'qcreject');
  }
  const consoleEl = document.getElementById('logConsole');
  if (consoleEl) {
    consoleEl.classList.remove('mode-press', 'mode-qcpass', 'mode-qcreject');
    consoleEl.classList.add('mode-' + (logAction === 'press' ? 'press' : logAction === 'qc_pass' ? 'qcpass' : 'qcreject'));
  }
  if (typeof logNumpadUpdateDisplay === 'function') logNumpadUpdateDisplay();

  const dateLabel = document.getElementById('logDateLabel');
  if (dateLabel) {
    const d = new Date(logViewDate);
    dateLabel.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  const todayBtn = document.getElementById('logTodayBtn');
  if (todayBtn) todayBtn.classList.toggle('active', isToday);

  const feedEl = document.getElementById('logDailyFeed');
  if (feedEl) {
    const items = [];
    const allJobs = S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done');
    const viewDate = logViewDate;

    allJobs.forEach(j => {
      if (!Array.isArray(j.progressLog)) return;
      j.progressLog.forEach(e => {
        if (!e || !e.timestamp) return;
        const d = new Date(e.timestamp).toDateString();
        if (d !== viewDate) return;
        if (e.stage === 'asset_note') return;
        if (e.stage === 'rejected') return; // reject rows rendered from qcLog with defect type
        const action = e.stage === 'pressed' ? 'PRESS' : e.stage === 'qc_passed' ? 'PASS' : 'LOG';
        const cls = e.stage === 'pressed' ? 'pressed' : e.stage === 'qc_passed' ? 'qc_passed' : '';
        const sw = parseSurfaceWho(e.person || '');
        items.push({
          ts: e.timestamp,
          qty: parseInt(e.qty, 10) || 0,
          action,
          defect: '',
          cls,
          source: sw.surface || '—',
          who: sw.who || '',
          press: (j.press || '').split(',')[0].trim(),
          jobLabel: `${j.catalog || '—'} · ${j.artist || '—'}`,
          jobId: j.id,
          assetKey: '',
        });
      });
    });

    viewLog.forEach(e => {
      const m = (e.job || '').match(/\(x(\d+)\)\s*$/i);
      const qty = m ? parseInt(m[1], 10) : 1;
      const jobLabel = m ? (e.job || '').replace(/\s*\(x\d+\)\s*$/i, '').trim() : (e.job || '—');
      const base = new Date(viewDate);
      const parts = String(e.time || '').split(':').map(n => parseInt(n, 10));
      if (parts.length >= 2 && parts.every(n => Number.isFinite(n))) base.setHours(parts[0], parts[1], parts[2] || 0, 0);
      items.push({
        ts: base.toISOString(),
        qty: Number.isFinite(qty) ? qty : 1,
        action: 'REJECT',
        defect: e.type || '',
        cls: 'rejected',
        source: 'QC',
        press: '',
        jobLabel,
      });
    });

    items.sort((a, b) => new Date(b.ts) - new Date(a.ts));

    if (!items.length) {
      feedEl.innerHTML = `<div class="empty">No entries ${isToday ? 'today' : 'on this date'}</div>`;
    } else {
      feedEl.innerHTML = items.map(it => {
        const time = new Date(it.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const primary = it.action === 'NOTE'
          ? ('NOTE' + (it.defect ? ' · ' + escapeHtml(it.defect) : ''))
          : (`+${(it.qty || 0).toLocaleString()} ${it.action}${it.defect ? ' · ' + escapeHtml(it.defect) : ''}`);
        const metaParts = [
          escapeHtml(it.source || '—'),
          it.press ? escapeHtml(it.press) : null,
          it.who ? escapeHtml(it.who) : null,
          escapeHtml(time),
          escapeHtml(it.jobLabel || '—'),
        ].filter(Boolean);
        const clickable = it.cls === 'asset_note' && it.jobId && it.assetKey;
        const jobIdAttr = clickable ? String(it.jobId).replace(/'/g, '\\\'') : '';
        const assetKeyAttr = clickable ? String(it.assetKey).replace(/'/g, '\\\'') : '';
        const clickAttr = clickable ? ` onclick=\"goToNotesWithFilter('${jobIdAttr}','${assetKeyAttr}')\"` : '';
        return `<div class="progress-entry ${it.cls}"${clickAttr}><div class="log-feed-primary">${primary}</div><div class="log-feed-meta">${metaParts.join(' · ')}</div></div>`;
      }).join('');
    }
  }
}

function renderQC() {
  renderLog();
}

// ============================================================
// TV MODE
// ============================================================
function renderTV() {
  const today = new Date().toDateString();
  const activeJobs = S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done');

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
    qe.innerHTML = activeJobs.map(j => {
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

  const statsEl = document.getElementById('tvStats');
  if (statsEl) {
    let pressedToday = 0;
    let passedToday = 0;
    activeJobs.forEach(j => {
      (j.progressLog || []).forEach(e => {
        if (!e || !e.timestamp) return;
        if (new Date(e.timestamp).toDateString() !== today) return;
        if (e.stage === 'pressed') pressedToday += (parseInt(e.qty, 10) || 0);
        if (e.stage === 'qc_passed') passedToday += (parseInt(e.qty, 10) || 0);
      });
    });
    const rejectedToday = (S.qcLog || []).filter(e => e.date === today).reduce((sum, e) => {
      const m = (e.job || '').match(/\(x(\d+)\)\s*$/i);
      const n = m ? parseInt(m[1], 10) : 1;
      return sum + (Number.isFinite(n) ? n : 1);
    }, 0);
    const pressingNow = S.presses.filter(p => !!p.job_id).length;
    const blockers = activeJobs.filter(j => (j.status || '').toLowerCase() === 'hold').length + S.presses.filter(p => p.status === 'offline').length;

    statsEl.innerHTML = `
      <div class="tv-stat"><div class="tv-stat-num w">${pressedToday.toLocaleString()}</div><div class="tv-stat-lab">PRESSED TODAY</div></div>
      <div class="tv-stat"><div class="tv-stat-num g">${passedToday.toLocaleString()}</div><div class="tv-stat-lab">PASSED TODAY</div></div>
      <div class="tv-stat"><div class="tv-stat-num r">${rejectedToday.toLocaleString()}</div><div class="tv-stat-lab">REJECTED TODAY</div></div>
      <div class="tv-stat"><div class="tv-stat-num">${pressingNow.toLocaleString()}</div><div class="tv-stat-lab">PRESSING NOW</div></div>
      <div class="tv-stat"><div class="tv-stat-num w">${blockers.toLocaleString()}</div><div class="tv-stat-lab">BLOCKERS</div></div>
    `;
  }

  const ti = document.getElementById('tvTicker');
  if (ti) {
    const items = [];

    // Notes today
    activeJobs.forEach(j => {
      ensureNotesLog(j);
      (j.notesLog || []).forEach(n => {
        if (!n || !n.timestamp) return;
        if (new Date(n.timestamp).toDateString() !== today) return;
        items.push({
          ts: n.timestamp,
          kind: 'NOTE',
          color: 'd',
          text: `${j.catalog || '—'} · ${truncateTickerText(n.text || '', 70)}`,
        });
      });
    });

    // Progress today (PRESS/PASS)
    activeJobs.forEach(j => {
      (j.progressLog || []).forEach(e => {
        if (!e || !e.timestamp) return;
        if (new Date(e.timestamp).toDateString() !== today) return;
        if (e.stage !== 'pressed' && e.stage !== 'qc_passed') return;
        const qty = parseInt(e.qty, 10) || 0;
        const press = (j.press || '').split(',')[0].trim();
        items.push({
          ts: e.timestamp,
          kind: e.stage === 'pressed' ? 'PRESS' : 'PASS',
          color: e.stage === 'pressed' ? 'w' : 'g',
          text: `${e.stage === 'pressed' ? '+ ' + qty.toLocaleString() : '+ ' + qty.toLocaleString()} · ${j.catalog || '—'}${press ? ' · ' + press : ''}`,
          source: e.person || '',
        });
      });
    });

    // Rejects today (defect types)
    (S.qcLog || []).filter(e => e.date === today).forEach(e => {
      const m = (e.job || '').match(/\(x(\d+)\)\s*$/i);
      const qty = m ? parseInt(m[1], 10) : 1;
      const jobLabel = m ? (e.job || '').replace(/\s*\(x\d+\)\s*$/i, '').trim() : (e.job || '—');
      const job = activeJobs.find(j => j.catalog === jobLabel) || null;
      const press = job ? (job.press || '').split(',')[0].trim() : '';
      const base = new Date(today);
      const parts = String(e.time || '').split(':').map(n => parseInt(n, 10));
      if (parts.length >= 2 && parts.every(n => Number.isFinite(n))) base.setHours(parts[0], parts[1], parts[2] || 0, 0);
      items.push({
        ts: base.toISOString(),
        kind: 'REJECT',
        color: 'r',
        text: `+ ${Number.isFinite(qty) ? qty.toLocaleString() : '1'} ${String(e.type || '').toUpperCase()} · ${jobLabel}${press ? ' · ' + press : ''}`,
      });
    });

    // Alerts: presses offline
    S.presses.filter(p => p.status === 'offline').forEach(p => {
      items.push({
        ts: new Date().toISOString(),
        kind: 'ALERT',
        color: 'w',
        text: `${p.name} down`,
      });
    });

    items.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    const top = items.slice(0, 30);
    if (!top.length) {
      ti.textContent = '★ NO ACTIVITY TODAY ★';
    } else {
      ti.innerHTML = top.map(it => `<span class="tv-tick tv-tick-${it.color}"><span class="tv-tick-k">${escapeHtml(it.kind)}</span> · ${escapeHtml(it.text)}</span>`).join('<span class="tv-tick-sep">   •   </span>');
    }
  }
}

function truncateTickerText(s, n) {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return t.slice(0, Math.max(0, n - 1)).trim() + '…';
}

// ============================================================
// PANEL: ASSET LIST (in job form)
// ============================================================
function buildAssetList() {
  const el = document.getElementById('assetList');
  if (!el) return;

  const received = ASSET_DEFS.filter(a => curAssets[a.key]?.received).length;
  const na = ASSET_DEFS.filter(a => curAssets[a.key]?.na).length;
  const remaining = ASSET_DEFS.length - received - na;
  const allDone = remaining === 0;

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
  /* Panel = edit-only; quantity logging lives on LOG page and Press Station */
  if (form) form.style.display = 'none';
  if (logBtn) logBtn.disabled = true;

  const p = getJobProgress(job);
  const ordered = p.ordered;
  const pressed = p.pressed;
  const qcPassed = p.qcPassed;
  const rejected = p.rejected;
  const pendingQC = p.pendingQC;

  const completionRatio = ordered > 0 ? Math.min(1, qcPassed / ordered) : 0;
  const barPct = Math.round(completionRatio * 100);
  const overQty = pressed > ordered;
  summaryEl.innerHTML = `
    <div class="ps-cell"><span class="ps-val" style="color:var(--d)">${barPct}%</span>QC COMPLETE</div>
    <div class="ps-cell"><span class="ps-val" style="color:var(--w)">${pressed.toLocaleString()}</span>PRESSED</div>
    <div class="ps-cell"><span class="ps-val" style="color:var(--g)">${qcPassed.toLocaleString()}</span>PASSED</div>
    <div class="ps-cell"><span class="ps-val" style="color:var(--r)">${rejected.toLocaleString()}</span>REJECTED</div>
    <div class="ps-cell"><span class="ps-val" style="color:var(--d2)">${pendingQC.toLocaleString()}</span>PENDING</div>
  `;

  barEl.innerHTML = `
    <div class="dl-bar td">${progressDualBarHTML(p.pressedPct, p.qcPassedPct)}</div>
    <div class="progress-bar-text">QC ${qcPassed.toLocaleString()}/${ordered.toLocaleString()} · Pressed ${pressed.toLocaleString()}</div>
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

// ============================================================
// NOTES SECTION — append-only production & assembly logs
// ============================================================
function renderNotesSection() {
  const job = S.jobs.find(j => j.id === S.editId);
  if (!job) return;
  ensureNotesLog(job);
  const prodEl = document.getElementById('notesLogList');
  if (prodEl) {
    prodEl.innerHTML = (job.notesLog || []).slice().reverse().slice(0, 5).map(e => {
      const time = new Date(e.timestamp).toLocaleString();
      const asset = e.assetLabel || e.assetKey || '';
      const assetHtml = asset ? `<div style="font-size:10px;color:var(--d3);text-align:right;margin-bottom:2px;">${escapeHtml(asset)}</div>` : '';
      return `<div class="progress-entry">${assetHtml}<strong>${escapeHtml(e.person || 'Unknown')}</strong> · ${escapeHtml(time)}<br>${escapeHtml(e.text)}</div>`;
    }).join('') || '<div class="progress-empty">No notes yet.</div>';
  }
  const asmEl = document.getElementById('assemblyLogList');
  if (asmEl) {
    asmEl.innerHTML = (job.assemblyLog || []).slice().reverse().slice(0, 5).map(e => {
      const time = new Date(e.timestamp).toLocaleString();
      return `<div class="progress-entry"><strong>${escapeHtml(e.person || 'Unknown')}</strong> · ${escapeHtml(time)}<br>${escapeHtml(e.text)}</div>`;
    }).join('') || '<div class="progress-empty">No notes yet.</div>';
  }
}

// ============================================================
// NOTES PAGE — plant-wide notes feed, filterable by job
// ============================================================
function renderNotesPage() {
  const pickerEl = document.getElementById('notesJobPicker');
  const selEl = document.getElementById('notesJobSelect');
  const feedEl = document.getElementById('notesFeed');
  const filterEl = document.getElementById('notesFilterIndicator');
  const addBtn = document.getElementById('notesAddBtn');
  const addRow = document.getElementById('notesAddRow');
  const searchRow = document.getElementById('notesSearchRow');
  const searchBtn = document.getElementById('notesSearchBtn');
  const searchEl = document.getElementById('notesSearch');
  const searchCountEl = document.getElementById('notesSearchCount');
  if (!feedEl) return;

  let selectedId = (selEl && (selEl.value || '').trim()) || '';
  if (S.notesPreloadFilter) {
    const pre = S.notesPreloadFilter;
    S.notesPreloadFilter = null;
    selectedId = (pre.jobId || '').trim();
    if (searchEl) searchEl.value = pre.search || '';
    if (pre.assetLabel) {
      S.notesActiveAssetFilter = { jobId: selectedId, label: pre.assetLabel };
    }
  }

  const allJobs = sortJobsByCatalogAsc(S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done'));
  const active = document.activeElement;
  if (pickerEl && !(active && active.id === 'notesJobSelect')) {
    pickerEl.innerHTML = `<select class="qc-job-select" id="notesJobSelect" onchange="renderNotesPage()">
<option value="">Select job</option>
${allJobs.map(j => `<option value="${j.id}" ${selectedId === j.id ? 'selected' : ''}>${(j.catalog || '—')} · ${j.artist || '—'}${j.status ? ' (' + j.status + ')' : ''}</option>`).join('')}
</select>`;
  }

  let entries = [];
  if (selectedId) {
    if (selectedId === '!TEAM' || selectedId === '!ALERT') {
      // Channels currently tabled; no-op selection.
    } else {
    const job = S.jobs.find(j => j.id === selectedId);
    if (job) {
      ensureNotesLog(job);
      (job.notesLog || []).forEach(e => entries.push({
        jobId: job.id,
        catalog: job.catalog || '',
        artist: job.artist || '',
        album: job.album || '',
        text: e.text,
        person: e.person,
        timestamp: e.timestamp,
        assetLabel: e.assetLabel || null,
        assetKey: e.assetKey || null,
      }));
    }
    }
  } else {
    allJobs.forEach(job => {
      ensureNotesLog(job);
      (job.notesLog || []).forEach(e => entries.push({
        jobId: job.id,
        catalog: job.catalog || '',
        artist: job.artist || '',
        album: job.album || '',
        text: e.text,
        person: e.person,
        timestamp: e.timestamp,
        assetLabel: e.assetLabel || null,
        assetKey: e.assetKey || null,
      }));
    });
  }
  entries.sort((a, b) => (new Date(b.timestamp) - new Date(a.timestamp)));

  const q = (searchEl && searchEl.value ? String(searchEl.value) : '').toLowerCase().trim();
  if (q) {
    entries = entries.filter(e => {
      const hay = [
        e.text || '',
        e.person || '',
        e.catalog || '',
        e.artist || '',
        e.album || '',
        e.jobId || '',
        e.assetLabel || '',
        e.assetKey || '',
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  if (searchCountEl) searchCountEl.textContent = q ? (entries.length + ' match') : '';

  if (filterEl) {
    if (S.notesActiveAssetFilter && S.notesActiveAssetFilter.label && selectedId) {
      const job = S.jobs.find(function (j) { return j.id === selectedId; });
      const jobLabel = job ? (job.catalog || '—') : selectedId;
      const label = S.notesActiveAssetFilter.label;
      filterEl.innerHTML = `FILTER: <span class="notes-filter-pill">${escapeHtml(jobLabel)} · ${escapeHtml(label)}</span> <button type="button" class="notes-filter-clear" onclick="clearNotesAssetFilter()">CLEAR</button>`;
      filterEl.style.display = '';
    } else {
      filterEl.innerHTML = '';
      filterEl.style.display = 'none';
    }
  }

  feedEl.innerHTML = entries.length === 0
    ? '<div class="progress-empty">No notes yet.</div>'
    : entries.map(e => {
        const time = new Date(e.timestamp).toLocaleString();
        const meta = [escapeHtml(e.person || 'Unknown'), time].join(' · ');
        const cat = e.catalog ? escapeHtml(e.catalog) : escapeHtml(e.jobId || '—');
        const artist = e.artist ? escapeHtml(e.artist) : '—';
        const asset = e.assetLabel || e.assetKey || '';
        const assetHtml = asset ? `<div class="notes-entry-asset">${escapeHtml(asset)}</div>` : '';
        const rowCls = e.jobId === '!ALERT' ? ' notes-row-alert' : '';
        return `<div class="progress-entry${rowCls}"><div class="notes-entry-job"><span class="notes-entry-cat">${cat}</span> <span class="notes-entry-artist">${artist}</span></div><div class="notes-entry-text">${escapeHtml(e.text)}</div>${assetHtml}<div class="notes-entry-meta">${meta}</div></div>`;
      }).join('');

  const addAllowed = !!selectedId && (selectedId !== '!ALERT' || ((window.PMP?.userProfile?.email || '').toLowerCase().includes('piper') || (window.PMP?.userProfile?.display_name || '').toLowerCase().includes('piper')));
  if (addBtn) addBtn.classList.toggle('is-disabled', !addAllowed);
  if (addRow) addRow.style.display = (selectedId && S.notesUtilityOpen === 'add') ? '' : 'none';
  if (searchRow) searchRow.style.display = (S.notesUtilityOpen === 'search') ? '' : 'none';
  if (searchBtn) searchBtn.classList.toggle('active', S.notesUtilityOpen === 'search');
}
