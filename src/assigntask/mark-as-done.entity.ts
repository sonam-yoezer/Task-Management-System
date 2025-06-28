import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { AssignToModel } from './assign.entity';

@Entity('mark_as_done')
export class MarkAsDone {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AssignToModel, { eager: true })
  assignment: AssignToModel;

  @Column({ type: 'timestamp' })
  submittedDate: Date;

  @Column({ type: 'text' })
  remarks: string;

  @Column()
  fileName: string;
}
