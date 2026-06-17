import {
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMeetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsDateString()
  startAt: string;

  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  attendeeEmails?: string[];
}
