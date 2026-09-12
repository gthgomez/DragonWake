import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function previewAssetsDevPlugin(): Plugin {
  const previewRoot = path.resolve(__dirname, ".preview-assets");

  return {
    name: "preview-assets-dev-middleware",
    apply: "serve", // active ONLY during vite dev/serve
    configureServer(server) {
      server.middlewares.use("/@preview-assets", (req, res, next) => {
        try {
          const reqUrl = (req.url || "").split("?")[0];
          const decoded = decodeURIComponent(reqUrl).replace(/^\/+/, "");
          const targetPath = path.resolve(previewRoot, decoded);

          const allowedPrefix = previewRoot.endsWith(path.sep) ? previewRoot : previewRoot + path.sep;
          // Enforce strict path containment
          if (!targetPath.startsWith(allowedPrefix)) {
            res.statusCode = 403;
            res.end("Forbidden: Path traversal blocked");
            return;
          }

          if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
            res.statusCode = 404;
            res.end("Not Found in preview assets");
            return;
          }

          // Content type mapping
          if (targetPath.endsWith(".png")) {
            res.setHeader("Content-Type", "image/png");
          } else if (targetPath.endsWith(".json")) {
            res.setHeader("Content-Type", "application/json");
          } else if (targetPath.endsWith(".webp")) {
            res.setHeader("Content-Type", "image/webp");
          }

          fs.createReadStream(targetPath).pipe(res);
        } catch (e) {
          next(e);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), previewAssetsDevPlugin()],
  server: {
    port: 5173,
    proxy: {
      "/health": "http://localhost:3001",
      "/api": "http://localhost:3001",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
});

