// lib/airtable.ts

// Tipos base
export type AirtableRecord<T = any> = {
  id: string;
  fields: T;
};

export type AirtableListResponse<T = any> = {
  records: AirtableRecord<T>[];
};

// ⚙️ Config
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;

const TABLE_SUPERVISORES =
  process.env.AIRTABLE_TABLE_SUPERVISORES || "Supervisores";
const TABLE_PROYECTOS = process.env.AIRTABLE_TABLE_PROYECTOS || "Proyectos";
const TABLE_REPORTES =
  process.env.AIRTABLE_TABLE_REPORTES || "Reportes diarios";

const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// Helper genérico para llamar Airtable
async function airtableFetch<T>(
  tableName: string,
  init?: RequestInit & { searchParams?: URLSearchParams }
): Promise<T> {
  const url = new URL(`${AIRTABLE_BASE_URL}/${encodeURIComponent(tableName)}`);

  if (init?.searchParams) {
    url.search = init.searchParams.toString();
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Airtable error:", res.status, text);
    throw new Error(`Airtable error ${res.status}`);
  }

  return res.json();
}

/* ---------------------------------------
 * SUPERVISORES
 * ------------------------------------- */

type SupervisorFields = {
  Nombre?: string;
  Activo?: boolean;
  RecordID?: string; // fórmula RECORD_ID()
};

export type Supervisor = {
  id: string; // record id real de Airtable
  name: string;
  active: boolean;
};

/**
 * Login simple:
 * El supervisor escribe su RecordID (ej. recAKr6tejjFxhQA)
 * y aquí lo validamos directo por ID.
 */
