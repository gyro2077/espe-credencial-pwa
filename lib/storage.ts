import { get, set, del } from "idb-keyval";
import { LS_KEYS } from "./storageKeys";

export type OverlayTransform = {
    // Normalizado 0..1 respecto a la zona recortada (credencial)
    x: number; // offset
    y: number;
    scale: number;
};

export type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};

export type CredentialCrop = Rect;
export type PhotoRect = Rect;

export async function savePdf(file: File) {
    await set(LS_KEYS.PDF_FILE, file);
    await set(LS_KEYS.PDF_NAME, file.name);
}

export async function loadPdf(): Promise<File | undefined> {
    return (await get(LS_KEYS.PDF_FILE)) as File | undefined;
}

export async function saveCredentialCrop(crop: CredentialCrop) {
    await set(LS_KEYS.CRED_CROP, crop);
}

export async function loadCredentialCrop(): Promise<CredentialCrop | undefined> {
    return (await get(LS_KEYS.CRED_CROP)) as CredentialCrop | undefined;
}

export async function savePhotoRect(rect: PhotoRect) {
    await set(LS_KEYS.PHOTO_RECT, rect);
}

export async function loadPhotoRect(): Promise<PhotoRect | undefined> {
    return (await get(LS_KEYS.PHOTO_RECT)) as PhotoRect | undefined;
}

// Store as ArrayBuffer to ensure persistence (avoiding potential Blob handle issues)
export async function saveOverlayPhoto(blob: Blob) {
    const buffer = await blob.arrayBuffer();
    await set(LS_KEYS.OVERLAY_PHOTO, { buffer, type: blob.type });
}

export async function loadOverlayPhoto(): Promise<Blob | undefined> {
    const data = await get(LS_KEYS.OVERLAY_PHOTO);
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
    await set(LS_KEYS.OVERLAY_TRANSFORM, t);
}

export async function loadOverlayTransform(): Promise<OverlayTransform | undefined> {
    return (await get(LS_KEYS.OVERLAY_TRANSFORM)) as OverlayTransform | undefined;
}

export async function resetWorkspace() {
    await del(LS_KEYS.CRED_CROP);
    await del(LS_KEYS.PHOTO_RECT);
    await del(LS_KEYS.OVERLAY_PHOTO);
    await del(LS_KEYS.OVERLAY_TRANSFORM);
    // Note: We intentionally do NOT clear the PDF here if we only want to reset the work ON the PDF.
    // But per requirements, "uploading NEW PDF" calls this.
    // If we want a full wipe including PDF, we'd delete PDF keys too.
    // But usually resetWorkspace implies cleaning the "edit state".
    // The upload function will overwrite the PDF key anyway.
}

export async function clearAll() {
    await del(LS_KEYS.PDF_FILE);
    await del(LS_KEYS.PDF_NAME);
    await resetWorkspace();
}
