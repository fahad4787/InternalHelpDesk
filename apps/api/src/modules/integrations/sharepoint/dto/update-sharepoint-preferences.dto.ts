import { IsBoolean } from 'class-validator';

export class UpdateSharePointPreferencesDto {
  @IsBoolean()
  showSites!: boolean;
}
