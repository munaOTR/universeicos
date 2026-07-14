/**
 * UniverseLayout — The branded base email layout.
 *
 * Every email template should wrap its content with this layout.
 * Brand colors, typography, header, and footer are consistent across all emails.
 */

import React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Preview,
  Font,
} from '@react-email/components'
import { EmailHeader } from './EmailHeader.tsx'
import { EmailFooter } from './EmailFooter.tsx'

// ── Brand tokens (kept in-file for email rendering isolation) ─────────────────
export const BRAND = {
  primary:       '#00D084',
  primaryDark:   '#00A86B',
  secondary:     '#050810',
  accent:        '#6366F1',
  textDark:      '#0f172a',
  textMid:       '#475569',
  textLight:     '#94a3b8',
  bgPage:        '#f1f5f9',
  bgCard:        '#ffffff',
  bgSubtle:      '#f8fafc',
  borderColor:   '#e2e8f0',
  success:       '#16a34a',
  warning:       '#d97706',
  error:         '#dc2626',
  fontFamily:    "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
}

export interface UniverseLayoutProps {
  preview: string
  children: React.ReactNode
  /** Override footer unsubscribe URL (pass null to hide unsubscribe for auth emails) */
  unsubscribeUrl?: string | null
  /** Shown in footer — useful for campaigns */
  campaignTitle?: string
}

export function UniverseLayout({
  preview,
  children,
  unsubscribeUrl = 'https://universeicos.app/unsubscribe',
  campaignTitle,
}: UniverseLayoutProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: BRAND.bgPage,
          fontFamily:       BRAND.fontFamily,
          margin:           '0',
          padding:          '0',
          WebkitTextSizeAdjust: '100%',
        }}
      >
        <Container
          style={{
            maxWidth:  '600px',
            margin:    '0 auto',
            padding:   '32px 16px',
          }}
        >
          {/* Brand Header */}
          <EmailHeader />

          {/* Email Body Card */}
          <Section
            style={{
              backgroundColor: BRAND.bgCard,
              borderRadius:    '16px',
              border:          `1px solid ${BRAND.borderColor}`,
              overflow:        'hidden',
              padding:         '40px 40px 32px',
              marginBottom:    '16px',
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <EmailFooter
            unsubscribeUrl={unsubscribeUrl ?? undefined}
            campaignTitle={campaignTitle}
          />
        </Container>
      </Body>
    </Html>
  )
}
