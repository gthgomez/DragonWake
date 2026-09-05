# R3 reinforcement semantics audit

## Current shipped contract

`reinforce` is an authoritative delivery march. On a valid same-owner or
same-alliance arrival, the sender's remaining composition is added to the target
city's stack and the march becomes stationed. The sender's march record retains
the target city, timestamp, and exact delivered composition until recall.

On an invalid arrival (missing target or non-alliance target), the original
composition remains on the returning march and is restored to the origin city
exactly once at return completion.

## Verified invariants

- Alliance membership is checked server-side at landing time.
- Sender units are deducted at march creation and cannot be duplicated by a
  repeated landing call.
- Failed reinforcement does not annihilate the sender's troops.
- Successful delivery empties the marching composition and creates a stationed
  record attributable to the sender.
- Recall removes the exact available stationed composition from the target and
  returns it to the sender after travel; alliance departure recalls affected
  stationed forces.
- Target manpower is recalculated after delivery.
- The existing regression suite covers successful same-alliance delivery,
  failed non-alliance return, idempotent landing, and manpower reservation.

## Deliberate scope boundary

Battle-time losses are reflected in the target stack and the stationed record is
not a separate combat unit type. The state is encoded in the persisted march
JSON and requires PostgreSQL CI to prove restart behavior on the current head.
