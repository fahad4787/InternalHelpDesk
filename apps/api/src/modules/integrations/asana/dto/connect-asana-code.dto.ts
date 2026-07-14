import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectAsanaCodeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;
}
