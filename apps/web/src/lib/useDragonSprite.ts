import { useState, useEffect } from "react";
import {
  type SpriteRuntimeManifest,
  validateSpriteRuntimeManifest,
  loadVerifiedAtlas,
} from "./spriteAnimation";

export interface UseDragonSpriteResult {
  manifest: SpriteRuntimeManifest | null;
  atlasImage: HTMLImageElement | null;
  loading: boolean;
  error: string | null;
}

export function useDragonSprite(archetype = "vale_drake"): UseDragonSpriteResult {
  const [manifest, setManifest] = useState<SpriteRuntimeManifest | null>(null);
  const [atlasImage, setAtlasImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let cleanupFn: (() => void) | null = null;

    setLoading(true);
    setError(null);

    async function load() {
      try {
        const manifestUrl = `/art/dragons/${archetype}/sprite/sprite.runtime.json`;
        const atlasUrl = `/art/dragons/${archetype}/sprite/atlas.png`;

        const resp = await fetch(manifestUrl);
        if (!resp.ok) {
          throw new Error(`Failed to load sprite manifest from ${manifestUrl} (HTTP ${resp.status})`);
        }
        const rawJson = await resp.json();
        const validManifest = validateSpriteRuntimeManifest(rawJson);

        const atlasRes = await loadVerifiedAtlas(atlasUrl, validManifest.atlas.sha256);
        if (!active) {
          atlasRes.cleanup();
          return;
        }

        cleanupFn = atlasRes.cleanup;
        setManifest(validManifest);
        setAtlasImage(atlasRes.image);
      } catch (err: any) {
        if (active) {
          setError(err.message || String(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
      cleanupFn?.();
    };
  }, [archetype]);

  return { manifest, atlasImage, loading, error };
}
