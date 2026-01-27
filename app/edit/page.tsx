"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// import PdfCredentialViewer from "@/components/PdfCredentialViewer"; // Static import removed
const PdfCredentialViewer = dynamic(() => import("@/components/PdfCredentialViewer"), { ssr: false });
import PhotoCropModal from "@/components/PhotoCropModal";
import { loadOverlayPhoto, loadPdf, saveOverlayPhoto, loadCredentialCrop, loadPhotoRect } from "@/lib/storage";

export default function EditPage() {
    const router = useRouter();
    const [pdf, setPdf] = useState<File | null>(null);
    const [overlay, setOverlay] = useState<Blob | undefined>(undefined);
    const [modalSrc, setModalSrc] = useState<string | null>(null);

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

                setTargetAspect(slotW / slotH);
            } catch (e) {
                console.error("Error calculating aspect ratio", e);
            }
        })();
    }, [router]);

    if (!pdf) return <main className="min-h-screen p-6 flex items-center justify-center">Cargando…</main>;

    return (
        <main className="min-h-screen p-6 flex flex-col items-center gap-6 bg-slate-50">
            <div className="text-center">
                <h2 className="text-xl font-bold">Vista Previa</h2>
                <p className="text-sm text-slate-500">Asegúrate de que la credencial se vea bien.</p>
            </div>

            <PdfCredentialViewer pdfFile={pdf} overlayBlob={overlay} mode="edit" />

            <div className="flex flex-col w-full max-w-md gap-3">
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
        </main>
    );
}
