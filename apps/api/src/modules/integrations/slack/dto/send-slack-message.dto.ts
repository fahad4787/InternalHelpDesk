import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendSlackMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text: string;
}
