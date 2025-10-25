import { z } from "zod";

/**
 * Environment variables validation schema
 * Validates all required environment variables at build time
 */
const envSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("URL do Supabase inválida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Anon key é obrigatória"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // OpenAI (optional - for AI-powered PDF parsing)
  OPENAI_API_KEY: z.string().optional(),

  // Node
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Throws error if validation fails
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Erro na validação de variáveis de ambiente:");
      console.error(
        error.errors
          .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
          .join("\n"),
      );
      throw new Error(
        "Variáveis de ambiente inválidas. Verifique o arquivo .env.local",
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Safe to use throughout the application
 */
export const env = validateEnv();

/**
 * Check if OpenAI is configured
 */
export const hasOpenAI = (): boolean => {
  return !!env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 0;
};

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
  return env.NODE_ENV === "production";
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return env.NODE_ENV === "development";
};
