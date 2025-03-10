import { DataSource } from "typeorm";
import { Template } from "../entities/Template";
import path from "path";

export const SqliteDataSource = new DataSource({
  type: "sqlite",
  database: path.join(__dirname, "../database.sqlite"),
  synchronize: true, // Set to false in production
  logging: false,
  entities: [Template],
});

export const initializeDatabase = async () => {
  try {
    await SqliteDataSource.initialize();
    console.log("Database connection established");
    return true;
  } catch (error) {
    console.error("Error initializing database connection:", error);
    return false;
  }
};
