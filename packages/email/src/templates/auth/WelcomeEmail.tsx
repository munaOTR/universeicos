import React from 'react'
import { Text, Section, Row, Column } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface WelcomeEmailProps {
  name: string
  dashboardUrl?: string
  referralCode?: string
  referralUrl?: string
}

export function WelcomeEmail({
  name = 'Student',
  dashboardUrl = 'https://universeicos.app/dashboard',
  referralCode,
  referralUrl,
}: WelcomeEmailProps) {
  const refLink = referralUrl ?? (referralCode ? `https://universeicos.app?ref=${referralCode}` : null)

  return (
    <UniverseLayout preview={`Welcome to Universe, ${name}! Your journey starts now.`} unsubscribeUrl={null}>
      {/* Hero */}
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          Welcome to Universe 🚀
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, we're thrilled to have you on board.
        </Text>
      </Section>

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 24px' }}>
        Universe is the operating system for Nigerian university students. Your account is set up and ready to go — explore your dashboard, track your referrals, and stay ahead of the waitlist.
      </Text>

      <EmailButton href={dashboardUrl} variant="primary" fullWidth>
        Go to My Dashboard →
      </EmailButton>

      {/* Referral section */}
      {refLink && (
        <Section
          style={{
            backgroundColor: BRAND.bgSubtle,
            border:          `1px solid ${BRAND.borderColor}`,
            borderRadius:    '12px',
            padding:         '20px 24px',
            marginTop:       '28px',
          }}
        >
          <Text style={{ fontSize: '15px', fontWeight: '700', color: BRAND.textDark, margin: '0 0 6px' }}>
            🎯 Climb the waitlist faster
          </Text>
          <Text style={{ fontSize: '14px', color: BRAND.textMid, margin: '0 0 14px', lineHeight: '1.6' }}>
            Share your referral link. Every person who signs up using it earns you 100 points and moves you up the leaderboard. Top referrers get early beta access.
          </Text>
          <Section
            style={{
              backgroundColor: '#ffffff',
              border:          `1px solid ${BRAND.borderColor}`,
              borderRadius:    '8px',
              padding:         '10px 14px',
            }}
          >
            <Text style={{ fontSize: '13px', color: BRAND.primary, fontWeight: '600', margin: '0', wordBreak: 'break-all' }}>
              {refLink}
            </Text>
          </Section>
        </Section>
      )}

      {/* What's next */}
      <Section style={{ marginTop: '28px' }}>
        <Text style={{ fontSize: '14px', fontWeight: '700', color: BRAND.textDark, margin: '0 0 12px' }}>
          What's next?
        </Text>
        {[
          ['🎓', 'Complete your profile', 'Add your faculty and department to connect with the right students.'],
          ['📋', 'Take a survey', 'Help shape the platform and earn bonus points.'],
          ['🏆', 'Check the leaderboard', 'See where you rank nationally and at your university.'],
        ].map(([emoji, title, body]) => (
          <Row key={title} style={{ marginBottom: '10px' }}>
            <Column style={{ width: '32px', verticalAlign: 'top' }}>
              <Text style={{ fontSize: '18px', margin: '0' }}>{emoji}</Text>
            </Column>
            <Column style={{ verticalAlign: 'top' }}>
              <Text style={{ fontSize: '14px', fontWeight: '600', color: BRAND.textDark, margin: '0 0 2px' }}>{title}</Text>
              <Text style={{ fontSize: '13px', color: BRAND.textMid, margin: '0' }}>{body}</Text>
            </Column>
          </Row>
        ))}
      </Section>
    </UniverseLayout>
  )
}
