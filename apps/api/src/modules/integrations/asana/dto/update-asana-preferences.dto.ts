import { IsBoolean } from 'class-validator';

export class UpdateAsanaPreferencesDto {
  @IsBoolean()
  showProjects!: boolean;

  @IsBoolean()
  showMyTasks!: boolean;
}
