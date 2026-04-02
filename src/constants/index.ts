export const DEFAULT_SERVICES = [
  'Transformation',
  'Reporting & Performance',
  'Conformité',
  'Hypervision & Planification',
]

export const DEFAULT_NUM_TEAMS = 9
export const MIN_TEAMS = 2
export const MAX_TEAMS = 20

export const TARGET_SIZE = 5
export const MAX_SAME_SERVICE = 2
export const EXPERT_THRESHOLD = 3

export const POLLING_INTERVAL_MS = 4000

export const TEAM_COLORS: string[] = [
  '#3b82f6', '#3b82f6', '#3b82f6', // bleu (0-2)
  '#f59e0b', '#f59e0b', '#f59e0b', // ambre (3-5)
  '#22c55e', '#22c55e', '#22c55e', // vert (6-8)
  '#8b5cf6', // violet (9)
  '#ec4899', // rose (10)
  '#06b6d4', // cyan (11)
  '#84cc16', // lime (12)
  '#f97316', // orange (13)
  '#6366f1', // indigo (14)
  '#14b8a6', // teal (15)
  '#e11d48', // crimson (16)
  '#a855f7', // pourpre (17)
  '#0ea5e9', // sky (18)
  '#d946ef', // fuchsia (19)
]

export const LABELS = {
  appTitle: 'Equipes',
  myWorkshops: 'Mes Ateliers',
  myWorkshopsSubtitle: 'Créez des équipes équilibrées pour vos ateliers de formation',
  workshopName: 'Nom de l\'atelier',
  workshopNameDefault: 'Formation d\'équipes',
  numTeams: 'Nombre d\'équipes',
  services: 'Services (virgule)',
  createWorkshop: 'Créer un atelier',
  open: 'Ouvert',
  closed: 'Fermé',
  generated: 'Équipes formées',
  participants: 'participants',
  teams: 'équipes',
  delete: 'Supprimer',
  confirm: 'Confirmer',
  cancel: 'Annuler',
  save: 'Enregistrer',
  validate: 'Valider',
  rebalance: 'Rebalancer',
  reset: 'Reset',
  editResponses: 'Modifier mes réponses',
  copilotLabel: 'Quel est votre niveau d\'utilisation de Copilot Chat ?',
  copilotHelp: '1 = jamais utilisé, 5 = je l\'utilise tout le temps',
  miaLabel: 'Quel est votre niveau d\'utilisation de Mia ?',
  serviceLabel: 'Quel est votre service ?',
  nameLabel: 'Votre prénom, nom ou pseudo',
  namePlaceholder: 'Ex: Marie D.',
  waitingTitle: 'Merci',
  waitingMessage: 'Votre réponse a été enregistrée.',
  waitingTeams: 'Les équipes seront bientôt formées...',
  sessionClosed: 'Cette session est fermée.',
} as const
