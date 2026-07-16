/**
 * React Email Template Registry for Deno Edge Functions
 * Maps template slugs to their React components.
 */
import type React from 'npm:react@18.2.0'

// Import all templates dynamically or statically.
// Since Deno Edge Functions have access to local file paths via import maps
// if configured, or we can just serve them as standard tsx files.
// For this architecture, we import the templates directly.
import { WelcomeEmail } from '../../../packages/email/src/templates/auth/WelcomeEmail.tsx'
import { VerifyEmail } from '../../../packages/email/src/templates/auth/VerifyEmail.tsx'
import { ResetPasswordEmail } from '../../../packages/email/src/templates/auth/ResetPasswordEmail.tsx'
import { MagicLinkEmail } from '../../../packages/email/src/templates/auth/MagicLinkEmail.tsx'
import { PasswordChangedEmail } from '../../../packages/email/src/templates/auth/PasswordChangedEmail.tsx'
import { AdminInvitationEmail } from '../../../packages/email/src/templates/auth/AdminInvitationEmail.tsx'
import { AdminPromotedEmail } from '../../../packages/email/src/templates/auth/AdminPromotedEmail.tsx'
import { AccountActivatedEmail } from '../../../packages/email/src/templates/auth/AccountActivatedEmail.tsx'
import { AccountSuspendedEmail } from '../../../packages/email/src/templates/auth/AccountSuspendedEmail.tsx'
import { WaitlistConfirmationEmail } from '../../../packages/email/src/templates/waitlist/WaitlistConfirmationEmail.tsx'
import { ReferralSuccessEmail } from '../../../packages/email/src/templates/waitlist/ReferralSuccessEmail.tsx'
import { ReferralMilestoneEmail } from '../../../packages/email/src/templates/waitlist/ReferralMilestoneEmail.tsx'
import { BetaInvitationEmail } from '../../../packages/email/src/templates/waitlist/BetaInvitationEmail.tsx'
import { AnnouncementEmail } from '../../../packages/email/src/templates/campaigns/AnnouncementEmail.tsx'
import { LaunchAnnouncementEmail } from '../../../packages/email/src/templates/campaigns/LaunchAnnouncementEmail.tsx'
import { SurveyInvitationEmail } from '../../../packages/email/src/templates/campaigns/SurveyInvitationEmail.tsx'
import { VerificationReminderEmail } from '../../../packages/email/src/templates/auth/VerificationReminderEmail.tsx'

export const TEMPLATE_REGISTRY: Record<string, React.FC<any>> = {
  welcome: WelcomeEmail,
  'verify-email': VerifyEmail,
  'reset-password': ResetPasswordEmail,
  'magic-link': MagicLinkEmail,
  'password-changed': PasswordChangedEmail,
  'admin-invitation': AdminInvitationEmail,
  'admin-promoted': AdminPromotedEmail,
  'account-activated': AccountActivatedEmail,
  'account-suspended': AccountSuspendedEmail,
  'waitlist-confirm': WaitlistConfirmationEmail,
  'referral-success': ReferralSuccessEmail,
  'referral-milestone': ReferralMilestoneEmail,
  'beta-invitation': BetaInvitationEmail,
  announcement: AnnouncementEmail,
  'launch-announcement': LaunchAnnouncementEmail,
  'survey-invitation': SurveyInvitationEmail,
  'verification-reminder': VerificationReminderEmail,
}
