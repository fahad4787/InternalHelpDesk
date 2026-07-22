import { IsBoolean } from 'class-validator';

export class UpdateTeamsPreferencesDto {
  @IsBoolean()
  showProfile: boolean;

  @IsBoolean()
  showTeams: boolean;

  @IsBoolean()
  showChats: boolean;
}
