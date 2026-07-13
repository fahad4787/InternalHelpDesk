import { IsBoolean } from 'class-validator';

export class UpdateTrelloPreferencesDto {
  @IsBoolean()
  showBoards!: boolean;
}
