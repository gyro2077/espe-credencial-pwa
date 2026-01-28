"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadPdf, saveCredentialCrop, savePhotoRect } from "@/lib/storage";
import { renderPdfPageToCanvas } from "@/lib/pdf";
import { DEFAULT_CREDENTIAL_CROP, DEFAULT_PHOTO_RECT } from "@/lib/constants";
import DraggableCrop from "@/components/DraggableCrop";
import { detectCredentialRect } from "@/lib/auto-crop";

export default function CalibratePage() {
    const router = useRouter();
    const [step, setStep] = useState<"credential" | "photo" | "verify_autocrop">("credential");
    const [pdf, setPdf] = useState<File | null>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [croppedBase64, setCroppedBase64] = useState<string | null>(null);

    // State for DraggableCrop (Normalized 0..1)
    const [cropRect, setCropRect] = useState(DEFAULT_CREDENTIAL_CROP);
    // Persist the auto-detected rect for "Restablecer" functionality
    const [autoRect, setAutoRect] = useState(DEFAULT_CREDENTIAL_CROP);

    // Helper to generate preview
    const generatePreview = async (src: string, rect: typeof DEFAULT_CREDENTIAL_CROP) => {
        const img = new Image();
        img.src = src;
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const sx = rect.x * img.naturalWidth;
        const sy = rect.y * img.naturalHeight;
        const sWidth = rect.w * img.naturalWidth;
        const sHeight = rect.h * img.naturalHeight;

        canvas.width = sWidth;
        canvas.height = sHeight;

        ctx?.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
        return canvas.toDataURL("image/jpeg");
    };

    // Step 1: Initialize
    useEffect(() => {
        (async () => {
            if (pdf) return; // Already loaded? (State check depends on how router loads, but okay)

            const p = await loadPdf();
            if (!p) return router.push("/upload");
            setPdf(p);

            try {
                // 1. Render Full Page
                const { canvas } = await renderPdfPageToCanvas(p, 1, 1.5);
                const fullPageImg = canvas.toDataURL("image/jpeg");
                setImgSrc(fullPageImg);

                // 2. Detect Crop (or use Default)
                // Only run detection if we are initializing (step === "credential" or "verify_autocrop" but only once)
                // Actually, just run it if we don't have a crop verification yes.

                let initialRect = DEFAULT_CREDENTIAL_CROP;
                const detected = await detectCredentialRect(p);
                if (detected) {
                    initialRect = detected;
                }

                setAutoRect(initialRect);
                setCropRect(initialRect);

                // 3. Generate Preview immediately
                const previewUrl = await generatePreview(fullPageImg, initialRect);
                setCroppedBase64(previewUrl);

                // 4. Set state to Verify (Friendly Mode)
                setStep("verify_autocrop");

            } catch (e) {
                console.error("Error initializing calibration", e);
            }
        })();
    }, [router]); // Remove 'step' dependency to avoid loops, explicit init logic

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
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-lg font-bold">
                            {isAutoVerifying ? "Vista Previa" :
                                isStep1 ? "Ajuste Manual" : "Paso 2: Área de Foto"}
                        </h1>
                        <p className="text-sm opacity-90">
                            {isAutoVerifying ? "Así se verá tu credencial. ¿Está correcta?" :
                                isStep1 ? "Ajusta el recuadro para cubrir toda la credencial." :
                                    "Mueve el recuadro para marcar donde va la FOTO."}
                        </p>
                    </div>

                </div>
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
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleConfirmCredential}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition shadow-lg text-lg"
                        >
                            Usar recorte automático
                        </button>
                        <button
                            onClick={() => {
                                setStep("credential");
                            }}
                            className="w-full py-2 text-blue-600 font-semibold active:opacity-70 transition"
                        >
                            Ajustar recorte
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {isStep1 && (
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setStep("verify_autocrop")}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
                                >
                                    Volver
                                </button>
                                <button
                                    onClick={() => setCropRect(autoRect)}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium flex-1"
                                >
                                    Restablecer a automático
                                </button>
                            </div>
                        )}
                        <button
                            onClick={isStep1 ? handleConfirmCredential : handleConfirmPhoto}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition shadow-lg text-lg"
                        >
                            {isStep1 ? "Siguiente Paso →" : "Finalizar (Guardar)"}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
