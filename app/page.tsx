// app/page.tsx
"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        <h1 className="text-2xl font-semibold text-center text-slate-800">
          Sistema de Bitácoras CW
        </h1>

        <p className="text-center text-slate-500 text-sm">
          Selecciona cómo deseas ingresar
        </p>

        {/* Card Supervisor */}
        <Link
          href="/supervisor"
          className="block bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center hover:shadow-md transition"
        >
          <span className="text-lg font-medium text-slate-800">
            👷 Supervisor
          </span>
          <p className="text-sm text-slate-500 mt-1">
            Capturar bitácora diaria
          </p>
        </Link>

        {/* Card Admin */}
        <Link
          href="/admin"
          className="block bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center hover:shadow-md transition"
        >
          <span className="text-lg font-medium text-slate-800">
            🛠️ Panel Administrativo
          </span>
          <p className="text-sm text-slate-500 mt-1">
            Revisar bitácoras enviadas
          </p>
        </Link>

      </div>
    </main>
  );
}
