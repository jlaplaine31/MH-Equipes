import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './msalConfig'

/**
 * Singleton MSAL PublicClientApplication instance.
 *
 * Import this wherever you need to interact with MSAL
 * (acquire tokens, check accounts, etc.).
 */
export const msalInstance = new PublicClientApplication(msalConfig)
