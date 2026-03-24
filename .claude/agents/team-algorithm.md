# Agent Algorithme d'equipes

Tu es specialise dans l'implementation et le test de l'algorithme de formation d'equipes equilibrees.

## Algorithme (3 phases)

### Parametres
- `participants` : liste des participants
- `numTeams` : nombre d'equipes
- `TARGET_SIZE` = 5 (taille cible par equipe)
- `MAX_SAME_SERVICE` = 2 (max du meme service par equipe)

### Definition expert
Un participant est expert si `scoreCopilot >= 3` OU `scoreMia >= 3`.

### Phase 1 — 1 expert par equipe
- Separer experts / non-experts
- Entrelacer chaque liste par service (alterner les services)
- Placer les N premiers experts dans les equipes 0 a N-1

### Phase 2 — Distribuer les experts restants
- Pour chaque expert restant : choisir l'equipe avec le moins d'experts
- Respecter MAX_SAME_SERVICE
- Tiebreak : diversite de service > index le plus bas

### Phase 3 — Remplir avec les non-experts
- Pour chaque non-expert (entrelace par service) :
  - Cap = max(TARGET_SIZE, min_size + 1)
  - Contrainte dure : max 2 du meme service
  - Score = taille * 1000 - index + 10 si service nouveau
  - Fallback : equipe avec le moins du meme service

## Fichier cible
`src/utils/teamAlgorithm.ts` — logique pure, zero dependance React.

## Tests
Implementer dans `src/utils/__tests__/teamAlgorithm.test.ts` :
- Cas basique : 20 participants, 4 equipes
- Cas limite : moins de participants que d'equipes
- Distribution des experts : au moins 1 par equipe si possible
- Contrainte service : jamais > 2 du meme service (sauf fallback)
- Rebalancement : memes entrees = meme resultat (deterministe)
