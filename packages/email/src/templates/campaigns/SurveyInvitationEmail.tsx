import React from 'react'
import { Text, Section } from '@react-email/components'
import { UniverseLayout, BRAND } from '../../components/UniverseLayout.tsx'
import { EmailButton } from '../../components/EmailButton.tsx'
import { EmailCallout } from '../../components/EmailCallout.tsx'

export interface SurveyInvitationEmailProps {
  name: string
  surveyTitle: string
  surveyDescription?: string
  pointsReward?: number
  surveyUrl: string
  expiresAt?: string
}

export function SurveyInvitationEmail({
  name = 'Student',
  surveyTitle = 'Universe Student Survey',
  surveyDescription,
  pointsReward,
  surveyUrl = 'https://waitlist.universeicos.app/dashboard/surveys',
  expiresAt,
}: SurveyInvitationEmailProps) {
  return (
    <UniverseLayout preview={`${name}, we'd love your feedback! Complete a quick survey and earn points.`}>
      <Section style={{ marginBottom: '28px' }}>
        <Text style={{ fontSize: '28px', fontWeight: '800', color: BRAND.textDark, margin: '0 0 8px', lineHeight: '1.2' }}>
          Your opinion matters 📋
        </Text>
        <Text style={{ fontSize: '16px', color: BRAND.textMid, margin: '0', lineHeight: '1.6' }}>
          Hi {name}, we'd love to hear from you.
        </Text>
      </Section>

      {/* Survey card */}
      <Section
        style={{
          backgroundColor: BRAND.bgSubtle,
          border:          `1px solid ${BRAND.borderColor}`,
          borderRadius:    '12px',
          padding:         '20px 24px',
          marginBottom:    '24px',
        }}
      >
        <Text style={{ fontSize: '16px', fontWeight: '700', color: BRAND.textDark, margin: '0 0 6px' }}>
          {surveyTitle}
        </Text>
        {surveyDescription && (
          <Text style={{ fontSize: '14px', color: BRAND.textMid, margin: '0 0 12px', lineHeight: '1.6' }}>
            {surveyDescription}
          </Text>
        )}
        {pointsReward && (
          <Text style={{ fontSize: '13px', color: BRAND.primary, fontWeight: '600', margin: '0' }}>
            🎯 Earn {pointsReward} points for completing this survey
          </Text>
        )}
      </Section>

      {expiresAt && (
        <EmailCallout variant="warning" title="Survey closes soon">
          This survey closes on {new Date(expiresAt).toLocaleDateString('en-NG', { dateStyle: 'long' })}. Don't miss your chance to earn points.
        </EmailCallout>
      )}

      <EmailButton href={surveyUrl} variant="primary" fullWidth>
        Take the Survey →
      </EmailButton>

      <Text style={{ fontSize: '13px', color: BRAND.textLight, margin: '20px 0 0', lineHeight: '1.6' }}>
        This survey takes approximately 2–5 minutes to complete. Your responses help us build a better platform for Nigerian students.
      </Text>
    </UniverseLayout>
  )
}
