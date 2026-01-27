import { get, set, del } from "idb-keyval";

export type OverlayTransform = {
    // Normalizado 0..1 respecto a la zona recortada (credencial)
    x: number; // offset
    y: number;
    scale: number;
};

const KEYS = {
    pdf: "espe_pdf_blob",
    pdfName: "espe_pdf_name",
    overlayPhoto: "espe_overlay_photo_blob",
    overlayTransform: "espe_overlay_transform",
    credentialCrop: "espe_credential_crop",
    photoRect: "espe_photo_rect",
} as const;

export type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};

export type CredentialCrop = Rect;
export type PhotoRect = Rect;

export async function savePdf(file: File) {
    await set(KEYS.pdf, file);
    await set(KEYS.pdfName, file.name);
}

export async function loadPdf(): Promise<File | undefined> {
    return (await get(KEYS.pdf)) as File | undefined;
}

export async function saveCredentialCrop(crop: CredentialCrop) {
    await set(KEYS.credentialCrop, crop);
}

export async function loadCredentialCrop(): Promise<CredentialCrop | undefined> {
    return (await get(KEYS.credentialCrop)) as CredentialCrop | undefined;
}

export async function savePhotoRect(rect: PhotoRect) {
    await set(KEYS.photoRect, rect);
}

export async function loadPhotoRect(): Promise<PhotoRect | undefined> {
    return (await get(KEYS.photoRect)) as PhotoRect | undefined;
}

// Store as ArrayBuffer to ensure persistence (avoiding potential Blob handle issues)
export async function saveOverlayPhoto(blob: Blob) {
    const buffer = await blob.arrayBuffer();
    await set(KEYS.overlayPhoto, { buffer, type: blob.type });
}

export async function loadOverlayPhoto(): Promise<Blob | undefined> {
    const data = await get(KEYS.overlayPhoto);
    if (!data) return undefined;

    // Backward compatibility: If it was stored as a Blob directly
    if (data instanceof Blob) return data;

    // New format: { buffer, type }
    if (data.buffer && data.type) {
        return new Blob([data.buffer], { type: data.type });
    }

    return undefined;
}

export async function saveOverlayTransform(t: OverlayTransform) {
    await set(KEYS.overlayTransform, t);
}

export async function loadOverlayTransform(): Promise<OverlayTransform | undefined> {
    return (await get(KEYS.overlayTransform)) as OverlayTransform | undefined;
}

export async function clearAll() {
    await del(KEYS.pdf);
    await del(KEYS.pdfName);
    await del(KEYS.overlayPhoto);
    await del(KEYS.overlayTransform);
    await del(KEYS.credentialCrop);
    await del(KEYS.photoRect);
}
