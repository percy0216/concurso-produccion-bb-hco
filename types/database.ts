/**
 * Tipos de base de datos generados desde el esquema SQL
 * Proyecto: concurso-produccion-bb-hco
 */

// Enums
export type RolUsuario = 'supervisor' | 'plancha' | 'packer' | 'admin';
export type Fase = 'pretest' | 'postest';
export type Turno = 1 | 2;
export type AreaOperador = 'plancha' | 'packer' | 'supervision';

// ============================================================
// TABLAS
// ============================================================

export interface Perfil {
  id: string;                    // UUID = auth.users.id
  cod_operador: string | null;   // Referencia a operadores.cod_operador
  rol: RolUsuario;
  nombre_visible: string | null;
  activo: boolean;
  created_at: string;            // ISO timestamptz
}

export interface Operador {
  cod_operador: string;          // PK: GU-PLA-001, GU-PCK-001, GU-SUP-001...
  area: AreaOperador;
  activo: boolean;
  fecha_pretest: string | null;  // ISO date
  fecha_postest: string | null;  // ISO date
  created_at: string;            // ISO timestamptz
}

export interface Comanda {
  id: string;                    // UUID
  id_orden: string;              // GU-CMD-001 ... GU-CMD-030 (unique)
  fase: Fase;
  grupo: string;                 // default 'GU'
  turno: Turno;                  // 1 = Almuerzo, 2 = Noche

  cod_oper_pl: string | null;    // FK -> operadores.cod_operador (area=plancha)
  cod_oper_pk: string | null;    // FK -> operadores.cod_operador (area=packer)

  // Timestamps crudos (ISO timestamptz)
  hora_emision_caja: string | null;
  hora_inicio_plancha: string | null;
  hora_fin_plancha: string | null;
  hora_inicio_packer: string | null;
  hora_fin_packer: string | null;
  hora_entrega_cliente: string | null;

  // Columnas calculadas (generated always as stored) - en SEGUNDOS
  tiempo_plancha: number | null;
  tiempo_packer: number | null;
  tiempo_despacho: number | null;

  // 1 = Sí cumple (≤480s) / 0 = No cumple / null = incompleto
  cumple_meta: 1 | 0 | null;

  created_at: string;
  user_id: string;               // UUID del usuario que creó la comanda
}

// Vista para exportar/Power BI (mismo shape que Comanda pero sin UUID interno)
export type VistaResultado = Omit<Comanda, 'id'>;

// ============================================================
// TIPOS PARA FORMULARIOS / UI
// ============================================================

/** Datos para crear una comanda (input del usuario) */
export interface ComandaInput {
  id_orden: string;
  fase: Fase;
  grupo?: string;
  turno: Turno;
  cod_oper_pl?: string;
  cod_oper_pk?: string;
  hora_emision_caja?: string; // Auto-set para calcular meta
}

/** Eventos de timestamp que la PWA envía */
export type TimestampEvent =
  | 'hora_emision_caja'
  | 'hora_inicio_plancha'
  | 'hora_fin_plancha'
  | 'hora_inicio_packer'
  | 'hora_fin_packer'
  | 'hora_entrega_cliente';

/** Payload para actualizar un timestamp específico */
export interface ComandaTimestampUpdate {
  id: string;              // UUID de la comanda
  event: TimestampEvent;
  value: string;           // ISO timestamptz (now())
}

/** Comanda con relaciones pobladas (para reportes) */
export interface ComandaConRelaciones extends Comanda {
  operador_pl?: Pick<Operador, 'cod_operador' | 'area'> | null;
  operador_pk?: Pick<Operador, 'cod_operador' | 'area'> | null;
}

// ============================================================
// TIPOS PARA REALTIME
// ============================================================

export interface RealtimeComandaPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Comanda | null;
  old: Comanda | null;
}

// ============================================================
// HELPERS
// ============================================================

/** Convierte segundos a minutos redondeados (para mostrar en UI) */
export function segundosAMinutos(segundos: number | null): number | null {
  if (segundos === null || segundos === undefined) return null;
  return Math.round(segundos / 60);
}

/** Verifica si una comanda está completa (todos los timestamps) */
export function comandaCompleta(c: Comanda): boolean {
  return !!(
    c.hora_emision_caja &&
    c.hora_inicio_plancha &&
    c.hora_fin_plancha &&
    c.hora_inicio_packer &&
    c.hora_fin_packer &&
    c.hora_entrega_cliente
  );
}

/** Obtiene el siguiente timestamp pendiente para una comanda */
export function getNextPendingTimestamp(c: Comanda): TimestampEvent | null {
  const orden: TimestampEvent[] = [
    'hora_emision_caja',
    'hora_inicio_plancha',
    'hora_fin_plancha',
    'hora_inicio_packer',
    'hora_fin_packer',
    'hora_entrega_cliente',
  ];
  for (const event of orden) {
    if (!c[event]) return event;
  }
  return null;
}

/** Etiquetas legibles para los eventos de timestamp */
export const TIMESTAMP_LABELS: Record<TimestampEvent, string> = {
  hora_emision_caja: 'Emisión Caja',
  hora_inicio_plancha: 'Inicio Plancha',
  hora_fin_plancha: 'Fin Plancha',
  hora_inicio_packer: 'Inicio Packer',
  hora_fin_packer: 'Fin Packer',
  hora_entrega_cliente: 'Entrega Cliente',
};

/** Etiquetas para roles */
export const ROL_LABELS: Record<RolUsuario, string> = {
  supervisor: 'Supervisor',
  plancha: 'Plancha',
  packer: 'Packer',
  admin: 'Administrador',
};

/** Etiquetas para fases */
export const FASE_LABELS: Record<Fase, string> = {
  pretest: 'Pretest (O1)',
  postest: 'Postest (O2)',
};

/** Etiquetas para turnos */
export const TURNO_LABELS: Record<Turno, string> = {
  1: 'Turno 1 - Almuerzo (Rush)',
  2: 'Turno 2 - Noche (Rush)',
};

/** Meta en segundos (8 minutos = 480s) */
export const META_SEGUNDOS = 480;
export const META_MINUTOS = 8;