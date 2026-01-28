import { PDFDocument } from "pdf-lib";

// Coordenadas fijas de la plantilla ("Golden Template")
// Sistema de coordenadas PDF: (0,0) es la esquina inferior izquierda.
export const TEMPLATE_CROP = {
    left: 39.6,
    bottom: 627.0,
    width: 261.36,
    height: 460.8,
};

/**
 * Attempts to auto-crop the credential from the PDF.
 * Currently uses fixed template coordinates, but normalized to the page size.
 */
export async function detectCredentialRect(file: File): Promise<{ x: number, y: number, w: number, h: number } | null> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(arrayBuffer);
        const page = doc.getPage(0);
        const { width, height } = page.getSize();

        // Convert PDF Point coordinates (Bottom-Left origin) to Normalized (Top-Left origin 0..1)
        // PDF y=0 is bottom. Top of Rect in PDF = bottom + height.
        // Screen y=0 is top.
        // Screen y = (PageHeight - TopOfRect) / PageHeight

        const rectTop = TEMPLATE_CROP.bottom + TEMPLATE_CROP.height;
        const rectLeft = TEMPLATE_CROP.left;

        const x = rectLeft / width;
        const y = (height - rectTop) / height;
        const w = TEMPLATE_CROP.width / width;
        const h = TEMPLATE_CROP.height / height;

        return { x, y, w, h };
    } catch (e) {
        console.error("Error detecting credential rect", e);
        return null;
    }
}

/**
 * Attempts to auto-crop the credential from the PDF using fixed template coordinates.
 * Returns a NEW PDF file containing only the cropped page.
 */
export async function cropCredentialPdf(file: File): Promise<File> {
    const arrayBuffer = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer);

    // Create a new document with the exact size of the credential
    const outDoc = await PDFDocument.create();
    const outPage = outDoc.addPage([TEMPLATE_CROP.width, TEMPLATE_CROP.height]);

    // Embed the first page of the source PDF
    // Note: We assume the credential is on Page 1 (index 0)
    const [embeddedPage] = await outDoc.embedPages([srcDoc.getPage(0)]);

    // Draw the embedded page shifted so the credential aligns with the new page
    // The new page origin (0,0) is bottom-left.
    // We want the point (left, bottom) of the original PDF to be at (0,0) of the new page.
    // So we shift by (-left, -bottom).
    outPage.drawPage(embeddedPage, {
        x: -TEMPLATE_CROP.left,
        y: -TEMPLATE_CROP.bottom,
        width: embeddedPage.width,
        height: embeddedPage.height,
    });

    // Save and return as File
    const outBytes = await outDoc.save();
    return new File([outBytes as BlobPart], `cropped_${file.name}`, { type: "application/pdf" });
}
