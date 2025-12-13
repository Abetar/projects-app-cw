"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReporteDiario } from "@/lib/airtable";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ----------------------------------------------------
// Utilidad para obtener semana ISO del año
// ----------------------------------------------------
function getISOWeek(dateStr: string) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  const tmp = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;

  tmp.setDate(tmp.getDate() - dayNr + 3);
  const firstThursday = tmp.valueOf();

  tmp.setMonth(0, 1);
  const dayNr2 = (tmp.getDay() + 6) % 7;
  tmp.setDate(tmp.getDate() - dayNr2 + 3);

  const week = 1 + Math.round((firstThursday - tmp.valueOf()) / 604800000);

  return week;
}

// ----------------------------------------------------
// Normaliza texto de proyecto (Airtable a veces manda array)
// ----------------------------------------------------
function normalizeProyectoNombre(value: any) {
  if (Array.isArray(value)) return value.join(" ").trim();
  return String(value ?? "").trim();
}

// ----------------------------------------------------
// Chips para actividades
// ----------------------------------------------------
function ChipsRow({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-3">
      <p className="font-medium text-sm mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 border border-slate-200"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Componente principal
// ----------------------------------------------------
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [reportes, setReportes] = useState<ReporteDiario[]>([]);
  const [selected, setSelected] = useState<ReporteDiario | null>(null);
  const [loading, setLoading] = useState(false);

  // Foto expandida (lightbox)
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  // Filtros
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("admin_logged_in");
    if (stored === "true") {
      setLoggedIn(true);

      const today = new Date();
      const currentWeek = getISOWeek(today.toISOString().slice(0, 10));
      const currentYear = today.getFullYear();

      setSelectedWeek(currentWeek ?? null);
      setSelectedYear(currentYear);
    }
  }, []);

  // ----------------------------------------------------
  // Login simple
  // ----------------------------------------------------
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setLoggedIn(true);
      window.localStorage.setItem("admin_logged_in", "true");

      const today = new Date();
      const currentWeek = getISOWeek(today.toISOString().slice(0, 10));
      const currentYear = today.getFullYear();
      setSelectedWeek(currentWeek ?? null);
      setSelectedYear(currentYear);
    } else {
      alert("Contraseña incorrecta");
    }
  }

  // ----------------------------------------------------
  // Cargar reportes desde la API
  // ----------------------------------------------------
  async function loadReportes() {
    setLoading(true);
    try {
      const res = await fetch("/api/reportes", { cache: "no-store" });
      const data: ReporteDiario[] = await res.json();
      setReportes(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loggedIn) loadReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  // ----------------------------------------------------
  // Filtrado (semana, año, search)
  // ----------------------------------------------------
  const filteredReportes = useMemo(() => {
    return reportes.filter((r) => {
      if (!r.fecha) return false;

      const week = getISOWeek(r.fecha);
      const year = new Date(r.fecha).getFullYear();

      if (selectedWeek && week !== selectedWeek) return false;
      if (selectedYear && year !== selectedYear) return false;

      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const proyectoNombre = normalizeProyectoNombre(
          (r as any).proyectoNombre
        );
        const text = `${proyectoNombre} ${r.supervisorNombre} ${
          r.supervisorId || ""
        } ${r.fecha}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [reportes, selectedWeek, selectedYear, search]);

  // ----------------------------------------------------
  // Stats para dashboard
  // ----------------------------------------------------
  const stats = useMemo(() => {
    const total = filteredReportes.length;

    const uniqueProjects = new Set(
      filteredReportes
        .map((r) => normalizeProyectoNombre((r as any).proyectoNombre))
        .filter(Boolean)
    ).size;

    const uniqueSupervisors = new Set(
      filteredReportes
        .map((r) => String(r.supervisorNombre || r.supervisorId || "").trim())
        .filter(Boolean)
    ).size;

    const totalFotos = filteredReportes.reduce(
      (acc, r) => acc + (r.fotos?.length ?? 0),
      0
    );

    return { total, uniqueProjects, uniqueSupervisors, totalFotos };
  }, [filteredReportes]);

  // ----------------------------------------------------
  // Exportar a PDF (pdf-lib) - con page-break real
  // ----------------------------------------------------
  async function handleExportPdf(reporte: ReporteDiario) {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const margin = 50;
      const BOTTOM_LIMIT = 80;

      let page = pdfDoc.addPage();
      let { width, height } = page.getSize();
      let y = height - margin;

      function addPage() {
        page = pdfDoc.addPage();
        ({ width, height } = page.getSize());
        y = height - margin;
      }

      function ensureSpace(neededPx: number) {
        if (y - neededPx < BOTTOM_LIMIT) addPage();
      }

      function drawLine(
        text: string,
        opts: { size: number; bold?: boolean; indent?: number } = {
          size: 11,
        }
      ) {
        const size = opts.size ?? 11;
        const indent = opts.indent ?? 0;

        ensureSpace(size + 6);

        page.drawText(text, {
          x: margin + indent,
          y,
          size,
          font: opts.bold ? fontBold : font,
          color: rgb(0, 0, 0),
        });

        y -= size + 6;
      }

      // Logo
      try {
        const logoUrl = "/cw-logo.jpg"; // public/cw-logo.jpg
        const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
        const logoImage = await pdfDoc.embedJpg(logoBytes);

        const logoWidth = 100;
        const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

        ensureSpace(logoHeight + 10);

        page.drawImage(logoImage, {
          x: width - margin - logoWidth,
          y: y - logoHeight,
          width: logoWidth,
          height: logoHeight,
        });

        y -= logoHeight + 18;
      } catch (e) {
        console.warn("No se pudo cargar el logo para el PDF:", e);
      }

      // Título + datos generales
      drawLine("Reporte diario de obra", { size: 18, bold: true });

      const supervisorNombre =
        reporte.supervisorNombre || reporte.supervisorId || "";
      const fechaTexto = reporte.fecha || "";
      const proyectoNombre = normalizeProyectoNombre(
        (reporte as any).proyectoNombre
      );

      y -= 4;
      drawLine(`Proyecto: ${proyectoNombre || "-"}`, { size: 12 });
      drawLine(`Supervisor: ${supervisorNombre || "-"}`, { size: 12 });
      drawLine(`Fecha: ${fechaTexto || "-"}`, { size: 12 });

      y -= 6;

      // Actividades
      drawLine("Actividades del día:", { size: 14, bold: true });

      function drawList(label: string, items?: string[]) {
        if (!items || items.length === 0) return;

        drawLine(label, { size: 12, bold: true });

        for (const item of items) {
          drawLine(`• ${item}`, { size: 11, indent: 10 });
        }

        y -= 4;
      }

      drawList("Fabricación:", reporte.actividadesFabricacion);
      drawList("Instalación:", reporte.actividadesInstalacion);
      drawList("Supervisión:", reporte.actividadesSupervision);

      // Incidencias
      if (reporte.tiempoMuerto || reporte.pendiente) {
        y -= 2;
        drawLine("Incidencias:", { size: 14, bold: true });

        if (reporte.tiempoMuerto)
          drawLine(`Tiempo muerto: ${reporte.tiempoMuerto}`, { size: 11 });
        if (reporte.tiempoMuertoOtro)
          drawLine(`Tiempo muerto (otro): ${reporte.tiempoMuertoOtro}`, {
            size: 11,
          });

        if (reporte.pendiente)
          drawLine(`Pendiente: ${reporte.pendiente}`, { size: 11 });
        if (reporte.pendienteOtro)
          drawLine(`Pendiente (otro): ${reporte.pendienteOtro}`, { size: 11 });
      }

      // Métricas
      if (reporte.metrics && reporte.metrics.length > 0) {
        y -= 6;
        drawLine("Métricas:", { size: 14, bold: true });

        for (const m of reporte.metrics as any[]) {
          const hasBorealShape = Boolean(m.codigo || m.medida);
          const hasTorresShape = Boolean(m.categoria || m.itemLabel);

          let line = "- ";

          if (hasBorealShape && !hasTorresShape) {
            if (m.codigo) line += `Código: ${m.codigo} `;
            if (m.medida) line += `| Medida: ${m.medida} `;
            if ("cantidad" in m) line += `| Cantidad: ${m.cantidad}`;
          } else if (hasTorresShape) {
            if (m.categoria) line += `Categoría: ${m.categoria} `;
            if (m.itemLabel) line += `| Item: ${m.itemLabel} `;
            if ("cantidad" in m) line += `| Cantidad: ${m.cantidad}`;
          } else {
            line += JSON.stringify(m);
          }

          drawLine(line, { size: 10 });
        }
      }

      // -----------------------------------------
      // Páginas de fotos (una por foto)
      // -----------------------------------------
      if (reporte.fotos && reporte.fotos.length > 0) {
        for (const url of reporte.fotos) {
          try {
            const imgBytes = await fetch(url).then((r) => r.arrayBuffer());

            let image;
            try {
              image = await pdfDoc.embedJpg(imgBytes);
            } catch {
              image = await pdfDoc.embedPng(imgBytes);
            }

            const imgPage = pdfDoc.addPage();
            const { width: pw, height: ph } = imgPage.getSize();

            const maxWidth = pw - margin * 2;
            const maxHeight = ph - margin * 2;

            const imgWidth = image.width;
            const imgHeight = image.height;

            const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

            const displayWidth = imgWidth * scale;
            const displayHeight = imgHeight * scale;

            const x = (pw - displayWidth) / 2;
            const imgY = (ph - displayHeight) / 2;

            imgPage.drawImage(image, {
              x,
              y: imgY,
              width: displayWidth,
              height: displayHeight,
            });

            imgPage.drawText("Evidencia fotográfica", {
              x: margin,
              y: margin - 10,
              size: 10,
              font,
              color: rgb(0.3, 0.3, 0.3),
            });
          } catch (e) {
            console.warn("No se pudo agregar una foto al PDF:", e);
          }
        }
      }

      const pdfBytes = await pdfDoc.save();

      // ✅ FIX definitivo TS: Blob con Uint8Array
      const blob = new Blob([new Uint8Array(pdfBytes)], {
        type: "application/pdf",
      });

      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileUrl;

      const proyectoNombreForFile =
        normalizeProyectoNombre((reporte as any).proyectoNombre) || "reporte";

      const safeProyecto = proyectoNombreForFile
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-");
      const safeFecha = (reporte.fecha || "").replace(/[^0-9-]/g, "");

      link.download = `reporte_${safeProyecto}_${safeFecha}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF.");
    }
  }

  // ----------------------------------------------------
  // Pantalla de LOGIN (estilo)
  // ----------------------------------------------------
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 w-full max-w-sm"
        >
          <h2 className="text-xl font-semibold mb-1 text-center text-slate-900">
            Panel de Administración
          </h2>
          <p className="text-center text-sm text-slate-500 mb-5">
            Ingresa la contraseña para ver reportes.
          </p>

          <input
            type="password"
            placeholder="Contraseña"
            className="border border-slate-300 rounded-xl px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl w-full"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // Vista principal ADMIN (dashboard)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Dashboard de reportes
            </h1>
            <p className="text-sm text-slate-500">
              Filtra por semana/año y revisa evidencias, métricas y exporta PDF.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium"
            onClick={() => {
              window.localStorage.removeItem("admin_logged_in");
              setLoggedIn(false);
            }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* Cards de stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500">Reportes (filtro actual)</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500">Proyectos únicos</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              {stats.uniqueProjects}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500">Supervisores únicos</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              {stats.uniqueSupervisors}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500">Fotos totales</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              {stats.totalFotos}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Semana */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Semana del año
              </label>
              <select
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={selectedWeek ?? ""}
                onChange={(e) =>
                  setSelectedWeek(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Todas</option>
                {Array.from({ length: 52 }).map((_, i) => (
                  <option key={i} value={i + 1}>
                    Semana {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Año */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Año
              </label>
              <select
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={selectedYear ?? ""}
                onChange={(e) =>
                  setSelectedYear(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Todos</option>
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Buscar reporte
              </label>
              <input
                type="text"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Buscar por proyecto, supervisor, fecha..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Refresh */}
            <div className="flex items-end">
              <button
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-sm font-medium"
                onClick={loadReportes}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-sm text-slate-600">Cargando reportes...</div>
        )}

        {/* Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReportes.map((r) => {
              const proyectoNombre = normalizeProyectoNombre(
                (r as any).proyectoNombre
              );

              return (
                <div
                  key={r.id}
                  className="border border-slate-200 rounded-2xl p-5 shadow-sm bg-white flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <p className="text-slate-500 text-xs">{r.fecha || "—"}</p>

                    <h2 className="text-lg font-semibold text-slate-900 mt-1">
                      {proyectoNombre || "Sin nombre"}
                    </h2>

                    <p className="text-slate-700 mt-2 text-sm">
                      <span className="font-semibold">Supervisor:</span>{" "}
                      {r.supervisorNombre || r.supervisorId}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 text-center">
                        <p className="text-slate-500">Fab</p>
                        <p className="font-semibold text-slate-900">
                          {r.actividadesFabricacion?.length ?? 0}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 text-center">
                        <p className="text-slate-500">Inst</p>
                        <p className="font-semibold text-slate-900">
                          {r.actividadesInstalacion?.length ?? 0}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 text-center">
                        <p className="text-slate-500">Sup</p>
                        <p className="font-semibold text-slate-900">
                          {r.actividadesSupervision?.length ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>Fotos: {r.fotos?.length ?? 0}</span>
                      <span>Métricas: {r.metrics?.length ?? 0}</span>
                    </div>
                  </div>

                  <button
                    className="mt-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2 text-sm font-medium"
                    onClick={() => setSelected(r)}
                  >
                    Ver detalles
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredReportes.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
            No hay reportes con los filtros actuales.
          </div>
        )}

        {/* MODAL DETALLES */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200">
              <button
                className="absolute right-3 top-3 text-slate-600 hover:text-slate-900 text-lg"
                onClick={() => setSelected(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>

              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                Detalle del reporte
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Revisa actividades, métricas y evidencia.
              </p>

              {/* Datos base */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Fecha</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selected.fecha || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Supervisor</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selected.supervisorNombre || selected.supervisorId || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Proyecto</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {normalizeProyectoNombre(
                      (selected as any).proyectoNombre
                    ) || "—"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-sm font-medium"
                  onClick={() => handleExportPdf(selected)}
                >
                  Exportar PDF
                </button>
              </div>

              <hr className="my-4" />

              {/* ACTIVIDADES */}
              <h3 className="font-semibold text-slate-900 mb-2">Actividades</h3>

              {(!selected.actividadesFabricacion ||
                selected.actividadesFabricacion.length === 0) &&
                (!selected.actividadesInstalacion ||
                  selected.actividadesInstalacion.length === 0) &&
                (!selected.actividadesSupervision ||
                  selected.actividadesSupervision.length === 0) && (
                  <p className="text-sm text-slate-600 mb-2">
                    Sin actividades registradas.
                  </p>
                )}

              <ChipsRow
                label="Fabricación"
                items={selected.actividadesFabricacion}
              />
              <ChipsRow
                label="Instalación"
                items={selected.actividadesInstalacion}
              />
              <ChipsRow
                label="Supervisión"
                items={selected.actividadesSupervision}
              />

              <hr className="my-4" />

              {/* MÉTRICAS */}
              <h3 className="font-semibold text-slate-900 mb-2">Métricas</h3>

              {(!selected.metrics || selected.metrics.length === 0) && (
                <p className="text-sm text-slate-600 mb-2">
                  Sin métricas registradas.
                </p>
              )}

              {selected.metrics && selected.metrics.length > 0 && (
                <div className="space-y-3 text-sm">
                  {selected.metrics.map((m: any, idx: number) => {
                    const hasBorealShape = Boolean(m.codigo || m.medida);
                    const hasTorresShape = Boolean(m.categoria || m.itemLabel);

                    return (
                      <div
                        key={idx}
                        className="border border-slate-200 rounded-xl bg-slate-50 px-3 py-2"
                      >
                        {/* Boreal */}
                        {hasBorealShape && !hasTorresShape && (
                          <>
                            {m.codigo && (
                              <p>
                                <strong>Código:</strong> {m.codigo}
                              </p>
                            )}
                            {m.medida && (
                              <p>
                                <strong>Medida:</strong> {m.medida}
                              </p>
                            )}
                            {"cantidad" in m && (
                              <p>
                                <strong>Cantidad:</strong> {m.cantidad}
                              </p>
                            )}
                          </>
                        )}

                        {/* Torres */}
                        {hasTorresShape && (
                          <>
                            {m.categoria && (
                              <p>
                                <strong>Categoría:</strong> {m.categoria}
                              </p>
                            )}
                            {m.itemLabel && (
                              <p>
                                <strong>Item:</strong> {m.itemLabel}
                              </p>
                            )}
                            {"cantidad" in m && (
                              <p>
                                <strong>Cantidad:</strong> {m.cantidad}
                              </p>
                            )}
                          </>
                        )}

                        {/* Fallback */}
                        {!hasBorealShape && !hasTorresShape && (
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(m, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <hr className="my-4" />

              {/* FOTOS */}
              {selected.fotos?.length > 0 && (
                <>
                  <h3 className="font-semibold text-slate-900 mb-2">Fotos</h3>
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {selected.fotos.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        className="h-24 w-32 rounded-xl border border-slate-200 object-cover cursor-zoom-in"
                        onClick={() => setExpandedPhoto(url)}
                        alt={`Foto ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Lightbox para foto expandida */}
        {expandedPhoto && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setExpandedPhoto(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-2 top-2 text-white text-2xl font-bold"
                onClick={() => setExpandedPhoto(null)}
                aria-label="Cerrar imagen"
              >
                ✕
              </button>
              <img
                src={expandedPhoto}
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-lg"
                alt="Foto ampliada"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
