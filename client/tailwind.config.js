/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "electric-blue": "#2E5BFF",
                "hot-pink": "#FF00F5",
                "toxic-green": "#ADFF00",
                "neon-yellow": "#FFF500",
                "primary": "#0df20d",
                "background-light": "#f5f8f5",
                "background-dark": "#0D0D0D",
                "neo-pink": "#FF007A",
                "neo-blue": "#00F0FF",
                "neo-green": "#0DF20D",
                "neo-yellow": "#F0FF00"
            },
            fontFamily: {
                "display": ["Archivo Black", "Space Grotesk", "sans-serif"],
                "body": ["Archivo", "sans-serif"],
                "mono": ["Space Mono", "monospace"]
            },
            boxShadow: {
                'neo-4': '4px 4px 0px 0px rgba(0,0,0,1)',
                'neo-8': '8px 8px 0px 0px rgba(0,0,0,1)',
                'neo-bottom': '0px 6px 0px 0px rgba(0,0,0,1)',
                "brutal": "4px 4px 0px 0px #000000",
                "brutal-lg": "8px 8px 0px 0px #000000",
            },
            borderWidth: {
                "3": "3px",
                "4": "4px"
            },
            borderRadius: {
                "DEFAULT": "0rem",
                "lg": "0rem",
                "xl": "0rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
