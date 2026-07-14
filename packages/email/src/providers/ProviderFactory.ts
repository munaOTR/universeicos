/**
 * ProviderFactory — resolves the active CommunicationProvider from configuration.
 *
 * To swap providers: set COMMS_PROVIDER=postmark (and POSTMARK_API_KEY).
 * No other files need to change.
 *
 * Supported values for COMMS_PROVIDER:
 *   - 'resend'    (default)
 *   - 'postmark'  (future)
 *   - 'ses'       (future)
 *   - 'sendgrid'  (future)
 */

import type { CommunicationProvider } from './types'
import { ResendProvider } from './ResendProvider'

export type ProviderName = 'resend' | 'postmark' | 'ses' | 'sendgrid' | 'mailgun' | 'brevo'

let _instance: CommunicationProvider | null = null

interface ProviderConfig {
  provider?: ProviderName
  resendApiKey?: string
  from?: string
}

export function createProvider(config: ProviderConfig = {}): CommunicationProvider {
  const name = (config.provider ?? 'resend') as ProviderName

  switch (name) {
    case 'resend': {
      const key = config.resendApiKey
      if (!key) throw new Error('ProviderFactory: RESEND_API_KEY is required for Resend provider')
      return new ResendProvider(key, config.from)
    }

    // Future providers — add implementations here without changing any other code
    case 'postmark':
      throw new Error('ProviderFactory: PostmarkProvider is not yet implemented')
    case 'ses':
      throw new Error('ProviderFactory: SESProvider is not yet implemented')
    case 'sendgrid':
      throw new Error('ProviderFactory: SendGridProvider is not yet implemented')
    default:
      throw new Error(`ProviderFactory: Unknown provider "${name}"`)
  }
}

/**
 * Singleton factory for use in Node/browser environments.
 * Reads from VITE_ env vars (browser) or process.env (server).
 */
export function getProvider(): CommunicationProvider {
  if (_instance) return _instance

  // Support both Vite (browser) and Node/Deno (edge functions)
  const env = (typeof process !== 'undefined' && process.env) ||
              ((typeof import.meta !== 'undefined') ? (import.meta as { env?: Record<string, string> }).env : {}) ||
              {}

  _instance = createProvider({
    provider:     (env['COMMS_PROVIDER'] ?? 'resend') as ProviderName,
    resendApiKey: env['RESEND_API_KEY'] ?? env['VITE_RESEND_API_KEY'],
    from:         env['COMMS_FROM_EMAIL'] ?? 'Universe <hello@rutherkingconsult.co.uk>',
  })

  return _instance
}

/** Reset singleton (useful in tests) */
export function resetProvider(): void {
  _instance = null
}
