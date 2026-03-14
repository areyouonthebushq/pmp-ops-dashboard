# Image Pipeline — Spec

**Date**: 2026-03-06
**Priority**: P2
**Type**: Spec (no implementation)
**Source**: Elegance Audit §4, Performance Audit §Image Strategy

---

## Premise

Every image in PMP OPS is currently uploaded raw, stored raw, and downloaded raw — regardless of display size. A 4000×3000 DSLR photo occupies the same bytes whether it fills a lightbox or a 36px crew avatar. There is no resize, no compression, no thumbnail, and no file-size guard. This spec defines a minimal, incremental pipeline that fixes payload without inventing a media service.

---

## Current State

### One bucket, four paths

All images live in a single Supabase Storage bucket: `po-images`.

| Type | Storage path | URL field | Display sizes | Cache-bust |
|------|-------------|-----------|--------------|------------|
| PO images | `{jobId}/po.{ext}` | `job.poContract.imageUrl` + `.imagePath` | 200px panel preview, full lightbox | `?t=Date.now()` |
| Crew photos | `crew/{employeeId}/photo.{ext}` | `employee.photo_url` | 36×36 CSS circle | `?t=Date.now()` |
| Compound images | `compounds/{compoundId}/color.{ext}` | `compound.imageUrl` | 40×40 CSS circle | `?t=Date.now()` |
| Note attachments | `notes/{timestamp}_{random}.{ext}` | `note.attachment_url` | 28×28 thumb, full lightbox | None |

### What's wrong

1. **No file-size limit.** A 20MB upload succeeds silently.
2. **No client-side resize.** The raw file goes to Supabase as-is.
3. **No thumbnails.** Crew avatars (36px) download multi-megabyte originals.
4. **No lazy loading** on crew/compound images (CSS `background-image`).
5. **Cache-bust in database.** `?t=Date.now()` is appended to URLs and stored permanently, defeating browser and CDN caching across sessions.

---

## Recommended Image Model

### Two sizes, one resize step

Every uploaded image produces two stored files:

| Size | Name | Max dimension | Quality | Use |
|------|------|--------------|---------|-----|
| **Full** | `{path}.{ext}` | 1200px longest edge | 85% JPEG | Lightbox, panel preview, full-view |
| **Thumb** | `{path}_thumb.{ext}` | 200px longest edge | 70% JPEG | Avatars, list thumbnails, feed entries |

Both are generated **client-side before upload** using a `<canvas>` resize. No server-side processing required. No new infrastructure.

### Why client-side

- Supabase Storage does not run server-side transforms on the free/pro tier.
- Client-side `<canvas>` resize is well-supported, synchronous enough for single images, and adds zero backend complexity.
- A ~30-line helper function handles both sizes.

### Output format

All resized images are output as JPEG regardless of input format. PNGs with transparency are rare in this domain (PO contracts, crew headshots, vinyl compound colors, note photos). JPEG at 85%/70% provides the best size-to-quality tradeoff for photographic content.

Exception: if the input is already ≤200KB and ≤1200px, skip resize and upload as-is. No need to re-encode small images.

---

## Per-Image-Type Rules

### PO Images

| Aspect | Rule |
|--------|------|
| Max upload size | 10MB (client-side check before resize) |
| Full size | 1200px longest edge, 85% JPEG |
| Thumb size | 200px longest edge, 70% JPEG |
| Storage path (full) | `{jobId}/po.jpg` |
| Storage path (thumb) | `{jobId}/po_thumb.jpg` |
| Panel preview | Uses **thumb** (displayed at max-height 200px) |
| Lightbox | Uses **full** (loaded on-demand when user taps to view) |
| JOBS LIVE star tooltip | Uses **thumb** if tooltip ever shows a preview |
| URL fields | `job.poContract.imageUrl` (full), `job.poContract.thumbUrl` (thumb), `job.poContract.imagePath` (storage path, no change) |

### Crew Photos

