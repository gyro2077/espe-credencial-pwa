"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// import PdfCredentialViewer from "@/components/PdfCredentialViewer"; // Static import removed
const PdfCredentialViewer = dynamic(() => import("@/components/PdfCredentialViewer"), { ssr: false });
import PhotoCropModal from "@/components/PhotoCropModal";
import { loadOverlayPhoto, loadPdf, saveOverlayPhoto } from "@/lib/storage";

export default function EditPage() {
    const router = useRouter();
    const [pdf, setPdf] = useState<File | null>(null);
    const [overlay, setOverlay] = useState<Blob | undefined>(undefined);
    const [modalSrc, setModalSrc] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const p = await loadPdf();
            if (!p) return router.push("/upload");
            setPdf(p);
            setOverlay(await loadOverlayPhoto());
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
