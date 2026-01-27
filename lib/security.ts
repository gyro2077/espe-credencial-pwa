export const MAX_PDF_BYTES = 5 * 1024 * 1024;

export async function validatePdfFile(file: File): Promise<string | null> {
    if (file.size > MAX_PDF_BYTES) return "El PDF supera 5MB.";
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return "Archivo inválido. Solo PDF.";
    }

    // Magic bytes: "%PDF-"
    const slice = file.slice(0, 5);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const header = String.fromCharCode(...bytes);

    if (header !== "%PDF-") return "El archivo no parece ser un PDF real.";
    return null;
}
