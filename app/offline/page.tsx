// Offline fallback page for when network is unavailable
export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="text-center max-w-md">
                <div className="mb-6">
                    <svg
                        className="w-20 h-20 mx-auto text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                    Sin Conexión
                </h1>

                <p className="text-slate-300 mb-8">
                    Esta página requiere conexión a internet la primera vez.
                    Por favor, verifica tu conexión e intenta nuevamente.
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                    Reintentar
                </button>
            </div>
        </div>
    );
}
