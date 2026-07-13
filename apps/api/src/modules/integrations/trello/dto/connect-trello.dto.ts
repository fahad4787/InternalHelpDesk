import { IsString, MinLength } from 'class-validator';

export class ConnectTrelloDto {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsString()
  @MinLength(10)
  state!: string;
}
