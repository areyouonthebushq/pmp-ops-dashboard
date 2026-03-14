// ============================================================
// SHARED DATA & RENDER HELPERS — single source for floor/stats/press
// ============================================================
function getFloorStats() {
  const open = S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done');
  const active = open.filter(j => ['pressing','assembly'].includes(j.status));
  const overdue = open.filter(j => j.due && new Date(j.due) < Date.now());
  const online = S.presses.filter(p => p.status === 'online').length;
  const onPress = S.presses.filter(p => p.job_id).map(p => p.job_id);
  const cautioned = open.filter(j => isJobCautioned(j));
  return [
    { key: 'presses', v: `${online}/${S.presses.length}`, l: 'PRESSES', s: 'online', c: online < S.presses.length ? 'warn' : '' },
    { key: 'active', v: active.length, l: 'ACTIVE', s: 'pressing/assembly', c: '' },
    { key: 'queued', v: open.filter(j => j.status === 'queue').length, l: 'QUEUED', s: 'waiting', c: '' },
    { key: 'overdue', v: overdue.length, l: 'OVERDUE', s: 'past due date', c: overdue.length ? 'red' : '' },
    { key: 'cautioned', v: cautioned.length, l: '\u26A0\uFE0E ACHTUNG', s: 'needs attention', c: cautioned.length ? 'warn' : '' },
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
  const cautioned = isJobCautioned(j);
  const needsNote = cautioned && cautionNeedsNote(j);
  const trClass = cautioned ? ' class="job-row-cautioned"' : '';
  const cautionIcon = cautioned ? ' <span class="floor-caution-icon' + (needsNote ? '' : ' floor-caution-satisfied') + '" onclick="event.stopPropagation();goToNotesWithFilter(\'' + j.id + '\')" title="ACHTUNG — view notes">\u26A0\uFE0E</span>' : '';
  return `
  <tr${trClass}>
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
    </div>${cautionIcon}
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
    </div>
    <div class="pc-assets pc-assets-demoted" onclick="event.stopPropagation(); openCardZone('${job.id}','asset')" style="cursor:pointer" title="Asset card">
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
      <select class="pc-select" onchange="setPressOnDeck('${p.id}',this.value)" title="Next up">
      <option value="">— ON DECK</option>
      ${sortJobsByCatalogAsc(S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done')).map(j => `<option value="${j.id}" ${(p.on_deck_job_id || '') === j.id ? 'selected' : ''}>${j.catalog || j.id} · ${j.artist || ''}</option>`).join('')}
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

function buildOnDeckCardHTML(p) {
  if (!p.on_deck_job_id) return '';
  const job = S.jobs.find(j => j.id === p.on_deck_job_id);
  if (!job) return '';
  const showArrow = S.pressOnDeckArrowPressId === p.id;
  const headClick = "event.stopPropagation(); showOnDeckArrow('" + p.id.replace(/'/g, "\\'") + "');";
  const arrowClick = "event.stopPropagation(); sendOnDeckToPress('" + p.id.replace(/'/g, "\\'") + "');";
  const arrowHtml = showArrow ? '<span class="pc-on-deck-arrow" onclick="' + arrowClick + '" title="Send to press" role="button" tabindex="0">↑</span>' : '';
  return `
  <div class="press-card press-card-on-deck">
    <div class="pc-head pc-head-on-deck" onclick="${headClick}" role="button" tabindex="0" title="Show send arrow">
      <div class="pc-name pc-name-on-deck">ON DECK</div>
      ${arrowHtml}
    </div>
    <div class="pc-job-link pc-job-link-on-deck" onclick="openPanel('${job.id.replace(/'/g, "\\'")}')" title="Open job panel" style="cursor:pointer">
      <div class="pc-job"><span class="job-id">${job.catalog || '—'}</span> — ${job.artist || ''}</div>
      <div class="pc-meta">${job.format || ''} · ${job.color || 'Black'} · ${job.weight || ''}</div>
      <div class="pc-meta">Qty: ${job.qty ? parseInt(job.qty).toLocaleString() : '—'}</div>
      <div class="pc-due ${dueClass(job.due)}">${dueLabel(job.due)}</div>
    </div>
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
  var pg = typeof currentPage !== 'undefined' ? currentPage : 'floor';
  switch (pg) {
    case 'floor':     renderStats(); renderPresses(); renderFloor(); break;
    case 'jobs':      renderJobs(); break;
    case 'log':
    case 'qc':        renderLog(); break;
    case 'notes':     renderNotesPage(); break;
    case 'ship':      renderShip(); break;
    case 'crew':      renderCrewPage(); break;
    case 'compounds': renderCompoundsPage(); break;
    case 'dev':       renderDevPage(); break;
    case 'tv':        renderTV(); break;
    case 'engine':    renderEngine(); break;
    case 'todos':     renderTodos(); break;
  }
}

// ============================================================
// PVC — operational compound library (visual reference)
// ============================================================

/** Sort compounds by numeric number (1, 2, 3, …). Non-numeric or empty go last. */
function sortCompoundsByNumber(list) {
  if (!Array.isArray(list) || !list.length) return list;
  return list.slice().sort(function (a, b) {
    var na = parseInt((a.number || '').trim(), 10);
    var nb = parseInt((b.number || '').trim(), 10);
    if (Number.isNaN(na)) na = Infinity;
    if (Number.isNaN(nb)) nb = Infinity;
    return na - nb;
  });
}