| Aspect | Rule |
|--------|------|
| Max upload size | 5MB |
| Full size | 1200px longest edge, 85% JPEG |
| Thumb size | 200px longest edge, 70% JPEG |
| Storage path (full) | `crew/{employeeId}/photo.jpg` |
| Storage path (thumb) | `crew/{employeeId}/photo_thumb.jpg` |
| Crew table (36px circle) | Uses **thumb** |
| Lightbox (if added) | Uses **full** |
| URL fields | `employee.photo_url` (full), `employee.thumb_url` (thumb) |

### Compound Images

| Aspect | Rule |
|--------|------|
| Max upload size | 5MB |
| Full size | 1200px longest edge, 85% JPEG |
| Thumb size | 200px longest edge, 70% JPEG |
| Storage path (full) | `compounds/{compoundId}/color.jpg` |
| Storage path (thumb) | `compounds/{compoundId}/color_thumb.jpg` |
| Compound list (40px circle) | Uses **thumb** |
| Lightbox | Uses **full** |
| URL fields | `compound.imageUrl` (full), `compound.thumbUrl` (thumb) |

### Note Attachments

| Aspect | Rule |
|--------|------|
| Max upload size | 10MB |
| Full size | 1200px longest edge, 85% JPEG |
| Thumb size | 200px longest edge, 70% JPEG |
| Storage path (full) | `notes/{timestamp}_{random}.jpg` |
| Storage path (thumb) | `notes/{timestamp}_{random}_thumb.jpg` |
| Notes feed (28px) | Uses **thumb** |
| Lightbox on click | Uses **full** |
| URL fields | `note.attachment_url` (full), `note.attachment_thumb_url` (thumb) |

---

## Upload Flow (All Types)

```
User selects file
  → Client checks file.size (reject if over limit, toast error)
  → Client loads image into <canvas>
  → Canvas resizes to 1200px max → export as JPEG blob at 0.85 → "full"
  → Canvas resizes to 200px max → export as JPEG blob at 0.70 → "thumb"
  → Upload full to Storage at {path}.jpg
  → Upload thumb to Storage at {path}_thumb.jpg
  → Store both URLs (without ?t= cache-bust) in the data model
  → Render
```

If the original is already ≤200KB and ≤1200px:
- Skip canvas resize for full (upload original)
- Still generate thumb (it will be tiny)

### Resize Helper Shape

One function, used by all four upload handlers:

```
resizeImage(file, maxDim, quality) → Promise<Blob>
```

Each upload handler calls it twice (once for full, once for thumb), then uploads both blobs. The helper is ~30 lines using `<canvas>` and `toBlob()`.

---

## Caching Strategy

### Problem: `?t=Date.now()` stored in database

Three of four upload paths append `?t=Date.now()` to the public URL before storing it. This means:
- Every browser session downloads the image fresh (different `?t=` values are never seen before)
- CDN edge caching is defeated
- The cache-bust parameter is permanently baked into the database

### Fix

1. **Stop appending `?t=` on new uploads.** Store the clean public URL. Supabase Storage returns stable public URLs. The file content at a given path is immutable (we use `upsert: true`, so the path is reused but the content changes).

2. **Use path versioning instead.** When a user replaces an image (e.g., re-uploads a crew photo), the new file overwrites the same path. To bust the browser cache, append `?v={uploadedAt}` where `uploadedAt` is the ISO timestamp already stored in the data model (e.g., `job.poContract.uploadedAt`). This is deterministic — the same upload produces the same URL — so browser caching works across tabs and sessions until the image actually changes.

3. **Existing `?t=` URLs remain valid.** Supabase ignores query parameters on public URLs. No migration needed for stored URLs — they will continue to work. New uploads simply won't have the `?t=` suffix.

---

## Display Changes

### Crew / Compound: Switch from CSS `background-image` to `<img>`

Currently, crew avatars and compound thumbnails use inline CSS `background-image`. This prevents native `loading="lazy"` and makes it harder to swap between thumb and full URLs.

**Recommendation**: Switch to `<img>` tags with `loading="lazy"`, `width`/`height` attributes, and `object-fit: cover` + `border-radius: 50%` for the circle crop. This enables:
- Native lazy loading (no IntersectionObserver needed)
- Declarative `src` swap between thumb and full
- Better accessibility (`alt` text)

