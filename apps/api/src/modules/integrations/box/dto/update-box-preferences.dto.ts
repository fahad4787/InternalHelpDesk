import { IsBoolean } from 'class-validator';

export class UpdateBoxPreferencesDto {
  @IsBoolean()
  showFiles!: boolean;
}
