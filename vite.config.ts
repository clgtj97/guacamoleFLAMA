import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    {
      name: "well-known-middleware",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/.well-known/appspecific")) {
            res.statusCode = 204;
            return res.end();
          }
          next();
        });
      },
    },
  ],
  assetsInclude: ['**/*.fbx', '**/*.FBX'],
  optimizeDeps: {
    include: ["colyseus.js", "use-debounce", "three"],
    exclude: ["lightweight-charts"],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      requireReturnsDefault: "auto", // ✅ Add this for CJS modules
    },
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
    alias: {
      // Ensure Node built-ins don't leak into browser
      "node-fetch": "isomorphic-fetch",
    },
  },
});