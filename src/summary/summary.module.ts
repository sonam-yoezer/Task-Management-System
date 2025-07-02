import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';
import { AssignToModel } from 'src/assigntask/assign.entity';
import { Work } from 'src/work/work.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssignToModel, Work])],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule { }
