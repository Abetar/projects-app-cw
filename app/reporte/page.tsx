"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MetricsRow } from "@/components/reporte/DynamicMetrics";
import { DynamicMetrics } from "@/components/reporte/DynamicMetrics";
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

// ✅ Actividades ajustadas según comentarios
const ACTIVIDADES_FABRICACION = [
  "Habilitado",
  "Corte",
  "Armado",
  "Ensamble",
  "Limpieza de piezas",
  "Perforado de piezas",
  "Rectificado / ajuste de piezas",
  "Suministro de accesorios",
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
  "Herrajes",
  "Detalles y ajustes",
];

const ACTIVIDADES_SUPERVISION = [
  "Revisión de calidad",
  "Revisión de avances",
  "Coordinación con contratista",
  "Validación de alcances",
  "Supervisión general de frente",
  "Levantamiento de pendientes",
  "Verificación de seguridad en obra",
  "Revisión de planos vs. ejecución",
  "Registro fotográfico de avance",
  "Cierre de frente / liberación de zona",
  "Inducción / charla de seguridad diaria",
];

const MAX_FOTOS = 5;

/* ---------------- SAQQARA (solo UI en /reporte) ---------------- */

const SAQQARA_OPCIONES_LONG: string[] = [
  "Corte de tapas registro y soldadura posterior a trabajos de instalaciones por terceros en columnas de Estructura de Lobby.",
  "instalacion de angulo con aplicación de soldadura en perfil de estructura en pasillo acceso de torre a lobby de cristal.",
  "instalacion de angulo con pijas en perfil de estructura en pasillo acceso de torre a lobby de cristal.",
  "NIVEL 6       Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 7      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 8      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 9     Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 10      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 11     Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 12      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 14      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 15      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 16      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 17     Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 18    Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 19     Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 20      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 21      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 22      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 23      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 24     Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 25      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 26      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 27      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 28     Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 29      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 30      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 31      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 32      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 33      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 34      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 35      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 36     Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 37      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "NIVEL 38      Solera  de panel   dar  silver  en canceles   de balcones    de 3.10 x 0.075.",
  "nivel 4     panel   en cancel pasillo elevador",
  "nivel 5     panel   en cancel pasillo elevador",
  "nivel 6     panel   en cancel pasillo elevador",
  "nivel 7     panel   en cancel pasillo elevador",
  "nivel 8    panel   en cancel pasillo elevador",
  "nivel 9     panel   en cancel pasillo elevador",
  "nivel 10     panel   en cancel pasillo elevador",
  "nivel 11     panel   en cancel pasillo elevador",
  "nivel 12     panel   en cancel pasillo elevador",
  "nivel 14     panel   en cancel pasillo elevador",
  "nivel 15     panel   en cancel pasillo elevador",
  "nivel 16     panel   en cancel pasillo elevador",
  "nivel 17     panel   en cancel pasillo elevador",
  "nivel 18     panel   en cancel pasillo elevador",
  "nivel 19     panel   en cancel pasillo elevador",
  "nivel 20     panel   en cancel pasillo elevador",
  "nivel 21     panel   en cancel pasillo elevador",
  "nivel 22    panel   en cancel pasillo elevador",
  "nivel 23     panel   en cancel pasillo elevador",
  "nivel 24     panel   en cancel pasillo elevador",
  "nivel 25     panel   en cancel pasillo elevador",
  "nivel 26     panel   en cancel pasillo elevador",
  "nivel 27    panel   en cancel pasillo elevador",
  "nivel 28    panel   en cancel pasillo elevador",
  "nivel 29    panel   en cancel pasillo elevador",
  "nivel 30     panel   en cancel pasillo elevador",
  "nivel 31    panel   en cancel pasillo elevador",
  "nivel 32     panel   en cancel pasillo elevador",
  "nivel 33     panel   en cancel pasillo elevador",
  "nivel 34    panel   en cancel pasillo elevador",
  "nivel 35     panel   en cancel pasillo elevador",
  "nivel 36     panel   en cancel pasillo elevador",
  "nivel 37     panel   en cancel pasillo elevador",
  "nivel 38     panel   en cancel pasillo elevador",
  "nivel 39     panel   en cancel pasillo elevador",
  "sub  estructura       bloque 1        corona  lobby",
  "sub  estructura       bloque 2       corona  lobby",
  "forro de  panel  bloque  1            corona lobby",
  "forro    de panel   bloque  2        corona  lobby",
  "detallado                                          corona  lobby",
  "Aplicación de Sello color negro en el contorno del piso y el cristal del lobby del cristal por interior 23 m   LOBBY",
  "Suministro e Instalación de película esmerilada en cristales de puerta del pasillo lobby y en módulos de la zona de amenidades 6.25 m2",
  "Apertura de huecos en plafon de lobby para instalacion de Spot luminarias De 20 cms.",
  "Suministro e Instalación de panel color Dark Silver en pecheras exterior en Lobby Area de Asadores",
  "Suministro e instalación de Tapas Con Medidas de 0.40ancho  x.05 ceja de precolado x 5.00 mts largo., de panel de aluminio en Lobby Exterior de Jardinera",
];

