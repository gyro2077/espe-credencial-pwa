"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            process.env.NODE_ENV === "production"
        ) {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .then((registration) => {
                    console.log("✅ Service Worker registered:", registration.scope);

                    // Check for updates every 60 seconds
                    setInterval(() => {
                        registration.update();
                    }, 60000);
                })
                .catch((error) => {
                    console.error("❌ Service Worker registration failed:", error);
                });
        }
    }, []);

    return null;
}
