---
description: Conventions React et TypeScript pour le projet Equipes
globs: "src/**/*.{ts,tsx}"
---

# Conventions React

- Composants fonctionnels uniquement, jamais de class components
- Hooks custom prefixes `use` dans `src/hooks/`
- Props typees avec des interfaces TypeScript (pas de `any`)
- Un composant par fichier, nom du fichier = nom du composant (PascalCase)
- Pas de barrel exports (index.ts) sauf dans `src/types/` et `src/constants/`
- Utiliser `React.FC` uniquement si necessaire (preferer le typage direct des props)
- Event handlers prefixes `handle` (ex: `handleSubmit`, `handleClick`)
- Pas de logique metier dans les composants — extraire dans hooks ou utils
