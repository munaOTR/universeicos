import React from 'react'
import { Text, Section, Row, Column } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'

export interface ReferralSuccessEmailProps {
  name: string
  referredName?: string
  pointsEarned: number
  totalPoints: number
  newPosition?: number
  leaderboardUrl?: string
}

export function ReferralSuccessEmail({
  name = 'Student',
  referredName,
  pointsEarned = 100,
  totalPoints = 100,
  newPosition,
  leaderboardUrl = 'https://waitlist.universeicos.app/dashboard/leaderboard',
}: ReferralSuccessEmailProps) {
  return (
    <UniverseLayout preview={`You earned ${pointsEarned} points from a new referral! 🎉`}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          New referral! 🎉
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, someone just joined using your link.
          {referredName && <> Welcome, {referredName}!</>}
        </Text>
      </Section>

      {/* Points earned card */}
      <Section
        style={{
          background:   `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})`,
          borderRadius: '14px',
          padding:      '24px',
          marginBottom: '24px',
          textAlign:    'center',
        }}
      >
        <Text style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 4px', fontWeight: '500' }}>
          Points earned
        </Text>
        <Text style={{ fontSize: '48px', fontWeight: '800', color: '#ffffff', margin: '0', lineHeight: '1' }}>
          +{pointsEarned}
        </Text>
        <Text style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '6px 0 0' }}>
          Total: {totalPoints.toLocaleString()} points{newPosition ? ` · Position #${newPosition.toLocaleString()}` : ''}
        </Text>
      </Section>

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 24px' }}>
        Keep sharing your referral link to climb the leaderboard. Top referrers get early beta access and exclusive rewards.
      </Text>

      <Row>
        <Column style={{ paddingRight: '8px' }}>
          <EmailButton href={leaderboardUrl} variant="primary" fullWidth>
            View Leaderboard →
          </EmailButton>
        </Column>
      </Row>
    </UniverseLayout>
  )
}
