import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
      plugins: [
        react({
          jsxRuntime: 'automatic',
          jsxImportSource: 'react'
        }),
      ],
      esbuild: {
        jsx: 'automatic',
        jsxDev: mode === 'development'
      },
      build: {
        target: 'es2015',
        minify: 'esbuild',
        sourcemap: mode === 'development',
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'editor': ['lexical', '@lexical/react', '@lexical/html'],
              'export': ['docx', 'jspdf', 'epub-gen-memory'],
              'ui': ['lucide-react']
            }
          }
        },
        chunkSizeWarningLimit: 1000
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'zustand', 'dexie']
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
          '@components': path.resolve(__dirname, './components'),
          '@services': path.resolve(__dirname, './services'),
          '@store': path.resolve(__dirname, './store'),
          '@types': path.resolve(__dirname, './types.ts')
        }
      },
      define: {
        // === REQUIRED API KEYS ===
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
        'process.env.OPENROUTER_ENDPOINT': JSON.stringify(env.OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1'),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_ENDPOINT': JSON.stringify(env.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com'),
        
        // === IMAGE GENERATION APIS ===
        'process.env.DALLE_API_KEY': JSON.stringify(env.DALLE_API_KEY),
        'process.env.STABILITY_API_KEY': JSON.stringify(env.STABILITY_API_KEY),
        
        // === OPTIONAL INTEGRATIONS ===
        'process.env.LANGUAGETOOL_API_KEY': JSON.stringify(env.LANGUAGETOOL_API_KEY),
        'process.env.LANGUAGETOOL_ENDPOINT': JSON.stringify(env.LANGUAGETOOL_ENDPOINT || 'https://api.languagetool.org'),
        'process.env.GRAMMARLY_API_KEY': JSON.stringify(env.GRAMMARLY_API_KEY),
        'process.env.GRAMMARLY_ENDPOINT': JSON.stringify(env.GRAMMARLY_ENDPOINT || 'https://api.grammarly.com'),
        'process.env.SCRAPING_API_KEY': JSON.stringify(env.SCRAPING_API_KEY),
        'process.env.SCRAPING_ENDPOINT': JSON.stringify(env.SCRAPING_ENDPOINT || 'https://app.scrapingbee.com'),
        'process.env.DOCUMENT_PARSER_API_KEY': JSON.stringify(env.DOCUMENT_PARSER_API_KEY),
        'process.env.DOCUMENT_PARSER_ENDPOINT': JSON.stringify(env.DOCUMENT_PARSER_ENDPOINT || 'https://api.documentparser.com'),
        'process.env.FACTCHECK_API_KEY': JSON.stringify(env.FACTCHECK_API_KEY),
        'process.env.FACTCHECK_ENDPOINT': JSON.stringify(env.FACTCHECK_ENDPOINT || 'https://api.factcheck.org'),
        
        // === APPLICATION CONFIGURATION ===
        'process.env.DEFAULT_AI_MODEL': JSON.stringify(env.DEFAULT_AI_MODEL || 'nvidia/nemotron-nano-9b-v2:free'),
        'process.env.DEFAULT_TEMPERATURE': JSON.stringify(env.DEFAULT_TEMPERATURE || '0.7'),
        'process.env.DEFAULT_MAX_TOKENS': JSON.stringify(env.DEFAULT_MAX_TOKENS || '4000'),
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'BookCraft AI'),
        'process.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
        
        // === SECURITY SETTINGS ===
        'process.env.VALIDATE_API_KEYS': JSON.stringify(env.VALIDATE_API_KEYS || 'true'),
        'process.env.ENABLE_DEBUG_LOGGING': JSON.stringify(env.ENABLE_DEBUG_LOGGING || 'false'),
        'process.env.ENABLE_ANALYTICS': JSON.stringify(env.ENABLE_ANALYTICS || 'true'),
        'process.env.API_RATE_LIMIT': JSON.stringify(env.API_RATE_LIMIT || '100'),
        'process.env.API_RATE_WINDOW': JSON.stringify(env.API_RATE_WINDOW || '3600000'),
        
        // Backwards compatibility
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        port: 5173,
        host: true
      },
      build: {
        sourcemap: mode === 'development',
        minify: mode === 'production'
      }
    };
});
