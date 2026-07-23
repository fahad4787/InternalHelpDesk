import { IsBoolean } from 'class-validator';

export class UpdateOneDrivePreferencesDto {
  @IsBoolean()
  showFiles!: boolean;
}
