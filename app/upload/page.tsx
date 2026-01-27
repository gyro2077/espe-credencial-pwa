"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { savePdf } from "@/lib/storage";
import { validatePdfFile } from "@/lib/security";

export default function UploadPage() {
    const router = useRouter();
    const [err, setErr] = useState<string | null>(null);

    async function handleFile(file: File) {
        setErr(null);
        const error = await validatePdfFile(file);
        if (error) return setErr(error);

        try {
            await savePdf(file);
            router.push("/calibrate");
        } catch (e) {
            console.error(e);
            setErr("Error guardando el archivo.");
        }
    }

    return (
        <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col justify-center gap-4">
            <div>
                <h2 className="text-2xl font-bold mb-2">Cargar Credencial</h2>
                <p className="text-sm text-slate-600">
                    Sube el PDF oficial descargado de Mi ESPE. Se procesa solo en tu dispositivo.
                </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-white flex flex-col items-center justify-center gap-4 hover:bg-slate-50 transition cursor-pointer relative">
                <div className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                </div>
                <span className="text-slate-500 font-medium">Toca para seleccionar PDF</span>
                <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleFile(f);
                    }}
                />
            </div>

            {err && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{err}</div>}
        </main>
    );
}
