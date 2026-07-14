import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendGoogleChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text: string;
}
