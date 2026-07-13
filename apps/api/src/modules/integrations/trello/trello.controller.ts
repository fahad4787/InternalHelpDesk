import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../common/types/api-response.type';
import { ConnectTrelloDto } from './dto/connect-trello.dto';
import { UpdateTrelloPreferencesDto } from './dto/update-trello-preferences.dto';
import { TrelloService } from './trello.service';

@Controller('integrations/trello')
export class TrelloController {
  constructor(private trelloService: TrelloService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.trelloService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.trelloService.getAuthUrl(user);
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  connect(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConnectTrelloDto,
  ) {
    return this.trelloService.connectWithToken(user, dto);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.trelloService.disconnect(user);
  }

  @Get('boards')
  @UseGuards(JwtAuthGuard)
  getBoards(@CurrentUser() user: AuthenticatedUser) {
    return this.trelloService.getBoards(user);
  }

  @Get('boards/:boardId')
  @UseGuards(JwtAuthGuard)
  getBoardDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('boardId') boardId: string,
  ) {
    return this.trelloService.getBoardDetail(user, boardId);
  }

  @Get('media')
  @UseGuards(JwtAuthGuard)
  async getMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Query('url') url: string,
    @Res() res: Response,
  ) {
    const { buffer, contentType } = await this.trelloService.fetchMedia(
      user,
      url,
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.send(buffer);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTrelloPreferencesDto,
  ) {
    return this.trelloService.updatePreferences(user, dto);
  }
}
