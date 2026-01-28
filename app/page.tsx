"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadPdf } from "@/lib/storage";
import OnboardingOverlay from "@/components/OnboardingOverlay";

export default function HomePage() {
  const router = useRouter();
  const [hasPdf, setHasPdf] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const pdf = await loadPdf();
      setHasPdf(!!pdf);
    })();
  }, []);

  if (hasPdf === null) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando...</div>;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-4">
      <OnboardingOverlay />
      <h1 className="text-2xl font-bold">Credencial ESPE</h1>

      {!hasPdf ? (
        <button
          onClick={() => router.push("/upload")}
          className="w-full max-w-md py-4 bg-blue-600 rounded-xl font-bold active:scale-95 transition"
        >
          Subir PDF
        </button>
      ) : (
        <>
          <button
            onClick={() => router.push("/view")}
            className="w-full max-w-md py-4 bg-slate-100 text-slate-900 rounded-xl font-bold active:scale-95 transition"
          >
            Ver credencial
          </button>

          <button
            onClick={() => router.push("/calibrate")}
            className="w-full max-w-md py-4 bg-blue-600 rounded-xl font-bold active:scale-95 transition"
          >
            Editar credencial
          </button>

          <button
            onClick={() => {
              if (confirm("Al reemplazar el PDF se borrará tu foto y ajustes actuales. ¿Continuar?")) {
                router.push("/upload");
              }
            }}
            className="w-full max-w-md py-3 bg-white/10 rounded-xl font-semibold active:scale-95 transition"
          >
            Reemplazar PDF
          </button>
        </>
      )}
    </main>
  );
}
