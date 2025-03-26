import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Add React plugin
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: "./",
  plugins: [react(),tailwindcss()], // Use React plugin
  devtool: false, // Add a comma here to separate the properties
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,       // Make sure this matches the port you're using
  },
  
})

