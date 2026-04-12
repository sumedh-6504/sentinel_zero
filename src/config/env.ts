import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default("3001"),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    SUPABASE_URL: z.string(),
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    NEBIUS_API_KEY: z.string(),
    BLAXEL_API_KEY: z.string(),
    LANGCHAIN_TRACING_V2: z.string().default("true"),
    LANGCHAIN_API_KEY: z.string(),
    LANGCHAIN_PROJECT: z.string().default("sentinel-zero"),
    GITHUB_PAT: z.string(),
})

export const env = envSchema.parse(process.env);