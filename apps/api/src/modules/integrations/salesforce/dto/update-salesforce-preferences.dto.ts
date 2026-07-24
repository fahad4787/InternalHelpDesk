import { IsBoolean } from 'class-validator';

export class UpdateSalesforcePreferencesDto {
  @IsBoolean()
  showContacts!: boolean;

  @IsBoolean()
  showAccounts!: boolean;

  @IsBoolean()
  showOpportunities!: boolean;
}
