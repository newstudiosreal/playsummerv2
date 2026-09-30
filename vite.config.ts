import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' → funziona su GitHub Pages, Cloudflare Pages e Netlify senza configurare nulla
export default defineConfig({ plugins: [react()], base: './' });
