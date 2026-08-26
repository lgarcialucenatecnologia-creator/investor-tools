import Link from "next/link";

import { OpeningSequence } from "@/components/intro/opening-sequence";

const modules = [
  {
    name: "Mi Ruta Patrimonial",
    description:
      "Tu plan patrimonial año a año. Sabes qué sigue, cuándo y por qué — sin improvisar.",
  },
  {
    name: "Consultor Luifer",
    description:
      "Resuelve tus dudas por WhatsApp, con el mismo criterio con el que Luifer estructura su propio patrimonio.",
    accent: true,
  },
  {
    name: "Filtro de Seguridad",
    description:
      "Antes de comprar, pasa el proyecto por el filtro. Si no cumple, no entra. Así de simple.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <OpeningSequence />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <span className="font-display text-lg tracking-tight text-marfil">
          Pensionate con Bienes Raíces
        </span>
        <span className="text-sm text-grafito-texto">
          Luis Fernando García Lucena
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* ---------- Hero ---------- */}
        <section className="border-b border-grafito/20 py-20 md:py-28">
          <p className="text-sm uppercase tracking-[0.2em] text-grafito-texto">
            Planificación patrimonial inmobiliaria
          </p>

          <h1 className="mt-6 max-w-3xl font-display text-4xl leading-tight text-marfil md:text-6xl">
            Descubre tu{" "}
            <span className="text-dorado">Índice de Blindaje Patrimonial</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-marfil/80">
            Y accede a Mi Ruta Patrimonial, Consultor Luifer y el Filtro de
            Seguridad — todo en un solo lugar, sin ruido ni promesas vacías.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/indice"
              className="rounded-md bg-dorado px-7 py-3.5 font-medium text-obsidiana transition-colors hover:bg-oro"
            >
              Calcular mi Índice
            </Link>
            <span className="text-sm text-grafito-texto">
              Toma 5 minutos. No necesitas preparar nada.
            </span>
          </div>
        </section>

        {/* ---------- Módulos ---------- */}
        <section className="py-20">
          <h2 className="font-display text-2xl text-marfil md:text-3xl">
            Tres herramientas, un solo criterio
          </h2>
          <p className="mt-3 max-w-2xl text-marfil/70">
            Lo básico es lo que funciona. Cada módulo existe para que dejes de
            suponer y empieces a decidir con metodología.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {modules.map((module) => (
              <article
                key={module.name}
                className="rounded-lg border border-grafito/20 bg-nocturno p-7"
              >
                <h3 className="font-display text-xl text-marfil">
                  {module.name}
                </h3>
                {module.accent && (
                  <span className="mt-3 inline-block rounded bg-azul px-2.5 py-1 text-xs text-marfil">
                    Acompañamiento directo
                  </span>
                )}
                <p className="mt-4 leading-relaxed text-marfil/70">
                  {module.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Cierre ---------- */}
        <section className="border-t border-grafito/20 py-20">
          <p className="max-w-2xl font-display text-2xl leading-snug text-marfil md:text-3xl">
            Las inversiones deben darte tranquilidad, no adrenalina.
          </p>
          <p className="mt-5 max-w-2xl leading-relaxed text-marfil/70">
            Luifer empezó con un negocio que quebró por falta de planeación.
            Encontró en los bienes raíces un camino sólido — y esta plataforma es
            el método que usa, ordenado para que tú también lo apliques.
          </p>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-grafito-texto">
        © {new Date().getFullYear()} Pensionate con Bienes Raíces
      </footer>
    </div>
  );
}
