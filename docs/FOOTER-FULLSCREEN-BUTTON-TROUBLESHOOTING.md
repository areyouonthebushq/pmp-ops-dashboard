# Footer & fullscreen button — troubleshooting (no code changes)

## 1. How wide is the footer?

**In code, the footer is full viewport width.**

- The footer is the element with class **`.syncbar`** (in `index.html` around line 404).
- In `styles.css` (lines 1612–1621), `.syncbar` has:
  - `position: fixed; bottom: 0; left: 0; right: 0;`
- So its width is from the left edge of the viewport to the right edge. No `width`, `max-width`, or `min-width` is set on `.syncbar`, so it spans the full screen.
- It lives in the DOM inside `#app`, but `#app` only has `position: relative` (line 333). For `position: fixed`, the containing block is the viewport unless an ancestor has `transform`, `perspective`, `filter`, or `will-change`. None of those are on `#app` or `body`, so the sync bar is laid out relative to the viewport and is full width.

So: **the footer is intended to be the same width as the screen.** If it ever looks narrower, something is overriding or the wrong assets are being served.

---

## 2. Why the FULLSCREEN button might still be on the left

Possible causes, in order of likelihood:

### A. Cached HTML (most likely)

- If the **served** `index.html` is an older version where the FULLSCREEN button was **inside** `.syncbar-left` (e.g. the button as a child of the left div), then the button will lay out with the left block and appear on the left (or under the sync text).
- **Current source** (correct): `.syncbar` has two direct children — (1) `div.syncbar-left` (status + version), (2) `button.syncbar-fullscreen-btn`. So the button is a **sibling** of the left block, not inside it.
- **Check:** In DevTools → Elements, expand the footer. You should see:
  - `div.syncbar`
    - `div.syncbar-left` → spans + text
    - `button.syncbar-fullscreen-btn`
  If the button is **inside** `div.syncbar-left`, the HTML you’re running is old/cached.

### B. Cached CSS

- If the **served** `styles.css` is old, it might be missing:
  - `.syncbar`: `display: flex; flex-wrap: nowrap; justify-content: space-between;`
  - `.syncbar-left`: `flex: 0 1 auto; min-width: 0;`
  - `.syncbar-fullscreen-btn`: `flex: 0 0 auto; margin-left: auto;`
- Without these, the button won’t be pushed to the right.
- **Check:** In DevTools → Elements → select `.syncbar` → Styles panel. Confirm the rules above are present and not overridden (no strikethrough). Then select the button and confirm `margin-left: auto` and the flex rules.

### C. Service worker cache

- `sw.js` (lines 5–6) uses `CACHE_NAME = 'pmp-ops-shell-v1'` and caches `/index.html` and `/styles.css`.
- Navigate and fetch requests can be fulfilled from this cache, so a hard refresh might still load old HTML/CSS if the SW is serving from cache.
- **Check:** DevTools → Application → Service Workers. See if a worker is controlling the page. Then Application → Cache Storage → open `pmp-ops-shell-v1` (or the active cache name) and inspect `index.html` / `styles.css` (e.g. open and search for "syncbar-fullscreen" and "syncbar-left" in the cached HTML, and for "margin-left: auto" in the cached CSS).

### D. Deploy / branch / build

- If you’re testing a **deployed** URL (e.g. Vercel), the live site might be from an older commit or a different branch that doesn’t have the footer layout changes.
- **Check:** Compare the deployed `index.html` and `styles.css` with your local files (e.g. “View Page Source” and “Sources” or Network tab for the CSS file). Confirm the DOM structure and the same CSS rules as in repo.

### E. Browser or proxy cache

- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) usually bypasses browser cache for that tab, but extensions or corporate proxies can still serve old assets.
- **Check:** Network tab → reload → look at `index.html` and `styles.css`. If they show “from disk cache” or “from service worker”, you’re still on cached resources. Try in a private/incognito window or another browser with no extensions.

### F. Overriding CSS (unlikely in this repo)

- There is no other selector in this codebase that sets `.syncbar` or `.syncbar-fullscreen-btn` width/flex/display in a way that would force the button left. The only extra rule is `body.theme-minimal .syncbar { box-shadow: none; }`, which doesn’t affect layout.
- If you have browser extensions or user styles that alter layout, disable them and test again.

---

## 3. Step-by-step checks (no code changes)

Do these in order and note what you see:

1. **DOM structure**
   - Open DevTools → Elements.
   - Find the footer bar at the bottom (the element with class `syncbar`).
   - Confirm:
     - `.syncbar` has exactly two direct children: `div.syncbar-left` and `button.syncbar-fullscreen-btn`.
     - The button is **not** inside `div.syncbar-left`.
   - If the button is inside `.syncbar-left`, the problem is **cached or wrong HTML** (A or D).

2. **Computed width of the footer**
   - With `.syncbar` selected, open Computed (or Styles → “computed” values).
   - Check `width`. It should equal the viewport width (e.g. same as `document.documentElement.clientWidth` in the console).
   - If it’s much smaller, something is constraining the footer (e.g. a different or overridden CSS rule, or an ancestor creating a new containing block).

3. **Computed styles on the button**
   - Select the FULLSCREEN button (`.syncbar-fullscreen-btn`).
   - In Computed, confirm:
     - `margin-left` is `auto` (or the used value that pushes it right).
     - `display` is not overridden in a way that breaks flex (e.g. still a flex item).
   - In Styles, confirm no other rule is overriding `margin-left` or the flex rules with higher specificity or a strikethrough.

4. **Where HTML and CSS are coming from**
   - Network tab → reload page.
   - Click the request for `index.html` and for `styles.css`. Check:
     - Status (200, 304, etc.).
     - “Size” or “Source”: “from memory cache”, “from disk cache”, “from service worker”, or a byte size (from network).
   - If either is “from service worker” or “from … cache”, that explains stale layout.

5. **Service worker and cache**
   - Application → Service Workers: note if the page is controlled by a worker; if so, note the script URL and “Update on reload” state.
   - Application → Cache Storage: open the cache used by the SW and, if possible, view the cached `index.html` and `styles.css` and compare with the current repo (structure and fullscreen/syncbar rules).

6. **Local vs deployed**
   - If the issue is only on the **deployed** site, compare:
     - Deployed `index.html` (View Page Source) vs local `index.html` (footer structure).
     - Deployed `styles.css` (open the URL in a new tab or from Network) vs local `styles.css` (syncbar and fullscreen button rules).
   - If they differ, the fix is to deploy the current branch/commit and/or purge CDN cache and unregister/update the service worker so the next load gets the new HTML and CSS.

---

## 4. Summary

| Question | Answer |
|----------|--------|
| How wide is the footer? | Full viewport width in code (`position: fixed; left: 0; right: 0` on `.syncbar`). |
| Can it be same width as screen? | It is specified to be; if it isn’t, you’re seeing cached or overridden assets. |
| Why is the button still on the left after hard refresh? | Most likely: old/cached `index.html` (button inside `.syncbar-left`) or old/cached `styles.css` (missing flex / `margin-left: auto`), often due to service worker or deploy. |
| What to do without changing code? | Follow the checks above: verify DOM structure, computed width of `.syncbar`, computed styles on the button, and whether HTML/CSS are from cache or SW; then fix deploy/cache/SW so the live site serves the current HTML and CSS. |

No code changes were made in this troubleshooting; it only explains how the footer is supposed to work and how to find why the fullscreen button is still on the left.
