// Polyfill for Promise.withResolvers (required by pdfjs-dist 4.4+)
if (typeof Promise.withResolvers === "undefined") {
    if (typeof window !== "undefined") {
        // @ts-expect-error - missing types
        window.Promise.withResolvers = function () {
            let resolve, reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        };
    } else {
        // @ts-expect-error - missing types
        global.Promise.withResolvers = function () {
            let resolve, reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        };
    }
}

// legacy import might not have types
// legacy import might not have types
// import * as pdfjsLib from "pdfjs-dist"; // Removed static import

export async function renderPdfPageToCanvas(file: File, pageNumber = 1, scale = 2) {
    // Dynamic import to ensure polyfill runs FIRST (and to save bundle size)
    const pdfjsLib = await import("pdfjs-dist");

    // Usamos URL-based worker setup que es compatible con Webpack 5 / Next.js
    // Solo configurarlo una vez si es necesario, o cada vez (es un global estático)
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
        ).toString();
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    if (!ctx) throw new Error("No se pudo crear contexto canvas.");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // Params for render are simple object in newer types + canvas/ctx in specific ways
    // Cast to any if types are stubborn, or pass context/viewport as expected.
    // The previous error suggested strict checking.
    // pdfjs-dist types usually take { canvasContext, viewport }
    await page.render({ canvasContext: ctx, viewport }).promise;

    return { canvas, width: canvas.width, height: canvas.height };
}
