import { IsBoolean } from 'class-validator';

export class UpdateMondayPreferencesDto {
  @IsBoolean()
  showBoards!: boolean;
}
