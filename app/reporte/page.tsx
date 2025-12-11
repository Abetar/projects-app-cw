"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DynamicMetrics, MetricsRow } from "@/components/reporte/DynamicMetrics";
import type { Proyecto } from "@/lib/airtable";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type SupervisorSession = {
  id: string;
  name: string;
};

type CreateReportePayload = {
  fecha: string;
  supervisorId: string;
  proyectoId: string;
  actividadesFabricacion: string[];
  actividadesInstalacion: string[];
  actividadesSupervision: string[];
  tiempoMuerto: string | null;
  tiempoMuertoOtro: string | null;
  pendiente: string | null;
  pendienteOtro: string | null;
  fotos: string[];
  metrics: MetricsRow[];
};

const TIEMPO_MUERTO_OPCIONES = [
  "Sin tiempo muerto",
  "Condiciones climáticas",
  "Falta de material",
  "Falta de personal",
  "Acceso restringido",
  "Otro",
];

const PENDIENTE_OPCIONES = [
  "Sin pendientes",
  "Detalle menor",
  "Revisión con cliente",
  "Requiere retrabajo",
  "Otro",
];

const ACTIVIDADES_FABRICACION = [
  "Habilitado",
  "Corte",
  "Armado",
  "Ensamble",
  "Limpieza de piezas",
  "Colocación de aluminio",
  "Colocación de vidrio",
  "Sellos interior",
  "Sellos exterior",
  "Accesorios",
  "Prearmado en taller",
  "Perforado de piezas",
  "Rectificado / ajuste de piezas",
  "Preparación de anclajes",
  "Soldadura de elementos",
];

const ACTIVIDADES_INSTALACION = [
  "Colocación de aluminio",
  "Colocación de vidrio",
  "Colocación de accesorios",
  "Ajuste de postes",
  "Sellos interior",
  "Sellos exterior",
  "Limpieza",
  "Nivelación y plomeo",
  "Fijación de anclajes",
  "Sellado perimetral",
  "Colocación de bastidores",
  "Corrección de desalineaciones",
];

const ACTIVIDADES_SUPERVISION = [
  "Revisión de calidad",
  "Revisión de avances",
  "Coordinación con contratista",
  "Validación de metrado",
  "Supervisión general de frente",
  "Levantamiento de pendientes",
  "Verificación de seguridad en obra",
  "Revisión de planos vs. ejecución",
  "Registro fotográfico de avance",
  "Cierre de frente / liberación de zona",
  "Inducción / charla de seguridad diaria",
];

const MAX_FOTOS = 5;

