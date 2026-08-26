# CLAUDE.md — Proyecto Plataforma Patrimonial Luifer

Este archivo da contexto persistente a Claude Code sobre el proyecto.
**Léelo antes de proponer nombres, copy, UI o lógica de producto.**

---

## 1. Resumen del proyecto

Plataforma web de **planificación patrimonial inmobiliaria** para **Luis Fernando García Lucena ("Luifer")**, educador en inversión inmobiliaria, marca **"Pensionate con Bienes Raíces"**.

El producto está inspirado **funcionalmente** en el ecosistema InvestorTools de Juan Londoño (`investortools.juanlondonoinversionista.com`), pero con identidad, tono y enfoque propios — dirigidos a un avatar distinto (ver sección 2).

**Referencia de benchmark (solo estructura funcional, NO tono ni identidad):**

- InvestorTools = 4 módulos conectados bajo un dashboard único, membresía todo-incluido.
- Concepto ancla propio de Londoño: **"Número de Seguridad Económica"** — ⛔ **NO USAR**, es de la competencia directa.

📄 **Teardown completo en [`docs/benchmark-investortools.md`](docs/benchmark-investortools.md)** — stack, mapa del API, criterios de su Check List y las grietas que podemos aprovechar.

**Lo esencial:** su dashboard **no calcula nada**, es un hub que enlaza productos en dominios separados (la calculadora del Número vive fuera, la comunidad fuera, el bot en WhatsApp). Solo el Check List es nativo. Su onboarding obliga al cliente a enlazar cuentas entre tres productos — estados reales suyos: *"Celular listo, falta Investor Plan"*.

👉 **Nuestra ventaja es la integración:** el Índice y Mi Ruta Patrimonial nativos, en la misma app, sin enlaces de cuentas. Eso es justo lo que su copy promete y su producto no cumple.

---

## 2. Avatar del cliente ideal (resumen ejecutivo)

Hombre **35–55 años**, profesional / empresario / independiente, ingresos estables, ya tiene propiedades y ahorros. **No busca crecer agresivamente** — busca **certeza** de que lo que ya construyó está bien estructurado y protegido.

### Dolores clave

1. Duda si su patrimonio está bien estructurado o simplemente disperso.
2. Miedo profundo a equivocarse y perder lo construido.
3. Saturación por opiniones contradictorias de inversión.
4. Temor a llegar a la vejez sin estabilidad.
5. Vergüenza silenciosa por no tener estrategia patrimonial pese a tener capacidad económica.

### Deseos

- Portafolio claro, ordenado, sólido y protegido.
- Decisiones con criterio profesional, no por impulso.
- Tranquilidad, no emoción, en sus inversiones.
- Dejar de "suponer" y operar con metodología.

### Psicografía

Rechaza especulación, riesgo innecesario y discursos sofisticados. Valora **seguridad por encima de adrenalina**. Confía en **hechos, no en teoría**.

> ### 🥇 REGLA DE ORO
> Todo el copy, UI y lógica de producto debe transmitir **orden, protección y claridad**.
> **NUNCA** urgencia, crecimiento agresivo, oportunidad limitada o adrenalina de inversión.

---

## 3. Identidad narrativa de Luifer

**Tono:** directo, sencillo, orientado a la acción. Sin tecnicismos innecesarios. Habla desde la **experiencia real** (incluyendo sus propios errores), no desde la teoría.

### Frases ancla

_(usar como referencia de voz, no citar literalmente en cada pantalla)_

- "Hace lo complejo sencillo"
- "La claridad lo cambia todo"
- "No inviertas en lo que no entiendes"
- "Las inversiones deben darte tranquilidad, no adrenalina"
- "Lo básico es lo que funciona"

### Historia de origen (activo narrativo)

Luifer empezó en un negocio de ensaladas de frutas que **quebró por falta de planeación financiera**. Vivió épocas difíciles (cocinar, repartir, lavar carros) antes de encontrar en bienes raíces un camino sólido.

