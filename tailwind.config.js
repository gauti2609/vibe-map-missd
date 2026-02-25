/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    900: '#1a103c', // Deep purple bg
                    800: '#2d1b69', // Card bg
                    600: '#7c3aed', // Primary action
                    500: '#8b5cf6', // Indigo/Violet shade
                    400: '#a78bfa', // Text highlight
                    accent: '#f472b6', // Pink accent
                }
            }
        }
    },
    plugins: [],
}
