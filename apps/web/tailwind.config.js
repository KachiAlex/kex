/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}"
	],
	theme: {
		extend: {
			colors: {
				kex: {
					primary: "#1E1E1E",
					secondary: "#FFB800",
					accent: "#00C2CB",
					background: "#FFFFFF"
				}
			},
			fontFamily: {
				heading: ["Poppins", "ui-sans-serif", "system-ui"],
				body: ["Inter", "ui-sans-serif", "system-ui"]
			}
		}
	},
	plugins: []
}; 