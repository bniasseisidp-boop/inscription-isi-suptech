import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['isi-logo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'ISI SUPTECH — Espace Étudiant',
        short_name: 'ISI SUPTECH',
        description: "Plateforme d'inscription et d'espace étudiant de l'ISI SUPTECH",
        theme_color: '#0f2352',
        background_color: '#ffffff',
        lang: 'fr',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Ne jamais mettre en cache les appels API ou le stockage — toujours frais.
        navigateFallbackDenylist: [/^\/api\//, /^\/storage\//],
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,woff2}'],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
