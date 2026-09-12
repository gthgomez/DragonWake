/** Alpha test raster buildings from AlphaDesign.png (Imagine edit-chain).
 *  Not AGES-promoted canon. CityGrid falls back to SVG glyphs if missing.
 */
export const ALPHA_BUILDING_ART: Record<string, string> = {
  forge_heart: "/art/alpha/imagine-explorations/buildings/bld-keep.png",
  habitation: "/art/alpha/imagine-explorations/buildings/bld-homes.png",
  barracks: "/art/alpha/imagine-explorations/buildings/bld-barracks.png",
  archive_spire: "/art/alpha/imagine-explorations/buildings/bld-scriptorium.png",
  rally_quay: "/art/alpha/imagine-explorations/buildings/bld-muster-yard.png",
  command_gallery: "/art/alpha/imagine-explorations/buildings/bld-commanders-hall.png",
  lookout: "/art/alpha/imagine-explorations/buildings/bld-watchtower.png",
  skyreost: "/art/alpha/imagine-explorations/buildings/bld-dragon-watch.png",
  saltvault: "/art/alpha/imagine-explorations/buildings/bld-storehouse.png",
  seawall: "/art/alpha/imagine-explorations/buildings/bld-walls.png",
  training_camp: "/art/alpha/imagine-explorations/buildings/bld-training-camp.png",
  gearfoundry: "/art/alpha/imagine-explorations/buildings/bld-forge.png",
};

export function alphaBuildingSrc(type: string): string | undefined {
  return ALPHA_BUILDING_ART[type];
}
