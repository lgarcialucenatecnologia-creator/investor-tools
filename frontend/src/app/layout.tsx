import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

import { SEEN_KEY } from "@/components/intro/script";

// Inter: UI y copy largo — neutra, legible, sin ruido.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Fraunces: titulares y el Índice — serif con autoridad, sin ser ostentosa.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Índice de Blindaje Patrimonial | Pensionate con Bienes Raíces",
    template: "%s | Pensionate con Bienes Raíces",
  },
  description:
    "Descubre tu Índice de Blindaje Patrimonial y accede a Mi Ruta Patrimonial, Consultor Luifer y el Filtro de Seguridad — todo en un solo lugar, sin ruido ni promesas vacías.",
};

// Corre en el primer frame, antes de que React monte la Secuencia de Apertura:
// marca el documento como pendiente para que el CSS pinte un escudo obsidiana
// y el visitante no alcance a ver la landing por debajo. Quien ya la vio, o
// pidió menos movimiento, entra directo al sitio.
const introGuard = `try{
  if(!localStorage.getItem(${JSON.stringify(SEEN_KEY)})
     && !matchMedia("(prefers-reduced-motion: reduce)").matches){
    document.documentElement.dataset.intro="pending";
  }
}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `suppressHydrationWarning` va acá porque el script de abajo escribe
    // `data-intro` en <html> antes de hidratar, y el servidor no puede saber si
    // este visitante ya vio la secuencia. Solo silencia los atributos de este
    // elemento — no afecta al resto del árbol.
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable} font-sans`}>
        <script dangerouslySetInnerHTML={{ __html: introGuard }} />
        {children}
      </body>
    </html>
  );
}
