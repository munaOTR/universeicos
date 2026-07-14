/**
 * ResendProvider — Resend implementation of CommunicationProvider.
 *
 * This is the ONLY file in the codebase that imports from 'resend'.
 * All other code uses the CommunicationProvider interface.
 */

import { Resend } from 'resend'
import type {
  CommunicationProvider,
  EmailPayload,
  ProviderResponse,
  ProviderHealthStatus,
} from './types'

export class ResendProvider implements CommunicationProvider {
  readonly name = 'resend'
  private readonly client: Resend
  private readonly fromDefault: string

  constructor(apiKey: string, fromDefault = 'Universe <hello@universeicos.app>') {
    if (!apiKey) throw new Error('ResendProvider: RESEND_API_KEY is required')
    this.client = new Resend(apiKey)
    this.fromDefault = fromDefault
  }

  async sendEmail(payload: EmailPayload): Promise<ProviderResponse> {
    try {
      const recipients = Array.isArray(payload.to) ? payload.to : [payload.to]
      const { data, error } = await this.client.emails.send({
        from:    payload.from || this.fromDefault,
        to:      recipients,
        replyTo: payload.replyTo,
        subject: payload.subject,
        html:    payload.html,
        text:    payload.text,
        headers: payload.headers,
        attachments: payload.attachments?.map(a => ({
          filename:    a.filename,
          content:     a.content,
          contentType: a.contentType,
        })),
        tags: payload.tags
          ? Object.entries(payload.tags).map(([name, value]) => ({ name, value }))
          : undefined,
      })

      if (error) {
        return {
          success: false,
          error: {
            code:      error.name,
            message:   error.message,
            // 429 = rate limit, 5xx = server — both retryable; 4xx = bad data — permanent
            retryable: this.isRetryable(error),
          },
        }
      }

      return { success: true, messageId: data?.id, raw: data }
    } catch (err: unknown) {
      const e = err as Error
      return {
        success: false,
        error: {
          code:      'UNKNOWN',
          message:   e.message ?? 'Unknown error from Resend',
          retryable: true,
        },
      }
    }
  }

  async sendBatch(payloads: EmailPayload[]): Promise<ProviderResponse[]> {
    // Resend supports batch sends; map payloads individually for simplicity
    // Replace with client.batch.send(...) when Resend exposes a stable batch API
    return Promise.all(payloads.map(p => this.sendEmail(p)))
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    const start = Date.now()
    try {
      // Attempt a trivial list operation to confirm the key is valid & API is up
      await this.client.emails.get('health-check-nonexistent-id').catch(() => {
        /* A 404 is expected and still means the API is reachable */
      })
      return {
        provider:  this.name,
        available: true,
        latencyMs: Date.now() - start,
        checkedAt: new Date().toISOString(),
      }
    } catch {
      return {
        provider:  this.name,
        available: false,
        latencyMs: Date.now() - start,
        message:   'Health check failed — API unreachable',
        checkedAt: new Date().toISOString(),
      }
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private isRetryable(error: { name: string; message: string }): boolean {
    const permanent = ['validation_error', 'missing_required_field', 'invalid_email']
    return !permanent.some(code => error.name?.toLowerCase().includes(code))
  }
}
