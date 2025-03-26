import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { WorkStatus } from './work.enum';

export class UpdateWorkDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @Length(3, 50, { message: 'Title must be between 3 and 50 characters' })
  @Matches(/^[a-zA-Z0-9 ]+$/, { message: 'Title can only contain letters, numbers, and spaces' })
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Description cannot be empty' })
  @Length(10, 500, { message: 'Description must be between 10 and 500 characters' })
  description?: string;

  @IsOptional()
  @IsEnum(WorkStatus, { message: 'Status must be pending, in-progress, or completed' })
  status?: WorkStatus;
}
