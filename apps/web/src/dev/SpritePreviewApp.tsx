/**
 * Dedicated Developer Sprite Preview Application Root.
 *
 * Isolated entrypoint for previewing AGES runtime sprites:
 * - Discovers current imported asset from /@preview-assets/current.json
 * - Supports loading synthetic fixture via ?fixture=synthetic
 * - Validates manifest fail-closed before mounting harness.
 */

import React, { useState, useEffect } from "react";
import {
  type SpriteRuntimeManifest,
  validateSpriteRuntimeManifest,
} from "../lib/spriteAnimation";
import { SpritePreviewHarness } from "./SpritePreviewHarness";

export const SpritePreviewApp: React.FC = () => {
  const [manifest, setManifest] = useState<SpriteRuntimeManifest | null>(null);
  const [atlasUrl, setAtlasUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const useSynthetic = params.get("fixture") === "synthetic";
    const customManifestUrl = params.get("manifest");

    async function loadPreview() {
      setLoading(true);
      setError(null);

      try {
        let manifestFetchUrl: string;
        let atlasFetchUrl: string;

        if (customManifestUrl) {
          manifestFetchUrl = customManifestUrl;
          atlasFetchUrl = customManifestUrl.replace(/sprite\.runtime\.json$/, "atlas.png");
        } else if (useSynthetic) {
          manifestFetchUrl = "/fixtures/synthetic-sprite/sprite.runtime.json";
          atlasFetchUrl = "/fixtures/synthetic-sprite/atlas.png";
        } else {
          // Attempt to load current imported preview pointer
          const curResp = await fetch("/@preview-assets/current.json");
          if (!curResp.ok) {
            // Fallback to synthetic if no real preview asset has been imported yet
            manifestFetchUrl = "/fixtures/synthetic-sprite/sprite.runtime.json";
            atlasFetchUrl = "/fixtures/synthetic-sprite/atlas.png";
          } else {
            const curData = await curResp.json();
            const baseUrl = curData.preview_url_base;
            manifestFetchUrl = `${baseUrl}${curData.manifest_file}`;
            atlasFetchUrl = `${baseUrl}${curData.atlas_file}`;
          }
        }

        const mResp = await fetch(manifestFetchUrl);
        if (!mResp.ok) {
          throw new Error(`Failed to load manifest from ${manifestFetchUrl} (HTTP ${mResp.status})`);
        }
        const rawJson = await mResp.json();
        const validated = validateSpriteRuntimeManifest(rawJson);

        setManifest(validated);
        setAtlasUrl(atlasFetchUrl);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }

    void loadPreview();
  }, []);

  if (loading) {
    return (
      <div style={{ background: "#12151c", color: "#9ca3af", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
        Loading DragonWake sprite preview environment...
      </div>
    );
  }

  if (error || !manifest || !atlasUrl) {
    return (
      <div style={{ background: "#12151c", color: "#fca5a5", minHeight: "100vh", padding: "40px", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "#ef4444" }}>Failed to initialize sprite preview</h2>
        <p>{error}</p>
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>
          Tip: Run <code>pnpm --filter @dragonwake/web sprite:preview-import</code> to import an AGES runtime package,
          or pass <code>?fixture=synthetic</code> to test with the lightweight CI fixture.
        </p>
      </div>
    );
  }

  return <SpritePreviewHarness manifest={manifest} atlasUrl={atlasUrl} />;
};
