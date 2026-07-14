import React from 'react'
import { Text, Section, Row, Column } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'

export interface WaitlistConfirmationEmailProps {
  name: string
  position?: number
  referralCode?: string
  referralUrl?: string
  dashboardUrl?: string
}

export function WaitlistConfirmationEmail({
  name = 'Student',
  position,
  referralCode,
  referralUrl,
  dashboardUrl = 'https://waitlist.universeicos.app/dashboard',
}: WaitlistConfirmationEmailProps) {
  const refLink = referralUrl ?? (referralCode ? `https://waitlist.universeicos.app?ref=${referralCode}` : null)

  return (
    <UniverseLayout preview={`You're on the Universe waitlist${position ? ` — #${position}` : ''}! Share your link to move up.`}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          You're on the waitlist! 🎯
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, welcome to Universe. Your spot has been reserved.
        </Text>
      </Section>

      {position && (
        <Section
          style={{
            background:   `linear-gradient(135deg, ${BRAND.primary}15, ${BRAND.accent}15)`,
            border:       `1px solid ${BRAND.primary}40`,
            borderRadius: '14px',
            padding:      '24px',
            marginBottom: '24px',
            textAlign:    'center',
          }}
        >
          <Text style={{ fontSize: '14px', color: BRAND.textMid, margin: '0 0 4px', fontWeight: '500' }}>
            Current waitlist position
          </Text>
          <Text style={{ fontSize: '48px', fontWeight: '800', color: BRAND.primary, margin: '0', lineHeight: '1' }}>
            #{position.toLocaleString()}
          </Text>
          <Text style={{ fontSize: '13px', color: BRAND.textLight, margin: '6px 0 0' }}>
            Refer friends to climb faster
          </Text>
        </Section>
      )}

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 20px' }}>
        Universe is being built for Nigerian university students — from marketplace to study tools, housing to student jobs. Early access is being granted to top waitlist members first.
      </Text>

      {refLink && (
        <>
          <Text style={{ fontSize: '15px', fontWeight: '700', color: BRAND.textDark, margin: '0 0 12px' }}>
            📤 Your referral link
          </Text>
          <Section
            style={{
              backgroundColor: BRAND.bgSubtle,
              border:          `1px solid ${BRAND.borderColor}`,
              borderRadius:    '10px',
              padding:         '14px 18px',
              marginBottom:    '20px',
            }}
          >
            <Text style={{ fontSize: '13px', color: BRAND.primary, fontWeight: '600', margin: '0', wordBreak: 'break-all' }}>
              {refLink}
            </Text>
          </Section>
        </>
      )}

      <EmailButton href={dashboardUrl} variant="primary" fullWidth>
        View My Dashboard →
      </EmailButton>

      {/* Perks of moving up */}
      <Section style={{ marginTop: '32px' }}>
        <Text style={{ fontSize: '14px', fontWeight: '700', color: BRAND.textDark, margin: '0 0 12px' }}>
          Benefits of moving up the list
        </Text>
        {[
          ['🚀', 'Early Beta Access', 'Be among the first to use Universe before the public launch.'],
          ['🏆', 'Exclusive Rewards', 'Top referrers receive unique badges and rewards.'],
          ['📱', 'Feature Input', 'Help shape the features built for Nigerian students.'],
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
