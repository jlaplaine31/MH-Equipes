# Cahier des Charges - Application "Equipes"

## 1. Presentation generale

### 1.1 Objectif
L'application **Equipes** permet a un organisateur de creer des **ateliers de formation** et de constituer automatiquement des **equipes equilibrees** parmi les participants inscrits. Elle est pensee pour un usage en presentiel : l'organisateur projette un QR code, les participants scannent avec leur telephone, repondent a un court formulaire, et les equipes se forment en temps reel.

### 1.2 Contexte d'usage
- **Entreprise** : PlaNel (formation en escape games pedagogiques)
- **Utilisateurs** : formateurs/organisateurs (admin) + participants (anonymes, sur mobile)
- **Scenario type** : un formateur projette le QR code sur un ecran, 20-50 participants rejoignent depuis leur telephone, les equipes se forment automatiquement et s'affichent en direct

### 1.3 Stack cible (nouvelle plateforme)
| Couche | Technologie |
|--------|-------------|
| Frontend | React + Tailwind CSS + Framer Motion |
| Hebergement | GitHub Pages (statique) |
| Authentification | MSAL.js (Microsoft M365) |
| Base de donnees | Dataverse Web API (REST) |
| Temps reel | Polling Dataverse ou Azure SignalR (pas de WebSocket natif sur GitHub Pages) |

---

## 2. Roles et authentification

### 2.1 Organisateur (utilisateur authentifie)
- Se connecte via **Microsoft M365** (MSAL.js)
- Peut creer, modifier, supprimer des sessions/ateliers
- Peut voir et gerer les equipes formees
- Acces a l'interface d'administration

### 2.2 Participant (anonyme)
- **Pas d'authentification requise**
- Accede via un lien de partage (QR code ou URL)
- Remplit un formulaire court (4 champs)
- Voit sa propre equipe une fois formee
- Peut modifier ses reponses
- Identifie par un **cookie de session** (token unique par session/atelier)

---

## 3. Modele de donnees

### 3.1 Table `eq_sessions` (Ateliers)

| Champ | Type | Description |
|-------|------|-------------|
| `id` | Entier, PK, auto-increment | Identifiant unique |
| `organizer_id` | Entier, FK → Users | Createur de la session |
| `title` | String(255) | Nom de l'atelier (defaut: "Formation d'equipes") |
| `num_teams` | Entier | Nombre d'equipes souhaite (defaut: 9, min: 2, max: 20) |
| `services` | JSON (tableau de strings) | Liste des services/departements disponibles |
| `share_token` | String(64), unique, index | Token aleatoire pour le lien de partage (genere avec `secrets.token_urlsafe(16)`) |
| `status` | String(20) | Statut : `open`, `closed`, `generated` |
| `created_at` | DateTime | Date de creation |

**Services par defaut** : `["Transformation", "Reporting & Performance", "Conformite", "Hypervision & Planification"]`

### 3.2 Table `eq_participants`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | Entier, PK, auto-increment | Identifiant unique |
| `session_id` | Entier, FK → eq_sessions (CASCADE) | Session rattachee |
| `name` | String(100), requis | Prenom/nom/pseudo du participant |
| `service` | String(100), requis | Service du participant (choisi parmi la liste de la session) |
| `score_copilot` | Entier (0-5) | Niveau d'utilisation de Copilot Chat |
| `score_mia` | Entier (0-5) | Niveau d'utilisation de Mia |
| `session_token` | String(64), unique, index | Token de session du participant (cookie) |
| `team_id` | Entier, FK → eq_teams (SET NULL), nullable | Equipe assignee |
| `created_at` | DateTime | Date d'inscription |

