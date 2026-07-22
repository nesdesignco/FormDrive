import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/FormDrive/" : "/",
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          state: ["zustand"],
        },
      },
    },
  },
});