function normalizeOneLine(s: string) {
  return String(s)
    .replace(/\s+/g, " ")
    .replace(/[.,]\s*$/, "")
    .trim();
}

function shortenSaqqaraLabel(longText: string) {
  const s = normalizeOneLine(longText);
  const lower = s.toLowerCase();

  // NIVEL X Solera ... 3.10 x 0.075
  const mSolera = s.match(/^\s*nivel\s*(\d+)\s+solera.*?(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
  if (mSolera) {
    const n = mSolera[1];
    const a = mSolera[2];
    const b = mSolera[3];
    return `N${n} solera panel ${a}x${b}`;
  }

  // nivel X panel en cancel pasillo elevador
  const mPanel = s.match(/^\s*nivel\s*(\d+)\s+panel\s+en\s+cancel\s+pasillo\s+elevador/i);
  if (mPanel) {
    return `N${mPanel[1]} panel cancel pasillo elevador`;
  }

  // fallback: recorte simple
  if (s.length <= 70) return s;
  return s.slice(0, 67) + "…";
}

type SaqqaraRowState = {
  opcion: string; // valor REAL (texto largo)
  cantidad: string;
};

export default function ReportePage() {
  const router = useRouter();

  // ---------------- SUPERVISOR / LOGIN ----------------
  const [supervisor, setSupervisor] = useState<SupervisorSession | null>(null);

  useEffect(() => {
    try {
      const id = window.localStorage.getItem("cw_supervisor_id");
      const name = window.localStorage.getItem("cw_supervisor_name");

      if (!id || !name) {
        router.push("/supervisor");
        return;
      }

      setSupervisor({ id, name });
    } catch {
      router.push("/supervisor");
    }
  }, [router]);

  // ---------------- PROYECTOS ----------------
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loadingProyectos, setLoadingProyectos] = useState(false);

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

  const [proyectoId, setProyectoId] = useState("");
  const selectedProyecto = proyectos.find((p) => p.id === proyectoId) ?? null;

  // ---------------- FORM STATE ----------------
  const [fecha, setFecha] = useState("");
  const [area, setArea] = useState("");

  // Actividades separadas por categoría
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
    categoria: "fabricacion" | "instalacion" | "supervision",
    nombre: string
  ) => {
    const updater = (prev: string[]) =>
      prev.includes(nombre)
        ? prev.filter((a) => a !== nombre)
        : [...prev, nombre];

    if (categoria === "fabricacion") {
      setActividadesFabricacion(updater);
    } else if (categoria === "instalacion") {
      setActividadesInstalacion(updater);
    } else {
      setActividadesSupervision(updater);
    }
  };

  // Incidencias
  const [tiempoMuerto, setTiempoMuerto] = useState("");
  const [tiempoMuertoOtro, setTiempoMuertoOtro] = useState("");
  const [pendiente, setPendiente] = useState("");
  const [pendienteOtro, setPendienteOtro] = useState("");

  // Métricas dinámicas
  const [metrics, setMetrics] = useState<MetricsRow[]>([]);

  // Saqqara (solo si formKey === "saqqara")
  const isSaqqara = selectedProyecto?.formKey === "saqqara";
  const [saqqaraRows, setSaqqaraRows] = useState<SaqqaraRowState[]>([
    { opcion: "", cantidad: "" },
  ]);

  const saqqaraOptions = useMemo(
    () =>
      SAQQARA_OPCIONES_LONG.map((longText) => ({
        value: normalizeOneLine(longText), // guardamos un string limpio
        label: shortenSaqqaraLabel(longText),
      })),
    []
  );

  function updateSaqqaraParent(rows: SaqqaraRowState[]) {
    const nextMetrics: MetricsRow[] = rows
      .filter((r) => r.opcion && r.cantidad)
      .map((r) => ({
        categoria: "Saqqara",
        itemId: r.opcion, // texto largo (limpio)
        itemLabel: shortenSaqqaraLabel(r.opcion), // texto corto para UI/Admin/PDF si lo usas
        cantidad: Number(r.cantidad),
      }));

    setMetrics(nextMetrics);
  }

  function handleSaqqaraChangeRow(
    index: number,
    field: keyof SaqqaraRowState,
    value: string
  ) {
    const next = [...saqqaraRows];
    next[index] = { ...next[index], [field]: value };
    setSaqqaraRows(next);
    updateSaqqaraParent(next);
  }

  function handleSaqqaraAddRow() {
    const next = [...saqqaraRows, { opcion: "", cantidad: "" }];
    setSaqqaraRows(next);
    updateSaqqaraParent(next);
  }

  function handleSaqqaraRemoveRow(index: number) {
    const next = saqqaraRows.filter((_, i) => i !== index);
    const finalRows = next.length > 0 ? next : [{ opcion: "", cantidad: "" }];
    setSaqqaraRows(finalRows);
    updateSaqqaraParent(finalRows);
  }

  // Al cambiar de proyecto, limpiamos métricas (y filas saqqara) sin tocar nada más
  useEffect(() => {
    setMetrics([]);
    setSaqqaraRows([{ opcion: "", cantidad: "" }]);
  }, [selectedProyecto?.formKey]);

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

  // ---------------- HANDLERS ----------------

  async function handleUploadFotos(files: FileList | null) {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files).slice(0, MAX_FOTOS);

    setSubiendoFotos(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const urls: string[] = [];
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      if (!uploadPreset || !cloudName) {
        console.error("Cloudinary env vars faltantes");
        setErrorMsg(
          "Error de configuración al subir imágenes. Contacta al administrador."
        );
        setSubiendoFotos(false);
        return;
      }

      for (const file of filesArray) {
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
    setFecha("");
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
    setSaqqaraRows([{ opcion: "", cantidad: "" }]);
    setFotoUrls([]);
    setConfirmado(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supervisor) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // ---------------- VALIDACIÓN BONITA ----------------
    const missing: string[] = [];

    if (!fecha) missing.push("la fecha del día");
    if (!proyectoId) missing.push("el proyecto del día");
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

      // ÉXITO 🎉
      setSuccessMsg("Tu reporte se envió correctamente.");
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

  // ---------------- RENDER ----------------

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

          {/* ALERTAS BONITAS */}
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

          {/* FORMULARIO */}
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

            {/* ACTIVIDADES COMO PÍLDORAS */}
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Actividades del día *
              </h2>
              <p className="text-xs text-slate-500">
                Toca cada actividad para marcarla o desmarcarla.
              </p>

              {/* FABRICACIÓN */}
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
                        className={`text-xs sm:text-sm rounded-full border px-3 py-1 ${
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

              {/* INSTALACIÓN */}
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
                        className={`text-xs sm:text-sm rounded-full border px-3 py-1 ${
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

              {/* SUPERVISIÓN */}
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
                        className={`text-xs sm:text-sm rounded-full border px-3 py-1 ${
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

            {/* MÉTRICAS */}
            <div className="pt-2 border-t border-slate-200">
              {!isSaqqara ? (
                <DynamicMetrics
                  formKey={selectedProyecto?.formKey ?? null}
                  onChange={setMetrics}
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Métricas – Proyecto Saqqara
                    </h3>
                    <p className="text-xs text-slate-500">
                      Elige una opción y captura la cantidad.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {saqqaraRows.map((row, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-2 items-start bg-slate-50 rounded-xl px-3 py-3"
                      >
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-600">
                            Opción
                          </label>
                          <select
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            value={row.opcion}
                            onChange={(e) =>
                              handleSaqqaraChangeRow(
                                index,
                                "opcion",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Selecciona una opción…</option>
                            {saqqaraOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-600">
                            Cantidad
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={row.cantidad}
                            onChange={(e) =>
                              handleSaqqaraChangeRow(
                                index,
                                "cantidad",
                                e.target.value
                              )
                            }
                            placeholder="0"
                          />
                        </div>

                        <div className="flex gap-2 pt-6 justify-end">
                          {saqqaraRows.length > 1 && (
                            <Button
                              type="button"
                              className="h-8 w-8 rounded-lg bg-red-700/10 border border-red-200 text-red-700 text-lg font-bold flex items-center justify-center hover:bg-red-200"
                              onClick={() => handleSaqqaraRemoveRow(index)}
                            >
                              −
                            </Button>
                          )}
                          {index === saqqaraRows.length - 1 && (
                            <Button
                              type="button"
                              className="h-8 w-8 rounded-lg bg-green-600 text-white text-lg font-bold flex items-center justify-center hover:bg-green-700"
                              onClick={handleSaqqaraAddRow}
                            >
                              +
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                Sube hasta {MAX_FOTOS} fotos del día (panorámicas, detalles,
                avances y pendientes).
              </p>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl px-4 py-6 text-center cursor-pointer hover:border-sky-500 hover:bg-sky-50 transition">
                <span className="text-sm font-medium text-slate-700">
                  Seleccionar archivos
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Se aceptan JPG y PNG. Máximo {MAX_FOTOS} imágenes.
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
