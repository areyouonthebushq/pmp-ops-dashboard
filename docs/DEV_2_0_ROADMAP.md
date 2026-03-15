# DEV 2.0 Roadmap

**Status:** Reference for stage / work type / entity model  
**Used by:** dev-2.0-console-spec.md

---

## Entity Model

**12 entities**, 4×3 grid. Semantic row grouping:

- **Row 1 — Primary surfaces (main nav):** FLOOR, JOBS, LOG, NOTES  
- **Row 2 — Object/detail/backstage:** CARD, RSP, EXCEPTION, DEV  
- **Row 3 — Secondary/utility:** ENGINE, CREW, PVC, AUDIT  

Entity set: `floor`, `jobs`, `log`, `notes`, `card`, `rsp`, `exception`, `dev`, `engine`, `crew`, `pvc`, `audit`.

**EXCEPTION:** The ACHTUNG/WRENCH exception protocol system. Use for protocol-level work; use specific surface entities (CARD, RSP) for surface-specific exception behavior.
