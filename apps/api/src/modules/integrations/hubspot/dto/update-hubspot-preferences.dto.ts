import { IsBoolean } from 'class-validator';

export class UpdateHubSpotPreferencesDto {
  @IsBoolean()
  showContacts!: boolean;

  @IsBoolean()
  showDeals!: boolean;

  @IsBoolean()
  showTickets!: boolean;
}
