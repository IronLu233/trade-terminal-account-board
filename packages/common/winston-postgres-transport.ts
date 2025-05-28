import Transport from "winston-transport";
import { PrismaClient } from "./generated/prisma";

const client = new PrismaClient();

interface WinstonPrismaTransportOptions extends Transport.TransportStreamOptions {
  workerId: string;
  jobId: string;
  account: string;
}

export class WinstonPrismaTransport extends Transport {
  private workerId: string;
  private jobId: string;
  private account: string;

  constructor(opts: WinstonPrismaTransportOptions) {
    super(opts);
    this.workerId = opts.workerId;
    this.jobId = opts.jobId;
    this.account = opts.account;
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    try {
      const { level, message, timestamp, jobId, workerId, ...metadata } = info;

      // 使用 Prisma 客户端直接创建日志
      await client.workerLog.create({
        data: {
          level: level || "info",
          message: message || "",
          workerId: workerId || this.workerId || "unknown",
          jobId: jobId || this.jobId || "unknown",
          account: this.account,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      });

      callback();
    } catch (error) {
      console.error("Error saving log to PostgreSQL:", error);
      callback();
    }
  }

  async close() {
    await client.$disconnect();
  }
}
