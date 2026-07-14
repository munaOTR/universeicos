import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Conditionally merges Tailwind CSS classes safely without specificity conflicts.
 * @example cn('px-4 py-2', isActive && 'bg-primary-500', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a random 8-character alphanumeric referral code.
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Formats a number with commas (e.g. 1234567 → "1,234,567").
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-NG').format(n)
}

/**
 * Formats an ISO date string to a readable date.
 * @example formatDate('2024-01-15T12:00:00Z') → "Jan 15, 2024"
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

/**
 * Formats an ISO date string to a relative time (e.g. "3 hours ago").
 */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

/**
 * Truncates a string to the given max length, appending "…" if cut.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

/**
 * Returns a user's initials from their full name (e.g. "Tobi Adeyemi" → "TA").
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Builds a shareable referral URL.
 */
export function buildReferralUrl(referralCode: string, baseUrl = 'https://waitlist.universeicos.app'): string {
  return `${baseUrl}/waitlist?ref=${referralCode}`
}

/**
 * Builds a pre-filled WhatsApp share link.
 */
export function buildWhatsAppShareUrl(referralUrl: string): string {
  const message = encodeURIComponent(
    `I just joined the Universe waitlist — the future OS for Nigerian university students! Use my link to jump the queue 🚀\n\n${referralUrl}`
  )
  return `https://wa.me/?text=${message}`
}

/**
 * Builds a pre-filled Twitter/X share link.
 */
export function buildTwitterShareUrl(referralUrl: string): string {
  const text = encodeURIComponent(
    `Just joined @UniverseNG waitlist 🚀 The future OS for Nigerian uni students is almost here. Use my link to jump the queue: ${referralUrl}`
  )
  return `https://twitter.com/intent/tweet?text=${text}`
}
