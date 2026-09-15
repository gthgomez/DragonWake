# Audit — Feature Gap Analysis

Status: **TEMPLATE — not yet run for the current campaign.**

Mechanism-level gap list (what competitors let players DO that DragonWake
does not, and vice versa). This is deliberately separate from the visual
gap analysis: a feature can exist here while being absent there, and
mechanism gaps are prioritized differently from presentation gaps.

Inputs: [`../sources/`](../sources/) claim files + the white-box
implementation inventory
([`dragonwake-current-product.md`](dragonwake-current-product.md)).
Translation dispositions (preserve/modernize/expand/reinterpret/reject)
remain the job of
[`../../design/DOA_PARITY_MATRIX.md`](../../design/DOA_PARITY_MATRIX.md) —
this audit informs it, never overrides it.

## Template

```markdown
# Feature gap analysis — <campaign, date>

| Mechanism | DoA (claim id) | Reign (claim id) | DragonWake state | Gap class | Work class |
| --- | --- | --- | --- | --- | --- |

Gap class: MISSING / INCOMPLETE / UNDISCOVERABLE / LACKS CONTENT /
LACKS VISUALIZATION / LACKS FEEDBACK / BADLY PACED / NONE (parity or ahead)
— reuse the root-cause table,
[`../../product/COMPETITIVE_PRODUCT_LAB.md`](../../product/COMPETITIVE_PRODUCT_LAB.md) §4.

Work class: code / asset / content / route-to-authority-stack.
```