### 3.3 Table `eq_teams`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | Entier, PK, auto-increment | Identifiant unique |
| `session_id` | Entier, FK → eq_sessions (CASCADE) | Session rattachee |
| `name` | String(100) | Nom de l'equipe (ex: "Equipe 1") |
| `color` | String(7) | Couleur hexadecimale (ex: "#3b82f6") |
| `tag` | String(100) | Tag libre (etiquette personnalisee par l'admin, ex: "Salle A") |
| `order` | Entier | Ordre d'affichage |

### 3.4 Relations
- `EqSession` 1→N `EqParticipant` (cascade delete)
- `EqSession` 1→N `EqTeam` (cascade delete)
- `EqTeam` 1→N `EqParticipant` (SET NULL on delete)

---

## 4. Palette de couleurs des equipes

Les equipes recoivent automatiquement une couleur selon leur index. La palette predeterminee est :

```
Index 0-2  : #3b82f6 (bleu)      - 3 equipes bleues
Index 3-5  : #f59e0b (ambre)     - 3 equipes ambre
Index 6-8  : #22c55e (vert)      - 3 equipes vertes
Index 9    : #8b5cf6 (violet)
Index 10   : #ec4899 (rose)
Index 11   : #06b6d4 (cyan)
Index 12   : #84cc16 (lime)
Index 13   : #f97316 (orange)
Index 14   : #6366f1 (indigo)
Index 15   : #14b8a6 (teal)
Index 16   : #e11d48 (crimson)
Index 17   : #a855f7 (pourpre)
Index 18   : #0ea5e9 (sky)
Index 19   : #d946ef (fuchsia)
```

L'organisateur peut modifier la couleur d'une equipe via un **color picker**.

---

## 5. Fonctionnalites detaillees

### 5.1 Page d'accueil organisateur (`/`)

**Acces** : authentifie uniquement

**Elements** :
- **Titre** : "Mes Ateliers"
- **Sous-titre** : "Creez des equipes equilibrees pour vos ateliers de formation"
- **Formulaire de creation** (inline, sur une ligne) :
  - Champ texte : "Nom de l'atelier" (placeholder, defaut vide → "Formation d'equipes")
  - Champ nombre : nombre d'equipes (defaut 9, min 2, max 20)
  - Champ texte : "Services (virgule)" avec valeur par defaut pre-remplie
  - Bouton "Creer un atelier"
- **Liste des ateliers existants** (tries par date de creation desc.) :
  - Pour chaque atelier : titre, badge de statut (Ouvert/Equipes formees/Ferme), nombre de participants, nombre d'equipes, date
  - Bouton "Ouvrir" → page admin de la session
  - Bouton "Supprimer" → confirmation modale puis DELETE API

**Regles d'acces** :
- Un admin voit TOUTES les sessions
- Un utilisateur normal voit uniquement SES sessions (filtre `organizer_id`)

---

### 5.2 Page d'administration d'un atelier (`/session/{id}`)

**Acces** : authentifie, organisateur de la session OU admin

**Layout** : plein ecran (100vh), header masque, interface dashboard

#### 5.2.1 Barre d'outils (header custom)

Barre horizontale en haut contenant :

**Gauche** :
- Icone maison (lien retour accueil)
- Lien "Ateliers" (retour liste)
- Separateur "|"
- Titre de la session (h1, editable dans les data, pas inline)
- Badge de statut (Ouvert/Equipes formees/Ferme)
- Compteur de participants en inline ("X participants")

**Droite** :
- **Toggles de vue** : boutons "QR" et "Equipes" (activer/desactiver les panneaux)
- **Champ nombre** : "Nb:" + input number pour changer le nombre d'equipes
- **Bouton "Rebalancer"** : relance l'algorithme de formation d'equipes
- **Bouton "Reset"** : reinitialise toutes les equipes (confirmation requise)

#### 5.2.2 Layout split (grille 1fr 2fr)

**Panneau gauche — QR Code** :
- QR code genere dynamiquement (librairie qrcodejs) pointant vers l'URL de join
- URL du lien en dessous (cliquable pour copier dans le presse-papier, retour visuel "Copie !")
- **Grand compteur** : nombre de participants en gros (Space Grotesk 3.5rem, couleur accent)
- **Liste des participants** : sous le QR, affichage en "pills" (pastilles) avec nom + service. Animation d'entree pour les nouveaux (slide-in).

**Panneau droit — Equipes** :
- **Grille de cartes** : 3 colonnes, chaque equipe est une carte
- Chaque carte d'equipe contient :
  - **Header** : nom de l'equipe (couleur de l'equipe) + color picker
  - **Tag** : input texte avec placeholder "Tag..." (debounced, sauvegarde auto apres 500ms)
  - **Liste des membres** : nom + badges d'expertise + service
  - Les equipes vides sont affichees en bordure pointillee
  - Animation d'apparition des nouvelles cartes (scale 0.95 → 1)
  - **Highlight des nouveaux membres** : fond legerement colore + animation translateX

