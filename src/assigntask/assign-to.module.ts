import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignToService } from './assign-to.service';
import { AssignToController } from './assign-to.controller';
import { User } from '../users/user.entity';
import { Work } from '../work/work.entity';
import { AssignedTaskRepository } from './assign.repository';
import { AssignToModel } from './assign.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssignToModel, User, Work])],
  controllers: [AssignToController],
  providers: [AssignToService, AssignedTaskRepository],
})
export class AssignToModule { }
