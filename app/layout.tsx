import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Bitácoras de supervisión",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-100 text-slate-900">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
