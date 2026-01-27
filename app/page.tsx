import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-6 flex flex-col gap-4 items-center justify-center bg-slate-50 text-slate-900">
      <h1 className="text-3xl font-bold text-center">Credencial ESPE (Local)</h1>
      <p className="text-sm text-slate-600 max-w-sm text-center">
        Esta app funciona 100% localmente. Sube tu PDF oficial y ajusta tu foto si lo deseas.
      </p>
      <Link
        href="/upload"
        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 transition"
      >
        Empezar
      </Link>
    </main>
  );
}
