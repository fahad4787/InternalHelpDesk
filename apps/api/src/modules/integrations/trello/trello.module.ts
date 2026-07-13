import { Module } from '@nestjs/common';
import { TrelloController } from './trello.controller';
import { TrelloService } from './trello.service';

@Module({
  controllers: [TrelloController],
  providers: [TrelloService],
  exports: [TrelloService],
})
export class TrelloModule {}
