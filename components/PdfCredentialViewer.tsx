"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { renderPdfPageToCanvas } from "@/lib/pdf";
import { DEFAULT_CREDENTIAL_CROP, DEFAULT_PHOTO_RECT } from "@/lib/constants";
import { loadCredentialCrop, loadPhotoRect, loadOverlayPhoto, type CredentialCrop, type PhotoRect } from "@/lib/storage";

type Props = {
    pdfFile: File;
    overlayBlob?: Blob;
    mode?: "edit" | "card";
};

export default function PdfCredentialViewer({ pdfFile, overlayBlob, mode = "edit" }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [baseCanvasUrl, setBaseCanvasUrl] = useState<string | null>(null);
    const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
    const [crop, setCrop] = useState<CredentialCrop>(DEFAULT_CREDENTIAL_CROP);
    const [photoRect, setPhotoRect] = useState<PhotoRect>(DEFAULT_PHOTO_RECT);

    // Internal state for overlay if not passed via props (or to handle reload persistence)
    const [storedOverlay, setStoredOverlay] = useState<Blob | undefined>(undefined);

    // Use the prop if available (editing mode), otherwise fall back to stored
    const activeOverlay = overlayBlob || storedOverlay;

    // Manage Blob URL in state to handle Strict Mode lifecycle correctly
    const [overlayUrl, setOverlayUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!activeOverlay) {
            setOverlayUrl(null);
            return;
        }
        const url = URL.createObjectURL(activeOverlay);
        setOverlayUrl(url);

        // Cleanup: Revoke ONLY when activeOverlay changes or component unmounts
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [activeOverlay]);

    useEffect(() => {
        let isActive = true;
        (async () => {
            // Load custom credentials
            const savedCrop = await loadCredentialCrop();
            if (isActive && savedCrop) setCrop(savedCrop);

            const savedPhoto = await loadPhotoRect();
            if (isActive && savedPhoto) setPhotoRect(savedPhoto);

            // Load overlay from storage if not provided in props (fixes reload issue)
            if (!overlayBlob) {
                const savedOverlay = await loadOverlayPhoto();
                if (isActive && savedOverlay) setStoredOverlay(savedOverlay);
            }
        })();
        return () => { isActive = false; };
    }, [overlayBlob]);

    useEffect(() => {
        let revoked: string | null = null;
        let isActive = true;

        (async () => {
            try {
                const { canvas, width, height } = await renderPdfPageToCanvas(pdfFile, 1, 2);
                if (!isActive) return;

                const url = canvas.toDataURL("image/png");
                revoked = url;
                setBaseCanvasUrl(url);
                setDims({ w: width, h: height });
            } catch (e) {
                console.error("Error renderizando PDF", e);
            }
        })();

        return () => {
            isActive = false;
            // Canvas URL doesn't necessarily need revoke for small data URIs, but consistent cleanup is good if it was a blob
        };
    }, [pdfFile]);

    if (!baseCanvasUrl || !dims) {
        return <div className="w-full rounded-xl bg-white/70 p-6 text-sm">Cargando PDF…</div>;
    }

    // Calculate percentages based on the active crop (default or custom)
    const viewWidthPct = crop.w * 100;
    const viewHeightPct = crop.h * 100;
    const offsetXPct = crop.x * 100;
    const offsetYPct = crop.y * 100;

    // Foto dentro del recorte (normalizado al recorte)
    const photo = photoRect;

    return (
        <div ref={containerRef} className="w-full max-w-md">
            <div
                className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg backdrop-blur-sm"
                // Force aspect ratio of the container to match the CROP's aspect ratio
                style={{
                    aspectRatio: `${crop.w} / ${crop.h}`
                }}
            >
                {/* The PDF Image is positioned absolutely to "show through" the window defined by the container */}
                <div
                    className="absolute inset-0 w-full h-full"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={baseCanvasUrl}
                        alt="Credencial PDF"
                        className="absolute max-w-none"
                        style={{
                            // The image size relative to the container width.
                            // If container width is 100% of the cropped width (Wc),
                            // and full image width is Wf, then Wc = Wf * crop.w
                            // So, Wf = Wc / crop.w.
                            // Taking container as 100% (1 unit), Image Width = 1 / crop.w
                            width: `${100 / crop.w}%`,
                            height: `${100 / crop.h}%`,

                            // Position relative to the container's top-left
                            left: `-${offsetXPct / crop.w}%`,
                            top: `-${offsetYPct / crop.h}%`,

                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    />

                    {/* Overlay de foto */}
                    {activeOverlay && overlayUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={overlayUrl}
                            alt="Foto superpuesta"
                            className="absolute object-cover rounded-sm z-10"
                            style={{
                                left: `${photo.x * 100}%`,
                                top: `${photo.y * 100}%`,
                                width: `${photo.w * 100}%`,
                                height: `${photo.h * 100}%`,
                                border: mode === "edit" ? "2px solid rgba(17,82,212,0.35)" : "none",
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
