import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("worker_log")
@Index("worker_log_pkey", ["id", "timestamp"], { unique: true })
@Index("worker_log_jobid_timestamp_index", ["jobId", "timestamp"])
export class WorkerLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  level!: string;

  @Column("text")
  message!: string;

  @Column("text")
  @Index("idx_worker_log_worker_id")
  workerId!: string;

  @Column({ nullable: true, type: 'text' })
  @Index("idx_worker_log_job_id")
  jobId!: string;

  @CreateDateColumn()
  @Index("worker_log_timestamp_idx")
  timestamp!: Date;
}
