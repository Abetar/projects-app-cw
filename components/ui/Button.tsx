"use client";

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center",
        "rounded-lg px-4 py-2 text-sm font-medium",
        "bg-blue-600 text-white shadow-sm",
        "hover:bg-blue-700",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
