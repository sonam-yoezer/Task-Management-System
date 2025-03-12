import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Add this line to make UserRepository available
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [],
}) 
export class UserModule {}