function renderCompoundsPage() {
  const shell = document.getElementById('pg-compounds');
  if (!shell) return;
  const listEl = document.getElementById('compoundList');
  if (!listEl) return;

  const raw = Array.isArray(S.compounds) ? S.compounds : [];
  const pvcQ = (document.getElementById('pvcSearch')?.value || '').toLowerCase().trim();
  const sorted = sortCompoundsByNumber(raw);
  const compounds = pvcQ
    ? sorted.filter(c =>
        (c.number || '').toLowerCase().includes(pvcQ) ||
        (c.code_name || '').toLowerCase().includes(pvcQ) ||
        (c.color || '').toLowerCase().includes(pvcQ) ||
        (c.notes || '').toLowerCase().includes(pvcQ))
    : sorted;

  if (!compounds.length) {
    listEl.innerHTML = '<div class="empty">' + (pvcQ ? 'NO MATCHES' : 'NO COMPOUNDS YET · TAP + TO ADD') + '</div>';
    return;
  }

  listEl.innerHTML = compounds.map((c) => {
    var displayUrl = ((c.thumbUrl || c.imageUrl) || '').trim();
    var hasImage = !!displayUrl;
    var thumbStyle = hasImage ? ' style="background-image:url(\'' + displayUrl.replace(/'/g, "\\'") + '\')"' : '';
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
// SHIP — fulfillment / pickup / shipping
// ============================================================

function getShipJobs() {
  return S.jobs.filter(function (j) {
    if (isJobArchived(j)) return false;
    return j.status === 'done' || j.status === 'assembly' || !!j.fulfillment_phase;
  });
}

function renderShip() {
  var bodyEl = document.getElementById('shipBody');
  var countEl = document.getElementById('shipCount');
  var emptyEl = document.getElementById('shipEmpty');
  var summaryEl = document.getElementById('shipSummary');
  if (!bodyEl) return;

  var filterEl = document.getElementById('shipFilter');
  var filter = filterEl ? filterEl.value : '';
  var q = (document.getElementById('shipSearch')?.value || '').toLowerCase().trim();

  var all = getShipJobs();

  var jobs;
  if (filter === 'unset') {
    jobs = all.filter(function (j) { return !j.fulfillment_phase; });
  } else if (filter) {
    jobs = all.filter(function (j) { return j.fulfillment_phase === filter; });
  } else {
    jobs = all.slice();
  }

  if (q) {
    jobs = jobs.filter(function (j) {
      return (j.catalog || '').toLowerCase().includes(q) ||
        (j.artist || '').toLowerCase().includes(q) ||
        (j.album || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q);
    });
  }

  jobs.sort(function (a, b) {
    var pa = a.fulfillment_phase || '';
    var pb = b.fulfillment_phase || '';
    if (pa === 'shipped' && pb !== 'shipped') return 1;
    if (pb === 'shipped' && pa !== 'shipped') return -1;
    if (pa === 'held_exception' && pb !== 'held_exception') return -1;
    if (pb === 'held_exception' && pa !== 'held_exception') return 1;
    var da = a.due || '\uffff';
    var db = b.due || '\uffff';
    if (da !== db) return da < db ? -1 : 1;
    return (a.catalog || '').localeCompare(b.catalog || '');
  });

  if (countEl) countEl.textContent = jobs.length + ' of ' + all.length;

  if (summaryEl) {
    var counts = {};
    all.forEach(function (j) {
      var p = j.fulfillment_phase || '_unset';
      counts[p] = (counts[p] || 0) + 1;
    });
    var pills = [];
    if (counts.held_exception) pills.push('<span class="ship-sum-item ship-sum-held">' + counts.held_exception + ' held</span>');
    if (counts.awaiting_instructions) pills.push('<span class="ship-sum-item ship-sum-await">' + counts.awaiting_instructions + ' awaiting</span>');
    if (counts.ready_to_ship) pills.push('<span class="ship-sum-item ship-sum-ready">' + counts.ready_to_ship + ' ready to ship</span>');
    if (counts.ready_for_pickup) pills.push('<span class="ship-sum-item ship-sum-pickup">' + counts.ready_for_pickup + ' ready for pickup</span>');
    if (counts.local_pickup) pills.push('<span class="ship-sum-item">' + counts.local_pickup + ' local</span>');
    if (counts.in_house_fulfillment) pills.push('<span class="ship-sum-item">' + counts.in_house_fulfillment + ' in-house</span>');
    if (counts.shipped) pills.push('<span class="ship-sum-item ship-sum-shipped">' + counts.shipped + ' shipped</span>');
    if (counts._unset) pills.push('<span class="ship-sum-item ship-sum-unset">' + counts._unset + ' no phase</span>');
    summaryEl.innerHTML = pills.length ? pills.join('') : '';
  }

  if (jobs.length === 0) {
    bodyEl.innerHTML = '';
    if (emptyEl) { emptyEl.style.display = 'block'; emptyEl.textContent = filter ? 'NO JOBS IN THIS PHASE' : 'NO LATE-STAGE JOBS'; }
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  bodyEl.innerHTML = jobs.map(function (j) {
    var esc = typeof escapeHtml === 'function' ? escapeHtml : function (s) { return s || ''; };
    var phaseOpts = typeof FULFILLMENT_PHASES !== 'undefined'
      ? FULFILLMENT_PHASES.map(function (o) { return '<option value="' + o.v + '"' + ((j.fulfillment_phase || '') === o.v ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('')
      : '';

    var notes = Array.isArray(j.notesLog) ? j.notesLog : [];
    var attachCount = notes.filter(function (n) { return !!n.attachment_url; }).length;
    var lastNote = null;
    for (var ni = notes.length - 1; ni >= 0; ni--) { if (notes[ni] && notes[ni].text) { lastNote = notes[ni]; break; } }
    var noteSnippet = '';
    if (lastNote) {
      var txt = (lastNote.text || '').trim();
      if (txt.length > 50) txt = txt.slice(0, 47) + '…';
      var ago = '';
      if (lastNote.timestamp) {
        var ms = Date.now() - new Date(lastNote.timestamp).getTime();
        if (ms < 36e5) ago = Math.max(1, Math.round(ms / 6e4)) + 'm';
        else if (ms < 864e5) ago = Math.round(ms / 36e5) + 'h';
        else ago = Math.round(ms / 864e5) + 'd';
      }
      noteSnippet = '<span class="ship-note-text" title="' + esc(lastNote.text || '').replace(/"/g, '&quot;') + '">' + esc(txt) + '</span>' +
        (ago ? ' <span class="ship-note-ago">' + ago + '</span>' : '');
    }
    var proofBadge = attachCount > 0
      ? '<span class="ship-proof-badge" title="' + attachCount + ' image' + (attachCount > 1 ? 's' : '') + ' attached">📎' + attachCount + '</span>'
      : '';
    var noteCountBadge = notes.length > 0
      ? '<span class="ship-notes-count">' + notes.length + '</span>'
      : '';

    var noteCell = '<div class="ship-note-cell">';
    if (noteSnippet || proofBadge) {
      noteCell += '<div class="ship-note-preview">' + proofBadge + noteSnippet + '</div>';
    } else {
      noteCell += '<span class="ship-no-phase">—</span>';
    }
    noteCell += '<div class="ship-note-actions">' +
      '<button type="button" class="ship-note-btn" onclick="goToNotesAndOpenAdd(\'' + j.id + '\')" title="Add shipping note">+ NOTE' + noteCountBadge + '</button>' +
    '</div>';
    noteCell += '</div>';

    var shipCautioned = isJobCautioned(j);
    return '<tr class="ship-row' + (j.fulfillment_phase === 'held_exception' ? ' ship-row-held' : '') + (j.fulfillment_phase === 'shipped' ? ' ship-row-shipped' : '') + (shipCautioned ? ' job-row-cautioned' : '') + '" data-jid="' + j.id + '">' +
      '<td class="ship-cat panel-trigger" onclick="openPanel(\'' + j.id + '\')" title="Open job">' + esc(j.catalog || '—') + '</td>' +
      '<td class="ship-artist panel-trigger" onclick="openPanel(\'' + j.id + '\')" title="Open job">' + esc(j.artist || '—') + (j.album ? ' <span class="ship-album">' + esc(j.album) + '</span>' : '') + '</td>' +
      '<td>' + (j.format ? '<span class="pill ' + (j.format.includes('7"') ? 'seven' : 'go') + '">' + esc(j.format) + '</span>' : '—') + '</td>' +
      '<td>' + (j.qty ? parseInt(j.qty).toLocaleString() : '—') + '</td>' +
      '<td>' + statusPill(j.status) + (shipCautioned ? ' ' + cautionPill(j) : '') + '</td>' +
      '<td class="ship-phase-cell">' +
        '<select class="ship-phase-select" onchange="setFulfillmentPhase(\'' + j.id + '\', this.value)">' + phaseOpts + '</select>' +
      '</td>' +
      '<td class="' + (typeof dueClass === 'function' ? dueClass(j.due) : '') + '">' + (typeof dueLabel === 'function' ? dueLabel(j.due) : (j.due || '—')) + '</td>' +
      '<td class="ship-td-note">' + noteCell + '</td>' +
      '<td><button type="button" class="bar-btn ship-open-btn" onclick="openPanel(\'' + j.id + '\')">OPEN</button></td>' +
    '</tr>';
  }).join('');
}

// ============================================================
// CREW — operational directory
// ============================================================

function getCrewSearchQuery() {
  const el = document.getElementById('crewSearch');
  return (el && el.value) ? el.value.trim().toLowerCase() : '';
}

function renderCrewPage() {
  const bodyEl = document.getElementById('crewBody');
  const countEl = document.getElementById('crewCount');
  const emptyEl = document.getElementById('crewEmpty');
  if (!bodyEl) return;
  const raw = Array.isArray(S.employees) ? S.employees : [];
  const q = getCrewSearchQuery();
  const list = q
    ? raw.filter(function (e) {
        return (
          (e.name || '').toLowerCase().includes(q) ||
          (e.role || '').toLowerCase().includes(q) ||
          (e.specialty || '').toLowerCase().includes(q) ||
          (e.phone || '').toLowerCase().includes(q) ||
          (e.email || '').toLowerCase().includes(q) ||
          (e.notes || '').toLowerCase().includes(q)
        );
      })
    : raw;
  if (countEl) countEl.textContent = '';
  if (emptyEl) {
    emptyEl.style.display = list.length === 0 && raw.length === 0 ? 'block' : 'none';
  }
  var table = bodyEl.closest('table');
  if (table) {
    var thead = table.querySelector('thead tr');
    if (thead) thead.innerHTML = crewTableHeaderHTML();
  }
  var sorted = sortCrewList(list);
  if (sorted.length === 0) {
    bodyEl.innerHTML = '';
    return;
  }
  bodyEl.innerHTML = sorted.map(function (e) {
    var name = (e.name || '').trim() || '—';
    var role = (e.role || '').trim() || '—';
    var specialty = (e.specialty || '').trim() || '—';
    var phoneRaw = (e.phone || '').trim();
    var emailRaw = (e.email || '').trim();
    var phone = phoneRaw || '—';
    var email = emailRaw || '—';
    var notes = (e.notes || '').trim();
    var notesShort = notes.length > 40 ? notes.slice(0, 37) + '…' : notes;
    var photoUrl = (e.photo_url || '').trim();
    var photoDisplay = ((e.thumb_url || e.photo_url) || '').trim();
    var hasPhoto = !!photoUrl;
    var thumbClick = 'event.stopPropagation();crewThumbClick(\'' + (e.id || '').replace(/'/g, "\\'") + '\',' + hasPhoto + ')';
    var thumbTitle = hasPhoto ? 'View / Replace photo' : 'Upload photo';
    var thumb = '';
    if (hasPhoto) {
      thumb = '<div class="crew-thumb crew-thumb-img crew-thumb-btn" style="background-image:url(\'' + photoDisplay.replace(/'/g, "\\'") + '\')" role="button" aria-label="' + thumbTitle + '" title="' + thumbTitle + '" onclick="' + thumbClick + '"></div>';
    } else {
      var initial = name.charAt(0).toUpperCase();
      thumb = '<div class="crew-thumb crew-thumb-initial crew-thumb-btn" role="button" aria-label="' + thumbTitle + '" title="' + thumbTitle + '" onclick="' + thumbClick + '">' + (typeof escapeHtml === 'function' ? escapeHtml(initial) : initial) + '</div>';
    }
    var esc = function (s) { return typeof escapeHtml === 'function' ? escapeHtml(s) : s; };
    function attrEsc(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    var phoneHtml = phoneRaw
      ? '<a class="crew-contact-link" href="tel:' + attrEsc(phoneRaw) + '">' + esc(phoneRaw) + '</a>'
      : '<span class="crew-contact-empty">—</span>';
    var emailHtml = emailRaw
      ? '<a class="crew-contact-link" href="mailto:' + attrEsc(emailRaw) + '">' + esc(emailRaw) + '</a>'
      : '<span class="crew-contact-empty">—</span>';
    var idEsc = (e.id || '').replace(/'/g, "\\'");
    return (
      '<tr class="crew-row">' +
      '<td class="crew-cell-thumb">' + thumb + '</td>' +
      '<td class="crew-cell-name">' + esc(name) + '</td>' +
      '<td class="crew-cell-role">' + esc(role) + '</td>' +
      '<td class="crew-cell-specialty">' + esc(specialty) + '</td>' +
      '<td class="crew-cell-phone">' + phoneHtml + '</td>' +
      '<td class="crew-cell-email">' + emailHtml + '</td>' +
      '<td class="crew-cell-notes" title="' + esc(notes).replace(/"/g, '&quot;') + '">' + esc(notesShort) + '</td>' +
      '<td class="crew-cell-action"><button type="button" class="bar-btn" onclick="editEmployee(\'' + idEsc + '\')">EDIT</button></td>' +
      '</tr>'
    );
  }).join('');

  // TODAY block
  var todayDateEl = document.getElementById('crewTodayDate');
  var todayBodyEl = document.getElementById('crewTodayBody');
  var todayEmptyEl = document.getElementById('crewTodayEmpty');
  if (todayDateEl || todayBodyEl) {
    var todayISO = typeof getTodayDateISO === 'function' ? getTodayDateISO() : new Date().toISOString().slice(0, 10);
    if (todayDateEl) {
      var d = new Date(todayISO + 'T12:00:00');
      todayDateEl.textContent = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    var allEntries = Array.isArray(S.scheduleEntries) ? S.scheduleEntries : [];
    var todayEntries = allEntries.filter(function (s) { return (s.date || '').slice(0, 10) === todayISO; });
    var employeesById = {};
    (Array.isArray(S.employees) ? S.employees : []).forEach(function (e) { if (e.id) employeesById[e.id] = e; });
    todayEntries.sort(function (a, b) {
      if (a.sort_order !== b.sort_order) return (a.sort_order || 0) - (b.sort_order || 0);
      var na = (employeesById[a.employee_id] && employeesById[a.employee_id].name) || '';
      var nb = (employeesById[b.employee_id] && employeesById[b.employee_id].name) || '';
      return na.localeCompare(nb);
    });
    if (todayEmptyEl) todayEmptyEl.style.display = todayEntries.length === 0 ? 'block' : 'none';
    if (todayBodyEl) {
      if (todayEntries.length === 0) {
        todayBodyEl.innerHTML = '';
      } else {
        todayBodyEl.innerHTML = todayEntries.map(function (s) {
          var emp = employeesById[s.employee_id];
          var name = (emp && emp.name) ? (typeof escapeHtml === 'function' ? escapeHtml(emp.name) : emp.name) : '—';
          var shift = (s.shift_label || '').trim() || '—';
          var area = (s.area || '').trim() || '—';
          var notes = (s.notes || '').trim() || '—';
          var idEsc = (s.id || '').replace(/'/g, "\\'");
          return (
            '<tr class="crew-row crew-today-row">' +
            '<td class="crew-cell-name">' + name + '</td>' +
            '<td class="crew-cell-role">' + (typeof escapeHtml === 'function' ? escapeHtml(shift) : shift) + '</td>' +
            '<td class="crew-cell-specialty">' + (typeof escapeHtml === 'function' ? escapeHtml(area) : area) + '</td>' +
            '<td class="crew-cell-notes">' + (typeof escapeHtml === 'function' ? escapeHtml(notes) : notes) + '</td>' +
            '<td class="crew-cell-action"><button type="button" class="bar-btn" onclick="editScheduleEntry(\'' + idEsc + '\')">EDIT</button></td>' +
            '</tr>'
          );
        }).join('');
      }
    }
  }
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
  el.innerHTML = S.presses.map(p => {
    const main = buildPressCardHTML(p, isAdmin ? 'pressStation' : 'panel', isAdmin);
    const onDeck = buildOnDeckCardHTML(p);
    return '<div class="press-card-wrap">' + main + onDeck + '</div>';
  }).join('');
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

async function saveFloorCardQuickEdit() {
  const j = S.jobs.find(x => x.id === S.floorCardJobId);
  if (!j) return;
  const get = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
  if (canEditField('status')) j.status = get('fcStatus') || j.status;
  if (canEditField('press')) j.press = get('fcPress') || j.press;
  if (canEditField('location')) j.location = get('fcLocation') || j.location;
  if (canEditField('due')) j.due = get('fcDue') || j.due;
  if (canEditField('notes')) j.notes = get('fcNotes') || j.notes;
  if (canEditField('assembly')) j.assembly = get('fcAssembly') || j.assembly;
  if (canEditField('fulfillment_phase')) j.fulfillment_phase = get('fcFulfillment') || null;
  if (canEditField('caution')) {
    var fcCR = get('fcCautionReason');
    if (fcCR) {
      var isNewFloorCaution = !(j.caution && j.caution.reason === fcCR && j.caution.since);
      var existingSince = isNewFloorCaution ? new Date().toISOString() : j.caution.since;
      j.caution = { reason: fcCR, since: existingSince, text: (j.caution && j.caution.text) || '' };
    } else {
      j.caution = null;
    }
  }
  try { await Storage.saveJob(j); } catch (e) { toastError('Floor card save failed'); }
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
      getRow('fulfillment_phase', '<label>Fulfillment</label>', `<select id="fcFulfillment">${FULFILLMENT_PHASES.map(o => `<option value="${o.v}" ${(j.fulfillment_phase || '') === o.v ? 'selected' : ''}>${o.l}</option>`).join('')}</select>`),
      getRow('caution', '<label>⚠ ACHTUNG</label>', `<select id="fcCautionReason">${CAUTION_REASONS.map(o => `<option value="${o.v}" ${((j.caution && j.caution.reason) || '') === o.v ? 'selected' : ''}>${o.l}</option>`).join('')}</select>`),
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
    ${j.fulfillment_phase ? '<span class="fc-fulfill">' + fulfillmentPhasePill(j.fulfillment_phase) + '</span>' : ''}
    ${isJobCautioned(j) ? '<span class="fc-caution floor-caution-icon' + (cautionNeedsNote(j) ? '' : ' floor-caution-satisfied') + '" onclick="event.stopPropagation();goToNotesWithFilter(\'' + j.id + '\')" title="ACHTUNG — view notes">\u26A0\uFE0E</span>' : ''}
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
// CARD ZONE — unified readiness card family (ASSET CARD / PACK CARD)
// ============================================================
let assetsOverlayState = null;
var cardZoneFace = 'asset';

function prepareAssetFace(jobId) {
  clearAssetsOverlayPulseTimers();
  const job = S.jobs.find(j => j.id === jobId);
  if (!job) return;
  S.assetsOverlayJobId = jobId;
  const raw = JSON.parse(JSON.stringify(job.assets || {}));
  ASSET_DEFS.forEach(a => {
    const d = raw[a.key] || {};
    const status = typeof getAssetStatus === 'function' ? getAssetStatus(d) : (d.received ? 'received' : d.na ? 'na' : '');
    raw[a.key] = { status, date: d.date || '', person: d.person || '', note: d.note || '', received: status === 'received', na: status === 'na', cautionSince: d.cautionSince || '' };
  });
  assetsOverlayState = { jobId, data: raw };
  document.getElementById('assetsOverlayTitle').textContent = `${job.catalog || '—'} · ${job.artist || '—'}`;
  renderAssetsOverlay();
}

function preparePackFace(jobId) {
  var job = S.jobs.find(function (j) { return j.id === jobId; });
  if (!job) return;
  var raw = JSON.parse(JSON.stringify(job.packCard || {}));
  PACK_DEFS.forEach(function (d) {
    if (!raw[d.key]) raw[d.key] = { status: '', person: '', date: '', note: '' };
    raw[d.key].status = getPackItemStatus(raw[d.key]);
  });
  if (raw._packNote === undefined) raw._packNote = '';
  packCardState = { jobId: jobId, data: raw, expandedKey: null };
  var titleEl = document.getElementById('packCardTitle');
  if (titleEl) titleEl.textContent = (job.catalog || '—') + ' · ' + (job.artist || '—');
  renderPackCard();
}

function openCardZone(jobId, face) {
  cardZoneFace = face || 'asset';
  if (cardZoneFace === 'asset') prepareAssetFace(jobId);
  else preparePackFace(jobId);
  document.getElementById('czFaceAsset').style.display = cardZoneFace === 'asset' ? '' : 'none';
  document.getElementById('czFacePack').style.display = cardZoneFace === 'pack' ? '' : 'none';
  updateCardZoneTabs();
  document.getElementById('cardZoneOverlay').classList.add('on');
}

function closeCardZone() {
  var saveTarget = null;

  if (assetsOverlayState) {
    flushAssetsOverlayInputs();
    var aJob = S.jobs.find(function(j) { return j.id === assetsOverlayState.jobId; });
    if (aJob) {
      aJob.assets = JSON.parse(JSON.stringify(assetsOverlayState.data));
      if (panelOpen && S.editId === assetsOverlayState.jobId) {
        curAssets = JSON.parse(JSON.stringify(aJob.assets));
      }
      saveTarget = aJob;
    }
  }

  if (packCardState) {
    var pJob = S.jobs.find(function(j) { return j.id === packCardState.jobId; });
    if (pJob) {
      pJob.packCard = JSON.parse(JSON.stringify(packCardState.data));
      if (!saveTarget) saveTarget = pJob;
    }
  }

  if (saveTarget) {
    Storage.saveJob(saveTarget).catch(function(e) {
      if (typeof toastError === 'function') toastError('Card zone changes may not have saved');
    });
  }

  assetsOverlayState = null;
  if (S) S.assetsOverlayJobId = null;
  clearAssetsOverlayPulseTimers();
  packCardState = null;
  if (typeof clearPackCardPulseTimers === 'function') clearPackCardPulseTimers();
  S.packCardAddingNoteKey = null;
  var el = document.getElementById('cardZoneOverlay');
  if (el) el.classList.remove('on');
  renderAll();
}

function switchCardZoneFace(face) {
  if (face === cardZoneFace) return;
  var jobId = cardZoneFace === 'asset'
    ? (assetsOverlayState ? assetsOverlayState.jobId : null)
    : (packCardState ? packCardState.jobId : null);
  if (!jobId) return;
  if (cardZoneFace === 'asset') flushAssetsOverlayInputs();
  else if (typeof flushPackCardInputs === 'function') flushPackCardInputs();
  cardZoneFace = face;
  if (face === 'asset' && !assetsOverlayState) prepareAssetFace(jobId);
  if (face === 'pack' && !packCardState) preparePackFace(jobId);
  document.getElementById('czFaceAsset').style.display = face === 'asset' ? '' : 'none';
  document.getElementById('czFacePack').style.display = face === 'pack' ? '' : 'none';
  updateCardZoneTabs();
}

function updateCardZoneTabs() {
  var aTab = document.getElementById('czTabAsset');
  var pTab = document.getElementById('czTabPack');
  var box = document.getElementById('cardZoneBox');
  if (aTab) aTab.classList.toggle('cz-tab-active', cardZoneFace === 'asset');
  if (pTab) pTab.classList.toggle('cz-tab-active', cardZoneFace === 'pack');
  if (box) box.classList.toggle('cz-pack-active', cardZoneFace === 'pack');
}

function openAssetsOverlay(jobId) { openCardZone(jobId, 'asset'); }
function openPackCard(jobId) { openCardZone(jobId, 'pack'); }

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
  closeCardZone();
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
    <span class="as-caution"><span class="as-num">${caution}</span> achtung</span>
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
    const icon = status === 'received' ? '✓' : status === 'na' ? '−' : status === 'caution' ? '\u26A0\uFE0E' : '';
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

/** Cycle asset status: '' → received → na → achtung → '' */
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
  if (!job) { closeCardZone(); return; }
  job.assets = JSON.parse(JSON.stringify(assetsOverlayState.data));
  if (panelOpen && S.editId === assetsOverlayState.jobId) {
    curAssets = JSON.parse(JSON.stringify(job.assets));
  }
  Storage.updateJobAssets(job.id, job.assets)
    .then(() => {
      assetsOverlayState = null;
      if (S) S.assetsOverlayJobId = null;
      clearAssetsOverlayPulseTimers();
      packCardState = null;
      const el = document.getElementById('cardZoneOverlay');
      if (el) el.classList.remove('on');
      renderAll();
      if (typeof toast === 'function') toast('ASSET CARD SAVED');
    })
    .catch((e) => {
      if (typeof setSyncState === 'function') setSyncState('error', { toast: 'SAVE FAILED' });
      if (typeof toastError === 'function') toastError('Assets save failed');
    });
}

// ============================================================
// PACK CARD — late-stage packing readiness (face of Card Zone)
// Unified with Asset card visual & interaction language
// ============================================================
var packCardState = null;

function flushPackCardInputs() {
  if (!packCardState) return;
}

function renderPackCard() {
  if (!packCardState) return;
  var data = packCardState.data;
  var ready = 0, na = 0, caution = 0, remaining = 0;
  PACK_DEFS.forEach(function (d) {
    var s = getPackItemStatus(data[d.key]);
    if (s === 'ready') ready++;
    else if (s === 'na') na++;
    else if (s === 'caution') caution++;
    else remaining++;
  });
  var allDone = remaining === 0 && caution === 0;

  var summaryEl = document.getElementById('packCardSummary');
  if (summaryEl) {
    summaryEl.innerHTML =
      '<span class="pk-ready"><span class="pk-num">' + ready + '</span> ready</span>' +
      '<span class="pk-na"><span class="pk-num">' + na + '</span> N/A</span>' +
      '<span class="pk-caution"><span class="pk-num">' + caution + '</span> achtung</span>' +
      '<span class="pk-remaining"><span class="pk-num">' + remaining + '</span> remaining</span>' +
      (allDone ? '<span class="pk-complete">✓ ALL PACKING READY</span>' : '');
  }

  var jobId = packCardState.jobId;
  var job = S.jobs.find(function (j) { return j.id === jobId; });
  var listEl = document.getElementById('packCardList');
  if (!listEl) return;

  var notesLog = (job && Array.isArray(job.notesLog)) ? job.notesLog : [];
  if (!S.packCardPulseKeys) S.packCardPulseKeys = {};
  if (!S.packCardPulseTimeouts) S.packCardPulseTimeouts = {};
  var pulseActive = {};
  var now = Date.now();

  PACK_DEFS.forEach(function (d) {
    var item = data[d.key] || {};
    var status = getPackItemStatus(item);
    var cautionSince = (item.cautionSince || '').trim();
    var hasNote = cautionSince && notesLog.some(function (n) { return n.assetKey === d.key && n.timestamp && n.timestamp >= cautionSince; });
    var locked = status === 'caution' && cautionSince && !hasNote;
    if (locked) {
      var elapsed = now - new Date(cautionSince).getTime();
      if (elapsed >= 1500 || S.packCardPulseKeys[d.key]) {
        pulseActive[d.key] = true;
      } else {
        if (!S.packCardPulseTimeouts[d.key]) {
          S.packCardPulseTimeouts[d.key] = setTimeout(function () {
            S.packCardPulseKeys[d.key] = true;
            if (S.packCardPulseTimeouts) delete S.packCardPulseTimeouts[d.key];
            renderPackCard();
          }, 1500 - elapsed);
        }
      }
    } else {
      if (S.packCardPulseTimeouts[d.key]) {
        clearTimeout(S.packCardPulseTimeouts[d.key]);
        delete S.packCardPulseTimeouts[d.key];
      }
      delete S.packCardPulseKeys[d.key];
    }
  });

  var addingNoteKey = S.packCardAddingNoteKey;

  listEl.innerHTML = PACK_DEFS.map(function (d) {
    var item = data[d.key] || { status: '', person: '', date: '', note: '' };
    var status = getPackItemStatus(item);
    var cautionSince = (status === 'caution' && item.cautionSince) ? item.cautionSince : '';
    var hasNoteSinceCaution = cautionSince && notesLog.some(function (n) { return n.assetKey === d.key && n.timestamp && n.timestamp >= cautionSince; });
    var cautionLocked = status === 'caution' && cautionSince && !hasNoteSinceCaution;
    var showPulse = cautionLocked && (pulseActive[d.key] || S.packCardPulseKeys[d.key]);
    var rowClass = status === 'ready' ? 'pk-row-ready' : status === 'na' ? 'pk-row-na' : status === 'caution' ? 'pk-row-caution' : '';
    var lockedClass = cautionLocked ? ' pk-row-caution-locked' : '';
    var icon = status === 'ready' ? '✓' : status === 'na' ? '−' : status === 'caution' ? '\u26A0\uFE0E' : '';
    var statClass = status === 'ready' ? 'pk-stat pk-stat-ready' : status === 'na' ? 'pk-stat pk-stat-na' : status === 'caution' ? 'pk-stat pk-stat-caution' : 'pk-stat';

    var addBtnClass = showPulse ? ' asset-row-btn-pulse' : '';
    var viewNotesBtn = cautionLocked
      ? '<button type="button" class="asset-row-btn asset-row-btn-disabled" disabled title="Add a note first (use +)">⌕</button>'
      : '<button type="button" class="asset-row-btn" onclick="event.stopPropagation();goToNotesWithFilter(\'' + jobId + '\',\'' + d.key + '\')" title="View notes for this item">⌕</button>';

    var addingNote = addingNoteKey === d.key;

    return '<div class="pk-item">' +
      '<div class="pk-row ' + rowClass + lockedClass + '" onclick="cyclePackStatus(\'' + d.key + '\')">' +
        '<div class="' + statClass + '">' + icon + '</div>' +
        '<div class="pk-name">' + d.label + '</div>' +
        '<div style="display:flex;gap: var(--space-sm);align-items:center">' +
          '<button type="button" class="asset-row-btn' + addBtnClass + '" onclick="event.stopPropagation();openPackNoteComposer(\'' + jobId + '\',\'' + d.key + '\')" title="Add note">+</button>' +
          viewNotesBtn +
        '</div>' +
      '</div>' +
      (addingNote ? '<div class="pk-note-composer">' +
        '<textarea id="packNoteComposerText" class="fta notes-textarea" placeholder="Add note (lands in NOTES)…" rows="2" onkeydown="packNoteComposerKeydown(event)"></textarea>' +
        '<button type="button" class="bar-btn notes-utility-action" onclick="submitPackNoteFromOverlay()">ADD</button>' +
        '</div>' : '') +
      '</div>';
  }).join('');
}

function cyclePackStatus(key) {
  if (!packCardState || !packCardState.data[key]) return;
  var item = packCardState.data[key];
  var cur = getPackItemStatus(item);
  var next = cur === '' ? 'ready' : cur === 'ready' ? 'na' : cur === 'na' ? 'caution' : '';
  item.status = next;
  if (next === 'ready' && !item.date) item.date = new Date().toISOString().split('T')[0];
  item.cautionSince = next === 'caution' ? new Date().toISOString() : '';
  renderPackCard();
}

function clearPackCardPulseTimers() {
  var timeouts = S.packCardPulseTimeouts;
  if (timeouts && typeof timeouts === 'object') {
    Object.keys(timeouts).forEach(function (k) {
      if (timeouts[k] != null) clearTimeout(timeouts[k]);
    });
  }
  if (S.packCardPulseTimeouts) S.packCardPulseTimeouts = {};
  if (S.packCardPulseKeys) S.packCardPulseKeys = {};
}

function savePackCard() {
  if (!packCardState) return;
  var job = S.jobs.find(function (j) { return j.id === packCardState.jobId; });
  if (!job) { closeCardZone(); return; }
  job.packCard = JSON.parse(JSON.stringify(packCardState.data));
  Storage.saveJob(job)
    .then(function () {
      packCardState = null;
      assetsOverlayState = null;
      if (S) S.assetsOverlayJobId = null;
      clearAssetsOverlayPulseTimers();
      clearPackCardPulseTimers();
      var el = document.getElementById('cardZoneOverlay');
      if (el) el.classList.remove('on');
      renderAll();
      if (typeof toast === 'function') toast('PACK CARD SAVED');
    })
    .catch(function () {
      if (typeof toastError === 'function') toastError('Pack card save failed');
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

function setCrewSort(key) {
  if (S.crewSortBy === key) S.crewSortDir = S.crewSortDir === 'asc' ? 'desc' : 'asc';
  else { S.crewSortBy = key; S.crewSortDir = 'asc'; }
  renderCrewPage();
}

function crewTableHeaderHTML() {
  return '<th></th>' + CREW_COLUMNS.map(c => {
    const active = S.crewSortBy === c.key;
    const arrow = active ? (S.crewSortDir === 'asc' ? ' ▲' : ' ▼') : '';
    return `<th class="sortable-th ${active ? 'sort-' + S.crewSortDir : ''}" onclick="setCrewSort('${c.key}')" title="Sort by ${c.label}">${c.label}${arrow}</th>`;
  }).join('') + '<th></th>';
}

const JOBS_TH_CLASS = { catalog: 'j-cat', artist: 'j-artist', album: 'j-album', format: 'j-spec', colorWt: 'j-spec', qty: 'j-spec', plus10: 'j-spec', status: 'j-state', due: 'j-state', press: 'j-press', assets: 'j-support', packing: 'j-support', location: 'j-support' };
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
  } else if (filter === 'cautioned') {
    jobs = activeJobs.filter(j => isJobCautioned(j));
    totalForCount = activeJobs.length;
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
  if (countEl) countEl.textContent = '';

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
      const jCautioned = isJobCautioned(j);
      const onPress = isJobOnPress(j);
      const ra = recentLogActivity(j);
      const pi = jobPressInfo(j);
      const pressRested = onPress && new Date().getHours() >= 17 && !ra.pressed;
      const poUrl = j.poContract && j.poContract.imageUrl;
      const poStar = poUrl ? '<span class="live-po-star' + (isPoRecent(j) ? ' live-po-star-glow' : '') + '" onclick="event.stopPropagation();openPoImageLightbox(\'' + poUrl.replace(/'/g, "\\'") + '\')" title="View PO image">★</span>' : '';
      const dots = poStar
        + (onPress && !pressRested ? '<span class="live-dot live-dot-press" title="On press"></span>' : '')
        + (ra.pressed  ? '<span class="live-dot live-dot-pressed" title="Pressed (1h)"></span>' : '')
        + (ra.qc_passed? '<span class="live-dot live-dot-qcpass" title="QC pass (1h)"></span>' : '')
        + (ra.rejected ? '<span class="live-dot live-dot-reject" title="Rejected (1h)"></span>' : '')
        + (ra.packed   ? '<span class="live-dot live-dot-packed" title="Boxed (1h)"></span>' : '')
        + (ra.ready    ? '<span class="live-dot live-dot-ready" title="Ready (1h)"></span>' : '')
        + (ra.shipped  ? '<span class="live-quack" title="Quacked (1h)">' + QUACK_ICON + '</span>' : '');
      const st = j.status || 'queue';
      const statusMicro = '';
      const cautionDot = jCautioned ? ' <span class="caution-dot' + (cautionNeedsNote(j) ? ' caution-dot-pulse' : '') + '" onclick="event.stopPropagation();goToNotesWithFilter(\'' + j.id + '\')" title="' + cautionReasonLabel((j.caution||{}).reason||'').toUpperCase() + '">\u26A0\uFE0E</span>' : '';
      const pressCell = pi.onPress
        ? '<span class="press-live' + (ra.pressed ? ' press-live-glow' : '') + '">' + escapeHtml(pi.onPress) + '</span>'
        : pi.onDeck
          ? '<span class="press-deck">' + escapeHtml(pi.onDeck) + '</span>'
          : (j.press ? escapeHtml(pressShortName(j.press)) : '—');
      return `<tr data-status="${j.status || ''}"${jCautioned ? ' class="job-row-cautioned"' : ''}>
        <td class="j-cat panel-trigger" onclick="openPanel('${j.id}')" title="Open job">${j.catalog || '—'}</td>
        <td class="j-artist panel-trigger" onclick="openPanel('${j.id}')" title="Open job">${j.artist || '—'}</td>
        <td class="j-album panel-trigger" onclick="openPanel('${j.id}')" title="Open job">${j.album || '—'}</td>
        <td class="j-spec">${j.format ? `<span class="pill ${j.format.includes('7"') ? 'seven' : 'go'}">${j.format}</span>` : '—'}</td>
        <td class="j-spec">${j.color || 'Black'}${j.weight ? ` <span class="j-wt">${j.weight}</span>` : ''}</td>
        <td class="j-spec">${j.qty ? parseInt(j.qty).toLocaleString() : '—'}</td>
        <td class="j-spec j-plus10">${j.qty ? Math.ceil(parseInt(j.qty) * 1.1).toLocaleString() : '—'}</td>
        <td class="j-state j-live-cell">${dots}${statusMicro}${cautionDot}</td>
        <td class="j-state">${dueDelta(j.due)}</td>
        <td class="j-press">${pressCell}</td>
        <td class="j-support assets-tap" onclick="event.stopPropagation(); openCardZone('${j.id}','asset')" title="Asset card">${ahHTML(j)}</td>
        <td class="j-support packing-tap" onclick="event.stopPropagation(); openCardZone('${j.id}','pack')" title="Pack card">${packHealthHTML(j)}</td>
        <td class="j-support">${j.location ? `<span class="loc">${j.location}</span>` : '—'}</td>
      </tr>`;
    }).join('');
  }

  if (cards) {
    cards.innerHTML = jobs.map(j => {
      const ah = assetHealth(j);
      const prog = progressDisplay(j);
      const jcCautioned = isJobCautioned(j);
      const onPress = isJobOnPress(j);
      const ra = recentLogActivity(j);
      const pi = jobPressInfo(j);
      const pressRested = onPress && new Date().getHours() >= 17 && !ra.pressed;
      const poUrl2 = j.poContract && j.poContract.imageUrl;
      const poStar2 = poUrl2 ? '<span class="live-po-star' + (isPoRecent(j) ? ' live-po-star-glow' : '') + '" onclick="event.stopPropagation();openPoImageLightbox(\'' + poUrl2.replace(/'/g, "\\'") + '\')" title="View PO image">★</span>' : '';
      const dots = poStar2
        + (onPress && !pressRested ? '<span class="live-dot live-dot-press" title="On press"></span>' : '')
        + (ra.pressed  ? '<span class="live-dot live-dot-pressed" title="Pressed (1h)"></span>' : '')
        + (ra.qc_passed? '<span class="live-dot live-dot-qcpass" title="QC pass (1h)"></span>' : '')
        + (ra.rejected ? '<span class="live-dot live-dot-reject" title="Rejected (1h)"></span>' : '')
        + (ra.packed   ? '<span class="live-dot live-dot-packed" title="Boxed (1h)"></span>' : '')
        + (ra.ready    ? '<span class="live-dot live-dot-ready" title="Ready (1h)"></span>' : '')
        + (ra.shipped  ? '<span class="live-quack" title="Quacked (1h)">' + QUACK_ICON + '</span>' : '');
      const st = j.status || 'queue';
      const statusMicro = '';
      const cautionDot = jcCautioned ? ' <span class="caution-dot' + (cautionNeedsNote(j) ? ' caution-dot-pulse' : '') + '" onclick="event.stopPropagation();goToNotesWithFilter(\'' + j.id + '\')" title="' + cautionReasonLabel((j.caution||{}).reason||'').toUpperCase() + '">\u26A0\uFE0E</span>' : '';
      const pressTag = pi.onPress
        ? '<span class="jc-detail press-live' + (ra.pressed ? ' press-live-glow' : '') + '">⬡ ' + escapeHtml(pi.onPress) + '</span>'
        : pi.onDeck
          ? '<span class="jc-detail press-deck">⬡ ' + escapeHtml(pi.onDeck) + '</span>'
          : (j.press ? `<span class="jc-detail">⬡ ${escapeHtml(pressShortName(j.press))}</span>` : '');
      return `
        <div class="job-card st-${j.status}${jcCautioned ? ' job-card-cautioned' : ''}" onclick="openPanel('${j.id}')">
        <div class="jc-top">
          <div>
          <div class="jc-cat">${j.catalog || '—'}</div>
          <div class="jc-artist">${j.artist || '—'}</div>
          <div class="jc-album">${j.album || ''}</div>
          </div>
          <div class="jc-live-wrap">${dots}${statusMicro}${cautionDot}</div>
        </div>
        
        <div class="jc-row">
          ${j.format ? `<span class="pill ${j.format.includes('7"') ? 'seven' : 'go'}">${j.format}</span>` : ''}
          <span class="jc-detail">${j.color || 'Black'} <span>${j.weight || ''}</span></span>
          <span class="jc-detail">Qty: ${j.qty ? parseInt(j.qty).toLocaleString() : '—'}</span>
        </div>
        <div class="jc-row">
          <span class="jc-detail">${dueDelta(j.due)}</span>
          ${ahHTML(j)}
          ${pressTag}
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
let logMode = 'ship';
let logAction = '';
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

function setLogMode(mode) {
  logMode = mode;
  logAction = '';
  logNumpadValue = '0';
  try { sessionStorage.setItem('logMode', mode); } catch (e) {}
  renderLog();
}

function triggerLogRailGlow() {
  const el = document.getElementById('logConsoleRail');
  if (!el) return;
  const glowMap = {
    press: 'press', qc_pass: 'qcpass', qc_reject: 'qcreject',
    packed: 'packed', ready: 'ready', shipped: 'shipped',
  };
  const glow = glowMap[logAction];
  const all = ['rail-glow-press', 'rail-glow-qcpass', 'rail-glow-qcreject', 'rail-glow-packed', 'rail-glow-ready', 'rail-glow-shipped'];
  all.forEach(c => el.classList.remove(c));
  if (glow) el.classList.add('rail-glow-' + glow);
  setTimeout(function () { all.forEach(c => el.classList.remove(c)); }, 750);
}

function selectLogJob(jobId) {
  S.logSelectedJob = (jobId && String(jobId).trim()) ? jobId : null;
  logNumpadValue = '0';
  logNumpadUpdateDisplay();
  if (typeof hideShipAchtungComposer === 'function') hideShipAchtungComposer();
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
    return;
  }

  const simpleShipActions = { packed: 'packed', ready: 'ready', shipped: 'shipped' };
  const shipToastLabel = { packed: 'BOXED', ready: 'READY', shipped: 'QUACK' };
  if (simpleShipActions[logAction]) {
    try {
      const result = await logJobProgress(S.logSelectedJob, logAction, n, 'Log');
      if (!result.ok) { toastError(result.error || 'Log failed'); return; }
      toast(`+${n.toLocaleString()} ${shipToastLabel[logAction] || logAction} → ${jobName}`);
      logNumpadValue = '0';
      logNumpadUpdateDisplay();
      renderLog();
      triggerLogRailGlow();
    } catch (e) { toastError(e?.message || 'Log failed'); }
    return;
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

  const pressToggle = document.getElementById('logModePressBtn');
  const shipToggle = document.getElementById('logModeShipBtn');
  if (pressToggle) pressToggle.classList.toggle('active', logMode === 'press');
  if (shipToggle) shipToggle.classList.toggle('active', logMode === 'ship');

  const picker = document.getElementById('logJobPicker');
  if (picker) {
    const active = document.activeElement;
    if (!(active && active.tagName === 'SELECT' && picker.contains(active))) {
      const allJobs = sortJobsByCatalogAsc(S.jobs.filter(j => {
        if (isJobArchived(j)) return false;
        return j.status !== 'done';
      }));
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
    jobLabel.textContent = sel ? `${sel.catalog || '—'} · ${sel.artist || '—'}` : '';
  }

  const logConsoleRail = document.getElementById('logConsoleRail');
  if (logConsoleRail) {
    const job = S.logSelectedJob ? S.jobs.find(j => j.id === S.logSelectedJob) : null;
    logConsoleRail.innerHTML = job ? logConsoleRailHTML(job, logAction) : logConsoleRailPlaceholderHTML();
  }

  const extraBtn4 = document.getElementById('logBtnMode4');
  const extraBtn5 = document.getElementById('logBtnMode5');
  const extraBtn6 = document.getElementById('logBtnMode6');
  const isShip = logMode === 'ship';

  if (isShip) {
    const pressActions = [
      { id: 'logBtnPress',    key: 'press',     label: 'PRESS',  cls: 'log-action-press' },
      { id: 'logBtnQcPass',   key: 'qc_pass',   label: 'PASS',   cls: 'log-action-qcpass' },
      { id: 'logBtnQcReject', key: 'qc_reject',  label: 'REJECT', cls: 'log-action-qcreject' },
    ];
    pressActions.forEach(a => {
      const btn = document.getElementById(a.id);
      if (!btn) return;
      btn.innerHTML = a.label;
      btn.setAttribute('onclick', "setLogAction('" + a.key + "')");
      btn.className = 'log-action-btn ' + a.cls + ' log-fp-' + ({logBtnPress:'press',logBtnQcPass:'qcpass',logBtnQcReject:'qcrej'}[a.id]);
      btn.classList.toggle('active', logAction === a.key);
    });
    const shipActions = [
      { id: 'logBtnMode4', key: 'packed',  label: 'BOXED',                  cls: 'log-action-packed' },
      { id: 'logBtnMode5', key: 'ready',   label: 'READY',                  cls: 'log-action-ready' },
      { id: 'logBtnMode6', key: 'shipped', label: QUACK_ICON + ' QUACK',    cls: 'log-action-shipped' },
    ];
    shipActions.forEach(a => {
      const btn = document.getElementById(a.id);
      if (!btn) return;
      btn.style.display = '';
      btn.innerHTML = a.label;
      btn.setAttribute('onclick', "setLogAction('" + a.key + "')");
      btn.className = 'log-action-btn ' + a.cls + ' log-fp-' + ({logBtnMode4:'mode4',logBtnMode5:'mode5',logBtnMode6:'mode6'}[a.id]);
      btn.classList.toggle('active', logAction === a.key);
    });
  } else {
    if (extraBtn4) extraBtn4.style.display = 'none';
    if (extraBtn5) extraBtn5.style.display = 'none';
    if (extraBtn6) extraBtn6.style.display = 'none';
    const pressActions = [
      { id: 'logBtnPress',    key: 'press',     label: 'PRESS',  cls: 'log-action-press' },
      { id: 'logBtnQcPass',   key: 'qc_pass',   label: 'PASS',   cls: 'log-action-qcpass' },
      { id: 'logBtnQcReject', key: 'qc_reject',  label: 'REJECT', cls: 'log-action-qcreject' },
    ];
    pressActions.forEach(a => {
      const btn = document.getElementById(a.id);
      if (!btn) return;
      btn.innerHTML = a.label;
      btn.setAttribute('onclick', "setLogAction('" + a.key + "')");
      btn.className = 'log-action-btn ' + a.cls + ' log-fp-' + ({logBtnPress:'press',logBtnQcPass:'qcpass',logBtnQcReject:'qcrej'}[a.id]);
      btn.classList.toggle('active', logAction === a.key);
    });
  }

  const enterMap = {
    press: { label: 'LOG PRESS', cls: 'log-enter-press' },
    qc_pass: { label: 'LOG PASS', cls: 'log-enter-qcpass' },
    qc_reject: { label: 'LOG REJECT', cls: 'log-enter-qcreject' },
    packed: { label: 'LOG BOXED', cls: 'log-enter-packed' },
    ready: { label: 'LOG READY', cls: 'log-enter-ready' },
    shipped: { label: 'LOG ' + QUACK_ICON + ' QUACK', cls: 'log-enter-shipped' },
  };
  const enterBtn = document.getElementById('logEnterBtn');
  if (enterBtn) {
    const e = enterMap[logAction];
    if (e) {
      enterBtn.innerHTML = e.label;
      enterBtn.className = 'log-enter-btn ' + e.cls;
    } else {
      enterBtn.innerHTML = 'LOG';
      enterBtn.className = 'log-enter-btn';
    }
  }

  const allModeClasses = ['mode-press', 'mode-qcpass', 'mode-qcreject', 'mode-packed', 'mode-ready', 'mode-shipped'];
  const actionModeCls = {
    press: 'mode-press', qc_pass: 'mode-qcpass', qc_reject: 'mode-qcreject',
    packed: 'mode-packed', ready: 'mode-ready', shipped: 'mode-shipped',
  };
  const consoleEl = document.getElementById('logConsole');
  if (consoleEl) {
    consoleEl.classList.toggle('log-ship-grid', logMode === 'ship');
    allModeClasses.forEach(c => consoleEl.classList.remove(c));
    if (actionModeCls[logAction]) consoleEl.classList.add(actionModeCls[logAction]);
  }
  if (typeof logNumpadUpdateDisplay === 'function') logNumpadUpdateDisplay();

  const achtungCtrl = document.getElementById('logAchtungCtrl');
  if (achtungCtrl) achtungCtrl.style.display = 'none';

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
    const feedJobs = S.jobs.filter(j => !isJobArchived(j));
    const viewDate = logViewDate;
    const activeFeedStages = { pressed: 1, qc_passed: 1, packed: 1, ready: 1, shipped: 1, picked_up: 1, held: 1 };
    const stageLabel = { pressed: 'PRESS', qc_passed: 'PASS', packed: 'BOXED', ready: 'READY', shipped: QUACK_ICON + ' QUACK', picked_up: QUACK_ICON + ' QUACK', held: 'HELD' };
    const stageCls   = { pressed: 'pressed', qc_passed: 'qc_passed', packed: 'packed', ready: 'ready', shipped: 'shipped', picked_up: 'picked_up', held: 'held' };

    feedJobs.forEach(j => {
      if (!Array.isArray(j.progressLog)) return;
      j.progressLog.forEach(e => {
        if (!e || !e.timestamp) return;
        const d = new Date(e.timestamp).toDateString();
        if (d !== viewDate) return;
        if (e.stage === 'asset_note') return;
        if (e.stage === 'rejected') return;
        if (!activeFeedStages[e.stage]) return;
        const sw = parseSurfaceWho(e.person || '');
        items.push({
          ts: e.timestamp,
          qty: parseInt(e.qty, 10) || 0,
          action: stageLabel[e.stage] || 'LOG',
          defect: e.reason || '',
          cls: stageCls[e.stage] || '',
          source: sw.surface || '—',
          who: sw.who || '',
          press: (j.press || '').split(',')[0].trim(),
          jobLabel: `${j.catalog || '—'} · ${j.artist || '—'}`,
          jobId: j.id,
          assetKey: '',
        });
      });
    });

    if (logMode !== 'ship') {
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
    }

    items.sort((a, b) => new Date(b.ts) - new Date(a.ts));

    const shipStages = { packed: 1, ready: 1, shipped: 1, picked_up: 1, held: 1 };
    if (!items.length) {
      feedEl.innerHTML = `<div class="empty">No entries ${isToday ? 'today' : 'on this date'}</div>`;
    } else {
      feedEl.innerHTML = items.map(it => {
        const time = new Date(it.ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const isOut = !!shipStages[it.cls];
        const prefix = isOut ? '◇ ' : '+';
        const primary = it.action === 'NOTE'
          ? ('NOTE' + (it.defect ? ' · ' + escapeHtml(it.defect) : ''))
          : (`${prefix}${(it.qty || 0).toLocaleString()} ${it.action}${it.defect ? ' · ' + escapeHtml(it.defect) : ''}`);
        const metaParts = [
          isOut ? 'SHIP' : null,
          escapeHtml(it.source || '—'),
          it.press ? escapeHtml(it.press) : null,
          it.who ? escapeHtml(it.who) : null,
          escapeHtml(time),
          escapeHtml(it.jobLabel || '—'),
        ].filter(Boolean);
        const laneCls = isOut ? ' log-feed-ship' : '';
        const clickable = it.cls === 'asset_note' && it.jobId && it.assetKey;
        const jobIdAttr = clickable ? String(it.jobId).replace(/'/g, '\\\'') : '';
        const assetKeyAttr = clickable ? String(it.assetKey).replace(/'/g, '\\\'') : '';
        const clickAttr = clickable ? ` onclick=\"goToNotesWithFilter('${jobIdAttr}','${assetKeyAttr}')\"` : '';
        return `<div class="progress-entry ${it.cls}${laneCls}"${clickAttr}><div class="log-feed-primary">${primary}</div><div class="log-feed-meta">${metaParts.join(' · ')}</div></div>`;
      }).join('');
    }
  }
}

function renderQC() {
  renderLog();
}

// ============================================================
// ENGINE — plant instrumentation / telemetry console
// Pedalboard console: equal square blocks, one color, uniform period.
// Click-through detail overlay for each metric block.
// ============================================================
var enginePeriod = '1M';

var ENGINE_METRICS = {
  qpm:        { label: QUACK_ICON + ' QPM',  stages: ['shipped', 'picked_up'], desc: 'Units out the door' },
  pressed:    { label: 'PRESSED',             stages: ['pressed'],              desc: 'Press output' },
  qc_passed:  { label: 'QC PASSED',           stages: ['qc_passed'],            desc: 'QC pass count' },
  yield:      { label: 'YIELD',               stages: ['qc_passed', 'rejected'], desc: 'QC yield rate', isYield: true },
  rejected:   { label: 'REJECTED',             stages: ['rejected'],             desc: 'Reject count' },
  packed:     { label: 'BOXED',                stages: ['packed'],               desc: 'In sealed boxes' },
  ready:      { label: 'READY',                stages: null, desc: 'Units on skids', isLive: true },
  order_book: { label: 'ORDER BOOK',           stages: null, desc: 'Total ordered across active jobs', isLive: true }
};

function setEnginePeriod(p) {
  enginePeriod = p;
  renderEngine();
}

function enginePeriodWindow() {
  var now = new Date();
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var tomorrowStart = new Date(todayStart.getTime() + 864e5);
  var pStart, pEnd = tomorrowStart;
  switch (enginePeriod) {
    case '1H':  pStart = new Date(now.getTime() - 36e5); pEnd = now; break;
    case '1D':  pStart = todayStart; break;
    case '1W':  pStart = new Date(todayStart.getTime() - 6 * 864e5); break;
    case '1M':  pStart = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case '1Y':  pStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
    case 'YTD': pStart = new Date(now.getFullYear(), 0, 1); break;
    case 'ALL': pStart = new Date(0); break;
    default:    pStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start: pStart, end: pEnd };
}

function enginePeriodLabel() {
  var labels = { '1H': 'Last hour', '1D': 'Today', '1W': 'Last 7 days', '1M': 'Month to date', '1Y': 'Trailing year', 'YTD': 'Year to date', 'ALL': 'All time' };
  return labels[enginePeriod] || enginePeriod;
}

function renderEngine() {
  var grid = document.getElementById('engineGrid');
  if (!grid) return;

  var w = enginePeriodWindow();
  var d = getEngineData(S.jobs, w.start, w.end);
  var quacked = d.shipped + d.pickedUp;

  var active = S.jobs.filter(function (j) { return !isJobArchived(j) && j.status !== 'done'; });
  var totalOrdered = 0;
  var liveReady = 0;
  active.forEach(function (j) {
    totalOrdered += Math.max(0, parseInt(j.qty, 10) || 0);
    var p = getJobProgress(j);
    liveReady += p.ready;
  });

  var yieldDenom = d.qcPassed + d.rejected;
  var yieldPct = yieldDenom > 0 ? ((d.qcPassed / yieldDenom) * 100) : null;

  function rail(num, denom) {
    var pct = denom > 0 ? Math.min(100, (num / denom) * 100) : 0;
    return '<div class="eng-rail"><div class="eng-rail-fill" style="width:' + Math.round(pct) + '%"></div></div>';
  }

  function sq(key, role, label, value, sub, railHTML) {
    return '<div class="eng-block ' + role + '" onclick="openEngineDetail(\'' + key + '\')" style="cursor:pointer">'
      + '<div class="eng-label">' + label + '</div>'
      + '<div class="eng-value">' + value + '</div>'
      + (railHTML || '')
      + (sub ? '<div class="eng-sub">' + sub + '</div>' : '')
      + '</div>';
  }

  var b = '';

  // hero — north-star output metric
  b += sq('qpm', 'eng-hero', QUACK_ICON + ' QPM', quacked.toLocaleString(),
    quacked > 0 ? 'out the door' : 'no quacks yet',
    rail(quacked, totalOrdered || 1));

  // process — production movement
  b += sq('pressed', 'eng-process', 'PRESSED', d.pressed.toLocaleString(),
    totalOrdered > 0 ? d.pressed.toLocaleString() + ' / ' + totalOrdered.toLocaleString() : '',
    rail(d.pressed, totalOrdered || 1));

  b += sq('qc_passed', 'eng-process', 'QC PASSED', d.qcPassed.toLocaleString(),
    d.pressed > 0 ? d.qcPassed.toLocaleString() + ' / ' + d.pressed.toLocaleString() + ' pressed' : '',
    rail(d.qcPassed, d.pressed || 1));

  // yield — conditional color escalation
  var yieldRole = 'eng-yield';
  if (yieldPct !== null && yieldPct < 90) yieldRole = 'eng-yield-bad';
  else if (yieldPct !== null && yieldPct < 95) yieldRole = 'eng-yield-warn';
  b += sq('yield', yieldRole, 'YIELD', yieldPct !== null ? yieldPct.toFixed(1) + '%' : '—',
    yieldDenom > 0 ? d.qcPassed.toLocaleString() + ' / ' + yieldDenom.toLocaleString() : 'no QC data',
    yieldPct !== null ? rail(Math.round(yieldPct), 100) : '');

  // friction — rejects (hot when > 0)
  var rejRole = d.rejected > 0 ? 'eng-friction eng-hot' : 'eng-friction';
  b += sq('rejected', rejRole, 'REJECTED', d.rejected.toLocaleString(),
    d.rejected > 0 && yieldDenom > 0 ? (100 - yieldPct).toFixed(1) + '% rate' : '',
    rail(d.rejected, yieldDenom || 1));

  // process — packed
  b += sq('packed', 'eng-process', 'BOXED', d.packed.toLocaleString(),
    d.qcPassed > 0 ? d.packed.toLocaleString() + ' / ' + d.qcPassed.toLocaleString() + ' QC' : '',
    rail(d.packed, d.qcPassed || 1));

  // staging — ready (outbound family)
  b += sq('ready', 'eng-stage', 'READY', liveReady.toLocaleString(),
    liveReady > 0 ? 'on skids' : 'none staged', '');

  // context — denominator / background stat
  b += sq('order_book', 'eng-context', 'ORDER BOOK', totalOrdered.toLocaleString(),
    active.length + ' active job' + (active.length !== 1 ? 's' : ''), '');

  grid.innerHTML = b;

  var strip = document.getElementById('enginePeriodStrip');
  if (strip) {
    var periods = ['1H', '1D', '1W', '1M', '1Y', 'YTD', 'ALL'];
    strip.innerHTML = periods.map(function (p) {
      return '<span class="eng-period' + (enginePeriod === p ? ' eng-period-on' : '') + '" onclick="setEnginePeriod(\'' + p + '\')">' + p + '</span>';
    }).join('');
  }

  var clockEl = document.getElementById('engineClock');
  if (clockEl) {
    var n = new Date();
    clockEl.textContent = n.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      + ' · ' + n.toLocaleTimeString('en-US', { hour12: false });
  }
}

// ---- ENGINE detail overlay ----

var engDetailKey = null;
var engChartPeriod = '30D';
var engCompareKeys = [];
var ENG_CHART_PERIODS = ['1D', '7D', '30D', 'MTD'];

var ENG_COMPARE_MAP = {
  qpm:       ['packed', 'pressed'],
  pressed:   ['qc_passed', 'rejected'],
  qc_passed: ['pressed', 'rejected'],
  rejected:  ['pressed', 'qc_passed'],
  packed:    ['qc_passed', 'qpm']
};

var ENG_COMPARE_LABELS = {
  qpm: 'QPM', pressed: 'PRESSED', qc_passed: 'QC PASS',
  rejected: 'REJECTED', packed: 'BOXED'
};

var ENG_OVERLAY_COLORS = [
  { line: 'rgba(0,229,255,0.5)',  dot: 'rgba(0,229,255,0.8)' },
  { line: 'rgba(255,179,0,0.4)',  dot: 'rgba(255,179,0,0.7)' }
];

function openEngineDetail(key) {
  var m = ENGINE_METRICS[key];
  if (!m) return;
  var overlay = document.getElementById('engDetailOverlay');
  if (!overlay) return;
  engDetailKey = key;
  engCompareKeys = [];

  var titleEl = document.getElementById('engDetailTitle');
  var numEl = document.getElementById('engDetailNumber');
  var periodEl = document.getElementById('engDetailPeriodLabel');

  titleEl.innerHTML = m.label;
  periodEl.textContent = enginePeriodLabel() + (m.isLive ? ' · live snapshot' : '');

  renderEngineDetailBody(key, m, numEl);
  overlay.classList.add('on');
}

function closeEngineDetail() {
  engDetailKey = null;
  engCompareKeys = [];
  var el = document.getElementById('engDetailOverlay');
  if (el) el.classList.remove('on');
}

function setEngChartPeriod(p) {
  engChartPeriod = p;
  if (!engDetailKey) return;
  var m = ENGINE_METRICS[engDetailKey];
  if (!m) return;
  var numEl = document.getElementById('engDetailNumber');
  renderEngineDetailBody(engDetailKey, m, numEl);
}

function toggleEngCompare(key) {
  var idx = engCompareKeys.indexOf(key);
  if (idx >= 0) {
    engCompareKeys.splice(idx, 1);
  } else {
    if (engCompareKeys.length >= 2) engCompareKeys.shift();
    engCompareKeys.push(key);
  }
  refreshEngChartSection();
}

function refreshEngChartSection() {
  var stripEl = document.getElementById('engCompareStrip');
  if (stripEl) stripEl.innerHTML = engCompareTogglesInner();
  requestAnimationFrame(function () { drawEngineChart(); });
}

function renderEngineDetailBody(key, m, numEl) {
  var bodyEl = document.getElementById('engDetailBody');
  if (!bodyEl) return;
  var w = enginePeriodWindow();
  var html = '';

  if (m.isLive && key === 'ready') {
    html = renderEngineDetailLiveReady(numEl);
  } else if (m.isLive && key === 'order_book') {
    html = renderEngineDetailOrderBook(numEl);
  } else if (m.isYield) {
    html = renderEngineDetailYield(numEl, w);
  } else {
    html = renderEngineDetailStage(key, m, numEl, w);
  }

  bodyEl.innerHTML = html;

  requestAnimationFrame(function () { drawEngineChart(); });
}

// ---- chart period strip HTML ----
function engChartStripHTML() {
  return '<div class="eng-chart-strip">' + ENG_CHART_PERIODS.map(function (p) {
    return '<button type="button" class="eng-chart-btn' + (engChartPeriod === p ? ' eng-chart-on' : '') + '" onclick="setEngChartPeriod(\'' + p + '\')">' + p + '</button>';
  }).join('') + '</div>';
}

// ---- comparison toggles HTML ----
function engCompareTogglesInner() {
  var opts = ENG_COMPARE_MAP[engDetailKey];
  if (!opts || opts.length === 0) return '';
  return opts.map(function (k) {
    var ci = engCompareKeys.indexOf(k);
    var cls = ci >= 0 ? ' eng-cmp-on-' + ci : '';
    return '<button type="button" class="eng-compare-btn' + cls + '" onclick="toggleEngCompare(\'' + k + '\')">'
      + (ENG_COMPARE_LABELS[k] || k) + '</button>';
  }).join('');
}

function engCompareTogglesHTML() {
  var opts = ENG_COMPARE_MAP[engDetailKey];
  if (!opts || opts.length === 0) return '';
  return '<div class="eng-compare-row">'
    + '<span class="eng-compare-label">VS</span>'
    + '<span id="engCompareStrip">' + engCompareTogglesInner() + '</span>'
    + '</div>';
}

// ---- chart canvas HTML shell ----
function engChartSectionHTML(title) {
  return '<div class="eng-detail-section">'
    + '<div class="eng-detail-section-title">' + title + '</div>'
    + '<div class="eng-chart-wrap"><canvas id="engChartCanvas"></canvas></div>'
    + engCompareTogglesHTML()
    + engChartStripHTML()
    + '</div>';
}

// ---- compute chart time window from engChartPeriod ----
function engChartWindow() {
  var now = new Date();
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var end = new Date(todayStart.getTime() + 864e5);
  var start;
  switch (engChartPeriod) {
    case '1D':  start = todayStart; break;
    case '7D':  start = new Date(todayStart.getTime() - 6 * 864e5); break;
    case '30D': start = new Date(todayStart.getTime() - 29 * 864e5); break;
    case 'MTD': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    default:    start = new Date(todayStart.getTime() - 29 * 864e5);
  }
  return { start: start, end: end };
}

// ---- bucket helpers ----
function engChartStageBuckets(stages) {
  var cw = engChartWindow();
  var isHourly = engChartPeriod === '1D';
  var map = {};
  var ps = cw.start.getTime(), pe = cw.end.getTime();
  S.jobs.forEach(function (j) {
    if (!j || isJobArchived(j)) return;
    (j.progressLog || []).forEach(function (e) {
      if (!e || !e.timestamp || stages.indexOf(e.stage) === -1) return;
      var t = new Date(e.timestamp).getTime();
      if (t < ps || t >= pe) return;
      var k = isHourly
        ? new Date(e.timestamp).getHours()
        : new Date(e.timestamp).toISOString().slice(0, 10);
      map[k] = (map[k] || 0) + Math.max(0, parseInt(e.qty, 10) || 0);
    });
  });

  var labels = [], values = [];
  if (isHourly) {
    for (var h = 0; h < 24; h++) {
      labels.push(h + 'h');
      values.push(map[h] || 0);
    }
  } else {
    var cur = new Date(cw.start);
    while (cur < cw.end) {
      var dk = cur.toISOString().slice(0, 10);
      labels.push((cur.getMonth() + 1) + '/' + cur.getDate());
      values.push(map[dk] || 0);
      cur = new Date(cur.getTime() + 864e5);
    }
  }
  return { labels: labels, values: values };
}

function engChartYieldBuckets() {
  var cw = engChartWindow();
  var isHourly = engChartPeriod === '1D';
  var passMap = {}, rejMap = {};
  var ps = cw.start.getTime(), pe = cw.end.getTime();
  S.jobs.forEach(function (j) {
    if (!j || isJobArchived(j)) return;
    (j.progressLog || []).forEach(function (e) {
      if (!e || !e.timestamp) return;
      var t = new Date(e.timestamp).getTime();
      if (t < ps || t >= pe) return;
      var q = Math.max(0, parseInt(e.qty, 10) || 0);
      var k = isHourly
        ? new Date(e.timestamp).getHours()
        : new Date(e.timestamp).toISOString().slice(0, 10);
      if (e.stage === 'qc_passed') passMap[k] = (passMap[k] || 0) + q;
      else if (e.stage === 'rejected') rejMap[k] = (rejMap[k] || 0) + q;
    });
  });

  var labels = [], values = [];
  if (isHourly) {
    for (var h = 0; h < 24; h++) {
      labels.push(h + 'h');
      var p = passMap[h] || 0, r = rejMap[h] || 0;
      values.push((p + r) > 0 ? (p / (p + r)) * 100 : -1);
    }
  } else {
    var cur = new Date(cw.start);
    while (cur < cw.end) {
      var dk = cur.toISOString().slice(0, 10);
      labels.push((cur.getMonth() + 1) + '/' + cur.getDate());
      var p = passMap[dk] || 0, r = rejMap[dk] || 0;
      values.push((p + r) > 0 ? (p / (p + r)) * 100 : -1);
      cur = new Date(cur.getTime() + 864e5);
    }
  }
  return { labels: labels, values: values, isPercent: true };
}

// ---- Canvas drawing ----
function drawEngineChart() {
  var canvas = document.getElementById('engChartCanvas');
  if (!canvas) return;
  var m = ENGINE_METRICS[engDetailKey];
  if (!m || m.isLive) return;

  var data;
  if (m.isYield) {
    data = engChartYieldBuckets();
  } else {
    data = engChartStageBuckets(m.stages);
    data.isPercent = false;
  }

  // compute overlay series
  var overlays = [];
  if (!data.isPercent) {
    engCompareKeys.forEach(function (ck, ci) {
      var cm = ENGINE_METRICS[ck];
      if (!cm || !cm.stages || cm.isLive || cm.isYield) return;
      var od = engChartStageBuckets(cm.stages);
      overlays.push({ values: od.values, colorIdx: ci });
    });
  }

  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var w = canvas.clientWidth;
  var h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  var green = '#00e676';
  var greenDim = 'rgba(0,230,118,0.15)';
  var gridClr = '#1e261e';
  var txtClr = '#3a443a';
  var vals = data.values;
  var lbls = data.labels;
  var isPct = data.isPercent;
  var n = vals.length;
  if (n === 0) return;

  var padL = 32, padR = 6, padT = 6, padB = 16;
  var cW = w - padL - padR;
  var cH = h - padT - padB;

  var posVals = vals.map(function (v) { return v < 0 ? 0 : v; });
  var maxV = isPct ? 100 : Math.max.apply(null, posVals);

  // scale Y-axis to fit overlays too
  overlays.forEach(function (o) {
    var oMax = Math.max.apply(null, o.values);
    if (oMax > maxV) maxV = oMax;
  });
  if (maxV === 0) maxV = 1;

  // grid lines
  ctx.strokeStyle = gridClr;
  ctx.lineWidth = 1;
  var gridN = 4;
  for (var i = 0; i <= gridN; i++) {
    var gy = padT + (cH / gridN) * i;
    ctx.beginPath();
    ctx.moveTo(padL, Math.round(gy) + 0.5);
    ctx.lineTo(w - padR, Math.round(gy) + 0.5);
    ctx.stroke();
  }

  // Y-axis labels
  ctx.font = '9px Inconsolata, monospace';
  ctx.fillStyle = txtClr;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (var i = 0; i <= gridN; i++) {
    var v = Math.round(maxV * (gridN - i) / gridN);
    ctx.fillText(isPct ? v + '%' : v.toLocaleString(), padL - 4, padT + (cH / gridN) * i);
  }

  // bar geometry
  var gap = Math.max(1, Math.round(cW / n * 0.15));
  var barW = Math.max(2, (cW - gap * (n + 1)) / n);

  // primary bars
  for (var i = 0; i < n; i++) {
    var v = posVals[i];
    var noData = vals[i] < 0;
    var barH = maxV > 0 ? (v / maxV) * cH : 0;
    var x = padL + gap + i * (barW + gap);
    var y = padT + cH - barH;

    if (noData) {
      ctx.fillStyle = gridClr;
      ctx.fillRect(x, padT, barW, cH);
    } else if (v > 0) {
      ctx.fillStyle = greenDim;
      ctx.fillRect(x, padT, barW, cH);
      ctx.fillStyle = green;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, barW, barH);
      ctx.globalAlpha = 1;
    }
  }

  // overlay line+dot series
  overlays.forEach(function (o) {
    var clr = ENG_OVERLAY_COLORS[o.colorIdx] || ENG_OVERLAY_COLORS[0];
    var ov = o.values;

    // line
    ctx.beginPath();
    ctx.strokeStyle = clr.line;
    ctx.lineWidth = 1.5;
    var started = false;
    for (var i = 0; i < n; i++) {
      var v = ov[i] || 0;
      var cx = padL + gap + i * (barW + gap) + barW / 2;
      var cy = padT + cH - (maxV > 0 ? (v / maxV) * cH : 0);
      if (!started) { ctx.moveTo(cx, cy); started = true; }
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // dots
    ctx.fillStyle = clr.dot;
    for (var i = 0; i < n; i++) {
      var v = ov[i] || 0;
      var cx = padL + gap + i * (barW + gap) + barW / 2;
      var cy = padT + cH - (maxV > 0 ? (v / maxV) * cH : 0);
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // X-axis labels
  ctx.fillStyle = txtClr;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  var maxLabels = Math.floor(cW / 36);
  var every = Math.max(1, Math.ceil(n / maxLabels));
  for (var i = 0; i < n; i += every) {
    var x = padL + gap + i * (barW + gap) + barW / 2;
    ctx.fillText(lbls[i], x, padT + cH + 3);
  }
}

// ---- bar row helper (for job breakdown) ----
function engineDetailBarRow(label, val, maxVal) {
  var pct = maxVal > 0 ? Math.min(100, (val / maxVal) * 100) : 0;
  return '<div class="eng-detail-row">'
    + '<div class="eng-detail-row-label">' + label + '</div>'
    + '<div class="eng-detail-row-bar"><div class="eng-detail-row-bar-fill" style="width:' + Math.round(pct) + '%"></div></div>'
    + '<div class="eng-detail-row-val">' + val.toLocaleString() + '</div>'
    + '</div>';
}

// ---- job breakdown helper ----
function engineDetailJobBreakdown(stages, pStart, pEnd) {
  var jobMap = {};
  var ps = pStart.getTime(), pe = pEnd.getTime();
  S.jobs.forEach(function (j) {
    if (!j || isJobArchived(j)) return;
    var total = 0;
    (j.progressLog || []).forEach(function (e) {
      if (!e || !e.timestamp || stages.indexOf(e.stage) === -1) return;
      var t = new Date(e.timestamp).getTime();
      if (t < ps || t >= pe) return;
      total += Math.max(0, parseInt(e.qty, 10) || 0);
    });
    if (total > 0) jobMap[j.title || j.id] = total;
  });
  var entries = Object.keys(jobMap).map(function (k) { return { name: k, qty: jobMap[k] }; });
  entries.sort(function (a, b) { return b.qty - a.qty; });
  if (entries.length === 0) return '';
  var maxJob = entries[0].qty;
  var html = '';
  entries.forEach(function (e) {
    var name = e.name.length > 18 ? e.name.slice(0, 17) + '…' : e.name;
    html += engineDetailBarRow(name, e.qty, maxJob);
  });
  return html;
}

// ---- context bar module ----

function engContextRow(label, value, maxVal, primary, fmt) {
  var pct = maxVal > 0 ? Math.min(100, (value / maxVal) * 100) : 0;
  var cls = primary ? 'eng-ctx-primary' : 'eng-ctx-ref';
  return '<div class="eng-ctx-row ' + cls + '">'
    + '<div class="eng-ctx-label">' + label + '</div>'
    + '<div class="eng-ctx-bar"><div class="eng-ctx-fill" style="width:' + Math.round(pct) + '%"></div></div>'
    + '<div class="eng-ctx-val">' + (fmt || value.toLocaleString()) + '</div>'
    + '</div>';
}

function engContextStageData(stages) {
  var now = new Date();
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var tomorrow = new Date(todayStart.getTime() + 864e5);
  var d30Start = new Date(todayStart.getTime() - 30 * 864e5);
  var ps = d30Start.getTime(), pe = tomorrow.getTime();

  var dayMap = {};
  S.jobs.forEach(function (j) {
    if (!j || isJobArchived(j)) return;
    (j.progressLog || []).forEach(function (e) {
      if (!e || !e.timestamp || stages.indexOf(e.stage) === -1) return;
      var t = new Date(e.timestamp).getTime();
      if (t < ps || t >= pe) return;
      var dk = new Date(e.timestamp).toISOString().slice(0, 10);
      dayMap[dk] = (dayMap[dk] || 0) + Math.max(0, parseInt(e.qty, 10) || 0);
    });
  });

  var todayKey = todayStart.toISOString().slice(0, 10);
  var todayVal = dayMap[todayKey] || 0;

  var sum7 = 0;
  for (var i = 1; i <= 7; i++) {
    var dk = new Date(todayStart.getTime() - i * 864e5).toISOString().slice(0, 10);
    sum7 += dayMap[dk] || 0;
  }

  var sum30 = 0;
  for (var i = 1; i <= 30; i++) {
    var dk = new Date(todayStart.getTime() - i * 864e5).toISOString().slice(0, 10);
    sum30 += dayMap[dk] || 0;
  }

  var peakVal = 0, peakDate = '';
  Object.keys(dayMap).forEach(function (dk) {
    if (dayMap[dk] > peakVal) {
      peakVal = dayMap[dk];
      var dt = new Date(dk + 'T12:00:00');
      peakDate = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  });

  return { today: todayVal, avg7: sum7 / 7, avg30: sum30 / 30, peak: peakVal, peakDate: peakDate };
}

function engContextStageHTML(stages) {
  var c = engContextStageData(stages);
  var maxBar = Math.max(c.today, c.avg7, c.avg30, c.peak, 1);
  var html = '<div class="eng-detail-section">'
    + '<div class="eng-detail-section-title">CONTEXT</div>';
  html += engContextRow('TODAY', c.today, maxBar, true);
  html += engContextRow('7D AVG', Math.round(c.avg7), maxBar, false);
  html += engContextRow('30D AVG', Math.round(c.avg30), maxBar, false);
  if (c.peak > 0) {
    html += engContextRow('PEAK · ' + c.peakDate, c.peak, maxBar, false);
  }
  html += '</div>';
  return html;
}

function engContextYieldData() {
  var now = new Date();
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var tomorrow = new Date(todayStart.getTime() + 864e5);
  var d30Start = new Date(todayStart.getTime() - 30 * 864e5);
  var ps = d30Start.getTime(), pe = tomorrow.getTime();

  var passMap = {}, rejMap = {};
  S.jobs.forEach(function (j) {
    if (!j || isJobArchived(j)) return;
    (j.progressLog || []).forEach(function (e) {
      if (!e || !e.timestamp) return;
      var t = new Date(e.timestamp).getTime();
      if (t < ps || t >= pe) return;
      var dk = new Date(e.timestamp).toISOString().slice(0, 10);
      var q = Math.max(0, parseInt(e.qty, 10) || 0);
      if (e.stage === 'qc_passed') passMap[dk] = (passMap[dk] || 0) + q;
      else if (e.stage === 'rejected') rejMap[dk] = (rejMap[dk] || 0) + q;
    });
  });

  function yld(dk) {
    var p = passMap[dk] || 0, r = rejMap[dk] || 0;
    return (p + r) > 0 ? (p / (p + r)) * 100 : null;
  }

  var todayKey = todayStart.toISOString().slice(0, 10);
  var todayYield = yld(todayKey);

  var s7 = 0, n7 = 0;
  for (var i = 1; i <= 7; i++) {
    var y = yld(new Date(todayStart.getTime() - i * 864e5).toISOString().slice(0, 10));
    if (y !== null) { s7 += y; n7++; }
  }

  var s30 = 0, n30 = 0;
  for (var i = 1; i <= 30; i++) {
    var y = yld(new Date(todayStart.getTime() - i * 864e5).toISOString().slice(0, 10));
    if (y !== null) { s30 += y; n30++; }
  }

  var peakYield = null, peakDate = '';
  var allDays = {};
  Object.keys(passMap).forEach(function (d) { allDays[d] = true; });
  Object.keys(rejMap).forEach(function (d) { allDays[d] = true; });
  Object.keys(allDays).forEach(function (dk) {
    var y = yld(dk);
    if (y !== null && (peakYield === null || y > peakYield)) {
      peakYield = y;
      var dt = new Date(dk + 'T12:00:00');
      peakDate = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  });

  return {
    today: todayYield,
    avg7: n7 > 0 ? s7 / n7 : null,
    avg30: n30 > 0 ? s30 / n30 : null,
    peak: peakYield,
    peakDate: peakDate
  };
}

function engContextYieldHTML() {
  var c = engContextYieldData();
  var vals = [c.today, c.avg7, c.avg30, c.peak].filter(function (v) { return v !== null; });
  if (vals.length === 0) return '';
  var maxBar = 100;
  function fmt(v) { return v !== null ? v.toFixed(1) + '%' : '—'; }
  var html = '<div class="eng-detail-section">'
    + '<div class="eng-detail-section-title">CONTEXT</div>';
  html += engContextRow('TODAY', c.today !== null ? c.today : 0, maxBar, true, fmt(c.today));
  if (c.avg7 !== null) html += engContextRow('7D AVG', c.avg7, maxBar, false, fmt(c.avg7));
  if (c.avg30 !== null) html += engContextRow('30D AVG', c.avg30, maxBar, false, fmt(c.avg30));
  if (c.peak !== null) html += engContextRow('PEAK · ' + c.peakDate, c.peak, maxBar, false, fmt(c.peak));
  html += '</div>';
  return html;
}

// ---- stage detail (QPM, PRESSED, QC PASSED, REJECTED, PACKED) ----
function renderEngineDetailStage(key, m, numEl, w) {
  var d = getEngineData(S.jobs, w.start, w.end);
  var total = 0;
  m.stages.forEach(function (s) {
    if (s === 'shipped') total += d.shipped;
    else if (s === 'picked_up') total += d.pickedUp;
    else if (s === 'pressed') total += d.pressed;
    else if (s === 'qc_passed') total += d.qcPassed;
    else if (s === 'rejected') total += d.rejected;
    else if (s === 'packed') total += d.packed;
    else if (s === 'ready') total += d.ready;
    else if (s === 'held') total += d.held;
  });
  numEl.textContent = total.toLocaleString();

  var html = engChartSectionHTML('TREND');

  html += engContextStageHTML(m.stages);

  var jobHTML = engineDetailJobBreakdown(m.stages, w.start, w.end);
  if (jobHTML) {
    html += '<div class="eng-detail-section">'
      + '<div class="eng-detail-section-title">BY JOB</div>'
      + jobHTML + '</div>';
  }

  return html;
}

// ---- yield detail ----
function renderEngineDetailYield(numEl, w) {
  var d = getEngineData(S.jobs, w.start, w.end);
  var denom = d.qcPassed + d.rejected;
  var pct = denom > 0 ? ((d.qcPassed / denom) * 100) : null;
  numEl.textContent = pct !== null ? pct.toFixed(1) + '%' : '—';

  var html = '<div class="eng-detail-section">'
    + '<div class="eng-detail-section-title">BREAKDOWN</div>';
  if (denom > 0) {
    html += engineDetailBarRow('PASSED', d.qcPassed, denom);
    html += engineDetailBarRow('REJECTED', d.rejected, denom);
  } else {
    html += '<div class="eng-detail-empty">No QC data in this period</div>';
  }
  html += '</div>';

  html += engChartSectionHTML('DAILY YIELD');

  html += engContextYieldHTML();

  return html;
}

// ---- live snapshot details (no chart) ----
function renderEngineDetailLiveReady(numEl) {
  var active = S.jobs.filter(function (j) { return !isJobArchived(j) && j.status !== 'done'; });
  var total = 0;
  var jobs = [];
  active.forEach(function (j) {
    var p = getJobProgress(j);
    if (p.ready > 0) {
      total += p.ready;
      jobs.push({ name: j.title || j.id, qty: p.ready });
    }
  });
  numEl.textContent = total.toLocaleString();
  jobs.sort(function (a, b) { return b.qty - a.qty; });

  if (jobs.length === 0) return '<div class="eng-detail-empty">No units currently staged</div>';
  var maxJob = jobs[0].qty;
  var html = '<div class="eng-detail-section">'
    + '<div class="eng-detail-section-title">BY JOB · LIVE</div>';
  jobs.forEach(function (e) {
    var name = e.name.length > 18 ? e.name.slice(0, 17) + '…' : e.name;
    html += engineDetailBarRow(name, e.qty, maxJob);
  });
  html += '</div>';
  return html;
}

function renderEngineDetailOrderBook(numEl) {
  var active = S.jobs.filter(function (j) { return !isJobArchived(j) && j.status !== 'done'; });
  var total = 0;
  var jobs = [];
  active.forEach(function (j) {
    var q = Math.max(0, parseInt(j.qty, 10) || 0);
    total += q;
    if (q > 0) jobs.push({ name: j.title || j.id, qty: q });
  });
  numEl.textContent = total.toLocaleString();
  jobs.sort(function (a, b) { return b.qty - a.qty; });

  if (jobs.length === 0) return '<div class="eng-detail-empty">No active orders</div>';
  var maxJob = jobs[0].qty;
  var html = '<div class="eng-detail-section">'
    + '<div class="eng-detail-section-title">BY JOB · ' + active.length + ' ACTIVE</div>';
  jobs.forEach(function (e) {
    var name = e.name.length > 18 ? e.name.slice(0, 17) + '…' : e.name;
    html += engineDetailBarRow(name, e.qty, maxJob);
  });
  html += '</div>';
  return html;
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
    const blockers = activeJobs.filter(j => (j.status || '').toLowerCase() === 'hold' || isJobCautioned(j)).length + S.presses.filter(p => p.status === 'offline').length;

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
      const assetObj = e.assetKey && job.assets && job.assets[e.assetKey];
      const isCaution = !!(e.assetKey && assetObj && typeof getAssetStatus === 'function' && getAssetStatus(assetObj) === 'caution');
      const cautionIcon = isCaution ? '<span class="notes-entry-caution-icon" aria-hidden="true">\u26A0\uFE0E</span> ' : '';
      const assetHtml = asset ? `<div style="font-size:10px;color:var(--d3);text-align:right;margin-bottom:2px;">${cautionIcon}${escapeHtml(asset)}</div>` : '';
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
      (job.notesLog || []).forEach(e => {
        const assetObj = e.assetKey && job.assets && job.assets[e.assetKey];
        const isCautionAsset = !!(e.assetKey && assetObj && typeof getAssetStatus === 'function' && getAssetStatus(assetObj) === 'caution');
        entries.push({
          jobId: job.id,
          catalog: job.catalog || '',
          artist: job.artist || '',
          album: job.album || '',
          text: e.text,
          person: e.person,
          timestamp: e.timestamp,
          assetLabel: e.assetLabel || null,
          assetKey: e.assetKey || null,
          attachment_url: e.attachment_url || null,
          attachment_name: e.attachment_name || null,
          attachment_type: e.attachment_type || null,
          attachment_thumb: e.attachment_thumb || null,
          attachment_thumb_url: e.attachment_thumb_url || null,
          isCautionAsset: isCautionAsset,
        });
      });
    }
    }
  } else {
    allJobs.forEach(job => {
      ensureNotesLog(job);
      (job.notesLog || []).forEach(e => {
        const assetObj = e.assetKey && job.assets && job.assets[e.assetKey];
        const isCautionAsset = !!(e.assetKey && assetObj && typeof getAssetStatus === 'function' && getAssetStatus(assetObj) === 'caution');
        entries.push({
          jobId: job.id,
          catalog: job.catalog || '',
          artist: job.artist || '',
          album: job.album || '',
          text: e.text,
          person: e.person,
          timestamp: e.timestamp,
          assetLabel: e.assetLabel || null,
          assetKey: e.assetKey || null,
          attachment_url: e.attachment_url || null,
          attachment_name: e.attachment_name || null,
          attachment_type: e.attachment_type || null,
          attachment_thumb: e.attachment_thumb || null,
          attachment_thumb_url: e.attachment_thumb_url || null,
          isCautionAsset: isCautionAsset,
        });
      });
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
        const cautionIcon = e.isCautionAsset ? '<span class="notes-entry-caution-icon" aria-hidden="true">\u26A0\uFE0E</span> ' : '';
        const assetHtml = asset ? `<div class="notes-entry-asset">${cautionIcon}${escapeHtml(asset)}</div>` : '';
        const rowCls = e.jobId === '!ALERT' ? ' notes-row-alert' : '';
        var noteThumbSrc = e.attachment_thumb_url || e.attachment_url;
        const thumbHtml = e.attachment_url
          ? '<div class="notes-entry-thumb" role="button" tabindex="0" data-src="' + escapeHtml(e.attachment_url) + '" onclick="openPoImageLightbox(this.getAttribute(\'data-src\'))" title="View image"><img src="' + escapeHtml(noteThumbSrc) + '" alt="" loading="lazy"></div>'
          : '';
        const inner = '<div class="notes-entry-job"><span class="notes-entry-cat">' + cat + '</span> <span class="notes-entry-artist">' + artist + '</span></div><div class="notes-entry-text">' + escapeHtml(e.text) + '</div>' + assetHtml + '<div class="notes-entry-meta">' + meta + '</div>';
        return '<div class="progress-entry' + rowCls + '"><div class="progress-entry-inner">' + inner + '</div>' + thumbHtml + '</div>';
      }).join('');

  const addAllowed = !!selectedId && (selectedId !== '!ALERT' || ((window.PMP?.userProfile?.email || '').toLowerCase().includes('piper') || (window.PMP?.userProfile?.display_name || '').toLowerCase().includes('piper')));
  if (addBtn) addBtn.classList.toggle('is-disabled', !addAllowed);
  if (addRow) addRow.style.display = (selectedId && S.notesUtilityOpen === 'add') ? '' : 'none';
  if (searchRow) searchRow.style.display = (S.notesUtilityOpen === 'search') ? '' : 'none';
  if (searchBtn) searchBtn.classList.toggle('active', S.notesUtilityOpen === 'search');
}
