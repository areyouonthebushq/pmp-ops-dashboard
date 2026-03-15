# DEV Notes Duplicate Cleanup + Delete (Console)

Run in browser DevTools on the DEV page. State key in this app is **`S.devNotes`** (camelCase). Persist with **`Storage.saveDevNotes()`** (local only; see Supabase note below).

---

## 1. Count duplicates (preview only)

```javascript
// Count duplicates — changes nothing
(() => {
  const notes = S.devNotes || [];
  const seen = new Set();
  const dupes = [];
  notes.forEach((n, i) => {
    const key = (n.text || '').trim() + '|||' + (n.entity || '') + '|||' + (n.stage || '') + '|||' + (n.type || '');
    if (seen.has(key)) dupes.push({ index: i, text: (n.text || '').slice(0, 60), person: n.person });
    else seen.add(key);
  });
  console.log('Total notes: ' + notes.length);
  console.log('Duplicates found: ' + dupes.length);
  console.table(dupes);
})();
```

---

## 2. Remove duplicates (keeps first occurrence, removes later copies)

```javascript
// Remove duplicates — keeps FIRST of each unique note
(() => {
  const notes = S.devNotes || [];
  const seen = new Set();
  const cleaned = [];
  let removed = 0;
  notes.forEach(n => {
    const key = (n.text || '').trim() + '|||' + (n.entity || '') + '|||' + (n.stage || '') + '|||' + (n.type || '');
    if (seen.has(key)) { removed++; }
    else { seen.add(key); cleaned.push(n); }
  });
  S.devNotes = cleaned;
  Storage.saveDevNotes();
  if (typeof renderDevPage === 'function') renderDevPage();
  console.log('Removed ' + removed + ' duplicates. ' + cleaned.length + ' notes remain.');
})();
```

- Dedup key: `text + entity + stage + type`. Same text with different tags stays as separate notes.
- **Local storage:** `Storage.saveDevNotes()` writes the cleaned array; it persists.
- **Supabase:** `Storage.saveDevNotes()` is a no-op. Cleaning only affects in-memory `S.devNotes`; the next fetch from the `dev_notes` table will overwrite with server data. To remove duplicates permanently with Supabase, you’d need to delete duplicate rows in the `dev_notes` table (e.g. via SQL or a small admin script), then refetch.
