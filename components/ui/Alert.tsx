"use client";

import clsx from "clsx";

export function Alert({
  type = "info",
  children,
}: {
  type?: "info" | "success" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-sky-50 text-sky-800 border-sky-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    error: "bg-rose-50 text-rose-800 border-rose-200",
  }[type];

  return (
    <div
      className={clsx(
        "w-full rounded-lg border px-3 py-2 text-sm mb-3",
        styles
      )}
    >
      {children}
    </div>
  );
}
