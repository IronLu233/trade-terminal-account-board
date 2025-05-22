import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, JoinColumn, ManyToOne, TableInheritance, PrimaryColumn } from "typeorm";
import { Hypertable, TimeColumn } from '@timescaledb/typeorm';

@Entity("worker_log")
@Hypertable({})
export class WorkerLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  level!: string;

  @Column({ type: "text", nullable: false })
  message!: string;

  @Column({ type: "text", nullable: false })
  @PrimaryColumn('text')
  workerId!: string;

  @Column({ type: "text", nullable: false })
  @PrimaryColumn('text')
  jobId!: string;

  @CreateDateColumn()
  @PrimaryColumn('date')
  @TimeColumn()
  timestamp!: Date;
}
