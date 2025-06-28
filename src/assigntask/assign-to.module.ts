import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignToService } from './assign-to.service';
import { AssignToController } from './assign-to.controller';
import { User } from '../users/user.entity';
import { Work } from '../work/work.entity';
import { AssignedTaskRepository } from './assign.repository';
import { AssignToModel } from './assign.entity';
import { MarkAsDone } from './mark-as-done.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([AssignToModel, User, Work, MarkAsDone, ]), ScheduleModule.forRoot(),],
  controllers: [AssignToController],
  providers: [AssignToService, AssignedTaskRepository,],
})
export class AssignToModule { }
