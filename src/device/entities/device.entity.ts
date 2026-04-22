import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'devices' })
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 64 })
  serialNumber: string;

  @Column({ length: 32, default: 'offline' })
  status: string;

  @Column({ length: 32, default: '1.0.0' })
  firmwareVersion: string;

  @Column({ length: 120, nullable: true })
  location?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
