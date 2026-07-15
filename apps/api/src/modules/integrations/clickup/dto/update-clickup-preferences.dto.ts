import { IsBoolean } from 'class-validator';

export class UpdateClickUpPreferencesDto {
  @IsBoolean()
  showLists!: boolean;
}
