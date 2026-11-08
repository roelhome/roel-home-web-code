import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: {
      enabled: false
    }
  }),
  integrations: [react()],
  site: 'https://roelhomes.com',
  build: {
    format: 'directory'
  }
});
