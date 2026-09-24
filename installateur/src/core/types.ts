import { z } from 'zod';

// Domain shapes (spec §4). Every TS type is inferred from these schemas.

const IsoDate = z.iso.datetime();

export const PilotModeSchema = z.enum(['autoconsommation', 'secours', 'heures_creuses']);
export const HealthStatusSchema = z.enum(['en_panne', 'sans_nouvelles', 'a_surveiller', 'ok']);
export const SeveritySchema = z.enum(['grave', 'mineure']);
export const ManipTypeSchema = z.enum([
  'verifier_tore',
  'changer_module',
  'remise_en_service',
  'rappeler_client',
  'verifier_communication',
]);
export const OriginSchema = z.enum(['alerte', 'revolty', 'installation']);
export const ManipStatusSchema = z.enum([
  'a_faire',
  'attente_confirmation',
  'a_confirmer',
  'cloturee',
]);
export const ClosureResultSchema = z.enum(['resolu', 'pas_resolu', 'auto_resolue']);
export const NextStepSchema = z.enum(['repasser', 'transmettre_revolty']);
export const SyncStateSchema = z.enum(['en_attente', 'envoi', 'envoyee', 'echec']);

export const SERIAL_PATTERN = /^RV-\d{4}-\d{4}$/;

export const SystemSchema = z.object({
  id: z.string(),
  serial: z.string().regex(SERIAL_PATTERN),
  client: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().optional(),
    email: z.email().optional(),
  }),
  city: z.string(),
  batteryLabel: z.string(),
  pilotMode: PilotModeSchema,
  configuration: z.enum(['verifiee', 'non_verifiee']),
  lastMeasureAt: IsoDate.nullable(),
  installedAt: IsoDate,
  isNew: z.boolean(),
});

export const AlertSchema = z.object({
  id: z.string(),
  systemId: z.string(),
  severity: SeveritySchema,
  title: z.string(),
  clientImpact: z.string(),
  checks: z.array(z.string()),
  // What an installer does about it; used when the alert spawns a manip.
  manipType: ManipTypeSchema,
  since: IsoDate,
  resolvedAt: IsoDate.nullable(),
});

// Sync state lives on the queue item (single source of truth), not on the closure.
export const ClosureSchema = z.object({
  id: z.string(),
  manipId: z.string(),
  result: ClosureResultSchema,
  next: NextStepSchema.optional(),
  actions: z.array(z.string()),
  photos: z.array(z.string()).max(2),
  note: z.string().optional(),
  audioMemo: z.string().optional(),
  arrivedAt: IsoDate,
  closedAt: IsoDate,
});

export const ManipSchema = z.object({
  id: z.string(),
  systemId: z.string(),
  type: ManipTypeSchema,
  origin: OriginSchema,
  alertId: z.string().nullable(),
  createdAt: IsoDate,
  // null once handed over to Revolty: no due date until they answer.
  dueAt: IsoDate.nullable(),
  openedByInstaller: z.boolean(),
  status: ManipStatusSchema,
  reopened: z.boolean(),
  transmitted: z.boolean(),
  // Deadline for the battery to confirm a "Résolu" closure.
  confirmBy: IsoDate.nullable(),
  attempts: z.array(ClosureSchema),
});

export const MeasureSchema = z.object({
  systemId: z.string(),
  at: IsoDate,
  productionW: z.number().nullable(),
  consumptionW: z.number().nullable(),
  // > 0 charge, < 0 discharge (battery side). null = data gap, never 0.
  batteryW: z.number().nullable(),
  // > 0 import, < 0 export.
  gridW: z.number().nullable(),
  socPct: z.number().min(0).max(100).nullable(),
});

export const QueueItemSchema = z.object({
  id: z.string(),
  kind: z.enum(['cloture', 'installation']),
  refId: z.string(),
  systemId: z.string(),
  label: z.string(),
  sync: SyncStateSchema,
  createdAt: IsoDate,
});

export const DomainStateSchema = z.object({
  systems: z.array(SystemSchema),
  alerts: z.array(AlertSchema),
  manips: z.array(ManipSchema),
  queue: z.array(QueueItemSchema),
});

export type PilotMode = z.infer<typeof PilotModeSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type ManipType = z.infer<typeof ManipTypeSchema>;
export type Origin = z.infer<typeof OriginSchema>;
export type ManipStatus = z.infer<typeof ManipStatusSchema>;
export type ClosureResult = z.infer<typeof ClosureResultSchema>;
export type NextStep = z.infer<typeof NextStepSchema>;
export type SyncState = z.infer<typeof SyncStateSchema>;
export type System = z.infer<typeof SystemSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export type Closure = z.infer<typeof ClosureSchema>;
export type Manip = z.infer<typeof ManipSchema>;
export type Measure = z.infer<typeof MeasureSchema>;
export type QueueItem = z.infer<typeof QueueItemSchema>;
export type DomainState = z.infer<typeof DomainStateSchema>;
