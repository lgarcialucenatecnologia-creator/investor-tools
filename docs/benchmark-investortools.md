# Benchmark: InvestorTools (Juan Londoño)

Análisis técnico y funcional de `investortools.juanlondonoinversionista.com`, realizado el 25 de agosto de 2026.

⚠️ **Solo referencia funcional.** Tono, identidad y naming son de la competencia directa. El concepto "Número de Seguridad Económica" **NO se usa** — el nuestro es el Índice de Blindaje Patrimonial.

---

## 1. Hallazgo central: es un hub, no una plataforma

**El dashboard no calcula nada.** Es una capa de orquestación que enlaza productos que viven en dominios separados:

| Pieza | Dónde vive de verdad |
| --- | --- |
| Investor Plan (el Número + plan) | `calculadora.juanlondonoinversionista.com` — app aparte |
| Asistente Expoinvestor | `tutoria.juanlondonoinversionista.com` |
| Juan Londoño IA | WhatsApp (`wa.me`) |
| Comunidad Club Platinum | plataforma de cursos externa, vía SSO |
| **Check List** | **lo único construido nativo en el dashboard** |

Cadenas encontradas en sus bundles que lo confirman: *"Ingresa a Investor Plan para cargar tus datos patrimoniales"*, *"Editable en Investor Plan"*, *"Entra al producto, crea tu cuenta con el correo de bienvenida y luego confirma este paso"*.

## 2. Stack

- Next.js con App Router · hosting en Google (`server: Google Frontend`)
- **Firebase Auth** — sin contraseña: enlace mágico por correo + OTP por SMS
- Firestore · reCAPTCHA · fuente Inter
- Landing prerenderizada con ISR agresivo (`s-maxage=31536000`)

## 3. Mapa del API

```
Auth      /api/auth/email-link/{request,approve,status}
          /api/auth/sms-otp/{request,verify}
Acceso    /api/access/validate        ← gate de membresía
          /api/me
Producto  /api/dashboard/numero       ← solo LEE el Número
          /api/investor-plan/provision
          /api/checklist  ·  /api/checklist?projectId=
          /api/community/confirmation
          /api/tutor-sso
Admin     /api/admin/clients  ·  /clients/bulk
          /api/control-remoto/jlia-{megagraph,questions?phone=,report}
```

**`control-remoto/jlia-questions?phone=`** — panel para leer qué le pregunta cada cliente al bot de WhatsApp, buscando por celular. Saben exactamente dónde se atasca la gente. Concepto que vale replicar para Consultor Luifer.

## 4. Criterios del Check List (literales de su código)

Es un formulario con puntajes. El valor está en los criterios, no en el código.

- **Ubicación** — del sector · del apto en el proyecto · análisis del entorno · cercanía a zonas comunes y vías principales · dinámica constructiva del barrio · aptos por piso
- **Constructora** — equipo promotor · *"Consultar # obras desarrolladas por el constructor y la gerencia"* · *"Preguntar si socios o empleados de la constructora han comprado"*
- **Fiduciaria** — *"Debe tener fiduciaria"* (eliminatorio)
- **Mercado** — estudio de mercado · precio por m² en la zona · *"Considerar qué otros proyectos se desarrollan en la zona"*
- **Costos** — escrituración · estructura del plan de pagos · reconocimiento de interés por pago adelantado · gastos mensuales entregado · etapas de entrega de zonas comunes

Criterio suyo que quedó en el bundle: *"Prefiero invertir en 3 aptos de 300 mill que en uno de 900 mill."*

## 5. Landing

Una sola página con anclas (`#camino #ecosistema #planes #faq`…).

Hero: *"Construye el patrimonio que te permitirá vivir con tranquilidad."*
Cuatro promesas: Tranquilidad · Estabilidad · Tiempo · Libertad.

**El Camino (6 pasos):** Descubre tu Número → Diseña tu plan patrimonial → Aprende a invertir con confianza → Encuentra oportunidades → Construye ingresos pasivos → Alcanza tranquilidad financiera.

**Planes:** membresía única "todo incluido", **sin precio visible**. CTA: "Unirme al Club Platinum" / "Hablar con un asesor" → venta por llamada, ticket alto.

## 6. Grietas — nuestras oportunidades

1. **El FAQ dice "las tres herramientas" pero listan cinco.** El copy se quedó atrás del producto.
2. **El onboarding es un rompecabezas.** Sus propios estados: *"Celular listo, falta Investor Plan"*, *"Investor Plan listo, falta celular"*. El cliente paga y tiene que enlazar cuentas en tres productos. Para un avatar que compra orden y claridad, eso es exactamente el dolor que dice resolver.
3. **El dashboard no calcula, solo refleja.** Salir a una calculadora externa rompe la promesa de "todo en un solo lugar".
4. **El Asistente Expoinvestor caduca** — está atado al evento 2026, infla el pitch pero no es permanente.

## 7. Qué significa para nosotros

**Nuestra ventaja natural es la integración.** Ellos pegaron productos durante años; nosotros arrancamos limpio: el Índice y Mi Ruta Patrimonial calculados y guardados en la misma app. Cero enlaces de cuentas.

**Vale replicar:**
- Check List como formulario puntuado con criterios eliminatorios → **Filtro de Seguridad**
- Lectura de conversaciones del bot por teléfono → **Consultor Luifer**
- Carga masiva de clientes desde Excel (*"Pega desde Excel columnas de nombre completo, celular y correo"*) → necesario para dar de alta a los estudiantes de Hotmart
- Membresía única todo-incluido sin precio en la página

**A revisar más adelante:** ellos van sin contraseña (enlace mágico + OTP). Nosotros usamos JWT con contraseña, que funciona bien. Para un avatar de 35–55 la contraseña es fricción y soporte reales — se puede sumar enlace mágico como segunda vía sin rehacer nada.
