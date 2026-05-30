import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/hotel-management-system/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/hotel%20management%20system',
        changeOrigin: true,
        secure: false,
      },
      '/hotel-management-system/api': {
        target: 'http://localhost/hotel%20management%20system',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/hotel-management-system/, ''),
      },
      '/uploads': {
        target: 'http://localhost/hotel%20management%20system',
        changeOrigin: true,
        secure: false,
      },
      '/hotel-management-system/uploads': {
        target: 'http://localhost/hotel%20management%20system',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/hotel-management-system/, ''),
      },
    },
  },
  define: {
    'process.env': process.env
  }
})
