/** Contrato con el backend. Debe seguir a `UsersService.sanitize()`. */

export type UserRole = 'investor' | 'admin';
export type UserStatus = 'pending_activation' | 'active' | 'suspended';

/** Lo que devuelve `GET /api/auth/me`. */
export interface SessionUser {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

/** Lo que devuelven login y activación. */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; fullName: string; email: string; role: UserRole };
}

/** Ficha completa, tal como la entrega el panel de administración. */
export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  accessExpiresAt: string | null;
  activationExpiresAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/* ---------- Filtro de Seguridad ---------- */

export type CategoryId = 'legal' | 'builder' | 'location' | 'financial' | 'fit';
export type Verdict = 'verde' | 'amarillo' | 'rojo' | 'sin_datos';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  weight: number;
}

export interface Choice {
  value: string;
  label: string;
  score: number;
}

export interface Criterion {
  id: string;
  category: CategoryId;
  question: string;
  help: string;
  weight: number;
  knockout?: boolean;
  choices: Choice[];
  unknownAction: string;
  /** Sale de los comparables; no se pregunta. */
  derived?: boolean;
}

export interface FilterDefaults {
  deedCostRate: number;
  taxRate: number;
  safetyMarginRate: number;
  refurbishCost: number;
}

export interface FilterForm {
  categories: Category[];
  criteria: Criterion[];
  defaults: FilterDefaults;
}

export interface Comparable {
  reference: string;
  areaM2: number;
  price: number;
}

/** Cada paso de la comparación de precio, para poder explicarla. */
export interface Pricing {
  medianPricePerM2: number;
  marketValue: number;
  listedVsMarket: number;
  deedCost: number;
  taxCost: number;
  refurbishCost: number;
  entryCosts: number;
  safetyMargin: number;
  maxPrice: number;
  gainAtMaxPrice: number;
  passes: boolean;
}

export interface CategoryScore {
  id: CategoryId;
  name: string;
  weight: number;
  score: number | null;
  answered: number;
  total: number;
}

export interface Alert {
  criterionId: string;
  question: string;
  severity: 'critica' | 'atencion';
  message: string;
}

export interface Evaluation {
  score: number | null;
  confidence: number;
  verdict: Verdict;
  label: string;
  summary: string;
  categories: CategoryScore[];
  alerts: Alert[];
  nextSteps: { criterionId: string; action: string }[];
}

export interface Assessment {
  evaluation: Evaluation;
  pricing: Pricing | null;
}

export interface Analysis {
  id: string;
  projectName: string;
  location: string | null;
  answers: Record<string, string>;
  listedPrice: number | null;
  areaM2: number | null;
  comparables: Comparable[];
  pricing: Pricing | null;
  result: Evaluation;
  notes: string | null;
  createdAt: string;
}
