import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("worker_log")
@Index("idx_worker_log_worker_id", ["workerId"])
@Index("idx_worker_log_job_id", ["jobId"])
@Index("worker_log_jobid_timestamp_index", ["jobId", "timestamp"])
@Index("worker_log_timestamp_idx", { synchronize: false })
export class WorkerLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  level!: string;

  @Column({ type: "text", nullable: false })
  message!: string;

  @Column({ type: "text", nullable: false })
  workerId!: string;

  @Column({ type: "text", nullable: false })
  jobId!: string;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Index("worker_log_timestamp_idx", { synchronize: false })
  timestamp!: Date;
}
