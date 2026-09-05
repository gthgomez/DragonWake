# M2 Final Resource Cutover

Dragon Wake now uses the final canonical resource domain:

`food`, `wood`, `stone`, `ore`, `crownmark` — displayed as Food, Wood, Stone,
Ore, and Crownmarks. Chronite remains separate.

The migration boundary accepts and canonicalizes both earlier generations:

`kelp → food`, `driftwood/timber → wood`, `basalt → stone`,
`slagiron/iron → ore`, and `tidegilt/coin → crownmark`.

Final keys win when a mixed bag contains both a final key and an alias. The
alias is not added a second time. PostgreSQL boot migration applies the same
rule: an existing final column is retained, and an alias column fills it only
when the final value is zero, then the alias column is removed. This makes
restarts safe without silently minting or summing duplicate state.

`M2_RESOURCE_RENAME_PLAN.md` is retained as historical Generation-B evidence;
its `food/timber/stone/iron/coin` target is superseded by this document.