Esto le da **autoridad humilde** — puede usarse en onboarding, landing o mensajes del "Consultor Luifer".

---

## 4. Mensajes a EVITAR (prohibido en copy)

- ⛔ Promesas de dinero rápido.
- ⛔ Terminología compleja sin necesidad.
- ⛔ Estímulos de urgencia / escasez ("cupos limitados", "bonos por actuar hoy", countdowns).
- ⛔ Narrativas especulativas o de alto riesgo.
- ⛔ Lenguaje de "multiplicar" o "escalar" patrimonio agresivamente.

---

## 5. Identidad visual — Paleta "Luisfer García"

**Concepto:** inversión inmobiliaria · autoridad · lujo sobrio · alto contraste

| Color | Hex | Uso |
| --- | --- | --- |
| Negro Obsidiana | `#0C0812` | Fondo principal (60%) |
| Violeta Nocturno | `#1A1125` | Profundidad, cards, contenedores, branding |
| Dorado Inversión | `#D7A72E` | Títulos, CTAs, llamados a la acción (15%) |
| Oro Luminoso | `#F2C85B` | Destellos y énfasis — con moderación, solo para el resultado clave (ej. el Índice) |
| Blanco Marfil | `#F4F1EB` | Texto y copy largo (20%) — **NUNCA blanco puro** |
| Gris Grafito | `#747078` | Información secundaria, metadata, fechas |
| Azul Tecnológico | `#0A6680` | Acento opcional — ideal para el módulo de asesor/mentor (5%) |

**Proporción recomendada:** 60% fondos oscuros · 20% blanco/marfil · 15% dorado · 5% acento azul o gris.

**Regla de aplicación:** el dorado se reserva para **momentos de valor real** (CTAs, resultado del diagnóstico). No decorar todo con dorado o pierde su función de énfasis.

---

## 6. Naming del producto — YA DEFINIDO

### Concepto ancla

_(equivalente al "Número de Seguridad Económica" de Londoño)_

# 🛡️ Índice de Blindaje Patrimonial

Comunica **protección activa**, no crecimiento — coherente con el dolor #2 del avatar (miedo a perder lo construido). Usar como **gancho principal** del funnel / landing.

### Módulos (naming cerrado, base inicial)

| Función | Nombre del módulo |
| --- | --- |
| Plan patrimonial año a año | **Mi Ruta Patrimonial** |
| Mentor/asesor vía WhatsApp | **Consultor Luifer** (evitar la palabra "IA" visible en el naming de cara al usuario) |
| Evaluador de proyectos inmobiliarios | **Filtro de Seguridad** |

### Copy de referencia para hero/landing

> "Descubre tu **Índice de Blindaje Patrimonial** y accede a **Mi Ruta Patrimonial**, **Consultor Luifer** y el **Filtro de Seguridad** — todo en un solo lugar, sin ruido ni promesas vacías."

**Nota:** este naming es la **base inicial**. Módulos y funciones adicionales se irán agregando y documentando en este archivo a medida que se definan con el cliente.

---

## 7. Stack técnico (confirmado)

| Capa | Tecnología |
| --- | --- |
| Frontend | **Next.js 16 (App Router)** + React 19 + **TypeScript** + **Tailwind CSS v4** |
| Backend | **NestJS 11** + TypeScript |
| Base de datos | **MongoDB** vía Mongoose |
| Auth | **JWT propio** — access 15 min + refresh 7 días con rotación |
| Hosting/deploy | **Vercel** (frontend) |

### Decisiones de arquitectura tomadas

