// app/api/reportes/route.ts
import { NextResponse } from "next/server";
import {
  createReporte,
  listReportes,
  type CreateReportePayload,
} from "@/lib/airtable";

/**
 * POST /api/reportes
 * Crea un reporte diario en Airtable.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreateReportePayload>;

    // ✅ Validaciones básicas
    if (!body.fecha) {
      return NextResponse.json(
        { ok: false, error: "La fecha es obligatoria." },
        { status: 400 }
      );
    }

    if (!body.supervisorId) {
      return NextResponse.json(
        { ok: false, error: "El ID de supervisor es obligatorio." },
        { status: 400 }
      );
    }

    if (!body.proyectoId) {
      return NextResponse.json(
        { ok: false, error: "El ID de proyecto es obligatorio." },
        { status: 400 }
      );
    }

    // Valores por defecto para evitar undefined
    const payload: CreateReportePayload = {
      fecha: body.fecha,
      supervisorId: body.supervisorId,
      proyectoId: body.proyectoId,
      actividadesFabricacion: body.actividadesFabricacion ?? [],
      actividadesInstalacion: body.actividadesInstalacion ?? [],
      actividadesSupervision: body.actividadesSupervision ?? [],
      tiempoMuerto: body.tiempoMuerto ?? null,
      tiempoMuertoOtro: body.tiempoMuertoOtro ?? null,
      pendiente: body.pendiente ?? null,
      pendienteOtro: body.pendienteOtro ?? null,
      fotos: body.fotos ?? [],
      metrics: body.metrics ?? [],
    };

    // 🧠 Llamamos a Airtable
    const newId = await createReporte(payload);

    return NextResponse.json(
      {
        ok: true,
        id: newId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/reportes:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Error al crear el reporte. Revisa los datos e intenta de nuevo.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reportes
 * (Bonus) Lista todos los reportes para el panel admin.
 */
export async function GET() {
  try {
    const reportes = await listReportes();

    return NextResponse.json(reportes, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/reportes:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener los reportes." },
      { status: 500 }
    );
  }
}
