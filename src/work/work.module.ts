import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Work } from './work.entity';
import { WorkService } from './work.service';
import { WorkController } from './work.controller';

/**
 * The module responsible for managing work items in the application.
 * 
 * This module provides the necessary components (controller, service, and repository) 
 * to create, update, delete, and retrieve work items. It imports the TypeOrmModule to 
 * handle interactions with the Work entity in the database.
 * 
 * - **Controllers**: Defines HTTP request handling logic for work-related routes.
 * - **Providers**: Contains the service that encapsulates business logic for work items.
 * - **Exports**: No exports defined in this module (could be used for reusability).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Work]),
  ],
  providers: [WorkService],
  controllers: [WorkController],
  exports: [],
})
export class workModule { }
