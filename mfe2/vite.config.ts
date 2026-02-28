import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import federation from "@originjs/vite-plugin-federation";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

/** Serves remoteEntry.js in dev by building once and caching, so the SPA fallback is not hit. */
function devRemoteEntryPlugin() {
  let cached: string | null = null;
  let buildPromise: Promise<string> | null = null;

  return {
    name: "dev-remote-entry",
    enforce: "pre" as const,
    configureServer(server: {
      config: { root: string };
      middlewares: {
        stack: Array<{
          route: string;
          handle: (req: any, res: any, next: () => void) => void;
        }>;
      };
    }) {
      return () => {
        const handler = (req: any, res: any, next: () => void) => {
          const pathname = (req.url ?? "").split("?")[0];
          if (
            req.method === "GET" &&
            (pathname === "/remoteEntry.js" ||
              pathname === "/assets/remoteEntry.js")
          ) {
            const run = async () => {
              if (cached) return cached;
              if (!buildPromise) {
                buildPromise = (async () => {
                  const root = server.config.root;
                  execSync("npx vite build", { cwd: root, stdio: "pipe" });
                  const outDir = join(root, "dist");
                  const assetsDir = "assets";
                  const filePath = join(outDir, assetsDir, "remoteEntry.js");
                  cached = readFileSync(filePath, "utf-8");
                  return cached!;
                })();
              }
              return buildPromise;
            };
            run()
              .then((content) => {
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader(
                  "Content-Type",
                  "application/javascript; charset=utf-8",
                );
                res.setHeader("Cache-Control", "no-cache");
                res.end(content);
              })
              .catch((err) => {
                res.statusCode = 500;
                res.setHeader("Content-Type", "text/plain");
                res.end(String(err?.message ?? err));
              });
            return;
          }
          const root = server.config.root;
          const distDir = join(root, "dist");
          const assetsDir = join(distDir, "assets");

          const tryServeFromAssets = (relativePath: string) => {
            const filePath = resolve(join(assetsDir, relativePath));
            if (
              !filePath.startsWith(resolve(assetsDir)) ||
              !existsSync(filePath) ||
              (!filePath.endsWith(".js") && !filePath.endsWith(".css"))
            )
              return false;
            try {
              const content = readFileSync(filePath, "utf-8");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader(
                "Content-Type",
                filePath.endsWith(".css")
                  ? "text/css; charset=utf-8"
                  : "application/javascript; charset=utf-8",
              );
              res.end(content);
              return true;
            } catch {
              return false;
            }
          };

          if (pathname.startsWith("/assets/")) {
            const relativePath = pathname.slice("/assets/".length);
            if (!relativePath.includes("..") && tryServeFromAssets(relativePath))
              return;
          }
          if (
            pathname.startsWith("/") &&
            pathname.length > 1 &&
            !pathname.slice(1).includes("/") &&
            (pathname.endsWith(".js") || pathname.endsWith(".css"))
          ) {
            const basename = pathname.slice(1);
            if (!basename.includes("..") && tryServeFromAssets(basename)) return;
          }
          next();
        };
        server.middlewares.stack.unshift({ route: "", handle: handler });
      };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    devRemoteEntryPlugin(),
    react(),
    federation({
      name: "mfe2",
      filename: "remoteEntry.js",
      exposes: {
        "./mount": "./src/mount.ts",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  server: {
    port: 5174,
    strictPort: true,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  preview: {
    port: 4174,
  },
});
