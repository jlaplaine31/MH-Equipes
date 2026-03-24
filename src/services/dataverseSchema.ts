/**
 * Mapping du schema Dataverse reel.
 * Prefixe editeur : aaa_
 * Environnement : https://laplainemh.crm12.dynamics.com/
 */

// --- Noms de tables (entity set names pour l'API OData) ---
export const TABLES = {
  sessions: 'aaa_eqsessions',
  teams: 'aaa_eqteamses',      // Dataverse pluralise automatiquement
  participants: 'aaa_eqparticipants',
} as const

// --- Colonnes EqSession ---
export const SESSION_COLS = {
  id: 'aaa_eqsessionid',
  title: 'aaa_title',
  numTeams: 'aaa_numteams',
  services: 'aaa_services',
  shareToken: 'aaa_sharetoken',
  status: 'aaa_status',
  createdOn: 'createdon',        // colonne systeme Dataverse
  ownerId: '_ownerid_value',     // colonne systeme (remplace organizer_id)
} as const

// --- Colonnes EqTeams ---
export const TEAM_COLS = {
  id: 'aaa_eqteamsid',
  name: 'aaa_name',
  color: 'aaa_color',
  tag: 'aaa_tag',
  order: 'aaa_order',
  session: '_aaa_session_value', // lookup (lecture)
  sessionBind: 'aaa_Session@odata.bind', // lookup (ecriture)
} as const

// --- Colonnes EqParticipant ---
export const PARTICIPANT_COLS = {
  id: 'aaa_eqparticipantid',
  name: 'aaa_name',
  service: 'aaa_service',
  scoreCopilot: 'aaa_scorecopilot',
  scoreMia: 'aaa_scoremia',
  sessionToken: 'aaa_sessiontoken',
  session: '_aaa_session_value',
  sessionBind: 'aaa_Session@odata.bind',
  team: '_aaa_team_value',
  teamBind: 'aaa_Team@odata.bind',
  createdOn: 'createdon',
} as const

// --- Choice Status ---
export const STATUS_VALUES = {
  open: 745_450_000,
  closed: 745_450_001,
  generated: 745_450_002,
} as const

export type StatusLabel = keyof typeof STATUS_VALUES

export function statusToLabel(value: number): StatusLabel {
  switch (value) {
    case STATUS_VALUES.open: return 'open'
    case STATUS_VALUES.closed: return 'closed'
    case STATUS_VALUES.generated: return 'generated'
    default: return 'open'
  }
}

export function statusToValue(label: StatusLabel): number {
  return STATUS_VALUES[label]
}
