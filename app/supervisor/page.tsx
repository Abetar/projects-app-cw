// app/supervisor/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type ApiSuccess = {
  ok: true;
  supervisor: {
    id: string;
    name: string;
    active: boolean;
  };
};

type ApiError = {
  ok: false;
  error: string;
};

type SupervisorResponse = ApiSuccess | ApiError;

export default function SupervisorLoginPage() {
  const [supervisorId, setSupervisorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const id = supervisorId.trim();
    if (!id) {
      setErrorMsg("Por favor ingresa tu ID de supervisor.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/supervisores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorId: id }),
      });

      let data: SupervisorResponse;

      try {
        data = (await res.json()) as SupervisorResponse;
      } catch {
        data = { ok: false, error: "Respuesta inválida del servidor." };
      }

      if (!res.ok || !data.ok) {
        const msg =
          !data.ok && data.error
            ? data.error
            : "No se pudo validar el supervisor.";
        console.error("Login supervisor error:", data);
        setErrorMsg(msg);
        return;
      }

      const sup = data.supervisor;
      const normalizedId = sup.id;
      const normalizedName = sup.name ?? "";

      if (!normalizedId) {
        setErrorMsg("No se pudo determinar el ID del supervisor.");
        return;
      }

      if (typeof window !== "undefined") {
        // ✅ Guardamos en ambas APIs de storage y con las keys viejas
        window.localStorage.setItem("cw_supervisor_id", normalizedId);
        window.localStorage.setItem("cw_supervisor_name", normalizedName);

        try {
          window.sessionStorage.setItem("cw_supervisor_id", normalizedId);
          window.sessionStorage.setItem("cw_supervisor_name", normalizedName);
        } catch {
          // en Safari / incognito a veces sessionStorage puede fallar, no pasa nada
        }

        // Para depurar rápido (puedes quitarlo cuando funcione)
        console.log("Supervisor guardado:", {
          id: normalizedId,
          name: normalizedName,
        });
      }

      router.push("/reporte");
    } catch (error) {
      console.error("Error inesperado en login:", error);
      setErrorMsg("Ocurrió un error al validar tu ID. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 border border-slate-200">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Bitácora diaria de supervisión
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Ingresa tu ID de supervisor para llenar la bitácora del día.
          </p>

          {errorMsg && (
            <div className="mb-4">
              <Alert type="error">{errorMsg}</Alert>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label
                htmlFor="supervisorId"
                className="block text-sm font-medium text-slate-700"
              >
                ID de supervisor
              </label>
              <Input
                id="supervisorId"
                placeholder="Ejemplo: recAKr6tejjFxhQA"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                autoComplete="off"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? "Validando..." : "Entrar como supervisor"}
            </Button>
          </form>

          <p className="text-xs text-slate-500 mt-4">
            Pide a sistemas tu{" "}
            <span className="font-semibold">ID de supervisor</span> si aún no lo
            tienes.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Si eres administrador, puedes revisar las bitácoras en{" "}
            <span className="font-mono">/admin</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
