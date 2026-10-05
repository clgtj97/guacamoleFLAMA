import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import tsconfigPaths from "vite-tsconfig-paths";
import netlifyPlugin from "@netlify/vite-plugin-react-router";

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    netlifyPlugin(),
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
    // Add this plugin to handle CJS requires in browser
    {
      name: "fix-colyseus-require",
      config() {
        return {
          define: {
            global: "globalThis",
          },
        };
      },
    },
  ],
  ssr: {
    noExternal: [
      /@react-router/,
      /@remix-run/,
      /@netlify/,
      "use-debounce",
      "lightweight-charts",
      "colyseus.js", // ✅ Add this to handle CJS/ESM
    ],
  },
  assetsInclude: ['**/*.fbx', '**/*.FBX'],
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "use-debounce", 'three'],
    exclude: ["lightweight-charts", "colyseus.js"],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      requireReturnsDefault: "auto", // ✅ Add this for CJS modules
    },
  },
  resolve: {
    alias: {
      // Ensure Node built-ins don't leak into browser
      "node-fetch": "isomorphic-fetch",
    },
  },
});