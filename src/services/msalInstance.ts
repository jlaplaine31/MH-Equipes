import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './msalConfig'

/**
 * Singleton MSAL PublicClientApplication instance.
 *
 * Only initialized if a client ID is configured.
 * When using Power Automate as proxy, MSAL is not needed.
 */
const clientId = import.meta.env.VITE_MSAL_CLIENT_ID as string | undefined

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const msalInstance: PublicClientApplication = clientId
  ? new PublicClientApplication(msalConfig)
  : (null as any)
