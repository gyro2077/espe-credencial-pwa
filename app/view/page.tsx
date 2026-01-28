"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadPdf, loadOverlayPhoto } from "@/lib/storage";
import dynamic from "next/dynamic";

const PdfCredentialViewer = dynamic(() => import("@/components/PdfCredentialViewer"), { ssr: false });

export default function ViewPage() {
    const router = useRouter();
    const [pdf, setPdf] = useState<File | null>(null);
    const [overlay, setOverlay] = useState<Blob | undefined>(undefined);

    useEffect(() => {
        (async () => {
            const p = await loadPdf();
            if (!p) return router.push("/upload");
            setPdf(p);
            setOverlay(await loadOverlayPhoto());
        })();
    }, [router]);

    if (!pdf) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando...</div>;

    return (
        <main className="min-h-screen bg-black text-white flex flex-col">
            <div className="p-4 flex gap-2 shrink-0">
                <button onClick={() => router.push("/")} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium">← Inicio</button>
                <button onClick={() => router.push("/edit")} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold">Editar Foto</button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                {/* Reuse the viewer in 'preview' mode (default) */}
                <PdfCredentialViewer pdfFile={pdf} overlayBlob={overlay} mode="preview" />
            </div>
        </main>
    );
}
