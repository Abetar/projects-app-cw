"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type SupervisorResponse = {
  ok: boolean;
  supervisor?: any;
  error?: string;
};

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
        body: JSON.stringify({ supervisorId: id }),
      });

      const data: SupervisorResponse = await res.json();

      if (!res.ok || !data.ok || !data.supervisor) {
        setErrorMsg(data.error || "ID de supervisor no válido.");
        return;
      }

      // 👇 Normalizamos el objeto que venga de la API
      const sup = data.supervisor as any;

      const normalized = {
        id:
          sup.id ||
          sup.ID ||
          sup.recordId ||
          sup.RecordID ||
          id, // al menos usamos el que se escribió
        name:
          sup.name ||
          sup.Nombre ||
          sup.nombre ||
          sup.supervisorName ||
          "",
      };

      if (!normalized.id) {
        setErrorMsg("No se pudo determinar el ID del supervisor.");
        return;
      }

      // Guardamos SIEMPRE en el mismo formato
      window.localStorage.setItem("supervisor", JSON.stringify(normalized));

      router.push("/reporte");
    } catch (error) {
      console.error(error);
      setErrorMsg("Ocurrió un error al validar tu ID. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex justify-center">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Bitácora diaria de supervisión
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Ingresa tu ID de supervisor para llenar la bitácora del día.
          </p>

          {errorMsg && <Alert type="error">{errorMsg}</Alert>}

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