#### 5.2.3 Toggles de vue
- **QR + Equipes** (defaut) : grille 1fr 2fr
- **QR seul** : grille 1fr
- **Equipes seul** : grille 1fr
- Si les deux sont desactives → force l'affichage des equipes

#### 5.2.4 Badges d'expertise
Un participant est considere "expert" si `score_copilot >= 3` OU `score_mia >= 3`.
- Badge "CP" (bleu) pour les experts Copilot
- Badge "Mia" (rose) pour les experts Mia
- Un membre peut avoir les deux badges

---

### 5.3 Formulaire de participation (`/join/{token}`)

**Acces** : anonyme, via lien de partage (QR code)

**Comportement** :
- Si le participant a deja un cookie valide pour cette session → redirection vers `/waiting/{token}`
- Si la session est fermee (`status != "open"`) → message d'erreur "Cette session est fermee"

**Formulaire** (4 questions) :

1. **Niveau Copilot Chat** (score 0-5)
   - Label : "Quel est votre niveau d'utilisation de **Copilot Chat** ?"
   - Aide : "0 = jamais utilise, 5 = je l'utilise tout le temps"
   - Widget : **6 boutons numeriques** (0 a 5), tous les boutons <= valeur selectionnee sont surlignés (couleur accent)
   - Valeur par defaut : 0

2. **Niveau Mia** (score 0-5)
   - Label : "Quel est votre niveau d'utilisation de **Mia** ?"
   - Meme widget que Copilot

3. **Service** (select)
   - Label : "Quel est votre service ?"
   - Dropdown popule dynamiquement avec les services de la session
   - Requis

4. **Nom** (texte)
   - Label : "Votre prenom, nom ou pseudo"
   - Placeholder : "Ex: Marie D."
   - Requis, autofocus

**Bouton de soumission** : "Valider"

**Apres soumission** :
- Creation du participant en BDD
- Generation d'un token de session (cookie httpOnly, samesite=lax, 24h)
- Broadcast WebSocket aux admins (nouveau participant + compteur)
- **Auto-assignation** : l'algorithme de formation d'equipes est relance immediatement
- Redirection vers la page d'attente

---

### 5.4 Page de modification (`/edit/{token}`)

**Acces** : anonyme, via cookie de session

