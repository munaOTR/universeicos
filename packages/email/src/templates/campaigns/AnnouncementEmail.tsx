import React from 'react'
import { Text, Section } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'

export interface AnnouncementEmailProps {
  recipientName?: string
  title: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  campaignTitle?: string
}

export function AnnouncementEmail({
  recipientName,
  title = 'An update from Universe',
  body = '',
  ctaLabel,
  ctaUrl,
  campaignTitle = 'Universe Announcements',
}: AnnouncementEmailProps) {
  return (
    <UniverseLayout preview={title} campaignTitle={campaignTitle}>
      <Section style={{ marginBottom: '24px' }}>
        {recipientName && (
          <Text style={{ fontSize: '15px', color: BRAND.textMid, margin: '0 0 16px' }}>
            Hi {recipientName},
          </Text>
        )}
        <Text style={{ fontSize: '26px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 20px', lineHeight: '1.2' }}>
          {title}
        </Text>
        {/* Body rendered as paragraph — future versions support rich HTML blocks */}
        {body.split('\n\n').map((paragraph, i) => (
          <Text
            key={i}
            style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.75', margin: '0 0 16px' }}
          >
            {paragraph}
          </Text>
        ))}
      </Section>

      {ctaLabel && ctaUrl && (
        <EmailButton href={ctaUrl} variant="primary" fullWidth>
          {ctaLabel} →
        </EmailButton>
      )}

      <Text style={{ fontSize: '13px', color: BRAND.textLight, margin: '28px 0 0', lineHeight: '1.6' }}>
        — The Universe Team
      </Text>
    </UniverseLayout>
  )
}
