export async function getCroppedImageBlob(imageSrc: string, cropPixels: { x: number; y: number; width: number; height: number }) {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas ctx");

    canvas.width = Math.floor(cropPixels.width);
    canvas.height = Math.floor(cropPixels.height);

    ctx.drawImage(
        img,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
    );

    return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
            if (!b) return reject(new Error("No se pudo crear blob"));
            resolve(b);
        }, "image/png");
    });
}

function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}
