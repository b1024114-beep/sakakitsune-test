import fs from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// ローカル開発時に api/*.ts（Vercel Functions）を Vite 上で動かす
// ファイルが無いAPIは、下の proxy 設定で本番(Vercel)へ転送される
function localApi(): Plugin {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "", "http://localhost");
        const match = url.pathname.match(/^\/api\/([\w-]+)$/);
        if (!match) return next();

        const file = path.resolve(server.config.root, "api", `${match[1]}.ts`);
        if (!fs.existsSync(file)) return next();

        try {
          const { default: handler } = await server.ssrLoadModule(file);

          // Vercel の request / response と同じ使い方ができるようにする
          const request = Object.assign(req, { query: Object.fromEntries(url.searchParams) });
          const response = {
            status(code: number) {
              res.statusCode = code;
              return response;
            },
            setHeader(name: string, value: string) {
              res.setHeader(name, value);
              return response;
            },
            json(body: unknown) {
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify(body));
              return response;
            },
            send(body: string) {
              res.end(body);
              return response;
            },
          };

          await handler(request, response);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // .env.local の SALINITY_API_URL などを api/*.ts から process.env で読めるようにする
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    process.env[key] ??= value;
  }

  return {
    plugins: [
      react(),
      tsconfigPaths(),
      localApi(),
    ],
    server: {
      proxy: {
        "/api": {
          target: "http://kitsunezaki.vercel.app",
          changeOrigin: true,
        },
      },
    },
  };
});
