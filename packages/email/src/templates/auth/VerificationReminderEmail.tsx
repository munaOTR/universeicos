import React from 'react'
import { Text, Section, Row, Column } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface VerificationReminderEmailProps {
  name: string
  verifyUrl: string
  reminderNumber?: number
  expiresInHours?: number
}

const benefits = [
  { icon: '🔐', text: 'Access your personalised Universe dashboard' },
  { icon: '🎓', text: 'Connect with students at your university' },
  { icon: '🏆', text: 'Earn referral points and climb the leaderboard' },
]

export function VerificationReminderEmail({
  name = 'Student',
  verifyUrl = 'https://universeicos.app/auth/callback',
  reminderNumber = 1,
  expiresInHours = 24,
}: VerificationReminderEmailProps) {
  return (
    <UniverseLayout
      preview={`Hi ${name}, your Universe account is waiting — just verify your email to get started.`}
      unsubscribeUrl={null}
    >
      {/* Heading */}
      <Section style={{ marginBottom: '28px' }}>
        <Text
          style={{
            fontSize: '28px',
            fontWeight: '800',
            color: BRAND.textDark,
            margin: '0 0 8px',
            lineHeight: '1.2',
          }}
        >
          Your account is waiting 👋
        </Text>
        <Text
          style={{
            fontSize: '16px',
            color: BRAND.textMid,
            margin: '0',
            lineHeight: '1.6',
          }}
        >
          Hi {name}, you&apos;re almost there — just one step left.
        </Text>
      </Section>

      {/* Body copy */}
      <Text
        style={{
          fontSize: '15px',
          color: BRAND.textMid,
          lineHeight: '1.7',
          margin: '0 0 24px',
        }}
      >
        You signed up for Universe{reminderNumber > 1 ? ' a while back' : ''} but haven&apos;t
        verified your email address yet. Verifying takes just one click and unlocks everything
        Universe has to offer.
      </Text>

      {/* Benefits list */}
      <Section
        style={{
          backgroundColor: BRAND.bgSubtle,
          borderRadius: '12px',
          border: `1px solid ${BRAND.borderColor}`,
          padding: '20px 24px',
          marginBottom: '28px',
        }}
      >
        <Text
          style={{
            fontSize: '13px',
            fontWeight: '700',
            color: BRAND.textDark,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 16px',
          }}
        >
          What you&apos;ll unlock
        </Text>
        {benefits.map((b, i) => (
          <Row key={i} style={{ marginBottom: '10px' }}>
            <Column style={{ width: '32px', verticalAlign: 'top' }}>
              <Text style={{ fontSize: '18px', margin: '0', lineHeight: '1.4' }}>{b.icon}</Text>
            </Column>
            <Column>
              <Text
                style={{
                  fontSize: '14px',
                  color: BRAND.textMid,
                  margin: '0',
                  lineHeight: '1.5',
                }}
              >
                {b.text}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>

      {/* CTA */}
      <EmailButton href={verifyUrl} variant="primary" fullWidth>
        Verify My Email Now →
      </EmailButton>

      {/* Expiry warning */}
      <EmailCallout variant="warning" title={`Link expires in ${expiresInHours} hours`}>
        For your security, this verification link will expire. If it expires, you can request a new
        one from the login page.
      </EmailCallout>

      {/* Footer note */}
      <Text
        style={{
          fontSize: '13px',
          color: BRAND.textLight,
          margin: '24px 0 0',
          lineHeight: '1.6',
        }}
      >
        If you didn&apos;t create a Universe account, you can safely ignore this email. You
        won&apos;t receive any further reminders.
      </Text>
    </UniverseLayout>
  )
}