export default function ReportePage() {
  const router = useRouter();

  // -------- SUPERVISOR / LOGIN ----------
  const [supervisor, setSupervisor] = useState<SupervisorSession | null>(null);

  useEffect(() => {
    try {
      const id = window.localStorage.getItem("cw_supervisor_id");
      const name = window.localStorage.getItem("cw_supervisor_name");

      if (!id) {
        router.push("/supervisor");
        return;
      }

      setSupervisor({
        id,
        name: name || "",
      });
    } catch {
      router.push("/supervisor");
    }
  }, [router]);

  // -------- PROYECTOS ----------
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [proyectoId, setProyectoId] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoadingProyectos(true);
      try {
        const res = await fetch("/api/proyectos", { cache: "no-store" });
        const data = await res.json();
        setProyectos(data ?? []);
      } catch (e) {
        console.error("Error cargando proyectos", e);
      } finally {
        setLoadingProyectos(false);
      }
    };
    load();
  }, []);

  const selectedProyecto = proyectos.find((p) => p.id === proyectoId) ?? null;

  // -------- FORM STATE ----------
  const [fecha, setFecha] = useState("");
  const [area, setArea] = useState("");

  // Fecha default hoy
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setFecha(today);
  }, []);

  // Actividades (3 grupos, estilo píldora)
  const [actividadesFabricacion, setActividadesFabricacion] = useState<string[]>(
    []
  );
  const [actividadesInstalacion, setActividadesInstalacion] = useState<string[]>(
    []
  );
  const [actividadesSupervision, setActividadesSupervision] = useState<string[]>(
    []
  );

  const toggleActividad = (
    tipo: "fabricacion" | "instalacion" | "supervision",
    nombre: string
  ) => {
    const updater =
      tipo === "fabricacion"
        ? setActividadesFabricacion
        : tipo === "instalacion"
        ? setActividadesInstalacion
        : setActividadesSupervision;

    updater((prev) =>
      prev.includes(nombre) ? prev.filter((a) => a !== nombre) : [...prev, nombre]
    );
  };

  // Incidencias
  const [tiempoMuerto, setTiempoMuerto] = useState("");
  const [tiempoMuertoOtro, setTiempoMuertoOtro] = useState("");
  const [pendiente, setPendiente] = useState("");
  const [pendienteOtro, setPendienteOtro] = useState("");

  // Métricas dinámicas
  const [metrics, setMetrics] = useState<MetricsRow[]>([]);

  // Fotos (urls Cloudinary)
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Checkbox confirmación
  const [confirmado, setConfirmado] = useState(false);

  // Mensajes de UI
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // -------- HANDLERS --------

  async function handleUploadFotos(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remaining = MAX_FOTOS - fotoUrls.length;
    if (remaining <= 0) {
      setErrorMsg(`Solo puedes subir máximo ${MAX_FOTOS} fotos.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);

    setSubiendoFotos(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const uploadPreset =
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "cw_uploads";
    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "cw-cloud";

    try {
      const urls: string[] = [];

      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!res.ok) {
          console.error("Error subiendo imagen", await res.text());
          continue;
        }

        const data = await res.json();
        if (data.secure_url) {
          urls.push(data.secure_url);
        }
      }

      setFotoUrls((prev) => {
        const merged = [...prev, ...urls];
        return merged.slice(0, MAX_FOTOS);
      });
    } catch (e) {
      console.error("Error en upload Cloudinary", e);
      setErrorMsg(
        "Ocurrió un problema al subir las fotos. Intenta de nuevo o verifica tu conexión."
      );
    } finally {
      setSubiendoFotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function resetForm() {
    const today = new Date().toISOString().slice(0, 10);
    setFecha(today);
    setArea("");
    setProyectoId("");
    setActividadesFabricacion([]);
    setActividadesInstalacion([]);
    setActividadesSupervision([]);
    setTiempoMuerto("");
    setTiempoMuertoOtro("");
    setPendiente("");
    setPendienteOtro("");
    setMetrics([]);
    setFotoUrls([]);
    setConfirmado(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supervisor) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const missing: string[] = [];

    if (!fecha) missing.push("la fecha del día");
    if (!proyectoId) missing.push("el proyecto del día");
    if (
      actividadesFabricacion.length === 0 &&
      actividadesInstalacion.length === 0 &&
      actividadesSupervision.length === 0
    ) {
      missing.push("al menos una actividad del día");
    }
    if (fotoUrls.length === 0) missing.push("al menos una foto como evidencia");
    if (!confirmado) missing.push("confirmar que la información es real");

    if (missing.length > 0) {
      const msg =
        "Por favor completa estos puntos antes de enviar:\n• " +
        missing.join("\n• ");
      setErrorMsg(msg);
      return;
    }

    const payload: CreateReportePayload = {
      fecha,
      supervisorId: supervisor.id,
      proyectoId,
      actividadesFabricacion,
      actividadesInstalacion,
      actividadesSupervision,
      tiempoMuerto: tiempoMuerto || null,
      tiempoMuertoOtro: tiempoMuerto === "Otro" ? tiempoMuertoOtro || null : null,
      pendiente: pendiente || null,
      pendienteOtro: pendiente === "Otro" ? pendienteOtro || null : null,
      fotos: fotoUrls,
      metrics,
    };

    setSending(true);
    try {
      const res = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        console.error("Error al guardar reporte:", data?.error);
        setErrorMsg(
          data?.error ||
            "No se pudo guardar el reporte. Revisa los datos e intenta de nuevo."
        );
        return;
      }

      setSuccessMsg("✅ Tu reporte se envió correctamente.");
      resetForm();
    } catch (err) {
      console.error("Error al enviar reporte:", err);
      setErrorMsg(
        "Ocurrió un error inesperado al enviar tu reporte. Intenta otra vez."
      );
    } finally {
      setSending(false);
    }
  }

  // -------- RENDER --------

  if (!supervisor) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md w-full text-center text-sm text-slate-600">
          Cargando información de supervisor…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-5 sm:px-8 sm:py-7">
          {/* HEADER */}
          <div className="mb-5">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              Bitácora diaria
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Captura la información del día para el proyecto asignado.
            </p>
          </div>

          {/* ALERTAS */}
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-800 flex gap-2">
              <span className="text-lg">⚠️</span>
              <p className="whitespace-pre-line">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm text-emerald-800 flex gap-2">
              <span className="text-lg">✅</span>
              <p>{successMsg}</p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fecha + Supervisor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Fecha del día *
                </label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Supervisor
                </label>
                <Input value={supervisor.name} readOnly />
              </div>
            </div>

            {/* Proyecto + Área */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Proyecto del día *
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  value={proyectoId}
                  onChange={(e) => setProyectoId(e.target.value)}
                  required
                >
                  <option value="">
                    {loadingProyectos
                      ? "Cargando proyectos…"
                      : "Selecciona un proyecto"}
                  </option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Área o nivel
                </label>
                <Input
                  placeholder="Ej. Nivel 5, Fachada norte…"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
            </div>

            {/* ACTIVIDADES (PÍLDORAS) */}
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Actividades del día *
              </h2>
              <p className="text-xs text-slate-500">
                Toca cada actividad para marcarla o desmarcarla.
              </p>

              {/* Fabricación */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  Fabricación
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVIDADES_FABRICACION.map((act) => {
                    const checked = actividadesFabricacion.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => toggleActividad("fabricacion", act)}
                        className={`text-xs rounded-full border px-3 py-1 ${
                          checked
                            ? "bg-sky-600 border-sky-600 text-white"
                            : "bg-slate-50 border-slate-300 text-slate-700"
                        }`}
                      >
                        {act}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instalación */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  Instalación
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVIDADES_INSTALACION.map((act) => {
                    const checked = actividadesInstalacion.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => toggleActividad("instalacion", act)}
                        className={`text-xs rounded-full border px-3 py-1 ${
                          checked
                            ? "bg-sky-600 border-sky-600 text-white"
                            : "bg-slate-50 border-slate-300 text-slate-700"
                        }`}
                      >
                        {act}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Supervisión */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  Supervisión
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVIDADES_SUPERVISION.map((act) => {
                    const checked = actividadesSupervision.includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => toggleActividad("supervision", act)}
                        className={`text-xs rounded-full border px-3 py-1 ${
                          checked
                            ? "bg-sky-600 border-sky-600 text-white"
                            : "bg-slate-50 border-slate-300 text-slate-700"
                        }`}
                      >
                        {act}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MÉTRICAS DINÁMICAS */}
            <div className="pt-2 border-t border-slate-200">
              <DynamicMetrics
                formKey={selectedProyecto?.formKey ?? null}
                onChange={setMetrics}
              />
            </div>

            {/* INCIDENCIAS */}
            <div className="pt-2 border-t border-slate-200 space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Incidencias
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tiempo muerto */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Tiempo muerto
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    value={tiempoMuerto}
                    onChange={(e) => setTiempoMuerto(e.target.value)}
                  >
                    <option value="">Selecciona tiempo muerto…</option>
                    {TIEMPO_MUERTO_OPCIONES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {tiempoMuerto === "Otro" && (
                    <Input
                      className="mt-2"
                      placeholder="Describe el tiempo muerto…"
                      value={tiempoMuertoOtro}
                      onChange={(e) => setTiempoMuertoOtro(e.target.value)}
                    />
                  )}
                </div>

                {/* Pendiente */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Pendiente
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    value={pendiente}
                    onChange={(e) => setPendiente(e.target.value)}
                  >
                    <option value="">Selecciona un pendiente…</option>
                    {PENDIENTE_OPCIONES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {pendiente === "Otro" && (
                    <Input
                      className="mt-2"
                      placeholder="Describe el pendiente…"
                      value={pendienteOtro}
                      onChange={(e) => setPendienteOtro(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* FOTOS */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Evidencia fotográfica *
              </h2>
              <p className="text-xs text-slate-500">
                Sube hasta {MAX_FOTOS} fotos del día (avances, detalles y
                pendientes).
              </p>

              <div className="flex items-center justify-between">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl px-4 py-4 text-center cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition">
                  <span className="text-sm font-medium text-slate-700">
                    Seleccionar archivos
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    JPG o PNG. Máximo {MAX_FOTOS} imágenes.
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUploadFotos(e.target.files)}
                  />
                </label>
                <span className="ml-3 text-xs text-slate-500 whitespace-nowrap">
                  {fotoUrls.length}/{MAX_FOTOS} cargadas
                </span>
              </div>

              {subiendoFotos && (
                <p className="text-xs text-slate-500">
                  Subiendo fotos, espera un momento…
                </p>
              )}

              {fotoUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fotoUrls.map((url) => (
                    <div
                      key={url}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200"
                    >
                      <img
                        src={url}
                        alt="Evidencia"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CONFIRMACIÓN */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  checked={confirmado}
                  onChange={(e) => setConfirmado(e.target.checked)}
                  required
                />
                <span>
                  Confirmo que la información capturada es real y verificable.
                </span>
              </label>
            </div>

            {/* BOTÓN ENVIAR */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full sm:w-auto sm:min-w-[200px] justify-center bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-xl px-6 py-3"
                disabled={sending}
              >
                {sending ? "Enviando reporte..." : "Enviar reporte"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
