/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                appred: {
                    100: "#EA1436",
                    200: "#EB2531",
                    250: "#E61422",
                },
                apporange: {
                    100: "#E99517",
                    200: "#E28C0B",
                },
            },
        },
    },
    plugins: [],
};
