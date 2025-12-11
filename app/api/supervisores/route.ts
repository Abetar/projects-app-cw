// app/api/supervisores/route.ts
import { NextResponse } from "next/server";
import { getSupervisorById } from "@/lib/airtable";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const supervisorId = body?.supervisorId as string | undefined;

    if (!supervisorId || typeof supervisorId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Falta el ID de supervisor." },
        { status: 400 }
      );
    }

    const trimmedId = supervisorId.trim();
    if (!trimmedId) {
      return NextResponse.json(
        { ok: false, error: "Por favor ingresa un ID válido." },
        { status: 400 }
      );
    }

    // 🔍 Consultamos Airtable
    const sup = await getSupervisorById(trimmedId);

    if (!sup) {
      return NextResponse.json(
        { ok: false, error: "Supervisor no encontrado. Verifica tu ID." },
        { status: 404 }
      );
    }

    if (!sup.active) {
      return NextResponse.json(
        {
          ok: false,
          error: "Este supervisor está inactivo. Contacta a sistemas.",
        },
        { status: 403 }
      );
    }

    // Normalizamos lo que regresamos al frontend
    const supervisor = {
      id: sup.id,
      name: sup.name || "",
      active: sup.active,
    };

    return NextResponse.json({ ok: true, supervisor }, { status: 200 });
  } catch (err) {
    console.error("Error en /api/supervisores:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Error interno al validar el supervisor. Intenta de nuevo.",
      },
      { status: 500 }
    );
  }
}
