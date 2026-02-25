import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Define process.env to prevent crashes in the browser (needed for the gemini.ts file)
    define: {
        'process.env': {}
    },
    server: {
        host: true, // This allows your phone to connect (0.0.0.0)
        port: 3000, // Explicitly set port to match tunnel
        allowedHosts: true, // Allow tunneling (ngrok/localtunnel) host headers
    },
    // Same config for production preview
    preview: {
        host: true,
        port: 3000,
        allowedHosts: true,
    }
})
