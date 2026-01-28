"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// import PdfCredentialViewer from "@/components/PdfCredentialViewer"; // Static import removed
const PdfCredentialViewer = dynamic(() => import("@/components/PdfCredentialViewer"), { ssr: false });
import PhotoCropModal from "@/components/PhotoCropModal";
import PhotoSlotModal from "@/components/PhotoSlotModal";
import { loadOverlayPhoto, loadPdf, saveOverlayPhoto, loadCredentialCrop, loadPhotoRect, savePhotoRect } from "@/lib/storage";

export default function EditPage() {
    const router = useRouter();
    const [pdf, setPdf] = useState<File | null>(null);
    const [overlay, setOverlay] = useState<Blob | undefined>(undefined);
    const [modalSrc, setModalSrc] = useState<string | null>(null);

    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const [slotModalSrc, setSlotModalSrc] = useState<string | null>(null);
    const [currentPhotoRect, setCurrentPhotoRect] = useState<any>(null); // Type lazily as any, but should be Rect

    const [targetAspect, setTargetAspect] = useState<number>(3 / 4);

    useEffect(() => {
        (async () => {
            const p = await loadPdf();
            if (!p) return router.push("/upload");
            setPdf(p);
            setOverlay(await loadOverlayPhoto());

            // Calculate Aspect Ratio from Calibration Data
            try {
                // We need the PDF page dimensions to translate normalized coords to real aspect ratio
                // We can use the helper to get dimensions at scale=1
                const { renderPdfPageToCanvas } = await import("@/lib/pdf");
                const { width, height } = await renderPdfPageToCanvas(p, 1, 1);

                const crop = await loadCredentialCrop() || { x: 0, y: 0, w: 1, h: 1 };
                const photo = await loadPhotoRect() || { x: 0, y: 0, w: 1, h: 1 };

                // Real dimensions of the cropped credential
                const credW = width * crop.w;
                const credH = height * crop.h;

                // Real dimensions of the photo slot
                const slotW = credW * photo.w;
                const slotH = credH * photo.h;

                setCurrentPhotoRect(photo);
                setTargetAspect(slotW / slotH);
            } catch (e) {
                console.error("Error calculating aspect ratio", e);
            }
        })();
    }, [router]);

    // Recalculate aspect when photo rect changes (from Slot Modal)
    const handleSlotSave = async (newRect: any) => {
        setIsSlotModalOpen(false);
        setCurrentPhotoRect(newRect);
        await savePhotoRect(newRect);

        // Recalculate Aspect
        if (pdf) {
            const { renderPdfPageToCanvas } = await import("@/lib/pdf");
            // Assuming we still have the crop
            const crop = await loadCredentialCrop() || { x: 0, y: 0, w: 1, h: 1 };
            const { width, height } = await renderPdfPageToCanvas(pdf, 1, 1);

            const credW = width * crop.w;
            const credH = height * crop.h;

            const slotW = credW * newRect.w;
            const slotH = credH * newRect.h;
            setTargetAspect(slotW / slotH);

            // Refresh page to force Viewer update? Or Viewer should listen to prop?
            // Viewer reads from storage internally in many places, but we might need to trigger a reload.
            // Given the Viewer architecture (it might re-read on mount or prop change), 
            // passing the new rect might be tricky if it doesn't accept it as prop.
            // Simplest is to reload the window or force a re-mount.
            // Let's force re-mount by key or just accept that 'overlay' update might not match perfectly until refresh.
            // Actually, PdfCredentialViewer might not react to storage changes.
            // Let's create a key to force re-render of viewer.
        }
    };

    // Key to force re-render viewer
    const [viewerKey, setViewerKey] = useState(0);
    useEffect(() => { setViewerKey(k => k + 1) }, [targetAspect]); // Refresh viewer when aspect changes

    if (!pdf) return <main className="min-h-screen p-6 flex items-center justify-center">Cargando…</main>;

    return (
        <main className="min-h-screen p-6 flex flex-col items-center gap-6 bg-slate-50">
            <div className="text-center">
                <h2 className="text-xl font-bold">Vista Previa</h2>
                <p className="text-sm text-slate-500">Asegúrate de que la credencial se vea bien.</p>
            </div>

            <PdfCredentialViewer key={viewerKey} pdfFile={pdf} overlayBlob={overlay} mode="edit" />

            <div className="flex flex-col w-full max-w-md gap-3">
                <button
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 font-bold text-slate-700 shadow-sm active:scale-95 transition"
                    onClick={async () => {
                        // We need the BASE credential image for the Slot Modal.
                        // We can generate it from PDF + Crop.
                        if (!pdf) return;
                        const { renderPdfPageToCanvas } = await import("@/lib/pdf");
                        // We need to render the CROPPED Credential.
                        // Actually DraggableCrop expects an image.
                        // Let's reuse logic from calibrate/page.ts step 1 confirm.
                        // But easier: Render full page, crop canvas?

                        // Wait, PhotoSlotModal takes 'src'. 
                        // The 'src' should be the CREDENTIAL image (already cropped from PDF).
                        // Let's generate it on the fly.

                        try {
                            const crop = await loadCredentialCrop() || { x: 0, y: 0, w: 1, h: 1 };
                            const { canvas } = await renderPdfPageToCanvas(pdf, 1, 2); // Scale 2 for good quality
                            const img = document.createElement("img");
                            img.src = canvas.toDataURL();
                            await new Promise(r => img.onload = r);

                            const c2 = document.createElement("canvas");
                            const ctx = c2.getContext("2d");

                            const sx = crop.x * img.naturalWidth;
                            const sy = crop.y * img.naturalHeight;
                            const sw = crop.w * img.naturalWidth;
                            const sh = crop.h * img.naturalHeight;

                            c2.width = sw;
                            c2.height = sh;

                            ctx?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                            setSlotModalSrc(c2.toDataURL());
                            setIsSlotModalOpen(true);
                        } catch (e) {
                            console.error(e);
                        }
                    }}
                >
                    📐 Ajustar recuadro de foto
                </button>

                <label className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 cursor-pointer shadow-sm active:scale-95 transition">
                    📷 Cambiar foto
                    <input
                        className="hidden"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const url = URL.createObjectURL(f);
                            setModalSrc(url);
                        }}
                    />
                </label>

                <button
                    className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition"
                    onClick={() => router.push("/card")}
                >
                    Guardar y continuar →
                </button>
            </div>

            {modalSrc && (
                <PhotoCropModal
                    imageSrc={modalSrc}
                    aspect={targetAspect}
                    onClose={() => {
                        URL.revokeObjectURL(modalSrc);
                        setModalSrc(null);
                    }}
                    onSave={async (blob) => {
                        await saveOverlayPhoto(blob);
                        setOverlay(blob);
                        URL.revokeObjectURL(modalSrc);
                        setModalSrc(null);
                    }}
                />
            )}

            {isSlotModalOpen && slotModalSrc && currentPhotoRect && (
                <PhotoSlotModal
                    open={isSlotModalOpen}
                    src={slotModalSrc}
                    initialRect={currentPhotoRect}
                    onCancel={() => setIsSlotModalOpen(false)}
                    onSave={handleSlotSave}
                />
            )}
        </main>
    );
}
