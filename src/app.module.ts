import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { UserModule } from './users/user.module';
import { Work } from './work/work.entity';
import { WorkModule } from './work/work.module';
import { AssignToModule } from './assigntask/assign-to.module';
import { AssignToModel } from './assigntask/assign.entity';
import { MarkAsDone } from './assigntask/mark-as-done.entity';
import { GlobalConfigModule } from './global-config.module';
import { SummaryModule } from './summary/summary.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
      username: process.env.DATABASE_USERNAME || '',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'task_management',
      entities: [User, Work, AssignToModel, MarkAsDone],
      synchronize: false,
    }),
    AuthModule,
    UserModule,
    WorkModule,
    AssignToModule,
    GlobalConfigModule, 
    SummaryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
