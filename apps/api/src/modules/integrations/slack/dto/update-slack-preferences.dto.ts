import { IsBoolean } from 'class-validator';

export class UpdateSlackPreferencesDto {
  @IsBoolean()
  showChannels!: boolean;

  @IsBoolean()
  showDirectMessages!: boolean;
}
