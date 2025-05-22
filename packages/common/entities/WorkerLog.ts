import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("worker_log")
export class WorkerLog {
  @Column('integer')
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  level!: string;

  @Column({ type: "text", nullable: false })
  message!: string;

  @Column({ type: "text", nullable: false })
  workerId!: string;

  @Column({ type: "text", nullable: false })
  jobId!: string;

  @CreateDateColumn({ type: 'timestamp' })
  timestamp!: Date;
}
