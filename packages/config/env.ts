import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in current directory
dotenv.config({ path: path.join(__dirname, ".env") });
