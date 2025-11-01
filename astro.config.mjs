// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import swup from "@swup/astro";
import fonts from "./fonts";

// https://astro.build/config
export default defineConfig({
	site: "https://hackthewinter.dev",
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
	},
	experimental: {
		fonts,
	},
});
