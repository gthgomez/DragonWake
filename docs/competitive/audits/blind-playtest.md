# Audit — Blind Playtest Record

Status: **TEMPLATE — no blind playtest recorded for the current campaign
yet.** Gate 2 of
[`../roadmap/player-product-roadmap.md`](../roadmap/player-product-roadmap.md).

Run per [`../../product/FTUE_PLAYTEST_PROTOCOL.md`](../../product/FTUE_PLAYTEST_PROTOCOL.md)
and [`../../product/prompts/blind-player-playtest.md`](../../product/prompts/blind-player-playtest.md).
One dated section per session; never overwrite a previous record.

## Template

```markdown
## Blind playtest — <date> (<build/commit>, <viewport>)

- Tester: <fresh subagent/session id> — repository-isolated: YES/NO
- Session length: <mm> min · Fast-time: YES/NO

### Seven answers (verbatim)
1..7

### EXPERIENCE TRACE
| TIME | ACTION | EXPECTATION | WHAT HAPPENED | INTERPRETATION | FRICTION | POSITIVE | REF | SEVERITY |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Screenshot Test notes (per surface visited)
<surface>: understood fantasy/importance/interactability/maturity? Y/N/partial
```

Raw captures go to `delivery/evidence/<RUN_ID>/` (with the run manifest);
selected captures are promoted to
[`../evidence/dragonwake/`](../evidence/dragonwake/) only after a verdict
uses them — see
[`../evidence/README.md`](../evidence/README.md). The white-box audit
([`dragonwake-current-product.md`](dragonwake-current-product.md)) may only
begin after this record is complete.
