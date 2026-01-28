"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadPdf, saveCredentialCrop, savePhotoRect } from "@/lib/storage";
import { renderPdfPageToCanvas } from "@/lib/pdf";
import { DEFAULT_CREDENTIAL_CROP, DEFAULT_PHOTO_RECT } from "@/lib/constants";
import DraggableCrop from "@/components/DraggableCrop";

export default function CalibratePage() {
    const router = useRouter();
    const [step, setStep] = useState<"credential" | "photo" | "verify_autocrop">("credential");
    const [pdf, setPdf] = useState<File | null>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [croppedBase64, setCroppedBase64] = useState<string | null>(null);

    // State for DraggableCrop (Normalized 0..1)
    const [cropRect, setCropRect] = useState(DEFAULT_CREDENTIAL_CROP);

    // Load PDF for Step 1
    useEffect(() => {
        (async () => {
            const p = await loadPdf();
            if (!p) return router.push("/upload");
            setPdf(p);

            // Auto-Crop Execution
            try {
                // If it's a fresh load (Step 1), try to auto-crop immediately
                if (step === "credential") {
                    // Check if we already have a crop? No, let's assume raw PDF.
                    // But we must be careful not to loop.
                    // We can do the crop, save it to state/storage, and visualize it.
                    const { cropCredentialPdf } = await import("@/lib/auto-crop");
                    try {
                        const croppedPdf = await cropCredentialPdf(p);

                        // Render the CROPPED PDF to verify
                        const { canvas } = await renderPdfPageToCanvas(croppedPdf, 1, 2);
                        const croppedUrl = canvas.toDataURL("image/jpeg");

                        // Store this temporarily to show the user "Is this correct?"
                        setCroppedBase64(croppedUrl);
                        setStep("verify_autocrop"); // New intermediate state
                        return;
                    } catch (cropErr) {
                        console.error("Auto-crop failed, falling back to manual", cropErr);
                        // Fallthrough to manual load
                    }
                }
            } catch (e) {
                console.error("Error in auto-crop flow", e);
            }

            try {
                const { canvas } = await renderPdfPageToCanvas(p, 1, 1.5);
                setImgSrc(canvas.toDataURL("image/jpeg"));
            } catch (e) {
                console.error("Error loading PDF", e);
            }
        })();
    }, [router, step]);

    // Step 1: Confirm Credential Crop
    const handleConfirmCredential = async () => {
        if (!imgSrc) return;

        // Save Credential Crop
        await saveCredentialCrop(cropRect);

        // Generate cropped image for Step 2
        try {
            const img = new Image();
            img.src = imgSrc;
            await new Promise((resolve) => (img.onload = resolve));

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Map normalized rect to pixel coordinates
            const sx = cropRect.x * img.naturalWidth;
            const sy = cropRect.y * img.naturalHeight;
            const sWidth = cropRect.w * img.naturalWidth;
            const sHeight = cropRect.h * img.naturalHeight;

            canvas.width = sWidth;
            canvas.height = sHeight;

            ctx?.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

            setCroppedBase64(canvas.toDataURL("image/jpeg"));

            // Reset for Step 2
            setStep("photo");
            setCropRect(DEFAULT_PHOTO_RECT); // Start with default photo position
        } catch (e) {
            console.error("Error generating crop preview", e);
        }
    };

    const handleConfirmAutoCrop = async () => {
        if (!pdf) return;

        try {
            const { cropCredentialPdf } = await import("@/lib/auto-crop");
            const newPdf = await cropCredentialPdf(pdf);

            // Update Storage with new PDF
            const { savePdf, saveCredentialCrop } = await import("@/lib/storage");
            await savePdf(newPdf);

            // The crop is now the FULL page (since we physically cropped it)
            await saveCredentialCrop({ x: 0, y: 0, w: 1, h: 1 });

            setStep("photo");
            setCropRect(DEFAULT_PHOTO_RECT);
        } catch (e) {
            console.error("Failed to commit auto-crop", e);
        }
    };

    // Step 2: Confirm Photo Slot
    const handleConfirmPhoto = async () => {
        await savePhotoRect(cropRect);
        router.push("/edit");
    };

    const isStep1 = step === "credential";
    const isAutoVerifying = step === "verify_autocrop";

    // Determine what to show
    let currentSrc = null;
    if (isAutoVerifying) currentSrc = croppedBase64;
    else if (isStep1) currentSrc = imgSrc;
    else currentSrc = croppedBase64;


    if (!currentSrc) return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;

    return (
        <main className="fixed inset-0 bg-black flex flex-col z-50">
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent text-white pointer-events-none">
                <h1 className="text-lg font-bold">
                    {isAutoVerifying ? "Verificar Recorte Automático" :
                        isStep1 ? "Ajuste Manual" : "Paso 2: Área de Foto"}
                </h1>
                <p className="text-sm opacity-90">
                    {isAutoVerifying ? "¿Se ve bien la credencial? Si no, usa el ajuste manual." :
                        isStep1 ? "Mueve los 4 puntos para cubrir TU credencial." :
                            "Mueve los 4 puntos para marcar donde va la FOTO."}
                </p>
            </div>

            <div className="relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center">
                {/* Container specifically sized to hold the component */}
                <div className="relative w-full h-full max-w-2xl">
                    {isAutoVerifying ? (
                        // Static Preview for verification
                        <div className="w-full h-full flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={currentSrc}
                                alt="Auto Crop Check"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    ) : (
                        <DraggableCrop
                            src={currentSrc}
                            rect={cropRect}
                            onChange={setCropRect}
                        />
                    )}
                </div>
            </div>

            <div className="p-4 bg-white flex flex-col gap-3">
                {isAutoVerifying ? (
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                // Fallback to Manual Step 1
                                setStep("credential");
                                // We need to ensure we show the ORIGINAL PDF (imgSrc), which is already set.
                            }}
                            className="flex-1 py-4 bg-slate-100 text-slate-800 font-bold rounded-xl active:scale-95 transition"
                        >
                            Ajustar Manualmente
                        </button>
                        <button
                            onClick={handleConfirmAutoCrop}
                            className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition shadow-lg"
                        >
                            ¡Se ve bien!
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={isStep1 ? handleConfirmCredential : handleConfirmPhoto}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition shadow-lg text-lg"
                    >
                        {isStep1 ? "Siguiente Paso →" : "Finalizar"}
                    </button>
                )}
            </div>
        </main>
    );
}
