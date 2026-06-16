import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class SyncWorkdayDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class WorkdayArticlesQueryDto extends PaginationDto {}
