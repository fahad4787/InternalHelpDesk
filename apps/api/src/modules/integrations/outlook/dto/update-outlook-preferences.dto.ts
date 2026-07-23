import { IsBoolean } from 'class-validator';

export class UpdateOutlookPreferencesDto {
  @IsBoolean()
  showCalendar: boolean;

  @IsBoolean()
  showInbox: boolean;
}
