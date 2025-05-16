import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, type PluginOption } from "vite";
import { VitePWA, type VitePWAOptions } from "vite-plugin-pwa";

const manifestForPlugIn: Partial<VitePWAOptions> = {
  registerType: "autoUpdate",
  includeAssets: [
    "favicon_io/favicon.ico",
    "favicon_io/apple-touc-icon.png",
    "favicon_io/mask-icon.png",
  ],
  manifest: {
    name: "Expenses V2",
    short_name: "expenses-2",
    description: "Simple expenses tracker",
    theme_color: "#F8359B",
    background_color: "#090909",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "favicon",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "favicon",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "apple touch icon",
      },
      {
        src: "/maskable_icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    display: "standalone",
    scope: "/",
    start_url: "/",
    orientation: "portrait",
  },
};

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), VitePWA(manifestForPlugIn) as PluginOption[]],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
