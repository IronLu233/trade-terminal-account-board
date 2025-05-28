import { PrismaClient } from "../generated/prisma";
import { WorkerLogRepository } from "../entities/WorkerLogRepository";
import type { CreateWorkerLogData } from "../entities/WorkerLog";

// 初始化 Prisma 客户端
const prisma = new PrismaClient();

// 创建 WorkerLog 仓库实例
const workerLogRepository = new WorkerLogRepository(prisma);

// 示例：创建日志条目
async function createWorkerLog() {
  const logData: CreateWorkerLogData = {
    level: "info",
    message: "Worker started processing job",
    workerId: "worker-001",
    jobId: "job-12345",
    timestamp: new Date(),
  };

  try {
    const createdLog = await workerLogRepository.create(logData);
    console.log("Created worker log:", createdLog);
    return createdLog;
  } catch (error) {
    console.error("Error creating worker log:", error);
    throw error;
  }
}

// 示例：查询所有日志
async function getAllLogs() {
  try {
    const logs = await workerLogRepository.findAll();
    console.log("All worker logs:", logs);
    return logs;
  } catch (error) {
    console.error("Error fetching logs:", error);
    throw error;
  }
}

// 示例：根据 worker ID 查询日志
async function getLogsByWorkerId(workerId: string) {
  try {
    const logs = await workerLogRepository.findByWorkerId(workerId);
    console.log(`Logs for worker ${workerId}:`, logs);
    return logs;
  } catch (error) {
    console.error("Error fetching logs by worker ID:", error);
    throw error;
  }
}

// 示例：分页查询日志
async function getLogsWithPagination(page: number = 1, limit: number = 10) {
  try {
    const result = await workerLogRepository.findWithPagination(page, limit);
    console.log(`Page ${page} logs:`, result.logs);
    console.log(`Total logs: ${result.total}`);
    return result;
  } catch (error) {
    console.error("Error fetching paginated logs:", error);
    throw error;
  }
}

// 示例：清理旧日志
async function cleanupOldLogs() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    const deletedCount = await workerLogRepository.deleteOlderThan(oneWeekAgo);
    console.log(`Deleted ${deletedCount} old logs`);
    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up old logs:", error);
    throw error;
  }
}

// 示例：获取日志统计
async function getLogStats() {
  try {
    const totalCount = await workerLogRepository.count();
    console.log(`Total logs in database: ${totalCount}`);
    return totalCount;
  } catch (error) {
    console.error("Error getting log stats:", error);
    throw error;
  }
}

// 主函数示例
async function main() {
  try {
    // 创建一些示例日志
    await createWorkerLog();

    // 查询所有日志
    await getAllLogs();

    // 根据 worker ID 查询
    await getLogsByWorkerId("worker-001");

    // 分页查询
    await getLogsWithPagination(1, 5);

    // 获取统计信息
    await getLogStats();

    // 清理旧日志（注释掉以避免意外删除）
    // await cleanupOldLogs();

  } catch (error) {
    console.error("Example execution failed:", error);
  } finally {
    // 关闭 Prisma 连接
    await prisma.$disconnect();
  }
}

// 导出示例函数供其他地方使用
export {
  createWorkerLog,
  getAllLogs,
  getLogsByWorkerId,
  getLogsWithPagination,
  cleanupOldLogs,
  getLogStats,
  main
};

// 如果直接运行此文件，执行主函数
if (require.main === module) {
  main();
}
