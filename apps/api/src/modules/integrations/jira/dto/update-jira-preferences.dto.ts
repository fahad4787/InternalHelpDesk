import { IsBoolean } from 'class-validator';

export class UpdateJiraPreferencesDto {
  @IsBoolean()
  showProfile!: boolean;

  @IsBoolean()
  showAssignedIssues!: boolean;

  @IsBoolean()
  showReportedIssues!: boolean;

  @IsBoolean()
  showProjects!: boolean;
}
