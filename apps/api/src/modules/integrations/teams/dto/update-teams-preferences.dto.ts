import { IsBoolean } from 'class-validator';

export class UpdateTeamsPreferencesDto {
  @IsBoolean()
  showTeams: boolean;

  @IsBoolean()
  showChats: boolean;
}