- **Access + refresh token, no un JWT único.** El access dura 15 min y el refresh 7 días. En cada refresh se rotan ambos y se guarda el hash del refresh vigente; si llega un refresh ya rotado se asume robo y se cierra la sesión completa.
- **Refresh tokens se hashean con SHA-256, no con bcrypt.** bcrypt trunca a 72 bytes y dos JWT del mismo usuario comparten ese prefijo — un token viejo seguiría validando. El token ya es de alta entropía.
- **Contraseñas con bcrypt (cost 12).** El login compara siempre contra un hash aunque el correo no exista, para que no se pueda enumerar usuarios midiendo el tiempo de respuesta.
- **`JwtAuthGuard` global.** Todas las rutas exigen token salvo las marcadas con `@Public()`.
- **Endurecimiento por defecto:** `helmet`, CORS restringido a `FRONTEND_URL`, `ValidationPipe` global con `whitelist`, y rate limit de 5 intentos/min en las rutas con credenciales.
- **Tailwind v4 con `@theme`.** La paleta vive como tokens en `globals.css`, no hay archivo `tailwind.config`.

### Base de datos — decisión tomada

La plataforma y el funnel de captación (`real-estate-funnels`) **comparten el clúster de Atlas pero NO la base de datos**:

| Proyecto | Bases |
| --- | --- |
| Funnel de captación | `dev` · `prod` |
| Plataforma patrimonial | `platform_dev` · `platform_prod` |

**Por qué separadas:** el backend del funnel es público, acepta POSTs anónimos y se autentica con un `ADMIN_PASSWORD` compartido. Si compartiera base con la plataforma, una filtración del funnel dejaría al alcance los `passwordHash` y `refreshTokenHash` de los clientes. Además los ciclos de vida no se parecen — los leads se purgan por cohorte semanal, las cuentas se conservan por años — y un restore del funnel no debe poder tocar cuentas.

**Cómo se conectan los datos:** la colección `leads` del funnel ya tiene `phoneE164` y `email` como llaves naturales. Cuando alguien se registra en la plataforma se copia un **snapshot de la atribución** (tracking, cohorte) al documento del usuario. Nunca se consulta la base del funnel en tiempo de request — y de todas formas MongoDB no permite `$lookup` entre bases.

⚠️ **Pendiente en Atlas:** hoy se usa un usuario con rol `atlasAdmin` para todo. Crear un usuario dedicado con `readWrite` limitado a `platform_dev` y `platform_prod`.

### Sistema de componentes — shadcn/ui + 21st.dev

