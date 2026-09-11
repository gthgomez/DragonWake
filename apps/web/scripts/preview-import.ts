/**
 * Safe Developer Preview Asset Importer for DragonWake.
 *
 * Imports an AGES PREVIEW_ONLY runtime export into apps/web/.preview-assets/:
 * 1. Reads and verifies integrity.json and all file SHA-256 digests.
 * 2. Validates package_digest against canonical files mapping.
 * 3. Asserts runtime_status === "PREVIEW_ONLY".
 * 4. Copies files into .preview-assets/<asset-id>/<package-digest>/.
 * 5. Re-verifies all destination bytes against recorded hashes.
 * 6. Writes import_receipt.json and updates current.json pointer.
 * 7. Never writes into production public/art/.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sha256File(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex").toLowerCase();
}

function canonicalJson(data: unknown): string {
  return JSON.stringify(data, Object.keys(data as object).sort(), 2);
}

export function importPreviewPackage(sourceDir: string): {
  success: boolean;
  assetId: string;
  packageDigest: string;
  destDir: string;
  receiptPath: string;
} {
  const src = path.resolve(sourceDir);
  if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) {
    throw new Error(`Source export directory does not exist: ${src}`);
  }

  // 1. Read integrity.json
  const integrityPath = path.join(src, "integrity.json");
  if (!fs.existsSync(integrityPath)) {
    throw new Error(`Missing integrity.json in export directory: ${src}`);
  }
  const integrity = JSON.parse(fs.readFileSync(integrityPath, "utf-8"));
  const expectedFiles: Record<string, string> = integrity.files ?? {};
  const expectedDigest: string = String(integrity.package_digest ?? "").toLowerCase();

  // 2. Verify all source file hashes
  for (const [fileName, expectedSha] of Object.entries(expectedFiles)) {
    const fPath = path.join(src, fileName);
    if (!fs.existsSync(fPath)) {
      throw new Error(`Missing file listed in integrity.json: ${fileName}`);
    }
    const actualSha = sha256File(fPath);
    if (actualSha !== String(expectedSha).toLowerCase()) {
      throw new Error(
        `Source file integrity failure for ${fileName}! Expected: ${expectedSha}, Actual: ${actualSha}`
      );
    }
  }

  // 3. Verify package_digest
  const canonicalFilesStr = canonicalJson(expectedFiles);
  const actualDigest = crypto.createHash("sha256").update(canonicalFilesStr).digest("hex").toLowerCase();
  if (actualDigest !== expectedDigest) {
    throw new Error(
      `Package digest mismatch! Expected: ${expectedDigest}, Actual derived: ${actualDigest}`
    );
  }

  // 4. Verify runtime manifest
  const manifestPath = path.join(src, "sprite.runtime.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing sprite.runtime.json in export directory: ${src}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  if (manifest.runtime_status !== "PREVIEW_ONLY") {
    throw new Error(
      `Refusing import: runtime_status is '${manifest.runtime_status}', expected 'PREVIEW_ONLY'`
    );
  }

  const assetId = String(manifest.asset_id || "unknown_asset");

  // 5. Destination under .preview-assets
  const previewRoot = path.resolve(__dirname, "..", ".preview-assets");
  const destDir = path.join(previewRoot, assetId, expectedDigest);
  fs.mkdirSync(destDir, { recursive: true });

  // 6. Copy files
  for (const fileName of Object.keys(expectedFiles)) {
    const srcFile = path.join(src, fileName);
    const destFile = path.join(destDir, fileName);
    fs.copyFileSync(srcFile, destFile);

    // Re-verify destination bytes
    const destSha = sha256File(destFile);
    if (destSha !== expectedFiles[fileName].toLowerCase()) {
      throw new Error(`Destination byte verification failed for ${fileName} after copy!`);
    }
  }

  // Copy integrity.json too
  fs.copyFileSync(integrityPath, path.join(destDir, "integrity.json"));

  // 7. Write import receipt
  const receipt = {
    schema_version: "1.7.0",
    imported_at: new Date().toISOString(),
    asset_id: assetId,
    subject_id: manifest.subject_id,
    package_digest: expectedDigest,
    atlas_sha256: expectedFiles["atlas.png"],
    manifest_sha256: expectedFiles["sprite.runtime.json"],
    runtime_status: manifest.runtime_status,
    source_export_dir: src,
    destination_relative: path.relative(path.resolve(__dirname, ".."), destDir).replace(/\\/g, "/"),
    verified: true,
  };

  const receiptPath = path.join(destDir, "import_receipt.json");
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), "utf-8");

  // Update current pointer for preview app convenience
  const currentPointer = {
    asset_id: assetId,
    package_digest: expectedDigest,
    preview_url_base: `/@preview-assets/${assetId}/${expectedDigest}/`,
    manifest_file: "sprite.runtime.json",
    atlas_file: "atlas.png",
    receipt_file: "import_receipt.json",
  };
  fs.writeFileSync(
    path.join(previewRoot, "current.json"),
    JSON.stringify(currentPointer, null, 2),
    "utf-8"
  );

  return {
    success: true,
    assetId,
    packageDigest: expectedDigest,
    destDir,
    receiptPath,
  };
}

// CLI Execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const args = process.argv.slice(2);
  const targetDir = args[0] || path.resolve("C:/Workspace/tools/gamedev/artifacts/runtime_exports/dragonwake/vale_drake");
  console.log(`[Preview Importer] Importing AGES runtime export from: ${targetDir}`);
  try {
    const result = importPreviewPackage(targetDir);
    console.log("=".repeat(80));
    console.log("DRAGONWAKE PREVIEW ASSET IMPORT SUMMARY");
    console.log("=".repeat(80));
    console.log(`ASSET ID:         ${result.assetId}`);
    console.log(`PACKAGE DIGEST:   ${result.packageDigest}`);
    console.log(`DESTINATION:      ${result.destDir}`);
    console.log(`RECEIPT:          ${result.receiptPath}`);
    console.log("STATUS:           VERIFIED & IMPORTED (Excluded from production build)");
    console.log("=".repeat(80));
  } catch (err: any) {
    console.error(`[ERROR] Preview import failed: ${err.message}`);
    process.exit(1);
  }
}
