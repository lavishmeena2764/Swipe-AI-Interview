import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { createServer } from "./server";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    fs: {
      allow: [
        "./client",
        "./shared",
        "C:/Users/manis/OneDrive/Desktop/interview-ease/interview-ease-main",
      ],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  optimizeDeps: {
    exclude: ["pdf-parse/test"],
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    async configureServer(server) {
      const { createServer } = await import("./server/index.js");
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
