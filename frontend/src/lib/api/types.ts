/** Contrato con el backend. Debe seguir a `UsersService.sanitize()`. */

export type UserRole = 'investor' | 'admin';
export type UserStatus = 'pending_activation' | 'active' | 'suspended';

/** Lo que devuelve `GET /api/auth/me`. */
export interface SessionUser {
  userId: string;
  email: string;
  fullName: string;
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

/* ---------- Check List ---------- */

export type ProjectType = 'vis' | 'no_vis';

export type ChecklistStatus =
  | 'sin_evaluar'
  | 'incompleto'
  | 'solido'
  | 'revisar'
  | 'debil'
  | 'no_pasa';

export interface ChecklistItem {
  id: string;
  title: string;
  weight: number;
  guide: string;
  scale: { low: string; high: string };
  knockout?: boolean;
  appliesTo?: ProjectType;
}

export interface ChecklistSection {
  id: string;
  name: string;
  weight: number;
  items: ChecklistItem[];
}

export interface ChecklistForm {
  sections: ChecklistSection[];
}

export interface ChecklistSectionResult {
  id: string;
  name: string;
  weight: number;
  score: number | null;
  evaluated: number;
  total: number;
}

export interface ChecklistWeakItem {
  itemId: string;
  title: string;
  sectionName: string;
  rating: number;
  knockout: boolean;
}

export interface ChecklistEvaluation {
  score: number | null;
  coverage: number;
  evaluated: number;
  total: number;
  status: ChecklistStatus;
  label: string;
  summary: string;
  sections: ChecklistSectionResult[];
  weakItems: ChecklistWeakItem[];
}

/** Lo que lista el selector de proyectos. */
export interface ChecklistSummary {
  id: string;
  projectName: string;
  projectType: ProjectType;
  score: number | null;
  status: ChecklistStatus;
  label: string;
  evaluated: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedChecklist {
  id: string;
  projectName: string;
  projectType: ProjectType;
  ratings: Record<string, number>;
  notes: Record<string, string>;
  result: ChecklistEvaluation;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Mi Meta de Pensión ---------- */

export type PensionGoal = 'gastos' | 'ingreso';

export interface CashEvent {
  label: string;
  /** Positivo = entra al capital; negativo = sale. */
  amount: number;
  /** 0 = hoy. */
  month: number;
}

export interface PensionInput {
  monthlyIncome: number;
  additionalIncome: number;
  monthlyExpenses: number;
  expenseReduction: number;
  goal: PensionGoal;
  annualReturnRate: number;
  events: CashEvent[];
}

export interface PensionResult {
  totalIncome: number;
  adjustedExpenses: number;
  monthlyInvestable: number;
  targetMonthlyIncome: number;
  targetCapital: number;
  startingCapital: number;
  gap: number;
  progress: number;
  reachedInMonths: number | null;
  yearly: { year: number; capital: number }[];
  monthlyNeededForReference: number;
  referenceYears: number;
  annualReturnRate: number;
  monthlyReturnRate: number;
}

export interface PensionOverview {
  saved: boolean;
  input: PensionInput;
  prefilledFromRoute: boolean;
  result: PensionResult | null;
  defaultReturnRate: number;
  updatedAt: string | null;
}

/* ---------- Consultor Luifer · base de conocimiento ---------- */

export type KnowledgeStatus = 'draft' | 'active' | 'archived';

export interface KnowledgeSummary {
  id: string;
  version: number;
  sourceFileName: string;
  pageCount: number;
  charCount: number;
  sectionCount?: number;
  status: KnowledgeStatus;
  activatedAt: string | null;
  createdAt: string;
  notes: string | null;
}

export interface KnowledgeSection {
  order: number;
  title: string;
  body: string;
  /** Lo corrigió una persona después de la extracción. */
  edited: boolean;
}

export interface KnowledgeDetail extends KnowledgeSummary {
  sections: KnowledgeSection[];
}

/* ---------- Consultor Luifer · conversaciones ---------- */

export type Author = 'person' | 'consultant';

export interface ChatMessage {
  author: Author;
  text: string;
  at: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: ChatMessage[];
}

/** En qué va la espera. Los emite el backend según lo que hace de verdad. */
export type ChatStep = 'material' | 'preparando' | 'pensando';

/** Lo que llega por el flujo de la respuesta. */
export type ChatEvent =
  | { type: 'step'; step: ChatStep }
  | { type: 'chunk'; text: string }
  | { type: 'done'; conversationId: string }
  | { type: 'error'; message: string };

/* ---------- Mi Ruta de 90 Días ---------- */

export interface StartingPoint {
  city?: string;
  propertyType?: string;
  availableCash: number;
  safetyReserve: number;
  monthlyIncome: number;
  monthlyObligations: number;
  possibleCredit: number;
  goal?: string;
  mainDifficulty?: string;
}

export interface RangeAlert {
  severity: 'critica' | 'atencion';
  message: string;
}

export interface BuyingRange {
  forOperation: number;
  maxBudget: number;
  maxInstallment: number;
  reserveShare: number;
  alerts: RangeAlert[];
}

export interface RouteTask {
  id: string;
  label: string;
  why: string;
  done: boolean;
  /** Cómo quedó hecha: a mano, o demostrada con trabajo en la plataforma. */
  source: 'manual' | 'demostrada' | null;
  /** Si no es nulo, la tarea se marca sola y no se puede tocar. */
  provenBy: string | null;
}

export interface RouteBlock {
  id: string;
  order: number;
  fromDay: number;
  toDay: number;
  stages: string;
  goal: string;
  caveat: string;
  tasks: RouteTask[];
  done: number;
  total: number;
  current: boolean;
}

export interface RouteOverview {
  started: boolean;
  startedAt?: string;
  day: number;
  range: BuyingRange | null;
  startingPoint: StartingPoint | null;
  blocks: RouteBlock[];
}
