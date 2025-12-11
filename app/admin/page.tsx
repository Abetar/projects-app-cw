"use client";

import { useEffect, useState } from "react";
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
            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs"
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
    const res = await fetch("/api/reportes");
    const data: ReporteDiario[] = await res.json();
    setReportes(data);
    setLoading(false);
  }

  useEffect(() => {
    if (loggedIn) loadReportes();
  }, [loggedIn]);

  // ----------------------------------------------------
  // Filtrado (semana, año, search)
  // ----------------------------------------------------
  const filteredReportes = reportes.filter((r) => {
    if (!r.fecha) return false;

    const week = getISOWeek(r.fecha);
    const year = new Date(r.fecha).getFullYear();

    if (selectedWeek && week !== selectedWeek) return false;
    if (selectedYear && year !== selectedYear) return false;

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      const text = `${r.proyectoNombre} ${r.supervisorNombre} ${
        r.supervisorId || ""
      } ${r.fecha}`.toLowerCase();
      if (!text.includes(q)) return false;
    }

    return true;
  });

  // ----------------------------------------------------
  // Exportar a PDF (pdf-lib)
  // ----------------------------------------------------
  async function handleExportPdf(reporte: ReporteDiario) {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Página principal
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const margin = 50;
      let y = height - margin;

      // Logo
      try {
        const logoUrl = "/cw-logo.jpg"; // coloca tu logo en public/cw-logo.jpg
        const logoBytes = await fetch(logoUrl).then((r) => r.arrayBuffer());
        const logoImage = await pdfDoc.embedJpg(logoBytes);
        const logoWidth = 100;
        const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

        page.drawImage(logoImage, {
          x: width / 2 - logoWidth / 2 + 200,
          y: y - logoHeight,
          width: logoWidth,
          height: logoHeight,
        });

        y -= logoHeight + 20;
      } catch (e) {
        console.warn("No se pudo cargar el logo para el PDF:", e);
      }

      // Título
      page.drawText("Reporte diario de obra", {
        x: margin,
        y,
        size: 18,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      y -= 30;

      const supervisorNombre =
        reporte.supervisorNombre || reporte.supervisorId || "";
      const fechaTexto = reporte.fecha || "";

      // Datos generales
      const linesGeneral = [
        `Proyecto: ${reporte.proyectoNombre || "-"}`,
        `Supervisor: ${supervisorNombre || "-"}`,
        `Fecha: ${fechaTexto || "-"}`,
      ];

      linesGeneral.forEach((line) => {
        page.drawText(line, {
          x: margin,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        y -= 18;
      });

      y -= 10;

      // Actividades
      page.drawText("Actividades del día:", {
        x: margin,
        y,
        size: 14,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      y -= 20;

      function drawList(label: string, items?: string[]) {
        if (!items || items.length === 0) return;
        page.drawText(label, {
          x: margin,
          y,
          size: 12,
          font: fontBold,
        });
        y -= 16;

        items.forEach((item) => {
          page.drawText(`• ${item}`, {
            x: margin + 10,
            y,
            size: 11,
            font,
          });
          y -= 14;
        });
        y -= 6;
      }

      drawList("Fabricación:", reporte.actividadesFabricacion);
      drawList("Instalación:", reporte.actividadesInstalacion);
      drawList("Supervisión:", reporte.actividadesSupervision);

      // Incidencias
      if (reporte.tiempoMuerto || reporte.pendiente) {
        y -= 4;
        page.drawText("Incidencias:", {
          x: margin,
          y,
          size: 14,
          font: fontBold,
        });
        y -= 20;

        if (reporte.tiempoMuerto) {
          page.drawText(`Tiempo muerto: ${reporte.tiempoMuerto}`, {
            x: margin,
            y,
            size: 11,
            font,
          });
          y -= 14;
        }
        if (reporte.tiempoMuertoOtro) {
          page.drawText(`Tiempo muerto (otro): ${reporte.tiempoMuertoOtro}`, {
            x: margin,
            y,
            size: 11,
            font,
          });
          y -= 14;
        }

        if (reporte.pendiente) {
          page.drawText(`Pendiente: ${reporte.pendiente}`, {
            x: margin,
            y,
            size: 11,
            font,
          });
          y -= 14;
        }
        if (reporte.pendienteOtro) {
          page.drawText(`Pendiente (otro): ${reporte.pendienteOtro}`, {
            x: margin,
            y,
            size: 11,
            font,
          });
          y -= 14;
        }
      }

      // Métricas
      if (reporte.metrics && reporte.metrics.length > 0) {
        y -= 10;
        page.drawText("Métricas:", {
          x: margin,
          y,
          size: 14,
          font: fontBold,
        });
        y -= 20;

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

          page.drawText(line, {
            x: margin + 5,
            y,
            size: 10,
            font,
          });
          y -= 14;

          if (y < 80) {
            // Nueva página si nos quedamos sin espacio
            const newPage = pdfDoc.addPage();
            y = newPage.getSize().height - margin;
          }
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

            // Texto pequeño abajo
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

      // ✅ usar el buffer interno como ArrayBuffer
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const proyectoNombre = Array.isArray(reporte.proyectoNombre)
        ? reporte.proyectoNombre.join(" ")
        : reporte.proyectoNombre || "reporte";

      const safeProyecto = proyectoNombre
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-");
      const safeFecha = (reporte.fecha || "").replace(/[^0-9-]/g, "");
      link.href = url;
      link.download = `reporte_${safeProyecto}_${safeFecha}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF.");
    }
  }

  // ----------------------------------------------------
  // Pantalla de LOGIN
  // ----------------------------------------------------
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="bg-white border rounded-lg shadow p-6 w-full max-w-sm"
        >
          <h2 className="text-xl font-bold mb-4 text-center">
            Panel de Administración
          </h2>

          <input
            type="password"
            placeholder="Contraseña"
            className="border rounded px-3 py-2 w-full mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded w-full"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // Vista principal ADMIN
  // ----------------------------------------------------
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reportes enviados</h1>
        <button
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
          }}
          onClick={() => {
            window.localStorage.removeItem("admin_logged_in");
            setLoggedIn(false);
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-6 mb-6">
        {/* Semana */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Semana del año
          </label>
          <select
            className="border rounded px-3 py-2"
            value={selectedWeek ?? ""}
            onChange={(e) =>
              setSelectedWeek(e.target.value ? Number(e.target.value) : null)
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
          <label className="block text-sm font-semibold mb-1">Año</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedYear ?? ""}
            onChange={(e) =>
              setSelectedYear(e.target.value ? Number(e.target.value) : null)
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
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold mb-1">
            Buscar reporte
          </label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            placeholder="Buscar por proyecto, supervisor, fecha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* LOADING */}
      {loading && <p>Cargando reportes...</p>}

      {/* GRID DE CARDS */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReportes.map((r) => (
            <div
              key={r.id}
              className="border rounded-lg p-5 shadow-sm bg-white flex flex-col justify-between"
            >
              <p className="text-gray-600 text-sm">{r.fecha}</p>

              <h2 className="text-lg font-bold mt-1">{r.proyectoNombre}</h2>

              <p className="text-gray-700 mt-1 text-sm">
                <strong>Supervisor:</strong>{" "}
                {r.supervisorNombre || r.supervisorId}
              </p>

              <div className="mt-3 text-sm text-gray-700">
                <p>
                  <strong>Fabricación:</strong>{" "}
                  {r.actividadesFabricacion?.length ?? 0}
                </p>
                <p>
                  <strong>Instalación:</strong>{" "}
                  {r.actividadesInstalacion?.length ?? 0}
                </p>
                <p>
                  <strong>Supervisión:</strong>{" "}
                  {r.actividadesSupervision?.length ?? 0}
                </p>
              </div>

              <button
                className="mt-4 bg-black text-white py-2 rounded"
                onClick={() => setSelected(r)}
              >
                Ver detalles
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETALLES */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute right-3 top-3 text-lg"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Detalle del reporte</h2>

            {/* Datos base */}
            <p>
              <strong>Fecha:</strong> {selected.fecha}
            </p>
            <p>
              <strong>Supervisor:</strong>{" "}
              {selected.supervisorNombre || selected.supervisorId}
            </p>
            <p>
              <strong>Proyecto:</strong> {selected.proyectoNombre}
            </p>

            <div className="mt-3 mb-4 flex gap-2">
              <button
                className="bg-black text-white px-3 py-2 rounded text-sm"
                onClick={() => handleExportPdf(selected)}
              >
                Exportar PDF
              </button>
            </div>

            <hr className="my-3" />

            {/* ACTIVIDADES COMO CHIPS */}
            <h3 className="font-bold mb-2">Actividades</h3>
            {(!selected.actividadesFabricacion ||
              selected.actividadesFabricacion.length === 0) &&
              (!selected.actividadesInstalacion ||
                selected.actividadesInstalacion.length === 0) &&
              (!selected.actividadesSupervision ||
                selected.actividadesSupervision.length === 0) && (
                <p className="text-sm text-gray-600 mb-2">
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

            <hr className="my-3" />

            {/* MÉTRICAS FORMATEADAS */}
            <h3 className="font-bold mb-2">Métricas</h3>
            {(!selected.metrics || selected.metrics.length === 0) && (
              <p className="text-sm text-gray-600 mb-2">
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
                      className="border rounded bg-gray-50 px-3 py-2"
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

                      {/* Torres 1000 */}
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

                      {/* Fallback genérico */}
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

            <hr className="my-3" />

            {/* FOTOS */}
            {selected.fotos?.length > 0 && (
              <>
                <h3 className="font-bold mb-2">Fotos</h3>
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {selected.fotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      className="h-24 rounded border object-cover cursor-zoom-in"
                      onClick={() => setExpandedPhoto(url)}
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
            >
              ✕
            </button>
            <img
              src={expandedPhoto}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
              alt="Foto ampliada"
            />
          </div>
        </div>
      )}
    </div>
  );
}
