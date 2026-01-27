"use client";

import React, { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImageBlob } from "@/lib/image";

type Props = {
    imageSrc: string;
    onClose: () => void;
    onSave: (blob: Blob) => void;
};

export default function PhotoCropModal({ imageSrc, onClose, onSave }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedPixels, setCroppedPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const onCropComplete = useCallback((_area: any, areaPixels: any) => {
        setCroppedPixels(areaPixels);
    }, []);

    const handleSave = useCallback(async () => {
        if (!croppedPixels) return;
        try {
            const blob = await getCroppedImageBlob(imageSrc, croppedPixels);
            onSave(blob);
        } catch (e) {
            console.error("Error cropping image", e);
        }
    }, [croppedPixels, imageSrc, onSave]);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-4 space-y-3">
                <div className="font-bold">Recortar foto</div>

                <div className="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden rounded-lg">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={3 / 4}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div className="flex gap-2 justify-end">
                    <button className="px-4 py-2 rounded-lg border" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold" onClick={handleSave}>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
