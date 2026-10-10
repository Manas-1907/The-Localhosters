import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        home: resolve(__dirname, 'home.html'),
        myHealth: resolve(__dirname, 'my-health.html'),
        medicines: resolve(__dirname, 'medicines.html'),
        appointments: resolve(__dirname, 'appointments.html'),
        insights: resolve(__dirname, 'insights.html'),
        doctorBrief: resolve(__dirname, 'doctor-brief.html'),
        settings: resolve(__dirname, 'settings.html'),
        support: resolve(__dirname, 'support.html'),
        contact: resolve(__dirname, 'contact.html'),
        thankYou: resolve(__dirname, 'thank-you.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        notFound: resolve(__dirname, '404.html'),
      },
    },
  },
});
