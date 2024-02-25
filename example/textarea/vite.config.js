import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: "3000",
    cors: "true",
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
