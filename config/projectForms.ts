// config/projectForms.ts

export type ProjectFormType =
  | "boreal_codigo_medida"
  | "torres_categoria_item"
  | "saqqara_dropdown_qty";

/* ------------------ BOREAL ------------------ */

export type BorealRowDefinition = {
  code: string;
  medida: string;
};

export type BorealFormConfig = {
  type: "boreal_codigo_medida";
  rows: BorealRowDefinition[];
};

/* ------------------ TORRES ------------------ */

export type TorresCategoryKey = "Cristal" | "Herrajes" | "Espejos";

export type TorresItemDefinition = {
  id: string;
  label: string;
};

export type TorresFormConfig = {
  type: "torres_categoria_item";
  categories: Record<TorresCategoryKey, TorresItemDefinition[]>;
};

/* ------------------ SAQQARA ------------------ */

export type SaqqaraItemDefinition = {
  id: string;
  label: string; // texto completo (lo que se guarda en MetricsJson como itemLabel)
};

export type SaqqaraFormConfig = {
  type: "saqqara_dropdown_qty";
  items: SaqqaraItemDefinition[];
};

/* --------------- UNIÓN GENERAL --------------- */

export type ProjectFormConfig = BorealFormConfig | TorresFormConfig | SaqqaraFormConfig;

const SAQQARA_LABELS: string[] = [
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
  "Suministro e Instalación de panel color Dark Silver en pecheras exterior en Lobby Area de Asadores.",
  "Suministro e instalación de Tapas Con Medidas de 0.40ancho  x.05 ceja de precolado x 5.00 mts largo., de panel de aluminio en Lobby Exterior de Jardinera",
];

const SAQQARA_ITEMS: SaqqaraItemDefinition[] = SAQQARA_LABELS.map((label, i) => ({
  id: `SAQ_${String(i + 1).padStart(3, "0")}`,
  label,
}));

export const projectForms: Record<string, ProjectFormConfig> = {
  FORM_BOREAL: {
    type: "boreal_codigo_medida",
    rows: [
      { code: "C-15E", medida: "2570 x 2400" },
      { code: "C-15", medida: "2700 x 2400" },
      { code: "C-15D", medida: "2700 x 2400" },
      { code: "C-16C", medida: "2770 x 2400" },
      { code: "C-19", medida: "2200 x 2400" },
      { code: "C-20", medida: "1400 x 2400" },
      { code: "C-18", medida: "3600 x 2400" },
      { code: "C-16", medida: "3000 x 2400" },
      { code: "C-17", medida: "2500 x 2400" },
      { code: "C-17B", medida: "2500 x 2400" },
      { code: "C-16B", medida: "2870 x 2400" },
      { code: "C-15C", medida: "2700 x 2400" },
      { code: "C-15B", medida: "2700 x 2400" },
      { code: "C15F", medida: "2680 x 2400" },
      { code: "C-12", medida: "1660 x 2935" },
      { code: "C-13", medida: "1550 x 2935" },
      { code: "C-14", medida: "1000 x 2935" },
      { code: "C-21", medida: "1230 x 2935" },
      { code: "C-22", medida: "1450 x 2935" },
    ],
  },

  FORM_TORRES: {
    type: "torres_categoria_item",
    categories: {
      Cristal: [
        {
          id: "PUERTA_TEMPLADO_9_5MM_2_RESAQUES_3_PERF_CPB",
          label:
            "PUERTA – Cristal claro templado 9.5 mm con 2 resaques y 3 perforaciones CPB",
        },
        {
          id: "FIJO_TEMPLADO_9_5MM_4_RESAQUES_CPB_1",
          label: "FIJO – Cristal claro templado 9.5 mm con 4 resaques CPB",
        },
        {
          id: "FIJO_TEMPLADO_9_5MM_4_RESAQUES_CPB_2",
          label: "Cristal claro templado 9.5 mm con 4 resaques CPB",
        },
      ],
      Herrajes: [
        {
          id: "BISAGRA_MURO_CRISTAL_AC_INOX",
          label: "Bisagra muro – cristal AC. INOX",
        },
        {
          id: "JALADERA_TOALLERO_AC_INOX",
          label: "Jaladera toallero AC. INOX",
        },
        {
          id: "CLIP_MURO_CRISTAL_AC_INOX",
          label: "Clip muro – cristal AC. INOX",
        },
      ],
      Espejos: [
        { id: "LAMINA_ESPEJO_1_80_X_2_60", label: "Lámina espejo 1.80 x 2.60" },
        { id: "MAQUILA_CPB_60X115", label: "Maquila CPB 60x115" },
        { id: "TUBO_1X1_NAT_MATE_6_10", label: 'Tubo 1" x 1" nat. mate 6.10' },
        { id: "GUNTHER_CARTUCHO", label: "Gunther cartucho" },
        { id: "MO_BASTIDOR_ARMADO_PEGADO", label: "M.O. bastidor armado y pegado" },
      ],
    },
  },

  // ✅ NUEVO
  saqqara: {
    type: "saqqara_dropdown_qty",
    items: SAQQARA_ITEMS,
  },
};

export function getProjectFormConfig(formKey: string | null): ProjectFormConfig | null {
  if (!formKey) return null;
  return projectForms[formKey] ?? null;
}

export function isBorealFormConfig(
  config: ProjectFormConfig | null
): config is BorealFormConfig {
  return !!config && config.type === "boreal_codigo_medida";
}

export function isTorresFormConfig(
  config: ProjectFormConfig | null
): config is TorresFormConfig {
  return !!config && config.type === "torres_categoria_item";
}

export function isSaqqaraFormConfig(
  config: ProjectFormConfig | null
): config is SaqqaraFormConfig {
  return !!config && config.type === "saqqara_dropdown_qty";
}
