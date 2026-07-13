import { IsBoolean } from 'class-validator';

export class UpdateCalendlyPreferencesDto {
  @IsBoolean()
  showEventTypes!: boolean;

  @IsBoolean()
  showUpcomingEvents!: boolean;
}
