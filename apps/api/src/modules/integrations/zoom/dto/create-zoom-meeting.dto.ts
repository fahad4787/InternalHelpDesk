import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateZoomMeetingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  topic: string;

  @IsISO8601()
  startTime: string;

  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(480)
  duration: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  password?: string;
}
