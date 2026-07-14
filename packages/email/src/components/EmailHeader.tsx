import React from 'react'
import { Section, Row, Column, Text, Link } from '@react-email/components'
import { BRAND } from './UniverseLayout.tsx'

export function EmailHeader() {
  return (
    <Section style={{ marginBottom: '24px' }}>
      <Row>
        <Column>
          <Link
            href="https://waitlist.universeicos.app"
            style={{ textDecoration: 'none' }}
          >
            {/* Logo wordmark rendered in text for maximum email client compatibility */}
            <Text
              style={{
                fontFamily:   BRAND.fontFamily,
                fontSize:     '22px',
                fontWeight:   '800',
                color:        BRAND.textDark,
                margin:       '0',
                letterSpacing: '-0.5px',
              }}
            >
              Universe<span style={{ color: BRAND.primary }}>.</span>
            </Text>
          </Link>
        </Column>
      </Row>
      {/* Accent divider */}
      <Row style={{ marginTop: '12px' }}>
        <Column>
          <div
            style={{
              height:          '3px',
              background:      `linear-gradient(to right, ${BRAND.primary}, ${BRAND.accent})`,
              borderRadius:    '2px',
            }}
          />
        </Column>
      </Row>
    </Section>
  )
}
