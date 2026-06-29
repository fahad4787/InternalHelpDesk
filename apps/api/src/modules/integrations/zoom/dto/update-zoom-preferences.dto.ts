import { IsBoolean } from 'class-validator';

export class UpdateZoomPreferencesDto {
  @IsBoolean()
  showUpcomingMeetings: boolean;

  @IsBoolean()
  showProfile: boolean;

  @IsBoolean()
  showCalendarView: boolean;
}
