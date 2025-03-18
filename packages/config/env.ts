import dotenv from "dotenv";
import path from "path";
import z from "zod";

// Load environment variables from .env file in current directory
dotenv.config({ path: path.join(__dirname, ".env") });

declare module "bun" {
  interface Env {
    REDIS_HOST: string;
    REDIS_PORT: string;
    SCRIPT_PWD: string;
    REDIS_PASS: string;
    PORT: string;
  }
}

export const Env = z
  .object({
    REDIS_HOST: z.string(),
    REDIS_PORT: z.string().transform((it) => parseInt(it)),
    SCRIPT_PWD: z.string(),
    REDIS_PASS: z.string().optional(),
    PORT: z
      .string()
      .default("3000")
      .transform((it) => parseInt(it)),
  })
  .parse(process.env);
