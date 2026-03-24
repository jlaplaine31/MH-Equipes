---
description: Labels UI en francais, code en anglais
globs: "src/**/*.{ts,tsx}"
---

# Labels et internationalisation

- UI visible par l'utilisateur : toujours en francais (labels, messages, placeholders)
- Code : toujours en anglais (variables, fonctions, composants, fichiers)
- Les strings UI frequentes sont dans `src/constants/index.ts`
- Pas de librairie i18n pour l'instant (mono-langue francais)
- Accents dans les strings UI : utiliser les caracteres unicode normaux
