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
      outer: job.outer || null,
      cpl: job.cpl || null,
      notes: job.notes || null,
      assembly: job.assembly || null,
      inv_date: job.invDate || null,
      deposit: job.deposit || null,
      inv2: job.inv2 || null,
      pay2: job.pay2 || null,
      assets: job.assets || {},
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
      outer: row.outer,
      cpl: row.cpl,
      notes: row.notes,
      assembly: row.assembly,
      invDate: row.inv_date,
      deposit: row.deposit,
      inv2: row.inv2,
      pay2: row.pay2,
      assets: row.assets || {},
      progressLog: [],
    };
    return job;
  }

  function progressRowToEntry(row) {
    return {
      qty: row.qty,
      stage: row.stage,
      person: row.person,
      timestamp: row.timestamp,
    };
  }

  function pressToRow(p) {
    return { id: p.id, name: p.name, type: p.type, status: p.status, job_id: p.job || null };
  }

  function rowToPress(row) {
    return { id: row.id, name: row.name, type: row.type, status: row.status, job: row.job_id };
  }

  function todoToRow(t, category) {
    return { id: t.id, category, text: t.text, done: !!t.done, who: t.who || '', sort_order: 0 };
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

    async loadAllData() {
      const client = getClient();
      const [jobsRes, progressRes, pressesRes, todosRes, qcRes] = await Promise.all([
        client.from('jobs').select('*').order('created_at', { ascending: true }),
        client.from('progress_log').select('*').order('timestamp', { ascending: true }),
        client.from('presses').select('*'),
        client.from('todos').select('*').order('sort_order', { ascending: true }),
        client.from('qc_log').select('*').order('created_at', { ascending: false }),
      ]);

      const jobs = (jobsRes.data || []).map(rowToJob);
      const progressLogs = progressRes.data || [];
      progressLogs.forEach((row) => {
        const job = jobs.find((j) => j.id === row.job_id);
        if (job) {
          if (!job.progressLog) job.progressLog = [];
          job.progressLog.push(progressRowToEntry(row));
        }
      });
      jobs.forEach((j) => { if (!Array.isArray(j.progressLog)) j.progressLog = []; });

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

      return { jobs, presses, todos, qcLog };
    },

    async saveJob(job) {
      const client = getClient();
      const row = jobToRow(job);
      const { error } = await client.from('jobs').upsert(row, { onConflict: 'id' });
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
      const { error } = await client.from('progress_log').insert(row);
      if (error) throw error;
    },

    async logQC(entry) {
      const client = getClient();
      const row = { time: entry.time, type: entry.type, job: entry.job, date: entry.date };
      const { error } = await client.from('qc_log').insert(row);
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
  };
})();
