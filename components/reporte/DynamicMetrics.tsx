// app/components/reporte/DynamicMetrics.tsx
"use client";

import { useMemo, useState } from "react";
import {
  getProjectFormConfig,
  isBorealFormConfig,
  isTorresFormConfig,
  isSaqqaraFormConfig,
  TorresItemDefinition,
  BorealFormConfig,
  TorresFormConfig,
  SaqqaraFormConfig,
  ProjectFormConfig,
} from "@/config/projectForms";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";

export type MetricsRow = Record<string, any>;

type Props = {
  formKey: string | null;
  onChange: (rows: MetricsRow[]) => void;
};

type BorealRowState = {
  code: string;
  cantidad: string;
};

type TorresRowState = {
  categoria: string;
  itemId: string;
  cantidad: string;
};

type SaqqaraRowState = {
  itemId: string;
  cantidad: string;
};

function compactSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function shortSaqqaraLabel(full: string) {
  const s = compactSpaces(full.replace(/[.,]+$/g, ""));

  // NIVEL / nivel -> N{num} ...
  const mNivel = s.match(/^(NIVEL|nivel)\s*(\d+)\s*(.*)$/);
  if (mNivel) {
    const num = mNivel[2];
    const rest = mNivel[3] || "";

    // intenta extraer medidas tipo 3.10 x 0.075
    const mMed = rest.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
    const medida = mMed ? `${mMed[1]}x${mMed[2]}` : "";

    // heurística para "solera ... panel"
    const isSolera = /solera/i.test(rest);
    const isPanel = /panel/i.test(rest);

    if (isSolera && isPanel) {
      return compactSpaces(`N${num} solera panel ${medida}`.trim());
    }

    // "panel en cancel pasillo elevador"
    if (/panel/i.test(rest) && /cancel/i.test(rest)) {
      return compactSpaces(`N${num} panel cancel elevador`);
    }

    return compactSpaces(`N${num} ${rest}`).slice(0, 60);
  }

  // default: recorte con ellipsis
  const max = 70;
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export function DynamicMetrics({ formKey, onChange }: Props) {
  const config: ProjectFormConfig | null = useMemo(
    () => getProjectFormConfig(formKey),
    [formKey]
  );

  const [borealRows, setBorealRows] = useState<BorealRowState[]>([
    { code: "", cantidad: "" },
  ]);

  const [torresRows, setTorresRows] = useState<TorresRowState[]>([
    { categoria: "", itemId: "", cantidad: "" },
  ]);

  const [saqqaraRows, setSaqqaraRows] = useState<SaqqaraRowState[]>([
    { itemId: "", cantidad: "" },
  ]);

  if (!formKey || !config) {
    return (
      <p className="text-sm text-slate-500">
        Selecciona un proyecto para capturar las métricas del día.
      </p>
    );
  }

  /* ------------ BOREAL ------------ */

  if (isBorealFormConfig(config)) {
    const borealConfig: BorealFormConfig = config;
    const codeOptions = borealConfig.rows;

    function updateParent(rows: BorealRowState[]) {
      const metrics: MetricsRow[] = rows
        .filter((r) => r.code && r.cantidad)
        .map((r) => {
          const def = codeOptions.find((c) => c.code === r.code);
          return {
            codigo: r.code,
            medida: def?.medida ?? "",
            cantidad: Number(r.cantidad),
          };
        });

      onChange(metrics);
    }

    function handleChangeRow(
      index: number,
      field: keyof BorealRowState,
      value: string
    ) {
      const next = [...borealRows];
      next[index] = { ...next[index], [field]: value };
      setBorealRows(next);
      updateParent(next);
    }

    function handleAddRow() {
      const next = [...borealRows, { code: "", cantidad: "" }];
      setBorealRows(next);
      updateParent(next);
    }

    function handleRemoveRow(index: number) {
      const next = borealRows.filter((_, i) => i !== index);
      const finalRows = next.length > 0 ? next : [{ code: "", cantidad: "" }];
      setBorealRows(finalRows);
      updateParent(finalRows);
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Métricas – Proyecto Boreal
          </h3>
          <p className="text-xs text-slate-500">
            Agrega una fila por cada código instalado.
          </p>
        </div>

        <div className="space-y-2">
          {borealRows.map((row, index) => {
            const selected = codeOptions.find((c) => c.code === row.code);
            return (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto] gap-2 items-start bg-slate-50 rounded-xl px-3 py-3"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Código
                  </label>
                  <select
                    className={clsx(
                      "w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    )}
                    value={row.code}
                    onChange={(e) =>
                      handleChangeRow(index, "code", e.target.value)
                    }
                  >
                    <option value="">Selecciona un código…</option>
                    {codeOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Medida vano
                  </label>
                  <Input
                    readOnly
                    value={selected?.medida ?? ""}
                    placeholder="Selecciona un código"
                    className="bg-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Cantidad colocada
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={row.cantidad}
                    onChange={(e) =>
                      handleChangeRow(index, "cantidad", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>

                <div className="flex gap-2 pt-6 justify-end">
                  {borealRows.length > 1 && (
                    <Button
                      type="button"
                      className="h-8 w-8 rounded-lg bg-red-700/10 border border-red-200 text-red-700 text-lg font-bold flex items-center justify-center hover:bg-red-200"
                      onClick={() => handleRemoveRow(index)}
                    >
                      −
                    </Button>
                  )}
                  {index === borealRows.length - 1 && (
                    <Button
                      type="button"
                      className="h-8 w-8 rounded-lg bg-green-600 text-white text-lg font-bold flex items-center justify-center hover:bg-green-700"
                      onClick={handleAddRow}
                    >
                      +
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ------------ TORRES 1000 ------------ */

  if (isTorresFormConfig(config)) {
    const torresConfig: TorresFormConfig = config;
    const categoryKeys = Object.keys(torresConfig.categories);

    function getItemsForCategory(categoria: string): TorresItemDefinition[] {
      if (!categoria) return [];
      const key = categoria as keyof typeof torresConfig.categories;
      return torresConfig.categories[key] ?? [];
    }

    function updateParent(rows: TorresRowState[]) {
      const metrics: MetricsRow[] = rows
        .filter((r) => r.categoria && r.itemId && r.cantidad)
        .map((r) => {
          const items = getItemsForCategory(r.categoria);
          const item = items.find(
            (i: TorresItemDefinition) => i.id === r.itemId
          );
          return {
            categoria: r.categoria,
            itemId: r.itemId,
            itemLabel: item?.label ?? "",
            cantidad: Number(r.cantidad),
          };
        });

      onChange(metrics);
    }

    function handleChangeRow(
      index: number,
      field: keyof TorresRowState,
      value: string
    ) {
      const next = [...torresRows];
      next[index] = { ...next[index], [field]: value };

      if (field === "categoria") {
        next[index].itemId = "";
      }

      setTorresRows(next);
      updateParent(next);
    }

    function handleAddRow() {
      const next = [...torresRows, { categoria: "", itemId: "", cantidad: "" }];
      setTorresRows(next);
      updateParent(next);
    }

    function handleRemoveRow(index: number) {
      const next = torresRows.filter((_, i) => i !== index);
      const finalRows =
        next.length > 0 ? next : [{ categoria: "", itemId: "", cantidad: "" }];
      setTorresRows(finalRows);
      updateParent(finalRows);
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Métricas – Proyecto Torres 1000
          </h3>
          <p className="text-xs text-slate-500">
            Elige categoría, concepto y captura la cantidad instalada.
          </p>
        </div>

        <div className="space-y-2">
          {torresRows.map((row, index) => {
            const itemsForCategory = getItemsForCategory(row.categoria);

            return (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_auto] gap-2 items-start bg-slate-50 rounded-xl px-3 py-3"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Categoría
                  </label>
                  <select
                    className={clsx(
                      "w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    )}
                    value={row.categoria}
                    onChange={(e) =>
                      handleChangeRow(index, "categoria", e.target.value)
                    }
                  >
                    <option value="">Selecciona categoría…</option>
                    {categoryKeys.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Concepto
                  </label>
                  <select
                    className={clsx(
                      "w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    )}
                    value={row.itemId}
                    onChange={(e) =>
                      handleChangeRow(index, "itemId", e.target.value)
                    }
                    disabled={!row.categoria}
                  >
                    <option value="">
                      {row.categoria
                        ? "Selecciona un concepto…"
                        : "Primero elige una categoría"}
                    </option>
                    {itemsForCategory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600">
                    Cantidad instalada
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={row.cantidad}
                    onChange={(e) =>
                      handleChangeRow(index, "cantidad", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>

                <div className="flex gap-2 pt-6 justify-end">
                  {torresRows.length > 1 && (
                    <Button
                      type="button"
                      className="h-8 w-8 rounded-lg bg-red-700/10 border border-red-200 text-red-700 text-lg font-bold flex items-center justify-center hover:bg-red-200"
                      onClick={() => handleRemoveRow(index)}
                    >
                      −
                    </Button>
                  )}
                  {index === torresRows.length - 1 && (
                    <Button
                      type="button"
                      className="h-8 w-8 rounded-lg bg-green-600 text-white text-lg font-bold flex items-center justify-center hover:bg-green-700"
                      onClick={handleAddRow}
                    >
                      +
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ------------ SAQQARA ------------ */

  if (isSaqqaraFormConfig(config)) {
    const saqqaraConfig: SaqqaraFormConfig = config;

    function updateParent(rows: SaqqaraRowState[]) {
      const metrics: MetricsRow[] = rows
        .filter((r) => r.itemId && r.cantidad)
        .map((r) => {
          const item = saqqaraConfig.items.find((i) => i.id === r.itemId);
          return {
            itemId: r.itemId,
            itemLabel: item?.label ?? "",
            cantidad: Number(r.cantidad),
          };
        });

      onChange(metrics);
    }

    function handleChangeRow(
      index: number,
      field: keyof SaqqaraRowState,
      value: string
    ) {
      const next = [...saqqaraRows];
      next[index] = { ...next[index], [field]: value };
      setSaqqaraRows(next);
      updateParent(next);
    }

    function handleAddRow() {
      const next = [...saqqaraRows, { itemId: "", cantidad: "" }];
      setSaqqaraRows(next);
      updateParent(next);
    }

    function handleRemoveRow(index: number) {
      const next = saqqaraRows.filter((_, i) => i !== index);
      const finalRows = next.length > 0 ? next : [{ itemId: "", cantidad: "" }];
      setSaqqaraRows(finalRows);
      updateParent(finalRows);
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Métricas – Proyecto Saqqara
          </h3>
          <p className="text-xs text-slate-500">
            Elige el concepto y captura la cantidad.
          </p>
        </div>

        <div className="space-y-2">
          {saqqaraRows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-2 items-start bg-slate-50 rounded-xl px-3 py-3"
            >
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">
                  Concepto
                </label>
                <select
                  className={clsx(
                    "w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  )}
                  value={row.itemId}
                  onChange={(e) =>
                    handleChangeRow(index, "itemId", e.target.value)
                  }
                >
                  <option value="">Selecciona un concepto…</option>
                  {saqqaraConfig.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {shortSaqqaraLabel(item.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">
                  Cantidad
                </label>
                <Input
                  type="number"
                  min={0}
                  value={row.cantidad}
                  onChange={(e) =>
                    handleChangeRow(index, "cantidad", e.target.value)
                  }
                  placeholder="0"
                />
              </div>

              <div className="flex gap-2 pt-6 justify-end">
                {saqqaraRows.length > 1 && (
                  <Button
                    type="button"
                    className="h-8 w-8 rounded-lg bg-red-700/10 border border-red-200 text-red-700 text-lg font-bold flex items-center justify-center hover:bg-red-200"
                    onClick={() => handleRemoveRow(index)}
                  >
                    −
                  </Button>
                )}
                {index === saqqaraRows.length - 1 && (
                  <Button
                    type="button"
                    className="h-8 w-8 rounded-lg bg-green-600 text-white text-lg font-bold flex items-center justify-center hover:bg-green-700"
                    onClick={handleAddRow}
                  >
                    +
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <p className="text-sm text-slate-500">
      Este proyecto tiene un tipo de formulario aún no implementado.
    </p>
  );
}
