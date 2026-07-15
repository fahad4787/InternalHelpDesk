import { IsBoolean } from 'class-validator';

export class UpdateJiraPreferencesDto {
  @IsBoolean()
  showAssignedIssues!: boolean;

  @IsBoolean()
  showReportedIssues!: boolean;

  @IsBoolean()
  showProjects!: boolean;
}
