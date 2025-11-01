import { fontProviders } from "astro/config";
import type { FontFamily } from "node_modules/astro/dist/assets/fonts/types";

const fonts: FontFamily[] = [
    {
        provider: "local",
        name: "Feast Of Flesh BB",
        cssVariable: "--font-angry",
        variants: [
            {
                style: "normal",
                src: ["./src/assets/fonts/FEASFBRG.woff2"],
            },
            {
                style: "italic",
                src: ["./src/assets/fonts/FEASFBI_.woff2"],
            }
        ],
    },
]

export default fonts;