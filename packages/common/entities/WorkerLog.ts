import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("worker_log")
export class WorkerLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  level!: string;

  @Column("text")
  message!: string;

  @Column("text")
  @Index()
  workerId!: string;

  @Column({ nullable: true, type: 'text' })
  @Index()
  jobId!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
