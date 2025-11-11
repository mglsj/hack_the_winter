// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import fonts from "./fonts";
import mdx from "@astrojs/mdx";
import lenis from "astro-lenis";
import icon from "astro-icon";
import react from "@astrojs/react";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
    site: "https://hack.gehubhimtal.in/",
    integrations: [mdx(), lenis(), icon(), react(), svelte()],
    vite: {
        plugins: [tailwindcss()],
    },
    experimental: {
        fonts,
    },
});