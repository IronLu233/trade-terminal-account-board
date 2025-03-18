import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in current directory
dotenv.config({ path: path.join(__dirname, ".env") });

declare module "bun" {
  interface Env {
    REDIS_HOST: string;
    REDIS_PORT: string;
    SCRIPT_PWD: string;
    REDIS_PASS: string;
  }
}
