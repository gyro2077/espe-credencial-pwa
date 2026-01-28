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

    // Wake Lock Logic
    useEffect(() => {
        let lock: any;
        (async () => {
            try {
                if ("wakeLock" in navigator) {
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

    if (!pdf) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando...</div>;

    return (
        <main className="min-h-screen bg-black text-white flex flex-col">
            <div className="p-4 flex justify-between items-center shrink-0">
                <div className="flex gap-2">
                    <button onClick={() => router.push("/")} className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition">← Inicio</button>
                    <button onClick={() => router.push("/edit")} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold hover:bg-blue-700 transition">Editar Foto</button>
                </div>

                <button
                    className="p-2 text-white/50 hover:text-white transition"
                    onClick={() => {
                        if (!document.fullscreenElement) {
                            document.documentElement.requestFullscreen?.();
                        } else {
                            document.exitFullscreen?.();
                        }
                    }}
                    title="Pantalla Completa"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                {/* Reuse the viewer in 'card' mode for the final polished look if requested, or 'preview' */}
                <PdfCredentialViewer pdfFile={pdf} overlayBlob={overlay} mode="card" />
            </div>
            <p className="text-xs text-white/30 text-center pb-4 select-none">
                Documento generado localmente.
            </p>
        </main>
    );
}
