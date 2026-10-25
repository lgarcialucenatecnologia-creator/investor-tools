/**
 * Los criterios del Check List.
 *
 * Este archivo ES la herramienta: la
 * pantalla, el cálculo y lo guardado se dibujan a partir de lo que aquí se
 * declara. Ajustar el método es editar esta lista, no tocar código.
 *
 * Cada ítem se califica de 1 a 5 (1 = juega en contra de la inversión,
 * 5 = juega a favor). La guía dice qué mirar y qué significa cada extremo.
 *
 * ⚠️ LOS PESOS SON PROVISIONALES. Parten de la estructura del Check List que
 * el mercado ya conoce (12 criterios, 41 ítems), pero cuánto pesa cada cosa
 * es justamente el criterio de Luifer y tiene que fijarlo él. Dos reglas:
 *   - los pesos de las secciones suman 100;
 *   - los pesos de los ítems dentro de cada sección suman 100.
 * `checklist.scoring.spec.ts` falla si alguna de las dos deja de cumplirse.
 */

export type ProjectType = 'vis' | 'no_vis';

export interface ChecklistItem {
  id: string;
  title: string;
  /** Peso dentro de su sección. */
  weight: number;
  /** Qué revisar y cómo averiguarlo, en la voz de Luifer. */
  guide: string;
  /** Qué significa calificar 1 y qué significa calificar 5. */
  scale: { low: string; high: string };
  /**
   * Eliminatorio: con 1 o 2 el proyecto no pasa, por bueno que sea lo demás.
   * No se promedia con el resto.
   */
  knockout?: boolean;
  /** Solo aplica a este tipo de proyecto; en el otro desaparece. */
  appliesTo?: ProjectType;
}

export interface ChecklistSection {
  id: string;
  name: string;
  /** Cuánto pesa la sección en el resultado. Todas suman 100. */
  weight: number;
  items: ChecklistItem[];
}

/** Calificación igual o menor a esto en un ítem eliminatorio = no pasa. */
export const KNOCKOUT_MAX_RATING = 2;

/** Largo máximo de las observaciones de un ítem. */
export const MAX_NOTE_LENGTH = 1000;

