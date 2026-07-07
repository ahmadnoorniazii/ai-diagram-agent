// Vite build configuration: enables React (JSX/Fast Refresh) support and
// the Cloudflare plugin so the app and its Worker build/run together.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
});