El frontend usa **shadcn/ui sobre Radix** (`components.json`, estilo `radix-nova`, iconos Lucide) para poder pegar componentes del ecosistema — incluido el catálogo de [21st.dev](https://21st.dev), que sigue las mismas convenciones.

**El puente de tokens es la pieza clave.** En `globals.css` los tokens semánticos de shadcn (`--primary`, `--background`, `--card`, `--accent`…) están mapeados a la paleta de marca:

| Token shadcn | Color de marca |
| --- | --- |
| `background` | Negro Obsidiana |
| `foreground` | Blanco Marfil |
| `card` · `popover` · `secondary` · `muted` | Violeta Nocturno |
| `primary` | **Dorado Inversión** (el CTA) |
| `accent` | Azul Tecnológico (Consultor Luifer) |
| `muted-foreground` | `grafito-texto` (4.9:1) |
| `ring` | Dorado Inversión |
| `destructive` | `alerta` `#E5705F` — 6.4:1, error sin alarmismo |

Gracias a eso, **cualquier componente de shadcn o 21st.dev entra ya pintado con la identidad de Luifer sin tocarle una línea**. La app es oscura siempre: `:root` y `.dark` tienen los mismos valores, no hay modo claro.

⚠️ **Regla:** nunca poner un hex dentro de un componente ni dentro del bloque del puente — siempre referenciar la paleta. Si un componente necesita un color que no existe, se agrega primero a la paleta con su contraste verificado.

⚠️ **21st.dev NO es una librería instalable.** Es un registro de código que se copia al repo. El plan gratis da 2 componentes al día; buscar es gratis. Su catálogo está lleno de heroes animados y estética de urgencia — usarlo para lo **estructural** (formularios, tablas, diálogos, sidebars, dashboards), nunca para pirotecnia que choque con la regla de oro.

---

## 8. Cliente y contacto

- **Cliente:** Luis Fernando García Lucena ("Luifer")
- **Marca:** Pensionate con Bienes Raíces
- **Contrato:** fee mensual fijo + comisión variable sobre ingresos netos de Hotmart, garantía comercial de 10 estudiantes/mes, duración 4 meses desde agosto 2026

---

## 9. Convenciones de código

- **Identificadores en inglés, texto de cara al usuario en español.** Evita el Spanglish en el código sin traducir la experiencia del cliente.
- **Los nombres de producto NUNCA se traducen ni se abrevian:** Índice de Blindaje Patrimonial, Mi Ruta Patrimonial, Consultor Luifer, Filtro de Seguridad.
- **Mensajes de error del API en español**, en tono calmado y sin alarmismo — coherentes con la regla de oro (sección 2).
- **Colores siempre por token de marca** (`bg-obsidiana`, `text-dorado`), nunca hex sueltos ni la paleta por defecto de Tailwind.
- ⚠️ **`text-grafito` y `text-azul` no se usan para texto** — 4.1:1 y 3.1:1 sobre el fondo, no pasan WCAG AA. Para metadata usa `text-grafito-texto` (4.9:1); `azul` solo como fondo o borde.
- **El dorado se reserva para valor real** (CTAs y resultados). `oro` (#F2C85B) es exclusivo del resultado del Índice.

---

## 10. Estructura del repositorio

```
investor-tools/
├── CLAUDE.md
├── frontend/                    # Next.js 16 · App Router · Vercel
│   └── src/app/
│       ├── globals.css          # Tokens @theme de la paleta + contrastes verificados
│       ├── layout.tsx           # Fuentes (Inter + Fraunces) y metadata
│       ├── page.tsx             # Landing con el Índice como gancho
│       └── globals.css          # + puente de tokens shadcn → marca
│   ├── components/ui/           # Componentes shadcn (no editar colores acá)
│   └── lib/utils.ts             # cn() — clsx + tailwind-merge
└── backend/                     # NestJS 11 · API bajo el prefijo /api
    └── src/
        ├── config/              # Carga y validación de variables de entorno
        ├── common/              # @Public, @CurrentUser, JwtAuthGuard, tipos
        └── modules/
            ├── users/           # Esquema User + servicio de acceso a datos
            └── auth/            # register · login · refresh · logout · me
```

**Tipografía:** *Inter* para UI y copy largo, *Fraunces* (serif) para titulares y el Índice — autoridad sin ostentación.

---

## 11. Cómo levantar el proyecto

```bash
# La base de desarrollo es platform_dev en Atlas Cluster0 (no requiere Mongo local)

# Backend → http://localhost:4000/api
cd backend && cp .env.example .env   # genera los secretos: openssl rand -base64 48
npm run start:dev

# Frontend → http://localhost:3000
cd frontend && npm run dev
```

### Endpoints disponibles

| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | `/api/auth/register` | público |
| POST | `/api/auth/login` | público |
| POST | `/api/auth/refresh` | público |
| POST | `/api/auth/logout` | requiere token |
| GET | `/api/auth/me` | requiere token |

---

## 12. Estado actual y pendientes

**Listo:** scaffold de frontend y backend, tokens de la paleta, landing inicial, y autenticación completa (registro, login, refresh con rotación, logout) verificada de punta a punta contra `platform_dev` en Atlas.

**Pendiente — a definir con el cliente:**

1. **Fórmula del Índice de Blindaje Patrimonial** — qué variables entran, cómo se ponderan y cómo se presenta el resultado. Es el gancho del funnel, es lo siguiente.
2. Modelo de datos del patrimonio (propiedades, deudas, ingresos).
3. Funciones concretas de cada módulo y sus wireframes.
4. Integración de WhatsApp para Consultor Luifer.
5. Integración con Hotmart para el control de membresías.

---

_Última actualización: stack confirmado e implementado (Next.js 16 + NestJS 11 + MongoDB + JWT). Identidad, avatar, paleta y naming definidos._
