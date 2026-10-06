/**
 * Roost presence — the small, testable rule deciding whether the signature
 * dragon is rendered as a physical inhabitant of the scene.
 *
 * A dragon that is away (Home Guard, or not yet present) must leave an
 * actually empty roost; rendering a dimmed dragon there would misrepresent
 * authoritative state.
 */
export type RoostPresence = {
  slot: number | null;
  away: boolean;
};

export function shouldRenderRoostDragon(
  presence: RoostPresence | null | undefined,
): boolean {
  return Boolean(presence) && !presence!.away && presence!.slot != null;
}
