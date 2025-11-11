type TextureInfo = { src: string; width: number; height: number };

async function getImage(src: string): Promise<HTMLImageElement> {
    const img = new Image();
    // Hint browsers to decode off the main thread when possible
    // and ensure decode is complete before we hand the image off.
    img.decoding = 'async';
    img.src = src;

    // Prefer decode() (non-blocking, ensures readiness).
    // Fallback to load/error events for older browsers.
    try {
        await img.decode();
    } catch {
        await new Promise<void>((resolve) => {
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
        });
    }

    return img;
}

async function loadTexture(path: string): Promise<TextureInfo> {
    const img = await getImage(path);
    const width = img.naturalWidth || img.width || 1;
    const height = img.naturalHeight || img.height || 1;

    return { src: path, width, height };
}

async function loadTextures<T extends Record<string, string>>(paths: T): Promise<{ [K in keyof T]: TextureInfo }> {
    const entries = await Promise.all(
        (Object.keys(paths) as (keyof T)[]).map(async (key) => {
            const texture = await loadTexture(paths[key]);
            return [key, texture] as const;
        }),
    );

    // Object.fromEntries returns any; assert to the mapped output type
    return Object.fromEntries(entries) as { [K in keyof T]: TextureInfo };
}

export { loadTextures, loadTexture, getImage, type TextureInfo };