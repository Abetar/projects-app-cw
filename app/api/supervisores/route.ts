// app/api/supervisores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupervisorById } from "@/lib/airtable";

// POST /api/supervisores
// Body: { supervisorId: string }
export async function POST(req: NextRequest) {
  try {
    const { supervisorId } = await req.json();

    if (!supervisorId || typeof supervisorId !== "string") {
      return NextResponse.json(
        { ok: false, error: "ID de supervisor requerido" },
        { status: 400 }
      );
    }

    const supervisor = await getSupervisorById(supervisorId.trim());

    if (!supervisor) {
      return NextResponse.json(
        { ok: false, error: "ID de supervisor no encontrado" },
        { status: 404 }
      );
    }

    if (!supervisor.active) {
      return NextResponse.json(
        { ok: false, error: "Supervisor inactivo" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
      },
    });
  } catch (error) {
    console.error("Error en POST /api/supervisores:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al validar supervisor" },
      { status: 500 }
    );
  }
}