export async function getSupervisorById(
  recordId: string
): Promise<Supervisor | null> {
  const url = `${AIRTABLE_BASE_URL}/${encodeURIComponent(
    TABLE_SUPERVISORES
  )}/${recordId}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    console.error("Airtable getSupervisorById error:", res.status, text);
    throw new Error("Error consultando supervisor");
  }

  const data = (await res.json()) as AirtableRecord<SupervisorFields>;

  return {
    id: data.id,
    name: data.fields.Nombre ?? "",
    active: Boolean(data.fields.Activo ?? true),
  };
}

// Listar supervisores (para mapear id → nombre en admin)
export async function listSupervisores(): Promise<Supervisor[]> {
  const data = await airtableFetch<AirtableListResponse<SupervisorFields>>(
    TABLE_SUPERVISORES
  );

  return data.records.map((r) => ({
    id: r.id,
    name: r.fields.Nombre ?? "",
    active: Boolean(r.fields.Activo ?? true),
  }));
}

/* ---------------------------------------
 * PROYECTOS
 * ------------------------------------- */

type ProyectoFields = {
  "Nombre del proyecto"?: string;
  "Código / Clave"?: string;
  FormKey?: string;
};

export type Proyecto = {
  id: string;
  name: string;
  code: string;
  formKey: string | null;
};

export async function listProyectos(): Promise<Proyecto[]> {
  const data = await airtableFetch<AirtableListResponse<ProyectoFields>>(
    TABLE_PROYECTOS
  );

  return data.records.map((r) => ({
    id: r.id,
    name: r.fields["Nombre del proyecto"] ?? "",
    code: r.fields["Código / Clave"] ?? "",
    formKey: r.fields.FormKey ?? null,
  }));
}

/* ---------------------------------------
 * REPORTES DIARIOS
 * ------------------------------------- */

type ReporteFields = {
  Fecha?: string;
  Supervisores?: string[]; // linked record IDs
  Proyectos?: string[]; // linked record IDs
  "Nombre del proyecto"?: string; // lookup
  "Código / Clave"?: string; // lookup
  FormKey?: string; // lookup
  "Fabricación – actividades"?: string[];
  "Instalación – actividades"?: string[];
  "Supervisión – actividades"?: string[];
  "Tiempo muerto"?: string;
  "Tiempo muerto otro"?: string;
  Pendiente?: string;
  "Pendiente otro"?: string;
  Fotos?: { url: string }[];
  MetricsJson?: string;
  "Confirmado por supervisor"?: boolean;

  // ✅ NUEVO
  "Comentario general"?: string;
};

export type MetricsRow = Record<string, any>;

export type ReporteDiario = {
  id: string;
  fecha: string | null;
  supervisorId: string | null;
  supervisorNombre: string;
  proyectoId: string | null;
  proyectoNombre: string;
  proyectoCode: string;
  formKey: string | null;
  actividadesFabricacion: string[];
  actividadesInstalacion: string[];
  actividadesSupervision: string[];
  tiempoMuerto: string | null;
  tiempoMuertoOtro: string | null;
  pendiente: string | null;
  pendienteOtro: string | null;
  fotos: string[];
  metrics: MetricsRow[];

  // ✅ NUEVO
  comentarioGeneral: string | null;
};

/**
 * Crear un reporte diario.
 * `payload` viene desde el frontend.
 */
export type CreateReportePayload = {
  fecha: string; // ISO (ej. 2025-12-10)
  supervisorId: string;
  proyectoId: string;

  // ✅ NUEVO
  comentarioGeneral?: string | null;

  actividadesFabricacion: string[];
  actividadesInstalacion: string[];
  actividadesSupervision: string[];
  tiempoMuerto: string | null;
  tiempoMuertoOtro: string | null;
  pendiente: string | null;
  pendienteOtro: string | null;
  fotos: string[]; // URLs de Cloudinary
  metrics: MetricsRow[]; // arreglo de filas dinámicas
};

export async function createReporte(
  payload: CreateReportePayload
): Promise<string> {
  const body = {
    records: [
      {
        fields: {
          Fecha: payload.fecha,
          Supervisores: [payload.supervisorId],
          Proyectos: [payload.proyectoId],

          // ✅ NUEVO (ojo al nombre exacto del campo en Airtable)
          "Comentario general": payload.comentarioGeneral || undefined,

          "Fabricación – actividades": payload.actividadesFabricacion,
          "Instalación – actividades": payload.actividadesInstalacion,
          "Supervisión – actividades": payload.actividadesSupervision,
          "Tiempo muerto": payload.tiempoMuerto || undefined,
          "Tiempo muerto otro": payload.tiempoMuertoOtro || undefined,
          Pendiente: payload.pendiente || undefined,
          "Pendiente otro": payload.pendienteOtro || undefined,
          Fotos: payload.fotos.map((url) => ({ url })),
          MetricsJson: JSON.stringify(payload.metrics ?? []),
          "Confirmado por supervisor": true,
        } as ReporteFields,
      },
    ],
  };

  let data;

  try {
    data = await airtableFetch<{ records: { id: string }[] }>(TABLE_REPORTES, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    console.error("Airtable POST ERROR:", err);
    throw err;
  }

  return data.records[0].id;
}

/**
 * Listar todos los reportes (para el panel admin y PDF)
 */
export async function listReportes(): Promise<ReporteDiario[]> {
  const [reportesData, supervisoresData] = await Promise.all([
    airtableFetch<AirtableListResponse<ReporteFields>>(TABLE_REPORTES),
    airtableFetch<AirtableListResponse<SupervisorFields>>(TABLE_SUPERVISORES),
  ]);

  // Mapa id → nombre de supervisor
  const supervisorMap = new Map<string, string>();
  for (const s of supervisoresData.records) {
    supervisorMap.set(s.id, s.fields.Nombre ?? "");
  }

  return reportesData.records.map((r) => {
    const f = r.fields;

    let metrics: MetricsRow[] = [];
    if (f.MetricsJson) {
      try {
        metrics = JSON.parse(f.MetricsJson);
      } catch (e) {
        console.error("Error parseando MetricsJson:", e);
      }
    }

    const supervisorId = f.Supervisores?.[0] ?? null;
    const supervisorNombre =
      supervisorId && supervisorMap.get(supervisorId)
        ? supervisorMap.get(supervisorId)!
        : "";

    return {
      id: r.id,
      fecha: f.Fecha ?? null,
      supervisorId,
      supervisorNombre,
      proyectoId: f.Proyectos?.[0] ?? null,
      proyectoNombre: f["Nombre del proyecto"] ?? "",
      proyectoCode: f["Código / Clave"] ?? "",
      formKey: f.FormKey ?? null,
      actividadesFabricacion: f["Fabricación – actividades"] ?? [],
      actividadesInstalacion: f["Instalación – actividades"] ?? [],
      actividadesSupervision: f["Supervisión – actividades"] ?? [],
      tiempoMuerto: f["Tiempo muerto"] ?? null,
      tiempoMuertoOtro: f["Tiempo muerto otro"] ?? null,
      pendiente: f.Pendiente ?? null,
      pendienteOtro: f["Pendiente otro"] ?? null,
      fotos: (f.Fotos ?? []).map((att) => att.url),
      metrics,

      // ✅ NUEVO
      comentarioGeneral: f["Comentario general"] ?? null,
    };
  });
}
