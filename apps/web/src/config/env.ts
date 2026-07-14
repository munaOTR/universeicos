import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
  VITE_APP_URL: z.string().url().default('http://localhost:5173'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  DEV: z.boolean().default(false),
  PROD: z.boolean().default(false),
})

const parseResult = envSchema.safeParse(import.meta.env)

if (!parseResult.success) {
  console.error("❌ Invalid environment variables:")
  console.error(parseResult.error.flatten().fieldErrors)
  throw new Error(
    `Missing or invalid required environment variables.\n` +
    `Copy apps/web/.env.example to apps/web/.env and fill in the values.`
  )
}

const parsedEnv = parseResult.data

export const env = {
  supabaseUrl: parsedEnv.VITE_SUPABASE_URL,
  supabaseAnonKey: parsedEnv.VITE_SUPABASE_ANON_KEY,
  appUrl: parsedEnv.VITE_APP_URL,
  appEnv: parsedEnv.VITE_APP_ENV,
  isDev: parsedEnv.DEV,
  isProd: parsedEnv.PROD,
} as const
