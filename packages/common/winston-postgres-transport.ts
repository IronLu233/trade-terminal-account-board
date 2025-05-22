import Transport from "winston-transport";
import { PostgresDataSource } from "./database/postgres";
import { WorkerLog } from "./entities/WorkerLog";
import { initializePostgresDatabase } from "./database/postgres";

interface PostgresTransportOptions extends Transport.TransportStreamOptions {
  workerId: string;
  jobId: string;
}

export class PostgresTransport extends Transport {
  private workerId?: string;
  private queueName?: string;
  private jobId?: string;

  constructor(opts?: PostgresTransportOptions) {
    super(opts);
    this.workerId = opts?.workerId;
    this.jobId = opts?.jobId;

    // 初始化数据库连接
    initializePostgresDatabase().catch(err => {
      console.error("Failed to initialize PostgreSQL database:", err);
    });
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    try {
      const { level, message, timestamp, jobId, queueName, workerId, ...metadata } = info;

      // 确保数据库已连接
      if (!PostgresDataSource.isInitialized) {
        await initializePostgresDatabase();
      }

      // 创建并保存日志
      const logRepository = PostgresDataSource.getRepository(WorkerLog);
      const log = new WorkerLog();
      log.level = level;
      log.message = message;
      log.workerId = workerId || this.workerId;
      log.jobId = jobId || this.jobId;
      log.metadata = Object.keys(metadata).length ? metadata : null;

      await logRepository.save(log);
      callback();
    } catch (error) {
      console.error("Error saving log to PostgreSQL:", error);
      callback();
    }
  }
}
