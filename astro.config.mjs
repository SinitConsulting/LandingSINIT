// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()]
  },
  site: 'https://sinit-consulting.netlify.app', // Placeholder URL for sitemap
});
