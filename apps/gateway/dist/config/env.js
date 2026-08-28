import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";
loadDotenv({ path: resolve(process.cwd(), ".env") });
loadDotenv({ path: resolve(process.cwd(), "../../.env") });
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    LOG_LEVEL: z.string().default("info"),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_JWT_SECRET: z.string().optional(),
    STUN_URL: z.string().optional(),
    TURN_URL: z.string().optional(),
    TURN_USERNAME: z.string().optional(),
    TURN_PASSWORD: z.string().optional(),
    TURN_SECRET: z.string().optional(),
    RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_DURATION: z.coerce.number().int().positive().default(60),
});
export const env = envSchema.parse(process.env);
