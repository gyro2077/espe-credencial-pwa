"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
// import PdfCredentialViewer from "@/components/PdfCredentialViewer"; // Static import removed
const PdfCredentialViewer = dynamic(() => import("@/components/PdfCredentialViewer"), { ssr: false });
import { loadOverlayPhoto, loadPdf } from "@/lib/storage";

export default function CardPage() {
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

    useEffect(() => {
        // Wake Lock
        let lock: any;
        (async () => {
            try {
                if ("wakeLock" in navigator) {
                    // navigator.wakeLock type is available

                    lock = await navigator.wakeLock.request("screen");
                }
            } catch (e) {
                console.log("Wake Lock no disponible o falló", e);
            }
        })();

        return () => {
            try { lock?.release(); } catch { }
        };
    }, []);

    if (!pdf) return <main className="min-h-screen p-6 flex items-center justify-center">Cargando…</main>;

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
            {/* Botón de regreso discreto */}
            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={() => router.push("/edit")}
                    className="p-2 text-white/50 hover:text-white"
                >
                    ←
                </button>
            </div>

            {/* Botón fullscreen discreto */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    className="p-2 text-white/50 hover:text-white"
                    onClick={() => {
                        if (!document.fullscreenElement) {
                            document.documentElement.requestFullscreen?.();
                        } else {
                            document.exitFullscreen?.();
                        }
                    }}
                >
                    ⛶
                </button>
            </div>

            <div className="w-full max-w-md flex flex-col items-center gap-4">
                <PdfCredentialViewer pdfFile={pdf} overlayBlob={overlay} mode="card" />

                <p className="text-xs text-white/30 text-center select-none">
                    Documento generado localmente.
                </p>
            </div>
        </main>
    );
}
