/**
 * La línea de los ocho pasos del método. Tres se encienden.
 *
 * Los cinco restantes son nodos apagados a propósito — no me corresponde
 * inventarle los pasos a Luifer. Cuando los defina, se escriben en
 * METHOD_STEPS y aparecen acá sin tocar este archivo.
 */

import { METHOD_STEPS } from "./script";

export function MethodLine({ on }: { on: boolean }) {
  return (
    <div className="method" data-on={on ? "true" : "false"} aria-hidden="true">
      <span className="method-rail" />
      {METHOD_STEPS.map((step, i) => (
        <span
          key={i}
          className="method-node"
          data-lit={step.lit ? "true" : "false"}
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <span className="method-dot" />
          {step.name && <span className="method-name">{step.name}</span>}
        </span>
      ))}
    </div>
  );
}