### Lightbox: Progressive Load (blur-up)

When the user taps to view full size:
1. Show the **thumb** immediately in the lightbox container (already cached by the browser from the list view)
2. Load the **full** image in the background
3. Swap `src` to full when loaded
4. Optional: apply a CSS `filter: blur(4px)` to the thumb during loading, remove on swap

This eliminates the current "blank lightbox while loading" problem.

---

## Data / Storage Implications

### New fields

| Entity | New field | Type | Default |
|--------|-----------|------|---------|
| `job.poContract` | `thumbUrl` | `string` | `undefined` |
| `employee` | `thumb_url` | `string \| null` | `null` |
| `compound` | `thumbUrl` | `string` | `''` |
| `note` (in notesLog) | `attachment_thumb_url` | `string` | `undefined` |

All new fields are **optional and additive**. Existing images without thumb fields are valid — the display layer falls back to the full URL.

### Database migration

**None required.** The new fields appear organically when an image is uploaded after the pipeline ships. Existing records are unaffected.

### Storage cost

Each image now stores 2 files instead of 1. But the combined size is dramatically smaller:

| Scenario | Before (raw upload) | After (full + thumb) |
|----------|--------------------|--------------------|
| 4000×3000 crew photo (3.5MB JPEG) | 3.5MB | ~180KB full + ~8KB thumb = **188KB** |
| 3000×2000 PO contract (2.1MB) | 2.1MB | ~150KB full + ~7KB thumb = **157KB** |
| 1200×900 note photo (800KB) | 800KB | ~120KB full + ~6KB thumb = **126KB** |

Typical storage savings: **85-95% per image.** The doubled file count is negligible.

---

## Backward Compatibility

### Existing images (no thumb URL)

When `thumbUrl` / `thumb_url` / `attachment_thumb_url` is missing or empty, the display layer uses the **full URL** as fallback. This is identical to current behavior — no visual regression for old images.

```
src = note.attachment_thumb_url || note.attachment_url
```

### Existing `?t=` URLs

Already addressed in Caching Strategy above. Old URLs keep working. New URLs drop the `?t=` suffix.

### Gradual rollout

As users re-upload or upload new images, they naturally get the new pipeline (resized full + thumb). Old images remain as-is until replaced. No bulk migration, no batch processing, no one-time script.

### Optional: backfill script (later, not v1)

If old images cause persistent payload problems after the pipeline ships, a one-time script could:
1. Download each full-size image from Storage
2. Resize to 200px thumb
3. Upload thumb to `{path}_thumb.{ext}`
4. Update the database record with `thumbUrl`

This is deferred. The organic rollout handles the 80% case.

---

## Implementation Order

| Phase | What | Effort | Impact |
|-------|------|--------|--------|
| **Phase 1** | `resizeImage()` helper + wire into all 4 upload handlers + file-size guard | 2-3 hours | Stops the bleeding — no more multi-MB uploads |
| **Phase 2** | Dual upload (full + thumb) + store `thumbUrl` fields | 1-2 hours | Thumbnails exist for new images |
| **Phase 3** | Display layer: use `thumbUrl` in crew/compound/notes lists | 1-2 hours | Page payload drops dramatically |
| **Phase 4** | Progressive lightbox (blur-up from thumb to full) | 1 hour | Eliminates blank-lightbox UX |
| **Phase 5** | Switch crew/compound from `background-image` to `<img loading="lazy">` | 1 hour | Lazy loading for free |
| **Phase 6** | Remove `?t=Date.now()` from upload paths + use `?v={uploadedAt}` | 30 min | Cross-session caching works |

**Phases 1-3 are the core.** Phases 4-6 are polish.

---

## What This Spec Does NOT Cover

- Server-side image transforms (Supabase Image Transforms, Cloudflare Image Resizing, etc.)
- Video uploads or processing
- Image deletion cleanup (orphaned thumbs)
- Image format conversion beyond JPEG (WebP, AVIF)
- Batch re-optimization of existing images (deferred to optional backfill)
- Content moderation or NSFW detection

These are explicitly out of scope. The goal is a practical client-side pipeline, not a media service.
