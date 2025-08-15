import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
  '@': path.resolve(__dirname, 'src'),
  // Force single React copy to avoid invalid hook calls
  'react': path.resolve(__dirname, 'node_modules/react'),
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    }
  },
  plugins: [
    react(),
    tailwindcss()   // Tailwind v4 plugin for Vite
  ],
  server: { port: 5173 }
})
