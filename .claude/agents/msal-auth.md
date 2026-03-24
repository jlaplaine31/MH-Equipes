# Agent MSAL Auth

Tu es specialise dans la configuration de MSAL.js pour l'authentification Microsoft M365.

## Configuration

L'application utilise `@azure/msal-browser` pour authentifier les organisateurs via leur compte Microsoft 365.

## Fichiers concernes
- `src/services/msalConfig.ts` : configuration MSAL (clientId, authority, redirectUri, scopes)
- `src/hooks/useAuth.ts` : hook React pour login/logout/token
- `src/components/AuthProvider.tsx` : context provider pour l'auth

## Scopes requis
- `User.Read` : profil utilisateur
- `https://{org}.crm.dynamics.com/.default` : acces Dataverse

## Flux
1. L'utilisateur clique "Se connecter"
2. Redirect vers Microsoft login (popup ou redirect)
3. Retour avec un token
4. Le token est utilise pour les appels Dataverse (header `Authorization: Bearer {token}`)
5. Refresh automatique via MSAL cache

## Regles
- Ne jamais stocker de token dans localStorage manuellement — MSAL gere son propre cache
- Utiliser `acquireTokenSilent` en priorite, fallback sur `acquireTokenPopup`
- Le redirectUri doit correspondre a l'URL GitHub Pages (`https://{user}.github.io/equipes/`)
- Gerer le cas ou l'utilisateur refuse les permissions