export const SECTIONS: ChecklistSection[] = [
  {
    id: 'sector',
    name: 'Ubicación del Sector',
    weight: 10,
    items: [
      {
        id: 'seguridad_barrio',
        title: 'Percepción de seguridad del barrio',
        weight: 18,
        guide:
          'Camina la zona de día y de noche, y pregúntale a quien vive ahí, no al asesor. Un barrio donde la gente no quiere salir de noche se arrienda y se vende más barato.',
        scale: {
          low: 'Los vecinos lo describen como inseguro.',
          high: 'Se camina tranquilo a cualquier hora.',
        },
      },
      {
        id: 'transporte',
        title: 'Facilidad de transporte',
        weight: 18,
        guide:
          'Mira a cuántos minutos queda el transporte público y las vías principales. Tu futuro arrendatario va a hacer ese recorrido todos los días.',
        scale: {
          low: 'Depende de carro o de largas caminatas.',
          high: 'Transporte y vías principales a pocos minutos.',
        },
      },
      {
        id: 'topografia',
        title: 'Topografía',
        weight: 18,
        guide:
          'Pendientes fuertes, zonas de ladera o cerca de cauces suben costos y riesgos. Revisa el plan de ordenamiento del municipio si hay dudas.',
        scale: {
          low: 'Ladera pronunciada o zona con riesgo identificado.',
          high: 'Terreno plano y estable, sin riesgos señalados.',
        },
      },
      {
        id: 'sitios_interes',
        title: 'Cercanía a sitios de interés',
        weight: 15,
        guide:
          'Supermercados, colegios, centros de salud y comercio cerca. Lo básico a mano es lo que hace que un inmueble no se quede vacío.',
        scale: {
          low: 'Todo queda lejos.',
          high: 'Lo del día a día se resuelve caminando.',
        },
      },
      {
        id: 'dinamica_constructiva',
        title: 'Dinámica constructiva en el barrio o sector',
        weight: 15,
        guide:
          'Cuenta cuántos proyectos nuevos hay alrededor. Que construyan cerca dice que el sector tiene demanda; que no construya nadie también dice algo.',
        scale: {
          low: 'Sector estancado, nadie más construye.',
          high: 'Varios proyectos serios en marcha alrededor.',
        },
      },
      {
        id: 'obras_futuras',
        title: 'Potenciales de valorización por obras a futuro',
        weight: 16,
        guide:
          'Busca obras públicas aprobadas: vías, estaciones, parques, centros comerciales. Que estén aprobadas y con presupuesto, no solo anunciadas.',
        scale: {
          low: 'No hay nada previsto.',
          high: 'Obras aprobadas y con fecha que van a valorizar la zona.',
        },
      },
    ],
  },
  {
    id: 'apto',
    name: 'Ubicación del Apto en el Proyecto',
    weight: 10,
    items: [
      {
        id: 'tipologias',
        title: 'Análisis de las tipologías y su distribución',
        weight: 18,
        guide:
          'Compara las tipologías del proyecto. La distribución debe aprovechar bien el área: sin pasillos largos ni espacios que no sirven para nada.',
        scale: {
          low: 'Distribución incómoda o con área desperdiciada.',
          high: 'Distribución funcional, fácil de arrendar.',
        },
      },
      {
        id: 'poniente',
        title: 'Poniente',
        weight: 20,
        guide:
          'Fíjate hacia dónde da el apartamento. El sol de la tarde de frente calienta todo el inmueble y en clima cálido eso pesa a la hora de arrendar.',
        scale: {
          low: 'Recibe todo el sol de la tarde.',
          high: 'Orientación fresca y bien iluminada.',
        },
      },
      {
        id: 'altura',
        title: 'Altura',
        weight: 12,
        guide:
          'Los pisos medios y altos suelen tener mejor vista, menos ruido y más demanda. Los primeros pisos pierden privacidad.',
        scale: {
          low: 'Piso bajo, con ruido o poca privacidad.',
          high: 'Piso medio o alto, con buena demanda.',
        },
      },
      {
        id: 'zonas_comunes_vias',
        title: 'Cercanía a zonas comunes y vías principales',
        weight: 12,
        guide:
          'Ni muy pegado a la piscina o al salón social, ni encima de la vía con tráfico pesado. El ruido se nota más viviendo que en la visita.',
        scale: {
          low: 'Encima del ruido de zonas comunes o de la vía.',
          high: 'Cerca de todo sin cargar con el ruido.',
        },
      },
      {
        id: 'entorno_apto',
        title: 'Análisis entorno del apto',
        weight: 12,
        guide:
          'Mira qué hay al lado y al frente de esa unidad: shut de basuras, ascensores, cuartos técnicos, otro edificio a pocos metros.',
        scale: {
          low: 'Junto a algo que molesta todos los días.',
          high: 'Entorno inmediato limpio y tranquilo.',
        },
      },
      {
        id: 'vista',
        title: 'Vista',
        weight: 20,
        guide:
          'Pregunta qué se va a construir enfrente. Una vista abierta hoy puede quedar contra una pared en dos años.',
        scale: {
          low: 'Vista contra un muro o que se va a tapar.',
          high: 'Vista abierta y protegida.',
        },
      },
      {
        id: 'parqueadero_util',
        title: 'Selección del parqueadero y útil',
        weight: 6,
        guide:
          'Revisa dónde queda el parqueadero y el depósito asignados. Uno lejano, o en un nivel incómodo, resta valor y comodidad.',
        scale: {
          low: 'Lejos o en mala ubicación.',
          high: 'Cerca y de fácil acceso.',
        },
      },
    ],
  },
  {
    id: 'financiero',
    name: 'Financiero',
    weight: 10,
    items: [
      {
        id: 'plan_pagos',
        title: 'Estructura plan de pagos',
        weight: 30,
        guide:
          'La cuota inicial y las mensualidades tienen que caber en tu flujo sin desorganizarte. Si para pagarlas tienes que apretarte, el proyecto no es para ti hoy.',
        scale: {
          low: 'El plan de pagos te deja sin margen.',
          high: 'Cabe holgado en tu flujo mensual.',
        },
      },
      {
        id: 'interes_pago_adelantado',
        title: 'Reconocimiento de interés por pago adelantado',
        weight: 5,
        guide:
          'Pregunta si reconocen algún descuento o interés si adelantas pagos. Es plata que se negocia y casi nadie la pide.',
        scale: {
          low: 'No reconocen nada.',
          high: 'Reconocen un beneficio claro y por escrito.',
        },
      },
      {
        id: 'numero_cuotas',
        title: 'Tiempo o número de cuotas',
        weight: 30,
        guide:
          'Más cuotas significa una mensualidad más liviana y más tiempo para organizarte antes de la entrega.',
        scale: {
          low: 'Pocas cuotas y muy pesadas.',
          high: 'Plazo amplio con cuotas cómodas.',
        },
      },
      {
        id: 'valor_inversion',
        title: 'Valor de la inversión',
        weight: 30,
        guide:
          'Compara el precio con lo que vale el metro cuadrado en la zona. Lo básico es lo que funciona: si pagas de más el día que compras, esa plata no la recuperas.',
        scale: {
          low: 'Por encima de lo que vale la zona.',
          high: 'En o por debajo del precio de mercado.',
        },
      },
      {
        id: 'negociacion',
        title: 'Negociación',
        weight: 5,
        guide:
          'Pregunta qué tanto margen tienen: descuento, acabados, parqueadero, plazos. Lo que no se pregunta no se consigue.',
        scale: {
          low: 'No hay ningún margen de negociación.',
          high: 'Lograste mejorar las condiciones.',
        },
      },
    ],
  },
  {
    id: 'constructora',
    name: 'Constructora o Equipo Promotor',
    weight: 5,
    items: [
      {
        id: 'numero_obras',
        title: '# Obras',
        weight: 25,
        guide:
          'Pide la lista de proyectos que han entregado, del constructor y de la gerencia. Mejor si puedes visitar alguno ya habitado.',
        scale: {
          low: 'Es su primer proyecto o no muestran ninguno.',
          high: 'Varias obras entregadas que puedes visitar.',
        },
      },
      {
        id: 'anos_experiencia',
        title: 'Años de experiencia',
        weight: 25,
        guide:
          'Una constructora que ha pasado por varios ciclos del mercado ya sabe terminar obras en tiempos difíciles.',
        scale: {
          low: 'Empresa nueva, sin trayectoria.',
          high: 'Muchos años construyendo sin tropiezos.',
        },
      },
      {
        id: 'quejas_denuncias',
        title: 'Quejas - Denuncias',
        weight: 25,
        guide:
          'Busca el nombre de la constructora con «quejas», «demanda» o «incumplimiento», y pregunta en la Superintendencia de Industria y Comercio.',
        scale: {
          low: 'Quejas repetidas o procesos en curso.',
          high: 'Sin quejas relevantes.',
        },
      },
      {
        id: 'gremios',
        title: 'Afiliada a gremios',
        weight: 25,
        guide:
          'Pregunta si está afiliada a Camacol u otro gremio del sector. No garantiza nada por sí solo, pero quien está afiliado se expone al escrutinio de sus pares.',
        scale: {
          low: 'No pertenece a ningún gremio.',
          high: 'Afiliada y activa en el gremio.',
        },
      },
    ],
  },
  {
    id: 'fiduciaria',
    name: 'Fiduciaria',
    weight: 10,
    items: [
      {
        id: 'tiene_fiduciaria',
        title: 'Debe tener fiduciaria',
        weight: 100,
        knockout: true,
        guide:
          'La fiducia guarda tu dinero hasta que el proyecto alcanza su punto de equilibrio. Pide el certificado y el número del encargo fiduciario. Sin fiducia no se entra, por bueno que se vea todo lo demás.',
        scale: {
          low: 'No tiene fiducia o no la pueden demostrar.',
          high: 'Fiducia constituida y verificada con el certificado.',
        },
      },
    ],
  },
  {
    id: 'tiempo_compra',
    name: 'Tiempo de Compra',
    weight: 10,
    items: [
      {
        id: 'momento_compra',
        title: 'Verificar el momento de compra',
        weight: 80,
        guide:
          'En lanzamiento se compra más barato pero se espera más; cerca de la entrega se paga más pero se ve lo que se compra. Decide en qué momento estás entrando y si te conviene.',
        scale: {
          low: 'Etapa que no conviene a tu plan.',
          high: 'Entras en el momento que más te favorece.',
        },
      },
      {
        id: 'entrega_zonas_comunes',
        title: 'Verificar etapas para entrega de zonas comunes',
        weight: 10,
        guide:
          'Pregunta en qué etapa entregan las zonas comunes. Si llegan con la última etapa, vas a vivir o arrendar años sin ellas.',
        scale: {
          low: 'Se entregan al final de todo el proyecto.',
          high: 'Se entregan con tu etapa o antes.',
        },
      },
      {
        id: 'independencia_etapas',
        title: 'Nivel de independencia entre etapas',
        weight: 10,
        guide:
          'Revisa si tu etapa funciona por su cuenta: accesos, servicios y administración. Si depende de que vendan las siguientes, carga con su riesgo.',
        scale: {
          low: 'Tu etapa depende de las que siguen.',
          high: 'Tu etapa funciona completa por sí sola.',
        },
      },
    ],
  },
  {
    id: 'ventas',
    name: 'Nivel de Ventas',
    weight: 8,
    items: [
      {
        id: 'nivel_ventas',
        title: 'Verificar el nivel de ventas',
        weight: 70,
        guide:
          'Pregunta cuántas unidades llevan vendidas frente al punto de equilibrio. Un proyecto que vende bien arranca obra; uno que no vende, se frena.',
        scale: {
          low: 'Lejos del punto de equilibrio.',
          high: 'Ya superó el punto de equilibrio.',
        },
      },
      {
        id: 'socios_compraron',
        title:
          'Preguntar si socios o empleados de la constructora han comprado',
        weight: 30,
        guide:
          'Si los de adentro compraron, confían en el proyecto. Si ninguno compró, pregunta por qué.',
        scale: {
          low: 'Nadie de adentro ha comprado.',
          high: 'Socios o empleados compraron unidades.',
        },
      },
    ],
  },
  {
    id: 'cesion',
    name: 'Cesión de Derechos',
    weight: 5,
    items: [
      {
        id: 'permite_cesion',
        title: 'Verificar si permite la cesión de derechos',
        weight: 100,
        guide:
          'La cesión de derechos te deja vender tu posición antes de la escritura. Revisa en la promesa si la permiten y cuánto cobran por hacerla.',
        scale: {
          low: 'No la permiten, o la cobran muy cara.',
          high: 'La permiten, con condiciones claras y costo razonable.',
        },
      },
    ],
  },
  {
    id: 'construccion',
    name: 'Construcción',
    weight: 7,
    items: [
      {
        id: 'sistema_constructivo',
        title: 'Aporticado (tradicional) o de muro vaciado',
        weight: 30,
        guide:
          'El sistema aporticado permite remodelar y mover muros; el de muro vaciado (estructural) no deja tumbar paredes. Pregunta cuál es y piensa si te importa poder modificar.',
        scale: {
          low: 'El sistema no te deja hacer lo que necesitas.',
          high: 'El sistema se ajusta a tu plan para el inmueble.',
        },
      },
      {
        id: 'acabados_no_vis',
        title: 'Para proyectos NO VIS preguntar si ofrecen acabados',
        weight: 10,
        appliesTo: 'no_vis',
        guide:
          'En proyectos NO VIS pregunta qué acabados incluye la entrega. Si se entrega en obra gris, súmale ese costo al precio antes de comparar.',
        scale: {
          low: 'Obra gris sin opción de acabados.',
          high: 'Acabados incluidos y especificados por escrito.',
        },
      },
      {
        id: 'fachada',
        title: 'Fachada',
        weight: 30,
        guide:
          'Fíjate en el material de la fachada y en su mantenimiento. Una fachada que se deteriora rápido se traduce en cuotas extraordinarias.',
        scale: {
          low: 'Material que exige mantenimiento costoso.',
          high: 'Material durable y de bajo mantenimiento.',
        },
      },
      {
        id: 'ascensores',
        title: 'Ascensores',
        weight: 10,
        guide:
          'Cuenta cuántos ascensores hay para la cantidad de apartamentos. Pocos ascensores significan filas todos los días.',
        scale: {
          low: 'Insuficientes para la cantidad de unidades.',
          high: 'Suficientes, con buena marca y mantenimiento.',
        },
      },
      {
        id: 'aptos_piso',
        title: 'Aptos por piso',
        weight: 15,
        guide:
          'Menos apartamentos por piso significa más privacidad y menos ruido en los pasillos.',
        scale: {
          low: 'Muchas unidades por piso.',
          high: 'Pocas unidades por piso.',
        },
      },
      {
        id: 'altura_piso_techo',
        title: 'Altura piso-techo',
        weight: 5,
        guide:
          'Una altura libre generosa hace los espacios más frescos y amplios. Pregunta la medida exacta, no la del apartamento modelo.',
        scale: {
          low: 'Techos bajos.',
          high: 'Techos altos y espacios amplios.',
        },
      },
    ],
  },
  {
    id: 'mercado',
    name: 'Estudio de Mercado',
    weight: 10,
    items: [
      {
        id: 'precio_m2_zona',
        title: 'Precio por m² en la zona',
        weight: 60,
        guide:
          'Busca al menos tres proyectos o inmuebles comparables en la zona y calcula su precio por metro cuadrado. Compara el resultado con el precio por metro cuadrado que te ofrecen.',
        scale: {
          low: 'Muy por encima del metro cuadrado de la zona.',
          high: 'En o por debajo del metro cuadrado de la zona.',
        },
      },
      {
        id: 'otros_proyectos',
        title: 'Considerar qué otros proyectos se desarrollan en la zona',
        weight: 40,
        guide:
          'Mira la competencia: si hay muchos proyectos iguales entregando al mismo tiempo, va a haber mucha oferta de arriendo y venta a la vez.',
        scale: {
          low: 'Mucha oferta igual entregando al mismo tiempo.',
          high: 'Poca competencia directa en la zona.',
        },
      },
    ],
  },
  {
    id: 'escrituracion',
    name: 'Costos de Escrituración',
    weight: 3,
    items: [
      {
        id: 'costos_escrituracion',
        title: 'Considerar costos de escrituración',
        weight: 100,
        guide:
          'Notaría, registro y beneficencia suman un porcentaje del precio que se paga al escriturar. Pregunta cómo se reparten con la constructora y tenlos presupuestados desde hoy.',
        scale: {
          low: 'No están claros ni presupuestados.',
          high: 'Claros, repartidos por escrito y en tu presupuesto.',
        },
      },
    ],
  },
  {
    id: 'especiales',
    name: 'Consideraciones Especiales',
    weight: 12,
    items: [
      {
        id: 'valorizacion_estimada',
        title: 'Preguntar incrementos de valorización estimados',
        weight: 40,
        guide:
          'Pregunta cuánto ha subido el precio desde el lanzamiento y en qué se basan para proyectar la valorización. Desconfía de las cifras sin sustento.',
        scale: {
          low: 'Promesas de valorización sin sustento.',
          high: 'Incrementos históricos demostrables.',
        },
      },
      {
        id: 'parqueaderos_depositos',
        title: 'Valor de parqueaderos privados y depósitos (útiles)',
        weight: 20,
        guide:
          'Pregunta si el parqueadero y el depósito vienen incluidos o se pagan aparte, y cuánto. A veces cambian por completo el precio real.',
        scale: {
          low: 'Se cobran aparte y caros.',
          high: 'Incluidos, o a un precio razonable.',
        },
      },
      {
        id: 'etapas_unidades',
        title: '# Etapas totales del proyecto y número de unidades',
        weight: 40,
        guide:
          'Muchas etapas y miles de unidades significan años de obra alrededor y mucha oferta compitiendo con la tuya. Pregunta el total y en qué etapa estás entrando.',
        scale: {
          low: 'Muchas etapas por delante y gran volumen de unidades.',
          high: 'Proyecto acotado, en su etapa final o de pocas unidades.',
        },
      },
    ],
  },
];

/** Todos los ítems con su sección, para buscarlos por id. */
export const ITEMS = SECTIONS.flatMap((section) =>
  section.items.map((item) => ({ ...item, sectionId: section.id })),
);

/** Ítems que cuentan para un tipo de proyecto. */
export function itemsFor(section: ChecklistSection, type: ProjectType) {
  return section.items.filter(
    (item) => !item.appliesTo || item.appliesTo === type,
  );
}
