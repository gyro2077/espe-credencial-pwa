"use client";
import { useEffect, useState } from "react";
import DraggableCrop from "@/components/DraggableCrop";
import { DEFAULT_PHOTO_RECT } from "@/lib/constants";

type Rect = { x: number; y: number; w: number; h: number };

export default function PhotoSlotModal({
    open,
    src,
    initialRect,
    onCancel,
    onSave,
}: {
    open: boolean;
    src: string;
    initialRect: Rect;
    onCancel: () => void;
    onSave: (rect: Rect) => void;
}) {
    const [draftRect, setDraftRect] = useState<Rect>(initialRect);

    useEffect(() => {
        if (open) setDraftRect(initialRect);
    }, [open, initialRect]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 right-0 p-4 text-white bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <h2 className="text-lg font-bold">Ajustar área de foto</h2>
                <p className="text-sm opacity-80">Mueve el recuadro para marcar EXACTAMENTE dónde debe ir tu foto.</p>
            </div>

            <div className="flex-1 w-full flex items-center justify-center p-4">
                <div className="relative w-full h-full max-w-2xl">
                    {/* We pass 'src' which is the base credential image */}
                    <DraggableCrop src={src} rect={draftRect} onChange={setDraftRect} />
                </div>
            </div>

            <div className="w-full p-4 bg-white flex flex-col md:flex-row gap-3">
                <div className="flex flex-1 gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700 active:scale-95 transition"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={() => setDraftRect(DEFAULT_PHOTO_RECT)}
                        className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700 active:scale-95 transition"
                    >
                        Restablecer
                    </button>
                </div>

                <button
                    onClick={() => onSave(draftRect)}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition shadow-lg"
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
}
