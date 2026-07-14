import { z } from 'zod'

export const badgeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  criteria: z.record(z.any()).default({}),
})

export type BadgeFormData = z.infer<typeof badgeSchema>

export const rewardSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  points_required: z.number().int().min(1, 'Points must be at least 1'),
  icon: z.string().optional().or(z.literal('')),
})

export type RewardFormData = z.infer<typeof rewardSchema>
