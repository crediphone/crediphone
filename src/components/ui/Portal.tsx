"use client";

/**
 * Portal — monta sus hijos directamente en document.body.
 *
 * Úsalo para envolver cualquier `position: fixed` que esté dentro del
 * dashboard. El layout del dashboard tiene `overflow-auto` en el <main>,
 * lo que crea un nuevo contexto de apilado y rompe position:fixed.
 * Renderizar con Portal evita ese problema.
 */
import { useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(<>{children}</>, document.body);
}
