import "dotenv/config";
import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    LOG_LEVEL: z.string().default("info"),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_REALTIME_MODEL: z.string().default("gpt-4o-mini"),
    OPENAI_SUMMARY_MODEL: z.string().optional(),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_JWT_SECRET: z.string().optional(),
    MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017"),
    MONGODB_DB_NAME: z.string().default("coral"),
    MONGODB_USERS_COLLECTION: z.string().default("users"),
    AUTH_TOKEN_SECRET: z.string().min(16).optional(),
    RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_DURATION: z.coerce.number().int().positive().default(60),
});
export const env = envSchema.parse(process.env);
