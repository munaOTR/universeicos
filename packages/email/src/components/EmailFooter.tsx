import React from 'react'
import { Section, Row, Column, Text, Link, Hr } from '@react-email/components'
import { BRAND } from './UniverseLayout.tsx'

interface EmailFooterProps {
  unsubscribeUrl?: string
  campaignTitle?: string
}

export function EmailFooter({ unsubscribeUrl, campaignTitle }: EmailFooterProps) {
  return (
    <Section style={{ marginTop: '8px' }}>
      <Hr style={{ borderColor: BRAND.borderColor, margin: '0 0 20px' }} />
      <Row>
        <Column style={{ textAlign: 'center' }}>
          {/* Social links */}
          <Row style={{ marginBottom: '16px' }}>
            <Column style={{ textAlign: 'center' }}>
              {['Twitter', 'LinkedIn', 'Instagram'].map(platform => (
                <Link
                  key={platform}
                  href={`https://universeicos.app`}
                  style={{
                    color:          BRAND.textLight,
                    fontSize:       '12px',
                    textDecoration: 'none',
                    marginRight:    '16px',
                  }}
                >
                  {platform}
                </Link>
              ))}
            </Column>
          </Row>

          {/* Copyright */}
          <Text
            style={{
              color:        BRAND.textLight,
              fontSize:     '11px',
              lineHeight:   '1.6',
              margin:       '0 0 8px',
              textAlign:    'center',
            }}
          >
            © {new Date().getFullYear()} Universe Technology Ltd. All rights reserved.
            <br />
            The operating system for Nigerian university students.
          </Text>

          {/* Address */}
          <Text
            style={{
              color:      BRAND.textLight,
              fontSize:   '11px',
              margin:     '0 0 8px',
              textAlign:  'center',
            }}
          >
            Lagos, Nigeria &nbsp;·&nbsp;
            <Link href="mailto:hello@universeicos.app" style={{ color: BRAND.textLight }}>
              hello@universeicos.app
            </Link>
          </Text>

          {/* Legal links */}
          <Row style={{ marginBottom: '8px' }}>
            <Column style={{ textAlign: 'center' }}>
              <Link href="https://universeicos.app/privacy" style={{ color: BRAND.textLight, fontSize: '11px', marginRight: '12px' }}>
                Privacy Policy
              </Link>
              <Link href="https://universeicos.app/terms" style={{ color: BRAND.textLight, fontSize: '11px', marginRight: '12px' }}>
                Terms of Service
              </Link>
              {unsubscribeUrl && (
                <Link href={unsubscribeUrl} style={{ color: BRAND.textLight, fontSize: '11px' }}>
                  Unsubscribe
                </Link>
              )}
            </Column>
          </Row>

          {/* Campaign attribution */}
          {campaignTitle && (
            <Text style={{ color: BRAND.textLight, fontSize: '10px', margin: '4px 0 0', textAlign: 'center' }}>
              You received this because you are subscribed to: {campaignTitle}
            </Text>
          )}
        </Column>
      </Row>
    </Section>
  )
}
