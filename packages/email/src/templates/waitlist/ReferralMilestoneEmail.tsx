import React from 'react'
import { Text, Section } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface ReferralMilestoneEmailProps {
  name: string
  milestone: number
  totalPoints: number
  rank?: number
  reward?: string
  leaderboardUrl?: string
}

export function ReferralMilestoneEmail({
  name = 'Student',
  milestone = 10,
  totalPoints = 1000,
  rank,
  reward,
  leaderboardUrl = 'https://waitlist.universeicos.app/dashboard/leaderboard',
}: ReferralMilestoneEmailProps) {
  return (
    <UniverseLayout preview={`You've hit ${milestone} referrals! 🏆 Keep climbing!`}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          Milestone reached! 🏆
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, you've reached {milestone} referrals — that's incredible!
        </Text>
      </Section>

      {/* Milestone badge */}
      <Section
        style={{
          background:   `linear-gradient(135deg, #f59e0b, #ef4444)`,
          borderRadius: '14px',
          padding:      '28px',
          marginBottom: '24px',
          textAlign:    'center',
        }}
      >
        <Text style={{ fontSize: '40px', margin: '0 0 8px', lineHeight: '1' }}>🏆</Text>
        <Text style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: '0 0 4px' }}>
          {milestone} Referrals
        </Text>
        <Text style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0' }}>
          {totalPoints.toLocaleString()} total points{rank ? ` · Rank #${rank.toLocaleString()}` : ''}
        </Text>
      </Section>

      {reward && (
        <EmailCallout variant="success" title="You've unlocked a reward!">
          {reward}
        </EmailCallout>
      )}

      <Text style={{ fontSize: '15px', color: BRAND.textMid, lineHeight: '1.7', margin: '0 0 24px' }}>
        You're among the top Universe community builders. Keep sharing your link to unlock even more rewards and secure your spot in the beta.
      </Text>

      <EmailButton href={leaderboardUrl} variant="primary" fullWidth>
        View My Rank on the Leaderboard →
      </EmailButton>
    </UniverseLayout>
  )
}
