import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // --- FIXED: Nest allowedHosts inside the server object ---
  server: {
    allowedHosts: true, // Adding a dot allows subdomains too
  }
})