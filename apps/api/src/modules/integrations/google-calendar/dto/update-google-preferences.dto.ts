import { IsBoolean } from 'class-validator';

export class UpdateGooglePreferencesDto {
  @IsBoolean()
  showUpcomingMeet: boolean;

  @IsBoolean()
  showCalendarEmbed: boolean;

  @IsBoolean()
  showGoogleDrive: boolean;

  @IsBoolean()
  showGmail: boolean;
}
