# Competitive Evidence Corpus

Status: **CURRENT AUTHORITY** — persistent home for competitor research and
product audits. Feeds the
[`../product/COMPETITIVE_PRODUCT_LAB.md`](../product/COMPETITIVE_PRODUCT_LAB.md)
workflow. Findings live here, not in chat history.

## Layout

```text
docs/competitive/
    README.md                        ← you are here
    sources/                         ← per-competitor evidence (atomic claims)
        dragons-of-atlantis.md
        reign-of-atlantis.md
    audits/                          ← dated campaign analyses
        dragonwake-current-product.md
        blind-playtest.md
        competitor-analysis.md
        visual-gap-analysis.md
        feature-gap-analysis.md
    matrices/                        ← reusable comparison instruments
        feature-matrix.md
        experience-matrix.md
        visual-benchmark-matrix.md
    roadmap/
        player-product-roadmap.md    ← active campaign gate sequence
    evidence/
        README.md                    ← capture, storage & copyright policy
        dragonwake/                  ← curated durable reference captures only
                                       (raw run artifacts live in delivery/evidence/<RUN_ID>/)
```

## Rules

1. **Every competitor claim carries provenance**: source, URL, access
   date, game/version, claim supported, and evidence confidence
   (`VERIFIED` / `STRONG_EVIDENCE` / `PARTIAL_EVIDENCE` / `ANECDOTAL` /
   `UNKNOWN`). Historical DoA claims follow the stricter labels in
   [`../design/DOA_REFERENCE_MODEL.md`](../design/DOA_REFERENCE_MODEL.md).
   Never invent historical mechanics.
2. **No copyrighted competitor asset dumps.** See
   [`evidence/README.md`](evidence/README.md) before committing captures.
3. **Audits are dated campaign records; matrices are living instruments.**
   Update matrices in place; append to audits (or create dated files)
   rather than rewriting history.
4. **Relation to design authorities.** Nothing here changes product
   direction. Historical DoA evidence is governed by
   [`../design/DOA_REFERENCE_MODEL.md`](../design/DOA_REFERENCE_MODEL.md);
   translation dispositions by
   [`../design/DOA_PARITY_MATRIX.md`](../design/DOA_PARITY_MATRIX.md); the
   conflict-resolution stack by
   [`../design/CANON_AUTHORITY.md`](../design/CANON_AUTHORITY.md). This
   corpus adds *player-experience and competitor-parity evidence* to that
   stack, not new canon.
5. Existing experience-comparison work
   ([`../design/DOA_EXPERIENCE_PARITY_MATRIX.md`](../design/DOA_EXPERIENCE_PARITY_MATRIX.md))
   remains valid; the matrices here extend it with the four-dimension
   model rather than replacing it.

## Current campaign

DoA → Reign → DragonWake → vertical slice:
[`roadmap/player-product-roadmap.md`](roadmap/player-product-roadmap.md).
