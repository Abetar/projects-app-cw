"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function InputBase({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm",
          "bg-white text-slate-900",
          "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500",
          className
        )}
        {...props}
      />
    );
  }
);
