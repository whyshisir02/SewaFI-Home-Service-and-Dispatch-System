import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('react-router')) return 'router-vendor';
          if (id.includes('recharts')) return 'charts-vendor';
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps-vendor';
          if (id.includes('react-hook-form') || id.includes('zod')) return 'forms-vendor';
          if (id.includes('axios') || id.includes('socket.io-client')) return 'network-vendor';

          return 'vendor';
        },
      },
    },
  },
});
