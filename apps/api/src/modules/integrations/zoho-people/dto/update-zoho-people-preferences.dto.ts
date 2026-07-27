import { IsBoolean } from 'class-validator';

export class UpdateZohoPeoplePreferencesDto {
  @IsBoolean()
  showEmployees!: boolean;

  @IsBoolean()
  showLeave!: boolean;
}
