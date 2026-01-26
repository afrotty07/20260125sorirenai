/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'wa-black': '#1a1a1a',
                'wa-gold': '#d4af37',
                'wa-red': '#8e2323',
                'wa-indigo': '#0f2540',
                'wa-paper': '#fdfcf0',
            },
            backgroundImage: {
                'paper-texture': "url('https://www.transparenttextures.com/patterns/p6.png')",
            }
        },
    },
    plugins: [],
}
