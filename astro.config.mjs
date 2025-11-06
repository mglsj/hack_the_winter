// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import fonts from "./fonts";
import mdx from "@astrojs/mdx";
import lenis from "astro-lenis";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
	site: "https://hack-the-winter.pages.dev",
	integrations: [mdx(), lenis(), icon()],
	vite: {
		plugins: [tailwindcss()],
	},
	experimental: {
		fonts,
	},
});
