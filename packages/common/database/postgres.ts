import { DataSource } from "typeorm";
import { WorkerLog } from "../entities/WorkerLog";

export const PostgresDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER ,
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB,
  synchronize: true, // 设置为false在生产环境
  logging: false,
  entities: [WorkerLog],
});

export const initializePostgresDatabase = async () => {
  try {
    if (!PostgresDataSource.isInitialized) {
      await PostgresDataSource.initialize();
      console.log("PostgreSQL database connection established");
    }
    return true;
  } catch (error) {
    console.error("Error initializing PostgreSQL database connection:", error);
    return false;
  }
};