Meme formulaire que la page de join, mais :
- Les champs sont pre-remplis avec les valeurs actuelles du participant
- Le titre est "Modifier mes reponses"
- Bouton "Enregistrer" au lieu de "Valider"
- Bouton "Annuler" (lien vers la page d'attente)
- Apres sauvegarde : l'algorithme est relance pour redistribuer si necessaire

---

### 5.5 Page d'attente participant (`/waiting/{token}`)

**Acces** : anonyme, via cookie de session

**Design** : page centree, mobile-first

**Etat 1 — En attente** :
- Spinner CSS anime (rotation infinie)
- "Merci {prenom} !"
- "Votre reponse a ete enregistree."
- "Les equipes seront bientot formees..."
- Bouton "Modifier mes reponses" → lien vers `/edit/{token}`

**Etat 2 — Equipe assignee** (s'affiche automatiquement via WebSocket) :
- **Badge d'equipe** : grand rectangle arrondi avec la couleur de l'equipe et son nom (ex: "Equipe 3")
- **Tag** : si l'equipe a un tag, l'afficher en dessous du badge
- **Liste des membres** : cartes empilees avec les noms, le participant actuel est mis en evidence (fond inverse, gras)
- Bouton "Modifier mes reponses"

**Comportement temps reel** :
- Connexion WebSocket a l'ouverture
- Au chargement, fait aussi un appel API pour verifier si une equipe est deja assignee
- Ecoute les messages :
  - `teams_updated` / `teams_generated` → affiche l'equipe du participant
  - `teams_reset` → revient a l'etat d'attente
  - `team_tag_changed` → met a jour le tag si c'est l'equipe du participant
  - `team_color_changed` → met a jour la couleur du badge

---

## 6. Algorithme de formation d'equipes

### 6.1 Parametres
- `participants` : liste des participants inscrits
- `num_teams` : nombre d'equipes souhaite
- `services` : liste des services (pour la diversite)
- `TARGET_SIZE` = 5 (taille cible par equipe)
- `MAX_SAME_SERVICE` = 2 (max de personnes du meme service par equipe)

### 6.2 Definition d'un "expert"
Un participant est expert si `score_copilot >= 3` **OU** `score_mia >= 3`.

### 6.3 Phases de l'algorithme

**Preparation** :
- Si le nombre de participants < num_teams, reduire num_teams au nombre de participants
- Separer les participants en 2 listes : experts et non-experts
- Chaque liste est "entrelacee par service" : on alterne les services pour maximiser la diversite

**Phase 1 — Placer 1 expert par equipe** :
- Prendre les N premiers experts (N = min(num_teams, nombre d'experts))
- Les placer sequentiellement dans les equipes 0 a N-1
- Garantit qu'au moins 1 expert par equipe si possible

**Phase 2 — Distribuer les experts restants** :
- Pour chaque expert restant, choisir l'equipe ayant le **moins d'experts**
- Respecter la contrainte MAX_SAME_SERVICE
- En cas d'egalite : preferer la diversite de service, puis l'index le plus bas

**Phase 3 — Remplir avec les non-experts** :
- Pour chaque non-expert (entrelace par service), trouver la meilleure equipe :
  - **Calcul du cap** : `max(TARGET_SIZE, min_size + 1)` — on ne depasse pas la taille cible tant que toutes les equipes n'ont pas atteint ce seuil
  - **Contrainte dure** : max 2 personnes du meme service par equipe
  - **Score de placement** :
    - `taille_equipe * 1000` (remplir les equipes les plus pleines en priorite → remplissage sequentiel)
    - `-index` (tiebreak : preferer les equipes de plus petit index)
    - `+10` si le service du participant n'est pas encore dans l'equipe (bonus diversite)
  - **Fallback** : si aucune equipe ne respecte la contrainte de service, choisir celle avec le moins de personnes du meme service

### 6.4 Comportement du rebalancement
- A chaque inscription d'un nouveau participant, l'algorithme est relance sur l'ensemble des participants
- L'admin peut aussi forcer un rebalancement via le bouton "Rebalancer"
- Les equipes existantes en BDD sont preservees (couleurs, tags, noms)
- Les assignations (team_id) sont toutes remises a NULL avant redistribution
- Le resultat est broadcast en temps reel a tous les clients connectes

---

## 7. Communication temps reel

### 7.1 Architecture actuelle (WebSocket)

Dans l'implementation existante, un WebSocket est utilise pour la communication temps reel :
- Endpoint : `/ws/{session_id}?token={identity_token}`
- Les admins se connectent avec un token `admin_{timestamp}`
- Les participants se connectent avec un token `participant_{participant_id}`
- Ping/pong toutes les 30 secondes pour maintenir la connexion
- Reconnexion automatique apres 2 secondes en cas de deconnexion

### 7.2 Adaptation pour GitHub Pages + Dataverse

Puisque GitHub Pages est un hebergement statique (pas de serveur), le WebSocket n'est pas possible nativement. **Alternatives recommandees** :

1. **Polling Dataverse** (plus simple) :
   - Le client interroge l'API Dataverse toutes les 3-5 secondes
   - Compare les donnees avec l'etat local et met a jour si changement
   - Avantage : zero infrastructure supplementaire
   - Inconvenient : latence de 3-5 secondes, charge API

2. **Azure SignalR Service** (temps reel natif) :
   - Service Azure gratuit (20 connexions simultanees en tier gratuit)
   - Compatible avec une architecture serverless
   - Necessite une Azure Function comme backend

### 7.3 Messages echanges

| Type de message | Direction | Payload |
|----------------|-----------|---------|
| `participant_joined` | Serveur → Admin | `{ participant: {...}, count: N }` |
| `teams_updated` | Serveur → Tous | `{ teams: [{id, name, color, tag, order, members: [...]}] }` |
| `teams_reset` | Serveur → Tous | `{}` |
| `team_color_changed` | Serveur → Tous | `{ team_id, color }` |
| `team_tag_changed` | Serveur → Tous | `{ team_id, tag }` |
| `ping` / `pong` | Bidirectionnel | `{}` |

---

## 8. API REST

### 8.1 Endpoints admin (authentification requise)

| Methode | URL | Description |
|---------|-----|-------------|
| `GET` | `/api/sessions/{id}/participants` | Liste des participants de la session |
| `GET` | `/api/sessions/{id}/teams` | Liste des equipes avec leurs membres |
| `POST` | `/api/sessions/{id}/generate` | Rebalancer les equipes (body: `{num_teams}`) |
| `POST` | `/api/sessions/{id}/reset` | Reinitialiser toutes les equipes |
| `PUT` | `/api/sessions/{id}` | Modifier la session (title, num_teams, services) |
| `DELETE` | `/api/sessions/{id}` | Supprimer la session et toutes ses donnees |
| `PUT` | `/api/teams/{id}/color` | Modifier la couleur d'une equipe (body: `{color}`) |
| `PUT` | `/api/teams/{id}/tag` | Modifier le tag d'une equipe (body: `{tag}`) |

### 8.2 Endpoints participant (anonyme, identifie par cookie)

| Methode | URL | Description |
|---------|-----|-------------|
| `GET` | `/api/participant/team?session_id={id}` | Retourne l'equipe du participant courant |

### 8.3 Format de reponse des equipes

```json
{
  "teams": [
    {
      "id": 1,
      "name": "Equipe 1",
      "color": "#3b82f6",
      "tag": "Salle A",
      "order": 0,
      "members": [
        {
          "id": 10,
          "name": "Marie D.",
          "service": "Transformation",
          "score_copilot": 4,
          "score_mia": 1
        }
      ]
    }
  ]
}
```

---

## 9. Design et UX

### 9.1 Identite visuelle

| Element | Valeur |
|---------|--------|
| Couleur accent | `#E2250C` (clair) / `#FF6B5A` (sombre) |
| Fond | `#F5F5F2` (clair) / `#1a1a1a` (sombre) |
| Surface (cartes) | `#ffffff` (clair) / `#2a2a2a` (sombre) |
| Texte | `#1a1a1a` (clair) / `#f0f0f0` (sombre) |
| Texte muted | `#6b7280` (clair) / `#9ca3af` (sombre) |
| Border | `#e5e7eb` (clair) / `#3a3a3a` (sombre) |
| Font body | Inter |
| Font titres | Space Grotesk |
| Border radius | 0.75rem (cartes), 0.5rem (inputs/boutons) |

### 9.2 Theme sombre
L'application doit supporter un theme clair et un theme sombre. Le theme est determine par un attribut `data-theme="sombre"` sur la balise `<html>`.

### 9.3 Animations
- **Participant pill** : slide-in depuis le bas (0.3s ease-out)
- **Carte d'equipe** : scale 0.95 → 1, opacity 0 → 1 (0.4s ease-out)
- **Nouveau membre** : translateX -0.5rem → 0, fond surligne (0.5s ease-out)
- **Compteur** : scale 1.15 puis retour (0.2s) a chaque nouveau participant
- **Spinner d'attente** : rotation infinie (1s linear)

### 9.4 Responsive
- **Breakpoint** : 768px
- En mobile : la grille d'equipes passe a 1 colonne, le layout split passe en colonne unique
- La page de join et la page d'attente sont mobile-first (max-width 28rem centree)

---

## 10. Generation du QR Code

- **Librairie** : qrcodejs (CDN)
- **Contenu** : URL complete du lien de join (`{origin}/equipes/join/{share_token}`)
- **Options** : couleur sombre `#1a1a1a`, fond blanc `#ffffff`, correction d'erreur niveau M
- **Taille** : responsive, `min(largeur_conteneur - 32px, 400px)`
- **L'URL sous le QR est masquee** (`display: none`) mais le texte est present pour la fonction copier

---

## 11. Gestion des cookies participants

- **Nom du cookie** : `eq_participant_{session_id}`
- **Valeur** : token unique (`secrets.token_urlsafe(32)`)
- **Options** : `httpOnly=true`, `samesite=lax`, `max_age=86400` (24h)
- **Usage** : identifier le participant sans authentification pour la page d'attente, l'edition, et l'API participant

**Note pour Dataverse** : sur la nouvelle plateforme, ce mecanisme devra etre adapte. Options possibles :
- `localStorage` avec un token unique (moins securise mais compatible SPA)
- Parametres dans l'URL (token dans le hash)

---

## 12. Parcours utilisateur

### 12.1 Parcours organisateur
1. Se connecte via M365
2. Arrive sur la page d'accueil → voit ses ateliers
3. Cree un nouvel atelier (titre, nb equipes, services)
4. Est redirige vers la page admin de l'atelier
5. Projette le QR code sur un ecran
6. Voit les participants arriver en temps reel (pills + compteur)
7. Voit les equipes se former automatiquement en temps reel
8. Peut ajuster : changer le nombre d'equipes, rebalancer, changer les couleurs, ajouter des tags
9. Peut reset et recommencer

### 12.2 Parcours participant
1. Scanne le QR code avec son telephone
2. Arrive sur la page de join (mobile-friendly)
3. Repond aux 4 questions (Copilot, Mia, service, nom)
4. Valide → redirige vers la page d'attente
5. Voit un spinner "Les equipes seront bientot formees..."
6. Automatiquement, son equipe apparait avec sa couleur, ses membres et eventuellement un tag
7. Peut modifier ses reponses a tout moment

---

## 13. Regles metier importantes

1. **Auto-assignation** : chaque fois qu'un participant rejoint ou modifie ses reponses, l'algorithme est relance sur TOUS les participants
2. **Preservation des equipes** : lors d'un rebalancement, les equipes en BDD sont preservees (couleurs, tags, noms), seules les assignations de membres changent
3. **Pre-creation des slots** : lorsque l'admin ouvre la page admin, les N equipes sont pre-creees en BDD (meme sans membres) pour que les couleurs et tags soient editables avant l'arrivee des participants
4. **Session fermee** : quand `status != "open"`, les nouveaux participants ne peuvent plus rejoindre
5. **Scores clampes** : `score_copilot` et `score_mia` sont bornes entre 0 et 5 cote serveur
6. **Un seul expert minimum par equipe** : l'algorithme garantit au moins 1 expert par equipe si le nombre d'experts >= nombre d'equipes
7. **Diversite des services** : max 2 personnes du meme service par equipe (contrainte dure avec fallback)

---

## 14. Considerations pour la migration Dataverse

### 14.1 Mapping des tables

| Table PostgreSQL | Table Dataverse suggeree |
|-----------------|--------------------------|
| `eq_sessions` | `planel_eqsession` |
| `eq_participants` | `planel_eqparticipant` |
| `eq_teams` | `planel_eqteam` |

### 14.2 Adaptations necessaires

- **Services** : le champ JSON sera stocke comme un champ texte multi-ligne (serialise en JSON) ou comme une table de choix Dataverse
- **Share token** : generer cote client avec `crypto.randomUUID()` ou equivalent
- **Temps reel** : remplacer WebSocket par du polling Dataverse (toutes les 3-5 secondes) ou Azure SignalR
- **Algorithme** : l'algorithme de formation d'equipes s'execute entierement cote client (React) — il recoit la liste des participants depuis Dataverse et calcule la repartition
- **Cookies** : remplacer par `localStorage` pour identifier le participant
- **QR Code** : utiliser une librairie React (ex: `qrcode.react`)

### 14.3 Permissions Dataverse
- Les organisateurs doivent pouvoir creer/modifier/supprimer les sessions, equipes et participants
- Les participants anonymes doivent pouvoir creer/modifier leur propre enregistrement — **attention** : Dataverse necessite generalement une authentification. Solution possible :
  - Utiliser un **Power Automate flow HTTP** comme proxy pour les operations anonymes
  - Ou utiliser un **portail Power Pages** pour l'acces anonyme
  - Ou faire tout cote client avec un compte de service (token embarque — securite a evaluer)

---

## 15. Arborescence des fichiers (implementation actuelle, pour reference)

```
app/equipes/
├── __init__.py
├── router.py            # 16 routes (pages + API + WebSocket)
├── models.py            # 3 modeles SQLAlchemy
├── services.py          # Algorithme de formation d'equipes
├── websocket.py         # Gestionnaire WebSocket (rooms par session)
├── static/
│   ├── css/
│   │   └── equipes.css  # ~894 lignes, theme clair + sombre
│   └── js/
│       ├── admin.js     # ~346 lignes, QR + teams + WS
│       ├── join.js      # ~25 lignes, star rating widget
│       └── waiting.js   # ~104 lignes, attente + reveal equipe
└── templates/
    ├── home.html        # Liste des ateliers
    ├── admin.html       # Dashboard admin (QR + equipes)
    ├── join.html        # Formulaire participant
    └── waiting.html     # Page d'attente/reveal
```
