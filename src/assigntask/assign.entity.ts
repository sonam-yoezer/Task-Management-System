import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from '../users/user.entity';
import { Work } from '../work/work.entity';
import { ApiProperty } from '@nestjs/swagger';
import { WorkStatus } from 'src/work/work.enum';

@Entity('assign_to')
export class AssignToModel {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Work, { eager: true })
  work: Work;

  @Column({ type: 'date' })
  dateline: Date;

  @Column({
    type: 'enum',
    enum: WorkStatus,
    default: WorkStatus.PENDING,
  })
  status: WorkStatus;

  @Column({ type: 'text' })
  description: String;

  @Column()
  assignedBy: String;

@Column({ type: 'text', nullable: true })
remarksByAdmin: string;

}
