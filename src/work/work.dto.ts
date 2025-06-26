import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { WorkStatus } from './work.enum';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO (Data Transfer Object) for creating a work item.
 * 
 * This class ensures validation of the work item fields before processing.
 */
export class CreateWorkDto {

  /**
   * The title of the work item.
   * 
   * - Must be a string.
   * - Cannot be empty.
   * - Length must be between 3 and 50 characters.
   * - Can only contain letters, numbers, and spaces.
   * 
   * @example "Project Planning"
   */
  @IsString()
  @ApiProperty()
  @IsNotEmpty({ message: 'Title is required' })
  @Length(3, 50, { message: 'Title must be between 3 and 50 characters' })
  @Matches(/^[a-zA-Z0-9 ]+$/, { message: 'Title can only contain letters, numbers, and spaces' })
  title: string;

  /**
   * A detailed description of the work item.
   * 
   * - Must be a string.
   * - Cannot be empty.
   * - Length must be between 10 and 500 characters.
   * 
   * @example "This task involves planning and resource allocation for the project."
   */
  @IsString()
  @ApiProperty()
  @IsNotEmpty({ message: 'Description is required' })
  @Length(10, 500, { message: 'Description must be between 10 and 500 characters' })
  description: string;
}
