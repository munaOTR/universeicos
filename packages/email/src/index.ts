/**
 * @universe/email
 * Email template infrastructure using React Email.
 * Templates are built here and sent via Resend.
 *
 * Usage:
 *   import { WelcomeEmail } from '@universe/email'
 *   import { render } from '@react-email/components'
 *   const html = render(<WelcomeEmail name="Tobi" />)
 */

// Re-export React Email primitives
export {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Link,
  Button,
  Img,
  Hr,
  Preview,
  render,
} from '@react-email/components'

// ── Providers ───────────────────────────────────────────────────────────────
export * from './providers/types'
export * from './providers/ResendProvider'
export * from './providers/ProviderFactory'

// ── Design System ────────────────────────────────────────────────────────────
export * from './components/UniverseLayout'
export * from './components/EmailButton'
export * from './components/EmailCallout'
export * from './components/EmailFooter'
export * from './components/EmailHeader'

// ── Templates ───────────────────────────────────────────────────────────────
export * from './templates/auth/AccountActivatedEmail'
export * from './templates/auth/AccountSuspendedEmail'
export * from './templates/auth/AdminInvitationEmail'
export * from './templates/auth/MagicLinkEmail'
export * from './templates/auth/PasswordChangedEmail'
export * from './templates/auth/ResetPasswordEmail'
export * from './templates/auth/VerifyEmail'
export * from './templates/auth/VerificationReminderEmail'
export * from './templates/auth/WelcomeEmail'

export * from './templates/waitlist/BetaInvitationEmail'
export * from './templates/waitlist/ReferralMilestoneEmail'
export * from './templates/waitlist/ReferralSuccessEmail'
export * from './templates/waitlist/WaitlistConfirmationEmail'

export * from './templates/campaigns/AnnouncementEmail'
export * from './templates/campaigns/LaunchAnnouncementEmail'
export * from './templates/campaigns/SurveyInvitationEmail'

// ── Email config ──────────────────────────────────────────────────────────────

export const EMAIL_FROM = 'Universe <hello@universeicos.app>'
export const EMAIL_REPLY_TO = 'hello@universeicos.app'
