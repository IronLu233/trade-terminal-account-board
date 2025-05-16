import dotenv from "dotenv";
import path from "path";
import z from "zod";

// Load environment variables from .env file in current directory
dotenv.config({ path: path.join(__dirname, ".env") });

declare module "bun" {
  interface Env {
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_DB: string;

    REDIS_PASS: string;
    SCRIPT_PWD: string;
    PORT: string;
  }
}

export const Env = z
  .object({
    REDIS_HOST: z.string(),
    REDIS_PORT: z.string().transform((it) => parseInt(it)),
    REDIS_PASS: z.string().optional(),
    REDIS_DB: z
      .string()
      .transform((it) => parseInt(it))
      .optional(),
    SCRIPT_PWD: z.string(),
    PORT: z
      .string()
      .default("3000")
      .transform((it) => parseInt(it)),
    MONGODB_URL: z.string()
  })
  .parse(process.env);
