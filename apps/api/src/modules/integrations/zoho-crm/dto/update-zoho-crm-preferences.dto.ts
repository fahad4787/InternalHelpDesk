import { IsBoolean } from 'class-validator';

export class UpdateZohoCrmPreferencesDto {
  @IsBoolean()
  showContacts!: boolean;

  @IsBoolean()
  showDeals!: boolean;

  @IsBoolean()
  showLeads!: boolean;
}
