---
description: Creer une nouvelle page React avec route
user_invocable: true
---

# Nouvelle page

Cree une nouvelle page pour l'application Equipes.

## Etapes

1. Demander le nom de la page et la route associee
2. Creer le composant dans `src/pages/{PageName}.tsx`
3. Ajouter la route dans `src/App.tsx`
4. Si la page necessite l'auth, l'envelopper dans le guard auth
5. Si la page est participant (anonyme), ne pas ajouter de guard

## Template

```tsx
export default function {PageName}() {
  return (
    <div>
      <h1>Titre</h1>
    </div>
  );
}
```
