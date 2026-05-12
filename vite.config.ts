import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    worker: {
        format: 'es',
    },
    optimizeDeps: {
        exclude: ['stockfish'],
    },
    build: {
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom', 'zustand'],
                    'vendor-ui': [
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-select',
                        '@radix-ui/react-slider',
                        '@radix-ui/react-switch',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-tooltip',
                        'lucide-react',
                        'framer-motion',
                        'clsx',
                        'tailwind-merge',
                        'class-variance-authority',
                    ],
                    'vendor-chess': ['chess.js', 'chessground'],
                    'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
                    'vendor-db': ['dexie', 'dexie-react-hooks'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
    server: {
        port: 5173,
        strictPort: true,
    },
})
