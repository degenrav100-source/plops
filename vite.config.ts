import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base is set for GitHub Pages project sites (served under /plops/).
// Override with BASE_PATH env var if the repo name differs.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/plops/",
  plugins: [react()],
})
