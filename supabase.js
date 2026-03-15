/**
 * PMP OPS — Supabase API layer
 * Expects window.SUPABASE_URL and window.SUPABASE_ANON_KEY to be set before this script runs.
 * Load after: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 */
(function () {
  'use strict';

  let supabase = null;

  function getClient() {
    if (!supabase) throw new Error('Supabase not initialized. Call initSupabase() first.');
    return supabase;
  }

  function jobToRow(job) {
    const qty = job.qty != null ? parseInt(job.qty, 10) : null;
    return {
      id: job.id,
      catalog: job.catalog || null,
      artist: job.artist || null,
      album: job.album || null,
      invoice: job.invoice || null,
      status: job.status || 'queue',
      due: job.due || null,
      press: job.press || null,
      client: job.client || null,
      email: job.email || null,
      location: job.location || null,
      last_contact: job.lastContact || null,
      format: job.format || null,
      vinyl_type: job.vinylType || null,
      qty: Number.isInteger(qty) ? qty : null,
      weight: job.weight || null,
      color: job.color || null,
      specialty: job.specialty || null,
      label_type: job.labelType || null,
      sleeve: job.sleeve || null,
      jacket: job.jacket || null,
      outer_pkg: job.outer_pkg || null,
      cpl: job.cpl || null,
      notes: job.notes || null,
      assembly: job.assembly || null,
      inv_date: job.invDate || null,
      deposit: job.deposit || null,
      inv2: job.inv2 || null,
      pay2: job.pay2 || null,
      assets: job.assets || {},
      archived_at: job.archived_at || null,
      archived_by: job.archived_by || null,
      archive_reason: job.archive_reason || null,
      po_contract: (job.poContract && typeof job.poContract === 'object') ? job.poContract : {},
      notes_log: Array.isArray(job.notesLog) ? job.notesLog : [],
      assembly_log: Array.isArray(job.assemblyLog) ? job.assemblyLog : [],
      fulfillment_phase: job.fulfillment_phase || null,
      caution: (job.caution && typeof job.caution === 'object' && job.caution.reason) ? job.caution : null,
      pack_card: (job.packCard && typeof job.packCard === 'object') ? job.packCard : null,
    };
  }

  function rowToJob(row) {
    if (!row) return null;
    const job = {
      id: row.id,
      catalog: row.catalog,
      artist: row.artist,
      album: row.album,
      invoice: row.invoice,
      status: row.status,
      due: row.due,
      press: row.press,
      client: row.client,
      email: row.email,
      location: row.location,
      lastContact: row.last_contact,
      format: row.format,
      vinylType: row.vinyl_type,
      qty: row.qty != null ? String(row.qty) : '',
      weight: row.weight,
      color: row.color,
      specialty: row.specialty,
      labelType: row.label_type,
      sleeve: row.sleeve,
      jacket: row.jacket,
      outer_pkg: row.outer_pkg,
      cpl: row.cpl,
      notes: row.notes,
      assembly: row.assembly,
      notesLog: Array.isArray(row.notes_log) ? row.notes_log : [],
      assemblyLog: Array.isArray(row.assembly_log) ? row.assembly_log : [],
      invDate: row.inv_date,
      deposit: row.deposit,
      inv2: row.inv2,
      pay2: row.pay2,
      assets: row.assets || {},
      progressLog: [],
      archived_at: row.archived_at || null,
      archived_by: row.archived_by || null,
      archive_reason: row.archive_reason || null,
      poContract: (row.po_contract && typeof row.po_contract === 'object') ? row.po_contract : {},
      fulfillment_phase: row.fulfillment_phase || null,
      caution: (row.caution && typeof row.caution === 'object' && row.caution.reason) ? row.caution : null,
      packCard: (row.pack_card && typeof row.pack_card === 'object') ? row.pack_card : null,
    };
    return job;
  }

  function progressRowToEntry(row) {
    return {
      qty: row.qty,
      stage: row.stage,
      person: row.person,
      timestamp: row.timestamp,
      asset_key: row.asset_key || null,
    };
  }

  function pressToRow(p) {
    return { id: p.id, name: p.name, type: p.type, status: p.status, job_id: p.job_id || p.job || null, on_deck_job_id: p.on_deck_job_id || null };
  }

  function rowToPress(row) {
    return { id: row.id, name: row.name, type: row.type, status: row.status, job_id: row.job_id, on_deck_job_id: row.on_deck_job_id || null };
  }

  function employeeToRow(e) {
    return {
      id: e.id,
      name: e.name || '',
      role: (e.role != null && e.role !== '') ? String(e.role) : null,
      phone: (e.phone != null && e.phone !== '') ? String(e.phone) : null,
      email: (e.email != null && e.email !== '') ? String(e.email) : null,
      specialty: (e.specialty != null && e.specialty !== '') ? String(e.specialty) : null,
      photo_url: (e.photo_url != null && e.photo_url !== '') ? String(e.photo_url) : null,
      notes: (e.notes != null && e.notes !== '') ? String(e.notes) : null,
      active: e.active !== false,
    };
  }

  function rowToEmployee(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name || '',
      role: row.role != null ? String(row.role) : '',
      phone: row.phone != null ? String(row.phone) : '',
      email: row.email != null ? String(row.email) : '',
      specialty: row.specialty != null ? String(row.specialty) : '',
      photo_url: (row.photo_url != null && row.photo_url !== '') ? String(row.photo_url) : '',
      notes: row.notes != null ? String(row.notes) : '',
      active: row.active !== false,
    };
  }

  function scheduleEntryToRow(entry) {
    return {
      id: entry.id,
      employee_id: entry.employee_id || '',
      date: entry.date || null,
      shift_label: (entry.shift_label != null && entry.shift_label !== '') ? String(entry.shift_label) : null,
      area: (entry.area != null && entry.area !== '') ? String(entry.area) : null,
      notes: (entry.notes != null && entry.notes !== '') ? String(entry.notes) : null,
      sort_order: typeof entry.sort_order === 'number' ? entry.sort_order : 0,
    };
  }

  function rowToScheduleEntry(row) {
    if (!row) return null;
    const d = row.date;
    return {
      id: row.id,
      employee_id: row.employee_id || '',
      date: d != null ? (typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)) : '',
      shift_label: row.shift_label != null ? String(row.shift_label) : '',
      area: row.area != null ? String(row.area) : '',
      notes: row.notes != null ? String(row.notes) : '',
      sort_order: typeof row.sort_order === 'number' ? row.sort_order : 0,
    };
  }

  function todoToRow(t, category) {
    return { id: t.id, category, text: t.text, done: !!t.done, who: t.who || '', sort_order: 0 };
  }

  /** Returns the Supabase client when initialized. Throws if not inited (use after initSupabase() === true). */
  function getClientOrNull() {
    return supabase || null;
  }

  window.PMP = window.PMP || {};
  window.PMP.Supabase = {
    initSupabase() {
      if (supabase) return true;
      const url = window.SUPABASE_URL;
      const key = window.SUPABASE_ANON_KEY;
      if (!url || !key) {
        console.warn('PMP Supabase: SUPABASE_URL or SUPABASE_ANON_KEY not set. Using localStorage fallback.');
        return false;
      }
      if (typeof window.supabase === 'undefined') {
        console.warn('PMP Supabase: @supabase/supabase-js not loaded.');
        return false;
      }
      supabase = window.supabase.createClient(url, key);
      return true;
    },

    /** Auth: get current session. Safe when Supabase not inited (returns null session). */
    async getSession() {
      if (window.PMP_GUEST_MODE) return { data: { session: null }, error: null };
      if (!supabase) return { data: { session: null }, error: null };
      return supabase.auth.getSession();
    },

    /** Auth: sign in with email/password. Call only when initSupabase() === true. */
    async signInWithPassword(email, password) {
      if (window.PMP_GUEST_MODE) return { data: { user: null, session: null }, error: null };
      const client = getClient();
      return client.auth.signInWithPassword({ email, password });
    },

    /** Auth: sign out. Call only when initSupabase() === true. */
    async signOut() {
      if (window.PMP_GUEST_MODE) return;
      const client = getClient();
      return client.auth.signOut();
    },

    /** Auth: subscribe to session changes. Call only when initSupabase() === true. */
    onAuthStateChange(callback) {
      if (window.PMP_GUEST_MODE) return;
      const client = getClient();
      return client.auth.onAuthStateChange(callback);
    },

    /** Fetch profile for user (id = auth.uid()). Includes role and assigned_press_id for RLS/UI. */
    async getProfile(userId) {
      if (window.PMP_GUEST_MODE) return { data: null, error: null };
      if (!supabase) return { data: null, error: new Error('Supabase not initialized') };
      const { data, error } = await supabase.from('profiles').select('id, email, display_name, role, assigned_press_id').eq('id', userId).maybeSingle();
      return { data, error };
    },

    /** Returns the client when inited, null otherwise. Use for auth checks without throwing. */
    getClientOrNull() {
      return getClientOrNull();
    },

    async loadAllData() {
      const client = getClient();
      const [jobsRes, progressRes, pressesRes, todosRes, qcRes, devRes, compoundsRes, channelsRes, employeesRes, scheduleRes] = await Promise.all([
        client.from('jobs').select('*').order('created_at', { ascending: true }),
        client.from('progress_log').select('*').order('timestamp', { ascending: true }),
        client.from('presses').select('*'),
        client.from('todos').select('*').order('sort_order', { ascending: true }),
        client.from('qc_log').select('*').order('created_at', { ascending: false }),
        client.from('dev_notes').select('*').order('timestamp', { ascending: true }),
        client.from('compounds').select('*').order('created_at', { ascending: true }),
        client.from('notes_channels').select('*'),
        client.from('employees').select('*').order('name', { ascending: true }),
        client.from('schedule_entries').select('*').order('date', { ascending: false }).order('sort_order', { ascending: true }),
      ]);

      const jobs = (jobsRes.data || []).map(rowToJob);
      const jobMap = new Map();
      jobs.forEach((j) => { j.progressLog = []; jobMap.set(j.id, j); });
      const progressLogs = progressRes.data || [];
      progressLogs.forEach((row) => {
        const job = jobMap.get(row.job_id);
        if (job) job.progressLog.push(progressRowToEntry(row));
      });

      const presses = (pressesRes.data || []).map(rowToPress);
      const todoRows = todosRes.data || [];
      const todos = { daily: [], weekly: [], standing: [] };
      todoRows.forEach((row) => {
        const item = { id: row.id, text: row.text, done: row.done, who: row.who || '' };
        if (row.category === 'daily') todos.daily.push(item);
        else if (row.category === 'weekly') todos.weekly.push(item);
        else if (row.category === 'standing') todos.standing.push(item);
      });

      const qcLog = (qcRes.data || []).map((row) => ({
        time: row.time,
        type: row.type,
        job: row.job,
        date: row.date,
      }));

      const devNotes = (devRes.data || []).map((row) => ({
        id: row.id || null,
        area: row.area || '',
        stage: row.stage != null ? String(row.stage) : '',
        type: row.type != null ? String(row.type) : '',
        entity: row.entity != null ? String(row.entity) : '',
        text: row.text || '',
        person: row.person || '',
        timestamp: row.timestamp || null,
        imported: row.imported || false,
      }));

      const compounds = (compoundsRes.data || []).map((row) => ({
        id: row.id,
        number: row.number != null ? String(row.number) : '',
        code_name: (row.code_name != null ? String(row.code_name) : '') || (row.name != null ? String(row.name) : ''),
        amount_on_hand: (row.amount_on_hand != null ? String(row.amount_on_hand) : '') || (row.stock != null ? String(row.stock) : ''),
        color: row.color != null ? String(row.color) : '',
        notes: row.notes != null ? String(row.notes) : '',
        imageUrl: (row.image_url != null && row.image_url !== '') ? String(row.image_url) : '',
      }));

      const notesChannels = {};
      (channelsRes.data || []).forEach((row) => {
        if (!row || !row.id) return;
        notesChannels[row.id] = Array.isArray(row.log) ? row.log : [];
      });

      const employees = (employeesRes.data || []).map(rowToEmployee);
      const scheduleEntries = (scheduleRes.data || []).map(rowToScheduleEntry);

      return { jobs, presses, todos, qcLog, devNotes, compounds, notesChannels, employees, scheduleEntries };
    },

    async saveJob(job) {
      const client = getClient();
      const row = jobToRow(job);
      const { error } = await client.from('jobs').upsert(row, { onConflict: 'id' });
      if (error) throw error;
    },

    /** Update only the assets column for a job (avoids full-row upsert / schema mismatch). */
    async updateJobAssets(jobId, assets) {
      const client = getClient();
      const payload = assets && typeof assets === 'object' ? assets : {};
      const { error } = await client.from('jobs').update({ assets: payload }).eq('id', jobId);
      if (error) throw error;
    },

    async deleteJob(id) {
      const client = getClient();
      const { error } = await client.from('jobs').delete().eq('id', id);
      if (error) throw error;
    },

    async savePresses(presses) {
      const client = getClient();
      const rows = presses.map(pressToRow);
      const { error } = await client.from('presses').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    },

    async saveTodos(todos) {
      const client = getClient();
      const rows = [];
      ['daily', 'weekly', 'standing'].forEach((cat) => {
        (todos[cat] || []).forEach((t, i) => rows.push({ ...todoToRow(t, cat), sort_order: i }));
      });
      if (rows.length === 0) return;
      const { error } = await client.from('todos').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    },

    async logProgress(entry) {
      const client = getClient();
      const row = {
        job_id: entry.job_id,
        qty: entry.qty,
        stage: entry.stage,
        person: entry.person || 'Unknown',
        timestamp: entry.timestamp || new Date().toISOString(),
      };
      if (entry.asset_key != null && entry.asset_key !== '') row.asset_key = entry.asset_key;
      const { error } = await client.from('progress_log').insert(row);
      if (error) throw error;
    },

    async logQC(entry) {
      const client = getClient();
      const row = { time: entry.time, type: entry.type, job: entry.job, date: entry.date };
      const { error } = await client.from('qc_log').insert(row);
      if (error) throw error;
    },

    async logDevNote(entry) {
      const client = getClient();
      const row = {
        area: entry.area,
        text: entry.text,
        person: entry.person || 'Unknown',
        timestamp: entry.timestamp || new Date().toISOString(),
        stage: entry.stage != null ? entry.stage : null,
        type: entry.type != null ? entry.type : null,
        entity: entry.entity != null ? entry.entity : null,
      };
      if (entry.id) row.id = entry.id;
      const { error } = await client.from('dev_notes').insert(row);
      if (error) throw error;
    },

    async deleteDevNote(id) {
      const client = getClient();
      const { error } = await client.from('dev_notes').delete().eq('id', id);
      if (error) throw error;
    },

    async saveAll(state) {
      const client = getClient();
      for (const job of state.jobs || []) {
        await this.saveJob(job);
      }
      if (state.presses && state.presses.length) await this.savePresses(state.presses);
      if (state.todos) await this.saveTodos(state.todos);
    },

    /**
     * Subscribe to Realtime postgres_changes for jobs, presses, todos, progress_log, qc_log.
     * Callback is invoked when any of these tables change (INSERT/UPDATE/DELETE).
     * Tables must be in the supabase_realtime publication (see docs).
     * @param {function()} onChange - Called when a change is received (no payload args; use for refetch).
     * @returns {function()} unsubscribe - Call to remove the subscription and release the channel.
     */
    subscribeRealtime(onChange) {
      const client = getClient();
      const channel = client
        .channel('pmp-ops-data')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'presses' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'progress_log' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'qc_log' }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes_channels' }, onChange)
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') console.warn('[PMP] Realtime channel error');
        });
      return function unsubscribe() {
        client.removeChannel(channel);
      };
    },

    async saveNotesChannels(channels) {
      const client = getClient();
      const rows = Object.entries(channels || {}).map(([id, log]) => ({
        id,
        log: Array.isArray(log) ? log : [],
      }));
      if (!rows.length) return;
      const { error } = await client.from('notes_channels').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    },

    /**
     * Fetch audit log (admin only; RLS enforces). For minimal UI or export.
     * @param {Object} opts - { limit?: number, table_name?: string, entity_id?: string, since?: string (ISO date) }
     */
    /** PO image: bucket and path convention. Path = {jobId}/po.jpg. Requires bucket "po-images" (public read, auth write). */
    getPoImagePath(jobId) {
      if (!jobId) return null;
      return jobId + '/po.jpg';
    },

    async uploadPoImage(jobId, blobs) {
      if (!jobId || !blobs || !blobs.full) throw new Error('Invalid job or image data');
      const client = getClient();
      const fullPath = this.getPoImagePath(jobId);
      const thumbPath = fullPath.replace('.jpg', '_thumb.jpg');
      const { error } = await client.storage.from('po-images').upload(fullPath, blobs.full, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = client.storage.from('po-images').getPublicUrl(fullPath);
      var result = { path: fullPath, url: data.publicUrl };
      try {
        await client.storage.from('po-images').upload(thumbPath, blobs.thumb, { upsert: true, contentType: 'image/jpeg' });
        var td = client.storage.from('po-images').getPublicUrl(thumbPath);
        result.thumbUrl = td.data.publicUrl;
      } catch (e) { console.warn('[PMP] PO thumb upload failed, continuing with full only', e); }
      return result;
    },

    async deletePoImage(path) {
      if (!path) return;
      const client = getClient();
      const { error } = await client.storage.from('po-images').remove([path]);
      if (error) throw error;
    },

    /** Compound color image: path = compounds/{compoundId}/color.jpg. Same bucket as PO. */
    getCompoundImagePath(compoundId) {
      if (!compoundId) return null;
      return 'compounds/' + compoundId + '/color.jpg';
    },
    async uploadCompoundImage(compoundId, blobs) {
      if (!compoundId || !blobs || !blobs.full) throw new Error('Invalid compound or image data');
      const client = getClient();
      const fullPath = this.getCompoundImagePath(compoundId);
      const thumbPath = fullPath.replace('.jpg', '_thumb.jpg');
      const { error } = await client.storage.from('po-images').upload(fullPath, blobs.full, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = client.storage.from('po-images').getPublicUrl(fullPath);
      var result = { path: fullPath, url: data.publicUrl };
      try {
        await client.storage.from('po-images').upload(thumbPath, blobs.thumb, { upsert: true, contentType: 'image/jpeg' });
        var td = client.storage.from('po-images').getPublicUrl(thumbPath);
        result.thumbUrl = td.data.publicUrl;
      } catch (e) { console.warn('[PMP] Compound thumb upload failed, continuing with full only', e); }
      return result;
    },

    /** Crew photo: path = crew/{employeeId}/photo.jpg. Same bucket as PO. */
    getCrewPhotoPath(employeeId) {
      if (!employeeId) return null;
      return 'crew/' + employeeId + '/photo.jpg';
    },
    async uploadCrewPhoto(employeeId, blobs) {
      if (!employeeId || !blobs || !blobs.full) throw new Error('Invalid employee or image data');
      const client = getClient();
      const fullPath = this.getCrewPhotoPath(employeeId);
      const thumbPath = fullPath.replace('.jpg', '_thumb.jpg');
      const { error } = await client.storage.from('po-images').upload(fullPath, blobs.full, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = client.storage.from('po-images').getPublicUrl(fullPath);
      var result = { path: fullPath, url: data.publicUrl };
      try {
        await client.storage.from('po-images').upload(thumbPath, blobs.thumb, { upsert: true, contentType: 'image/jpeg' });
        var td = client.storage.from('po-images').getPublicUrl(thumbPath);
        result.thumbUrl = td.data.publicUrl;
      } catch (e) { console.warn('[PMP] Crew thumb upload failed, continuing with full only', e); }
      return result;
    },

    /** Note attachment: path = notes/{timestamp}_{id}.jpg. Uses po-images bucket. */
    async uploadNoteAttachment(blobs) {
      if (!blobs || !blobs.full) throw new Error('Invalid image data');
      const client = getClient();
      const basePath = 'notes/' + Date.now() + '_' + Math.random().toString(36).slice(2, 9) + '.jpg';
      const thumbPath = basePath.replace('.jpg', '_thumb.jpg');
      const { error } = await client.storage.from('po-images').upload(basePath, blobs.full, { upsert: false, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = client.storage.from('po-images').getPublicUrl(basePath);
      var result = { path: basePath, url: data.publicUrl };
      try {
        await client.storage.from('po-images').upload(thumbPath, blobs.thumb, { upsert: false, contentType: 'image/jpeg' });
        var td = client.storage.from('po-images').getPublicUrl(thumbPath);
        result.thumbUrl = td.data.publicUrl;
      } catch (e) { console.warn('[PMP] Note thumb upload failed, continuing with full only', e); }
      return result;
    },

    async getAuditLog(opts = {}) {
      const client = getClient();
      let q = client
        .from('audit_log_with_actor')
        .select('id, table_name, entity_id, action, changed_by, changed_by_email, changed_by_display_name, occurred_at, changed_fields, old_values, new_values')
        .order('occurred_at', { ascending: false });
      if (opts.limit != null) q = q.limit(Math.min(Math.max(1, opts.limit), 500));
      if (opts.table_name) q = q.eq('table_name', opts.table_name);
      if (opts.entity_id) q = q.eq('entity_id', opts.entity_id);
      if (opts.since) q = q.gte('occurred_at', opts.since);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },

    async saveCompounds(compounds) {
      const client = getClient();
      const rows = (compounds || []).map((c) => ({
        id: c.id,
        number: (c.number != null && c.number !== '') ? String(c.number) : null,
        code_name: (c.code_name != null && c.code_name !== '') ? String(c.code_name) : null,
        amount_on_hand: (c.amount_on_hand != null && c.amount_on_hand !== '') ? String(c.amount_on_hand) : null,
        color: (c.color != null && c.color !== '') ? String(c.color) : null,
        notes: (c.notes != null && c.notes !== '') ? String(c.notes) : null,
        name: String(c.code_name != null ? c.code_name : (c.name != null ? c.name : '')),
        stock: (c.amount_on_hand != null && c.amount_on_hand !== '') ? String(c.amount_on_hand) : null,
        image_url: (c.imageUrl != null && c.imageUrl !== '') ? String(c.imageUrl) : null,
      }));
      if (!rows.length) return;
      const { error } = await client.from('compounds').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    },

    async saveEmployees(employees) {
      const client = getClient();
      const rows = (employees || []).map(employeeToRow);
      if (!rows.length) return;
      const { error } = await client.from('employees').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    },

    async saveScheduleEntries(entries) {
      const client = getClient();
      const rows = (entries || []).map(scheduleEntryToRow);
      if (!rows.length) return;
      const { error } = await client.from('schedule_entries').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    },
  };
})();
