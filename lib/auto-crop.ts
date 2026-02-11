import { PDFDocument } from "pdf-lib";

// ============================================================================
// FORMAT-SPECIFIC TEMPLATES (PWA Offline-First Approach)
// ============================================================================

// Tamaños de página estándar (puntos PDF)
const PAGE_FORMATS = {
    A3: { width: 841.92, height: 1191.12 },
    LETTER: { width: 612, height: 792 },
    A4: { width: 595, height: 842 }
};

// Templates normalizados específicos por formato (0-1)
// Cada formato tiene su propia calibración para posicionamiento óptimo

const TEMPLATES = {
    // A3: PDF descargado desde desktop (Mi ESPE web)
    A3: {
        x: 0.050,   // ~42 pts margen (más centrado)
        y: 0.087,   // Posición vertical original
        w: 0.310,   // Ancho original
        h: 0.387    // Altura original
    },
    // LETTER: PDF descargado desde móvil (Mi ESPE app)
    // IMPORTANTE: Este es el formato más común para usuarios móviles  
    LETTER: {
        x: 0.070,   // ~43 pts margen (CENTRADO - más a la DERECHA)
        y: 0.087,   // Posición vertical original
        w: 0.310,   // Ancho original
        h: 0.387    // Altura original
    },
    // A4: Fallback si alguien lo usa
    A4: {
        x: 0.038,
        y: 0.087,
        w: 0.315,
        h: 0.387
    }
};

// Template por defecto (si no se detecta formato)
export const DEFAULT_TEMPLATE = TEMPLATES.A3;

// ============================================================================
// USER CALIBRATION (localStorage - PWA Persistent)
// ============================================================================

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Carga el template calibrado por el usuario (si existe).
 * PWA Offline: Usa localStorage para persistencia sin internet.
 */
export function loadUserTemplate(): Rect | null {
    try {
        if (typeof window === 'undefined') return null; // SSR safety
        const data = localStorage.getItem('credential-crop-template');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Error loading user template", e);
        return null;
    }
}

/**
 * Guarda el template calibrado por el usuario.
 * PWA Offline: Persiste en localStorage para futuras sesiones.
 */
export function saveUserTemplate(rect: Rect): void {
    try {
        if (typeof window === 'undefined') return; // SSR safety
        localStorage.setItem('credential-crop-template', JSON.stringify(rect));
        console.log("✅ User template saved:", rect);
    } catch (e) {
        console.error("Error saving user template", e);
    }
}

/**
 * Elimina el template del usuario (reset a factory).
 */
export function clearUserTemplate(): void {
    try {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('credential-crop-template');
        console.log("🔄 User template cleared");
    } catch (e) {
        console.error("Error clearing user template", e);
    }
}

// ============================================================================
// FORMAT DETECTION
// ============================================================================

type PageFormat = 'A3' | 'LETTER' | 'A4' | 'UNKNOWN';

/**
 * Detecta el formato del PDF basándose en su tamaño.
 * PWA Offline: Detección local sin dependencias externas.
 */
function detectPageFormat(width: number, height: number): PageFormat {
    const tolerance = 5; // Tolerancia en puntos

    // Detectar A3
    if (Math.abs(width - PAGE_FORMATS.A3.width) < tolerance &&
        Math.abs(height - PAGE_FORMATS.A3.height) < tolerance) {
        return 'A3';
    }

    // Detectar Letter
    if (Math.abs(width - PAGE_FORMATS.LETTER.width) < tolerance &&
        Math.abs(height - PAGE_FORMATS.LETTER.height) < tolerance) {
        return 'LETTER';
    }

    // Detectar A4
    if (Math.abs(width - PAGE_FORMATS.A4.width) < tolerance &&
        Math.abs(height - PAGE_FORMATS.A4.height) < tolerance) {
        return 'A4';
    }

    return 'UNKNOWN';
}

/**
 * Obtiene el template normalizado para un formato específico.
 */
function getTemplateForFormat(format: PageFormat): Rect {
    switch (format) {
        case 'A3':
            return TEMPLATES.A3;
        case 'LETTER':
            return TEMPLATES.LETTER;
        case 'A4':
            return TEMPLATES.A4;
        default:
            console.warn(`Unknown format, using default template`);
            return DEFAULT_TEMPLATE;
    }
}

// ============================================================================
// AUTO-DETECTION (Offline, Instant)
// ============================================================================

