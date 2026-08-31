'use client';

import { useEffect } from 'react';

/**
 * Abre el diálogo de impresión al terminar de pintar.
 *
 * Se usa la impresión del navegador y no una biblioteca de PDF por dos
 * razones: el texto queda seleccionable y buscable en vez de convertido en
 * imagen, y no se agrega una dependencia de medio megabyte para generar un
 * documento de una página.
 */
export function PrintTrigger() {
  useEffect(() => {
    // Un fotograma de margen para que las fuentes ya estén aplicadas: sin
    // esto el diálogo puede capturar la página con la tipografía de reserva.
    const id = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(id);
  }, []);

  return null;
}
