import type { Configuration, RedirectRequest } from '@azure/msal-browser'

/**
 * MSAL configuration built from Vite environment variables.
 *
 * Required env vars (see .env.example):
 *   VITE_MSAL_CLIENT_ID
 *   VITE_MSAL_AUTHORITY
 *   VITE_MSAL_REDIRECT_URI
 *   VITE_DATAVERSE_URL
 */

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID as string | undefined
const authority = import.meta.env.VITE_MSAL_AUTHORITY as string | undefined
const redirectUri = import.meta.env.VITE_MSAL_REDIRECT_URI as string | undefined
const dataverseUrl = import.meta.env.VITE_DATAVERSE_URL as string | undefined

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId ?? '',
    authority: authority ?? 'https://login.microsoftonline.com/common',
    redirectUri: redirectUri ?? window.location.origin,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

/**
 * Scopes requested during login / token acquisition.
 * - User.Read: basic Microsoft Graph profile
 * - Dataverse scope: full access to the organisation's Dataverse API
 */
export const loginRequest: RedirectRequest = {
  scopes: [
    'User.Read',
    `${dataverseUrl ?? 'https://org.crm.dynamics.com'}/.default`,
  ],
}

/**
 * Scopes used specifically when calling the Dataverse Web API.
 */
export const dataverseScopes: string[] = [
  `${dataverseUrl ?? 'https://org.crm.dynamics.com'}/.default`,
]

export const dataverseBaseUrl: string = dataverseUrl ?? ''