export type DetectionResult = {
    rect: Rect;
    source: 'user' | 'auto';
    confidence: number;
};

/**
 * Detecta automáticamente el área de la credencial en el PDF.
 * 
 * PWA Offline Strategy:
 * 1. Prioridad 1: Template del usuario (si calibró) → 100% confianza
 * 2. Prioridad 2: Template específico por formato (A3/Letter/A4) → Confianza estimada
 * 
 * @param file - Archivo PDF
 * @returns Rectángulo normalizado (0-1), fuente, y nivel de confianza
 */
export async function detectCredentialRect(file: File): Promise<DetectionResult> {
    try {
        // Prioridad 1: Template del usuario (máxima precisión)
        // RE-HABILITADO: Ahora que los templates por defecto funcionan bien,
        // el usuario puede calibrar manualmente para ajuste perfecto
        const userTemplate = loadUserTemplate();
        if (userTemplate) {
            return {
                rect: userTemplate,
                source: 'user',
                confidence: 1.0  // 100% confianza (usuario lo calibró manualmente)
            };
        }

        // Prioridad 2: Detectar formato y usar template específico
        const arrayBuffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(arrayBuffer);
        const page = doc.getPage(0);
        const { width, height } = page.getSize();

        // Detectar formato del PDF
        const format = detectPageFormat(width, height);
        const rect = getTemplateForFormat(format);

        console.log(`📄 PDF Format detected: ${format} (${width}x${height})`);
        console.log(`📏 Using template:`, rect);

        // Estimar confianza basada en aspect ratio
        // Credenciales típicas tienen aspect ratio w/h ≈ 0.57
        const expectedAspect = 0.57;
        const actualAspect = (rect.w * width) / (rect.h * height);
        const aspectDiff = Math.abs(expectedAspect - actualAspect);
        const confidence = Math.max(0.6, Math.min(1.0, 1 - aspectDiff / expectedAspect));

        return {
            rect,
            source: 'auto',
            confidence
        };

    } catch (e) {
        console.error("Error detecting credential rect", e);
        // Fallback: Devolver template por defecto con baja confianza
        return {
            rect: DEFAULT_TEMPLATE,
            source: 'auto',
            confidence: 0.5
        };
    }
}

// ============================================================================
// PDF CROPPING (Offline, Dynamic)
// ============================================================================

/**
 * Recorta la credencial del PDF usando coordenadas normalizadas.
 * Funciona con cualquier tamaño de PDF (A3, Letter, A4, etc.)
 * 
 * PWA Offline: 100% procesamiento en cliente, sin dependencias externas.
 * 
 * @param file - Archivo PDF original
 * @param rect - Rectángulo normalizado (0-1). Si no se provee, usa auto-detect
 * @returns Nuevo archivo PDF recortado
 */
export async function cropCredentialPdf(file: File, rect?: Rect): Promise<File> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer);
        const page = srcDoc.getPage(0);
        const { width, height } = page.getSize();

        // Usar rect proporcionado o auto-detectar
        const cropRect = rect || (await detectCredentialRect(file)).rect;

        // Convertir de normalizado (0-1) a coordenadas absolutas (puntos PDF)
        // Sistema de coordenadas PDF: (0,0) = esquina inferior izquierda
        const absoluteCrop = {
            left: cropRect.x * width,
            bottom: (1 - cropRect.y - cropRect.h) * height,
            width: cropRect.w * width,
            height: cropRect.h * height
        };

        console.log("📐 PDF Size:", { width, height });
        console.log("📏 Normalized rect:", cropRect);
        console.log("✂️ Absolute crop:", absoluteCrop);

        // Crear nuevo documento with el tamaño exacto del crop
        const outDoc = await PDFDocument.create();
        const outPage = outDoc.addPage([absoluteCrop.width, absoluteCrop.height]);

        // Embed la primera página del PDF original
        const [embeddedPage] = await outDoc.embedPages([page]);

        // Dibujar la página embebida con offset para que el crop quede en (0,0)
        outPage.drawPage(embeddedPage, {
            x: -absoluteCrop.left,
            y: -absoluteCrop.bottom,
            width: embeddedPage.width,
            height: embeddedPage.height,
        });

        // Guardar y retornar como File
        const outBytes = await outDoc.save();
        return new File([outBytes as BlobPart], `cropped_${file.name}`, { type: "application/pdf" });

    } catch (e) {
        console.error("Error cropping PDF", e);
        throw new Error("Failed to crop PDF");
    }
}
