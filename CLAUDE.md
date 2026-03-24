# Equipes — Formation d'equipes equilibrees

## Projet

Application SPA React permettant a un formateur de creer des ateliers et de constituer automatiquement des equipes equilibrees parmi les participants. Les participants rejoignent via QR code sur mobile, les equipes se forment en temps reel.

**Entreprise** : PlaNel (formation en escape games pedagogiques)

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Framer Motion |
| Auth | MSAL.js (@azure/msal-browser) — Microsoft M365 |
| Donnees | Dataverse Web API (REST, OData) |
| Temps reel | Polling Dataverse (3-5s) |
| QR Code | qrcode.react |
| Hebergement | GitHub Pages (statique) |
| Routing | react-router-dom v7 |

## Structure du projet

```
src/
├── components/        # Composants UI reutilisables
│   ├── ui/            # Boutons, inputs, badges, cards generiques
│   └── teams/         # Composants specifiques equipes (TeamCard, TeamGrid, etc.)
├── pages/             # Composants de page (1 par route)
│   ├── HomePage.tsx           # Liste des ateliers (/)
│   ├── AdminPage.tsx          # Dashboard admin (/session/:id)
│   ├── JoinPage.tsx           # Formulaire participant (/join/:token)
│   ├── EditPage.tsx           # Modification reponses (/edit/:token)
│   └── WaitingPage.tsx        # Attente + reveal (/waiting/:token)
├── services/          # Couche d'acces aux donnees
│   ├── dataverseClient.ts     # Client Dataverse generique (fetch wrapper)
│   ├── sessionService.ts      # CRUD sessions
│   ├── participantService.ts  # CRUD participants
│   └── teamService.ts         # CRUD equipes
├── hooks/             # Hooks React custom
│   ├── useAuth.ts             # Auth MSAL context
│   ├── usePolling.ts          # Polling generique Dataverse
│   └── useTeamAlgorithm.ts    # Lancement algo + state
├── utils/             # Logique pure, sans React
│   ├── teamAlgorithm.ts       # Algorithme de formation d'equipes
│   └── colors.ts              # Palette de couleurs des equipes
├── constants/         # Constantes et labels
│   └── index.ts
├── types/             # Types TypeScript
│   └── index.ts
├── App.tsx
└── main.tsx
```

## Conventions de code

- **Langue** : UI en francais, code en anglais (noms de variables, composants, fichiers)
- **Composants** : fonctionnels uniquement, hooks custom prefixes `use`
- **Styling** : Tailwind classes dans le JSX, pas de fichiers CSS custom sauf animations complexes
- **Services** : tout appel Dataverse passe par `services/dataverseClient.ts`, jamais de fetch direct dans les composants
- **State** : React state local + context, pas de state manager externe
- **Types** : interfaces TypeScript pour toutes les entites (Session, Participant, Team)

## Modele de donnees (Dataverse)

### Tables

| Table Dataverse | Description |
|-----------------|-------------|
| `planel_eqsession` | Ateliers de formation |
| `planel_eqparticipant` | Participants inscrits |
| `planel_eqteam` | Equipes formees |

### Relations
- Session 1→N Participant (cascade delete)
- Session 1→N Team (cascade delete)
- Team 1→N Participant (SET NULL on delete)

### Champs cles
- `planel_eqsession` : title, num_teams (defaut 9), services (JSON string), share_token, status (open/closed/generated)
- `planel_eqparticipant` : name, service, score_copilot (0-5), score_mia (0-5), session_token, team_id
- `planel_eqteam` : name, color (hex), tag, order

## Regles metier critiques

1. **Expert** = score_copilot >= 3 OU score_mia >= 3
2. **Algorithme d'equipes** (cote client) :
   - Phase 1 : 1 expert par equipe minimum (si assez d'experts)
   - Phase 2 : distribuer les experts restants (equipe avec le moins d'experts)
   - Phase 3 : remplir avec non-experts (contrainte MAX_SAME_SERVICE=2 par equipe)
3. **Auto-assignation** : relancer l'algo a chaque nouveau participant
4. **Rebalancement** : preserve les equipes (couleurs, tags, noms), remet les assignations a NULL
5. **Session fermee** : interdit les nouvelles inscriptions

## Design tokens

| Token | Clair | Sombre |
|-------|-------|--------|
| Accent | `#E2250C` | `#FF6B5A` |
| Fond | `#F5F5F2` | `#1a1a1a` |
| Surface | `#ffffff` | `#2a2a2a` |
| Texte | `#1a1a1a` | `#f0f0f0` |
| Muted | `#6b7280` | `#9ca3af` |
| Border | `#e5e7eb` | `#3a3a3a` |

- **Polices** : Inter (body), Space Grotesk (titres)
- **Border radius** : 0.75rem (cartes), 0.5rem (inputs/boutons)
- **Theme** : attribut `data-theme="sombre"` sur `<html>`

## Palette couleurs equipes

```
Index 0-2: #3b82f6 (bleu)    Index 3-5: #f59e0b (ambre)    Index 6-8: #22c55e (vert)
Index 9: #8b5cf6  Index 10: #ec4899  Index 11: #06b6d4  Index 12: #84cc16
Index 13: #f97316  Index 14: #6366f1  Index 15: #14b8a6  Index 16: #e11d48
Index 17: #a855f7  Index 18: #0ea5e9  Index 19: #d946ef
```

## Commandes

```bash
npm run dev          # Serveur de dev Vite
npm run build        # Build production
npm run preview      # Preview du build
npm run test         # Tests Vitest
npm run lint         # ESLint
```

## Deploiement

- GitHub Pages via GitHub Actions
- Base path Vite : `/equipes/`
- Azure AD app registration pour MSAL redirect URIs
