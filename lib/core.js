// lib/core.js — Pure business logic, extracted for testing.
// app.js is global-scope vanilla JS; this module is kept in sync manually for unit tests.

export function getJobProgress(job) {
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

export function jobFieldsHash(job) {
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

export function findDuplicateJob(jobs, catalog, artist, album, excludeId) {
  return jobs.filter(j => {
    if (excludeId && j.id === excludeId) return false;
    if (catalog && j.catalog && j.catalog.toUpperCase() === catalog.toUpperCase()) return true;
    if (artist && album && j.artist && j.album &&
        j.artist.toLowerCase() === artist.toLowerCase() &&
        j.album.toLowerCase() === album.toLowerCase()) return true;
    return false;
  });
}

export function assetHealth(job, assetDefs) {
  const applicable = assetDefs.filter(a => !job.assets || job.assets[a.key]?.na !== true);
  const done = applicable.filter(a => job.assets && job.assets[a.key]?.received);
  return { done: done.length, total: applicable.length, pct: applicable.length ? done.length / applicable.length : 0 };
}

export const STATUS_ORDER = ['queue', 'pressing', 'assembly', 'hold', 'done'];

export function nextStatus(current) {
  const cur = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(cur + 1) % STATUS_ORDER.length];
}
