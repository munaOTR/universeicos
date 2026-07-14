import React from 'react'
import { Button as ReactEmailButton } from '@react-email/components'
import { BRAND } from './UniverseLayout.tsx'

interface EmailButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  fullWidth?: boolean
}

export function EmailButton({
  href,
  children,
  variant = 'primary',
  fullWidth = false,
}: EmailButtonProps) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: BRAND.primary,
      color:           '#ffffff',
      border:          'none',
    },
    secondary: {
      backgroundColor: BRAND.accent,
      color:           '#ffffff',
      border:          'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color:           BRAND.primary,
      border:          `2px solid ${BRAND.primary}`,
    },
  }

  return (
    <ReactEmailButton
      href={href}
      style={{
        ...styles[variant],
        fontFamily:     BRAND.fontFamily,
        fontSize:       '15px',
        fontWeight:     '600',
        padding:        '14px 28px',
        borderRadius:   '10px',
        textDecoration: 'none',
        display:        'inline-block',
        letterSpacing:  '0.01em',
        cursor:         'pointer',
        width:          fullWidth ? '100%' : undefined,
        textAlign:      fullWidth ? 'center' : undefined,
        boxSizing:      fullWidth ? 'border-box' : undefined,
      }}
    >
      {children}
    </ReactEmailButton>
  )
}
