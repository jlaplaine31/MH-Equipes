---
description: Patterns d'acces aux donnees Dataverse
globs: "src/services/**/*.ts"
---

# Patterns Dataverse

- Tout appel Dataverse passe par `src/services/dataverseClient.ts`
- Jamais de `fetch` direct vers Dataverse dans les composants ou hooks
- Les services (`sessionService.ts`, etc.) encapsulent les operations CRUD
- Les hooks appellent les services, les composants appellent les hooks
- Gerer les erreurs HTTP : 401 (reauth), 403 (permissions), 404 (not found), 429 (throttling)
- Les GUIDs Dataverse sont en minuscules sans accolades
- Prefixe des colonnes Dataverse : `planel_`
