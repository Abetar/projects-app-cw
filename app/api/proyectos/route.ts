// app/api/proyectos/route.ts
import { NextResponse } from "next/server";
import { listProyectos } from "@/lib/airtable";

export async function GET() {
  try {
    const proyectos = await listProyectos();

    // Solo devolvemos lo que el frontend necesita
    return NextResponse.json(
      proyectos.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        formKey: p.formKey,
      }))
    );
  } catch (error) {
    console.error("Error en GET /api/proyectos:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener proyectos" },
      { status: 500 }
    );
  }
}
