import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AssignTaskDto {
  @ApiProperty({ example: 1, description: 'ID of the user to whom the task will be assigned' })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ example: 2, description: 'ID of the work/task to assign' })
  @IsInt()
  @Min(1)
  workId: number;

  @ApiProperty({ example: '2025-06-30T23:59:59Z', description: 'Deadline for the task assignment (ISO date string)' })
  @IsDateString()
  dateline: string;

  @ApiProperty()
  description: string;
}

export class UpdateStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  remarksByAdmin: string;
}

export class MarkAsDoneDto {
  @ApiProperty({ description: 'Remarks about the submitted task' })
  remarks: string;
}
