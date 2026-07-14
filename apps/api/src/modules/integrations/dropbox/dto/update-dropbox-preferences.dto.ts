import { IsBoolean } from 'class-validator';

export class UpdateDropboxPreferencesDto {
  @IsBoolean()
  showFiles!: boolean;
}
