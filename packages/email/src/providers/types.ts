/**
 * @universe/email — Provider Abstraction Types
 *
 * The application NEVER references Resend directly outside of ResendProvider.
 * To swap providers, only the provider implementation and COMMS_PROVIDER env var change.
 */

// ── Email Payload ──────────────────────────────────────────────────────────────

export interface EmailAttachment {
  filename: string
  content: string    // base64 encoded
  contentType: string
}

export interface EmailPayload {
  to: string | string[]
  from: string
  replyTo?: string
  subject: string
  html: string
  text?: string               // plain text fallback
  headers?: Record<string, string>
  attachments?: EmailAttachment[]
  tags?: Record<string, string>  // provider-specific metadata tags
}

// ── Provider Response ─────────────────────────────────────────────────────────

export interface ProviderResponse {
  success: boolean
  messageId?: string          // provider-assigned message ID for tracking
  raw?: unknown               // raw provider response for logging
  error?: ProviderError
}

export interface ProviderError {
  code: string
  message: string
  retryable: boolean          // whether the error warrants a retry attempt
  statusCode?: number
}

// ── Health Status ─────────────────────────────────────────────────────────────

export interface ProviderHealthStatus {
  provider: string
  available: boolean
  latencyMs?: number
  errorRate?: number          // fraction 0–1 from recent sends
  message?: string
  checkedAt: string           // ISO timestamp
}

// ── Core Interface ────────────────────────────────────────────────────────────

export interface CommunicationProvider {
  /** Unique identifier for this provider (e.g. 'resend', 'postmark') */
  readonly name: string

  /**
   * Send a single email.
   * Implementations must map ProviderError.retryable correctly so the queue
   * worker knows whether to retry on failure.
   */
  sendEmail(payload: EmailPayload): Promise<ProviderResponse>

  /**
   * Send multiple emails in batch.
   * Falls back to sequential sends if the provider has no native batch API.
   */
  sendBatch?(payloads: EmailPayload[]): Promise<ProviderResponse[]>

  /**
   * Probe the provider for availability and latency.
   * Used by the Admin Dashboard health monitor.
   */
  checkHealth(): Promise<ProviderHealthStatus>
}

// ── Priority Levels ───────────────────────────────────────────────────────────

export type EmailPriority = 'critical' | 'high' | 'medium' | 'low' | 'bulk'

export const PRIORITY_ORDER: Record<EmailPriority, number> = {
  critical: 5,
  high:     4,
  medium:   3,
  low:      2,
  bulk:     1,
}

/** Maximum retry attempts per priority level */
export const MAX_RETRY_ATTEMPTS: Record<EmailPriority, number> = {
  critical: 7,
  high:     5,
  medium:   3,
  low:      2,
  bulk:     1,
}

/**
 * Exponential backoff delay in seconds for retry attempt N.
 * delay = base * 2^(attempt - 1), capped at maxDelay.
 */
export function calculateBackoffSeconds(attempt: number, baseSeconds = 30, maxSeconds = 3600): number {
  const delay = baseSeconds * Math.pow(2, attempt - 1)
  return Math.min(delay, maxSeconds)
}
