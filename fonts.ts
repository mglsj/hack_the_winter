import { fontProviders } from "astro/config";
import type { FontFamily } from "node_modules/astro/dist/assets/fonts/types";

const fonts: FontFamily[] = [
    // {
    //     provider: fontProviders.google(),
    //     name: "Noto Sans",
    //     cssVariable: "--font-noto-sans",
    // },
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
    {
        provider: "local",
        name: "Lazy Dog",
        cssVariable: "--font-lazy-dog",
        variants: [
            {
                style: "normal",
                src: ["./src/assets/fonts/lazy_dog.woff2"],
            },
        ],
    },
    {
        provider: "local",
        name: "KG Broken Vessels Sketch",
        cssVariable: "--font-broken-vessels",
        variants: [
            {
                style: "normal",
                src: ["./src/assets/fonts/kg-broken-vessels-sketch/kimberly-geswein_kg-broken-vessels-sketch/KGBrokenVesselsSketch.ttf"],
            },
        ],
    },
    //     {
    //         provider: "local",
    //         name: "Whispering Signature",
    //         cssVariable: "--font-whispering-signature",
    //         variants: [
    //             {
    //                 style: "normal",
    //                 src: ["./src/assets/fonts/WhisperingSignature.woff2"],
    //             },
    //         ],
    //     },
    //     {
    //         provider: "local",
    //         name: "Quality Modern",
    //         cssVariable: "--font-quality-modern",
    //         variants: [
    //             {
    //                 style: "normal",
    //                 src: ["./src/assets/fonts/Quality Modern.otf"],
    //             },
    //         ],
    //     },
]

export default fonts;