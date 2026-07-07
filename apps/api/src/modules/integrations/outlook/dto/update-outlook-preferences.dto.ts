import { IsBoolean } from 'class-validator';

export class UpdateOutlookPreferencesDto {
  @IsBoolean()
  showProfile: boolean;

  @IsBoolean()
  showInbox: boolean;
}
