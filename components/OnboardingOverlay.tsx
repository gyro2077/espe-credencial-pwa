"use client";
import React, { useEffect, useState } from "react";
import { hasSeenOnboarding, setSeenOnboarding } from "@/lib/onboarding";

export default function OnboardingOverlay() {
    const [step, setStep] = useState<number>(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!hasSeenOnboarding()) {
            setVisible(true);
        }
    }, []);

    if (!visible) return null;

    const STEPS = [
        {
            title: "¡Bienvenido a Credencial ESPE Local!",
            desc: "Esta aplicación funciona 100% en tu dispositivo. Nadie ve tu PDF ni tu foto.",
        },
        {
            title: "Paso 1: Sube tu PDF",
            desc: "Descarga tu credencial oficial de Mi ESPE y súbela aquí.",
        },
        {
            title: "Paso 2: Edita tu Foto",
            desc: "Podrás cambiar la foto aburrida del sistema por una que te guste más.",
        },
        {
            title: "Listo",
            desc: "Si algo sale mal, puedes usar 'Ajustar recorte' para arreglarlo manualmente.",
        },
    ];

    const current = STEPS[step];

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            setSeenOnboarding();
            setVisible(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    {step + 1}
                </div>

                <h2 className="text-xl font-bold text-slate-900">{current.title}</h2>
                <p className="text-slate-600">{current.desc}</p>

                <div className="pt-4 flex gap-2">
                    <div className="flex-1 flex gap-1 justify-center items-center">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i === step ? "bg-blue-600" : "bg-slate-200"}`} />
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleNext}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition"
                >
                    {step === STEPS.length - 1 ? "¡Entendido!" : "Siguiente"}
                </button>
            </div>
        </div>
    );
}
