// app/api/proyectos/route.ts
import { NextResponse } from "next/server";
import { listProyectos } from "@/lib/airtable";

export async function GET() {
  try {
    const proyectos = await listProyectos();

    return NextResponse.json(
      proyectos.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        // ✅ asegura siempre string (evita null/undefined rompiendo el form)
        formKey: String(p.formKey ?? ""),
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
