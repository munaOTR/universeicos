import React from 'react'
import { Section, Text } from '@react-email/components'
import { BRAND } from './UniverseLayout.tsx'

type CalloutVariant = 'info' | 'success' | 'warning' | 'error' | 'brand'

interface EmailCalloutProps {
  variant?: CalloutVariant
  title?: string
  children: React.ReactNode
}

const CALLOUT_STYLES: Record<CalloutVariant, { bg: string; border: string; icon: string; titleColor: string }> = {
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: 'ℹ️',  titleColor: '#1d4ed8' },
  success: { bg: '#f0fdf4', border: '#86efac', icon: '✅', titleColor: '#15803d' },
  warning: { bg: '#fffbeb', border: '#fcd34d', icon: '⚠️', titleColor: '#b45309' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '🚨', titleColor: '#dc2626' },
  brand:   { bg: '#f0fdf9', border: BRAND.primary, icon: '🚀', titleColor: BRAND.primaryDark },
}

export function EmailCallout({ variant = 'info', title, children }: EmailCalloutProps) {
  const s = CALLOUT_STYLES[variant]
  return (
    <Section
      style={{
        backgroundColor: s.bg,
        border:          `1px solid ${s.border}`,
        borderLeft:      `4px solid ${s.border}`,
        borderRadius:    '8px',
        padding:         '16px 20px',
        margin:          '24px 0',
      }}
    >
      {title && (
        <Text
          style={{
            fontFamily:  BRAND.fontFamily,
            fontSize:    '14px',
            fontWeight:  '700',
            color:       s.titleColor,
            margin:      '0 0 6px',
          }}
        >
          {s.icon} {title}
        </Text>
      )}
      <Text
        style={{
          fontFamily:  BRAND.fontFamily,
          fontSize:    '14px',
          color:       BRAND.textMid,
          margin:      '0',
          lineHeight:  '1.6',
        }}
      >
        {children}
      </Text>
    </Section>
  )
}
