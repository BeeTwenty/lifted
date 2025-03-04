
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from "url";
import path from "path";
import { splashScreenPlugin } from "vite-plugin-splash-screen";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splashScreenPlugin({
      customCss: `
        body {
          background-color: #f9fafb;
        }
        .splash-logo {
          width: 80px;
          height: 80px;
        }
        .splash-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .splash-title {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          font-size: 28px;
          font-weight: 600;
          margin-top: 20px;
          color: #4f46e5;
        }
      `,
      logoPath: '/public/logo.svg',
      customHtml: `
        <div class="splash-container">
          <img src="/logo.svg" alt="Logo" class="splash-logo" />
          <div class="splash-title">Fitness Tracker</div>
        </div>
      `,
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 8080
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
})
