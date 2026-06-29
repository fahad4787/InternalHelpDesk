import { IsBoolean } from 'class-validator';

export class UpdateTeamsPreferencesDto {
  @IsBoolean()
  showProfile!: boolean;

  @IsBoolean()
  showChannels!: boolean;
}
