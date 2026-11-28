import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main: new URL("./index.html", import.meta.url).pathname,
          upcoming: new URL("./upcoming.html", import.meta.url).pathname,
        },
      },
    },
    server: {
      proxy: { "/api": env.VITE_BACKEND_URL || "http://localhost:8080" },
    },
  };
});
