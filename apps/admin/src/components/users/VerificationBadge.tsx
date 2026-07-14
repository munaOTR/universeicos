/**
 * VerificationBadge
 *
 * Accessible badge showing email verification status.
 * Uses icon + text (not color alone) to convey state.
 *
 * States:
 *   verified   — green  — CheckmarkCircle01Icon
 *   unverified — amber  — MailOpen01Icon
 *   pending    — zinc   — Clock01Icon   (registered < 24h)
 */

import { CheckmarkCircle01Icon, Clock01Icon, MailOpen01Icon } from 'hugeicons-react'

export type VerificationStatus = 'verified' | 'unverified' | 'pending'

interface VerificationBadgeProps {
  status: VerificationStatus
  size?: 'sm' | 'md'
}

const CONFIG: Record<
  VerificationStatus,
  { label: string; icon: React.ElementType; className: string; dot: string }
> = {
  verified: {
    label: 'Verified',
    icon: CheckmarkCircle01Icon,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  unverified: {
    label: 'Unverified',
    icon: MailOpen01Icon,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  pending: {
    label: 'Pending',
    icon: Clock01Icon,
    className: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    dot: 'bg-zinc-400',
  },
}

import React from 'react'

export function VerificationBadge({ status, size = 'sm' }: VerificationBadgeProps) {
  const { label, icon: Icon, className } = CONFIG[status]
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-sm gap-1.5'
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${className} ${padding}`}
      aria-label={`Email status: ${label}`}
      role="status"
    >
      <Icon size={iconSize} aria-hidden="true" />
      {label}
    </span>
  )
}

/**
 * Derives the badge status from user data fields.
 * email_confirmed_at → authoritative auth state
 * created_at → determines "pending" (< 24h old)
 */
export function getVerificationStatus(
  emailConfirmedAt: string | null | undefined,
  createdAt: string
): VerificationStatus {
  if (emailConfirmedAt) return 'verified'
  const hoursSinceRegistration = (Date.now() - new Date(createdAt).getTime()) / 36e5
  if (hoursSinceRegistration < 24) return 'pending'
  return 'unverified'
}
