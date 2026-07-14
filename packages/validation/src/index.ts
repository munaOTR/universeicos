import { z } from 'zod'
import { UNIVERSITIES } from '@universe/constants'

// ── Waitlist ──────────────────────────────────────────────────────────────────

export const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  university: z.enum(UNIVERSITIES as unknown as [string, ...string[]], 'Please select your university'),
  faculty: z
    .string()
    .min(2, 'Faculty name must be at least 2 characters')
    .max(150, 'Faculty name is too long')
    .optional(),
  department: z
    .string()
    .min(2, 'Department name must be at least 2 characters')
    .max(150, 'Department name is too long')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  graduation_year: z.string().optional(),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  newsletter_consent: z.boolean().optional(),
  referral_code: z.string().optional(),
})

export type WaitlistFormData = z.infer<typeof waitlistSchema>

// ── Profile ───────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  university: z.enum(UNIVERSITIES as unknown as [string, ...string[]], 'Please select your university'),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// ── Feature Suggestion ────────────────────────────────────────────────────────

export const featureSuggestionSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title is too long'),
  description: z
    .string()
    .min(20, 'Please provide more detail (at least 20 characters)')
    .max(1000, 'Description is too long'),
})

export type FeatureSuggestionFormData = z.infer<typeof featureSuggestionSchema>

// ── Admin: Survey Creation ────────────────────────────────────────────────────

export const surveyQuestionSchema = z.object({
  text: z.string().min(5, 'Question text is required'),
  type: z.enum(['multiple_choice', 'text', 'rating', 'boolean']),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
})

export const createSurveySchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  reward_points: z.number().int().min(0).max(500).default(50),
  questions: z.array(surveyQuestionSchema).min(1, 'Add at least one question'),
  expires_at: z.string().datetime().optional(),
})

export type CreateSurveyFormData = z.infer<typeof createSurveySchema>

// ── Admin: Announcement ───────────────────────────────────────────────────────

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  body: z.string().min(10, 'Body is required').max(2000),
  is_pinned: z.boolean().default(false),
})

export type CreateAnnouncementFormData = z.infer<typeof createAnnouncementSchema>
