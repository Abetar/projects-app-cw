// config/projectForms.ts

export type ProjectFormType = "boreal_codigo_medida" | "torres_categoria_item";

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

/* --------------- UNIÓN GENERAL --------------- */

export type ProjectFormConfig = BorealFormConfig | TorresFormConfig;

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
        {
          id: "LAMINA_ESPEJO_1_80_X_2_60",
          label: "Lámina espejo 1.80 x 2.60",
        },
        {
          id: "MAQUILA_CPB_60X115",
          label: "Maquila CPB 60x115",
        },
        {
          id: "TUBO_1X1_NAT_MATE_6_10",
          label: 'Tubo 1" x 1" nat. mate 6.10',
        },
        {
          id: "GUNTHER_CARTUCHO",
          label: "Gunther cartucho",
        },
        {
          id: "MO_BASTIDOR_ARMADO_PEGADO",
          label: "M.O. bastidor armado y pegado",
        },
      ],
    },
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
