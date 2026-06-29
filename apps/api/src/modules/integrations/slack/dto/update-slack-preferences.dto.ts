import { IsBoolean } from 'class-validator';

export class UpdateSlackPreferencesDto {
  @IsBoolean()
  showProfile!: boolean;

  @IsBoolean()
  showChannels!: boolean;

  @IsBoolean()
  showDirectMessages!: boolean;
}
