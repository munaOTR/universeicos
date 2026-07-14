import React from 'react'
import { Text, Section, Row, Column } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'

export interface LaunchAnnouncementEmailProps {
  recipientName?: string
  launchUrl?: string
  launchDate?: string
}

export function LaunchAnnouncementEmail({
  recipientName,
  launchUrl = 'https://universeicos.app',
  launchDate,
}: LaunchAnnouncementEmailProps) {
  return (
    <UniverseLayout preview="Universe is live! The OS for Nigerian university students is here. 🚀">
      {/* Hero */}
      <Section
        style={{
          background:   `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
          borderRadius: '14px',
          padding:      '40px 32px',
          marginBottom: '32px',
          textAlign:    'center',
        }}
      >
        <Text style={{ fontSize: '48px', margin: '0 0 16px', lineHeight: '1' }}>🚀</Text>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', margin: '0 0 8px', lineHeight: '1.2' }}>
          Universe is live!
        </Text>
        <Text style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', margin: '0' }}>
          The operating system for Nigerian university students.
        </Text>
        {launchDate && (
          <Text style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '10px 0 0' }}>
            Launched on {new Date(launchDate).toLocaleDateString('en-NG', { dateStyle: 'long' })}
          </Text>
        )}
      </Section>

      {recipientName && (
        <Text style={{ fontSize: '15px', color: BRAND.textMid, margin: '0 0 16px' }}>
          Hi {recipientName},
        </Text>
      )}

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.75', margin: '0 0 20px' }}>
        After months of building, iterating, and listening to you, Universe is finally live. Thank you for being part of this journey — your feedback, referrals, and support made this possible.
      </Text>

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.75', margin: '0 0 28px' }}>
        Universe is your digital home as a Nigerian university student — marketplace, study tools, housing, jobs, events, and your AI assistant. It's all here.
      </Text>

      <EmailButton href={launchUrl} variant="primary" fullWidth>
        Explore Universe Now →
      </EmailButton>

      {/* Module showcase */}
      <Section style={{ marginTop: '32px' }}>
        <Text style={{ fontSize: '14px', fontWeight: '700', color: BRAND.textDark, margin: '0 0 14px' }}>
          What's available at launch
        </Text>
        {[
          ['🛒', 'Marketplace', 'Buy, sell, and rent anything between students.'],
          ['📚', 'Study Hub', 'Course notes, past questions, and study groups.'],
          ['🏠', 'Housing', 'Find verified student accommodation.'],
          ['💼', 'Student Jobs', 'Part-time gigs and internships near your campus.'],
        ].map(([emoji, title, desc]) => (
          <Row key={title} style={{ marginBottom: '10px' }}>
            <Column style={{ width: '28px', verticalAlign: 'top' }}>
              <Text style={{ fontSize: '16px', margin: '0' }}>{emoji}</Text>
            </Column>
            <Column style={{ verticalAlign: 'top' }}>
              <Text style={{ fontSize: '14px', fontWeight: '600', color: BRAND.textDark, margin: '0 0 2px' }}>{title}</Text>
              <Text style={{ fontSize: '13px', color: BRAND.textMid, margin: '0' }}>{desc}</Text>
            </Column>
          </Row>
        ))}
      </Section>
    </UniverseLayout>
  )
}
