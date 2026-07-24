import { IsBoolean } from 'class-validator';

export class UpdateDynamicsPreferencesDto {
  @IsBoolean()
  showContacts!: boolean;

  @IsBoolean()
  showAccounts!: boolean;

  @IsBoolean()
  showOpportunities!: boolean;
}
