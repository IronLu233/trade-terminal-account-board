import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("worker_log")
export class WorkerLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  level!: string;

  @Column({ type: "text", nullable: false })
  message!: string;

  @Column({ type: "text", nullable: false })
  @Index()
  workerId!: string;

  @Column({ type: "text", nullable: false })
  @Index()
  jobId!: string;

  @CreateDateColumn({ type: 'timestamp' })
  @Index()
  timestamp!: Date;

}
