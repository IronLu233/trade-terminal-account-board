import winston from "winston";
import colors from "colors/safe";
import { WinstonPrismaTransport } from "./winston-postgres-transport";

// 定义日志级别颜色
const levelColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
  silly: "grey",
} as const;

// 定义colors/safe中颜色函数的类型
type ColorFunction = (text: string) => string;

// 创建带颜色的自定义格式
const customFormat = winston.format.printf(
  ({ level, message, timestamp, ...metadata }) => {
    const levelLower = level.toLowerCase() as keyof typeof levelColors;
    const colorName = levelColors[levelLower] || "white";
    const colorizer = (colors as unknown as Record<string, ColorFunction>)[
      colorName
    ];
    const paddedLevel = level.padEnd(7);
    const coloredLevel = colorizer(paddedLevel);
    const metadataStr = Object.keys(metadata).length
      ? "\n" + JSON.stringify(metadata, null, 2)
      : "";

    return `${timestamp} ${coloredLevel}: ${message}${metadataStr}`;
  }
);

// 创建Worker Logger工厂函数
export const createWorkerLogger = (options: {
  workerId: string;
  jobId: string;
}) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.errors({ stack: true }),
      customFormat
    ),
    transports: [
      new WinstonPrismaTransport({
        workerId: options.workerId,
        jobId: options.jobId,
      }),
    ],
  });
};
