import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WorkdayEnvironment } from '@prisma/client';

export class ConnectWorkdayDto {
  @IsOptional()
  @IsString()
  tenantUrl?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsEnum(WorkdayEnvironment)
  environment?: WorkdayEnvironment;
}

export class TestWorkdayConnectionDto {
  @IsOptional()
  @IsString()
  tenantUrl?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsEnum(WorkdayEnvironment)
  environment?: WorkdayEnvironment;
}
