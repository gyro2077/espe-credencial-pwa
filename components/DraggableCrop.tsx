"use client";

import { useEffect, useRef, useState } from "react";

type Rect = { x: number; y: number; w: number; h: number };

type Props = {
    src: string;
    rect: Rect;
    onChange: (rect: Rect) => void;
    aspect?: number;
};

export default function DraggableCrop({ src, rect, onChange, aspect }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);

    // Interaction State
    const [dragging, setDragging] = useState<"tl" | "tr" | "bl" | "br" | "move" | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startRect, setStartRect] = useState<Rect | null>(null);

    // Handle Image Load to get natural dimensions
    const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setImgDims({ w: naturalWidth, h: naturalHeight });
    };

    const getClientPos = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return { x: clientX, y: clientY };
    };

    const handleStart = (type: "tl" | "tr" | "bl" | "br" | "move", e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setDragging(type);
        setStartPos(getClientPos(e));
        setStartRect({ ...rect });
    };

    // Improved Move logic with global listener
    useEffect(() => {
        if (!dragging) return;

        const onMove = (e: MouseEvent | TouchEvent) => {
            if (!startRect || !containerRef.current) return;

            const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

            // Use container dimensions which now match image dimensions exactly
            const rectBox = containerRef.current.getBoundingClientRect();

            // Delta in Normalized units
            const dxPx = clientX - startPos.x;
            const dyPx = clientY - startPos.y;

            const dx = dxPx / rectBox.width;
            const dy = dyPx / rectBox.height;

            const newRect = { ...startRect };

            if (dragging === "move") {
                // Clamping
                newRect.x = Math.min(1 - newRect.w, Math.max(0, startRect.x + dx));
                newRect.y = Math.min(1 - newRect.h, Math.max(0, startRect.y + dy));
            } else {
                // Resizing Corners
                // If aspect is provided, we lock the ratio.
                // Ratio calculation: (w * imgW) / (h * imgH) = aspect
                // => w / h = aspect * (imgH / imgW) = ratioConf
                let ratioConf = 0;
                if (aspect && imgDims) {
                    ratioConf = aspect * (imgDims.h / imgDims.w);
                }

                if (activeAspectLock(dragging)) {
                    // Free resizing if no aspect
                    if (!aspect) {
                        applyFreeResize(dragging, newRect, startRect, dx, dy);
                    } else {
                        applyLockedResize(dragging, newRect, startRect, dx, dy, ratioConf);
                    }
                }
            }

            onChange(newRect);
        };

        const onEnd = () => setDragging(null);

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onEnd);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onEnd);

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onEnd);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onEnd);
        };
    }, [dragging, startPos, startRect, onChange, aspect, imgDims]);

    function activeAspectLock(dragType: string) {
        return ["tl", "tr", "bl", "br"].includes(dragType);
    }

    // Helper for free resize
    function applyFreeResize(type: string, r: Rect, start: Rect, dx: number, dy: number) {
        if (type === "tl") {
            r.x = Math.min(start.x + start.w - 0.05, Math.max(0, start.x + dx));
            r.y = Math.min(start.y + start.h - 0.05, Math.max(0, start.y + dy));
            r.w = start.w + (start.x - r.x);
            r.h = start.h + (start.y - r.y);
        }
        if (type === "tr") {
            r.y = Math.min(start.y + start.h - 0.05, Math.max(0, start.y + dy));
            r.w = Math.min(1 - start.x, Math.max(0.05, start.w + dx));
            r.h = start.h + (start.y - r.y);
        }
        if (type === "bl") {
            r.x = Math.min(start.x + start.w - 0.05, Math.max(0, start.x + dx));
            r.w = start.w + (start.x - r.x);
            r.h = Math.min(1 - start.y, Math.max(0.05, start.h + dy));
        }
        if (type === "br") {
            r.w = Math.min(1 - start.x, Math.max(0.05, start.w + dx));
            r.h = Math.min(1 - start.y, Math.max(0.05, start.h + dy));
        }
    }

    // Helper for locked resize
    function applyLockedResize(type: string, r: Rect, start: Rect, dx: number, dy: number, ratio: number) {
        // We take the dominant delta (larger movement) to drive the resize
        // For simplicity, let's drive by Width (dx) and adjust Height

        // This is a simplified locked resize implementation.
        // realW / realH = aspect
        // normW * imgW / (normH * imgH) = aspect
        // normH = normW * (imgW / imgH) / aspect = normW / ratio

        let newW = start.w;
        let newH = start.h;

        // Calculate proposed width change
        if (type.includes("l")) {
            // Dragging Left
            // new x = start.x + dx
            // new w = start.w - dx
            // We clamp dx
            const maxDx = start.w - 0.05; // min width
            const minDx = -start.x; // max width (hit 0)
            const safeDx = Math.max(minDx, Math.min(maxDx, dx));
            newW = start.w - safeDx;
            newH = newW / ratio;

            r.x = start.x + (start.w - newW);
            r.w = newW;

            // Adjust y to center? No, corner specific.
            // If TL, we move Y. If BL, we don't move Y (just H changes).
            if (type === "tl") {
                r.y = start.y + (start.h - newH);
                r.h = newH;
            } else { // bl
                r.h = newH;
            }
        } else {
            // Dragging Right
            // new w = start.w + dx
            const maxDx = (1 - start.x) - start.w;
            const minDx = 0.05 - start.w;
            const safeDx = Math.max(minDx, Math.min(maxDx, dx));
            newW = start.w + safeDx;
            newH = newW / ratio;

            r.w = newW;

            // TR moves Y. BR doesn't.
            if (type === "tr") {
                r.y = start.y + (start.h - newH);
                r.h = newH;
            } else { // br
                r.h = newH;
            }
        }
    }


    return (
        <div className="relative w-full h-full bg-slate-900 select-none touch-none flex items-center justify-center p-4">
            {/* Aspect Ratio Container
            This div will shrink to fit the parent (w-full h-full) while maintaining the aspect ratio of the image.
            This ensures the overlay (inset-0) perfectly matches the visible image area.
        */}
            <div
                ref={containerRef}
                className="relative shadow-2xl"
                style={{
                    aspectRatio: imgDims ? `${imgDims.w} / ${imgDims.h}` : undefined,
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto",
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    onLoad={handleImgLoad}
                    alt="Source"
                    className="w-full h-full block object-contain pointer-events-none select-none"
                    draggable={false}
                />

                {/* If dimensions are loaded, show overlay matched to this container */}
                {imgDims && (
                    <div className="absolute inset-0 pointer-events-none">
                        <svg className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <mask id="crop-mask">
                                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                    <rect
                                        x={`${rect.x * 100}%`}
                                        y={`${rect.y * 100}%`}
                                        width={`${rect.w * 100}%`}
                                        height={`${rect.h * 100}%`}
                                        fill="black"
                                    />
                                </mask>
                            </defs>

                            <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask)" />

                            <rect
                                x={`${rect.x * 100}%`}
                                y={`${rect.y * 100}%`}
                                width={`${rect.w * 100}%`}
                                height={`${rect.h * 100}%`}
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>

                        {/* Handles */}
                        {/* TL */}
                        <div
                            className="absolute w-8 h-8 -ml-4 -mt-4 z-20 pointer-events-auto flex items-center justify-center"
                            style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%` }}
                            onMouseDown={(e) => handleStart("tl", e)}
                            onTouchStart={(e) => handleStart("tl", e)}
                        >
                            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                        </div>

                        {/* TR */}
                        <div
                            className="absolute w-8 h-8 -ml-4 -mt-4 z-20 pointer-events-auto flex items-center justify-center"
                            style={{ left: `${(rect.x + rect.w) * 100}%`, top: `${rect.y * 100}%` }}
                            onMouseDown={(e) => handleStart("tr", e)}
                            onTouchStart={(e) => handleStart("tr", e)}
                        >
                            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                        </div>

                        {/* BL */}
                        <div
                            className="absolute w-8 h-8 -ml-4 -mt-4 z-20 pointer-events-auto flex items-center justify-center"
                            style={{ left: `${rect.x * 100}%`, top: `${(rect.y + rect.h) * 100}%` }}
                            onMouseDown={(e) => handleStart("bl", e)}
                            onTouchStart={(e) => handleStart("bl", e)}
                        >
                            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                        </div>

                        {/* BR */}
                        <div
                            className="absolute w-8 h-8 -ml-4 -mt-4 z-20 pointer-events-auto flex items-center justify-center"
                            style={{ left: `${(rect.x + rect.w) * 100}%`, top: `${(rect.y + rect.h) * 100}%` }}
                            onMouseDown={(e) => handleStart("br", e)}
                            onTouchStart={(e) => handleStart("br", e)}
                        >
                            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                        </div>

                        {/* Move Area */}
                        <div
                            className="absolute pointer-events-auto cursor-move z-10"
                            style={{
                                left: `${rect.x * 100}%`,
                                top: `${rect.y * 100}%`,
                                width: `${rect.w * 100}%`,
                                height: `${rect.h * 100}%`,
                            }}
                            onMouseDown={(e) => handleStart("move", e)}
                            onTouchStart={(e) => handleStart("move", e)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
