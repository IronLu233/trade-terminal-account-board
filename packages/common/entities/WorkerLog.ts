import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("worker_log")
@Index("worker_log_pkey", ["id", "timestamp"], { unique: true })
@Index("worker_log_jobid_timestamp_index", ["jobId", "timestamp"])
@Index("idx_worker_log_worker_id", ["workerId", "timestamp"])
@Index("idx_worker_log_job_id", ["jobId", "timestamp"])
@Index("worker_log_timestamp_idx", ["timestamp"])
export class WorkerLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  level!: string;

  @Column("text")
  message!: string;

  @Column("text")
  workerId!: string;

  @Column({ nullable: true, type: 'text' })
  jobId!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
