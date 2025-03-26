import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { UserModule } from './users/user.module';
import { Work } from './work/work.entity';
import { workModule } from './work/work.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
      username: process.env.DATABASE_USERNAME || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'task_management',
      entities: [User, Work],
      synchronize: true,
    }),
    AuthModule,
    UserModule,
    workModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
