import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default("3000"),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    BLAXEL_API_KEY: z.string(),
    BL_WORKSPACE: z.string(),
})

export const env = envSchema.parse(process.env);