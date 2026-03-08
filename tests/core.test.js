import { describe, it, expect } from 'vitest';
import { getJobProgress, jobFieldsHash, findDuplicateJob, assetHealth, nextStatus, STATUS_ORDER } from '../lib/core.js';

describe('getJobProgress', () => {
  it('returns zeros for empty job', () => {
    const p = getJobProgress({ qty: '500', progressLog: [] });
    expect(p).toEqual({ ordered: 500, pressed: 0, qcPassed: 0, rejected: 0, pendingQC: 0 });
  });

  it('sums pressed entries', () => {
    const p = getJobProgress({
      qty: '1000',
      progressLog: [
        { qty: 25, stage: 'pressed', person: 'A', timestamp: '' },
        { qty: 50, stage: 'pressed', person: 'B', timestamp: '' },
      ]
    });
    expect(p.pressed).toBe(75);
    expect(p.pendingQC).toBe(75);
  });

  it('calculates pendingQC correctly', () => {
    const p = getJobProgress({
      qty: '500',
      progressLog: [
        { qty: 100, stage: 'pressed', person: 'A', timestamp: '' },
        { qty: 60, stage: 'qc_passed', person: 'B', timestamp: '' },
        { qty: 10, stage: 'rejected', person: 'C', timestamp: '' },
      ]
    });
    expect(p.pressed).toBe(100);
    expect(p.qcPassed).toBe(60);
    expect(p.rejected).toBe(10);
    expect(p.pendingQC).toBe(30);
  });

  it('handles missing qty gracefully', () => {
    const p = getJobProgress({ progressLog: [] });
    expect(p.ordered).toBe(0);
  });

  it('handles missing progressLog', () => {
    const p = getJobProgress({ qty: '100' });
    expect(p.pressed).toBe(0);
  });
});

describe('jobFieldsHash', () => {
  it('produces consistent hash', () => {
    const job = { status: 'pressing', press: 'PRESS 1', qty: '500', notes: '', assembly: '', location: 'Bay 1', due: '2026-04-01', progressLog: [1,2,3] };
    const h1 = jobFieldsHash(job);
    const h2 = jobFieldsHash(job);
    expect(h1).toBe(h2);
  });

  it('changes when status changes', () => {
    const base = { status: 'pressing', press: '', qty: '', notes: '', assembly: '', location: '', due: '', progressLog: [] };
    const h1 = jobFieldsHash(base);
    const h2 = jobFieldsHash({ ...base, status: 'done' });
    expect(h1).not.toBe(h2);
  });
});

describe('findDuplicateJob', () => {
  const jobs = [
    { id: 'j1', catalog: 'LUNLP3108', artist: 'Luna', album: 'Eclipse', status: 'pressing' },
    { id: 'j2', catalog: 'SUNLP001', artist: 'Solar', album: 'Dawn', status: 'queue' },
  ];

  it('finds duplicate by catalog (case insensitive)', () => {
    const dupes = findDuplicateJob(jobs, 'lunlp3108', '', '');
    expect(dupes.length).toBe(1);
    expect(dupes[0].id).toBe('j1');
  });

  it('finds duplicate by artist+album', () => {
    const dupes = findDuplicateJob(jobs, '', 'luna', 'eclipse');
    expect(dupes.length).toBe(1);
  });

  it('requires both artist AND album to match', () => {
    const dupes = findDuplicateJob(jobs, '', 'luna', 'Different Album');
    expect(dupes.length).toBe(0);
  });

  it('excludes specified ID', () => {
    const dupes = findDuplicateJob(jobs, 'LUNLP3108', '', '', 'j1');
    expect(dupes.length).toBe(0);
  });

  it('returns empty for no match', () => {
    const dupes = findDuplicateJob(jobs, 'NOMATCH', '', '');
    expect(dupes.length).toBe(0);
  });
});

describe('nextStatus', () => {
  it('cycles through statuses', () => {
    expect(nextStatus('queue')).toBe('pressing');
    expect(nextStatus('pressing')).toBe('assembly');
    expect(nextStatus('assembly')).toBe('hold');
    expect(nextStatus('hold')).toBe('done');
    expect(nextStatus('done')).toBe('queue');
  });
});

describe('assetHealth', () => {
  const defs = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];

  it('returns 0% for no assets', () => {
    const h = assetHealth({ assets: {} }, defs);
    expect(h.done).toBe(0);
    expect(h.total).toBe(3);
    expect(h.pct).toBe(0);
  });

  it('counts received assets', () => {
    const h = assetHealth({ assets: { a: { received: true }, b: { received: false } } }, defs);
    expect(h.done).toBe(1);
    expect(h.total).toBe(3);
  });

  it('excludes N/A assets from total', () => {
    const h = assetHealth({ assets: { a: { received: true }, c: { na: true } } }, defs);
    expect(h.done).toBe(1);
    expect(h.total).toBe(2);
    expect(h.pct).toBe(0.5);
  });
});
