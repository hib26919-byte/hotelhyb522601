import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    appType: "spa",          // ← THIS is the correct Vite way to handle SPA routing
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_SERVER_URL || "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            firebase: ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/storage"],
            charts: ["recharts"],
            ui: ["lucide-react", "react-hot-toast"],
          },
        },
      },
    },
  };
});