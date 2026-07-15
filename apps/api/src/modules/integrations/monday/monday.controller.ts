import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../common/types/api-response.type';
import { UpdateMondayPreferencesDto } from './dto/update-monday-preferences.dto';
import { MondayService } from './monday.service';

@Controller('integrations/monday')
export class MondayController {
  private readonly logger = new Logger(MondayController.name);

  constructor(
    private mondayService: MondayService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.mondayService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.mondayService.getAuthUrl(user);
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://127.0.0.1:3000',
    );

    const error =
      typeof req.query.error === 'string' ? req.query.error : undefined;
    const code =
      typeof req.query.code === 'string' ? req.query.code : undefined;
    const state =
      typeof req.query.state === 'string' ? req.query.state : undefined;

    this.logger.log(
      `Monday OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/monday?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/monday`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/monday?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.mondayService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations/monday?connected=true`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Monday.com connection failed';
      this.logger.error(`Monday OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/monday?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.mondayService.disconnect(user);
  }

  @Get('boards')
  @UseGuards(JwtAuthGuard)
  getBoards(@CurrentUser() user: AuthenticatedUser) {
    return this.mondayService.getBoards(user);
  }

  @Get('boards/:boardId')
  @UseGuards(JwtAuthGuard)
  getBoardDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('boardId') boardId: string,
  ) {
    return this.mondayService.getBoardDetail(user, boardId);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMondayPreferencesDto,
  ) {
    return this.mondayService.updatePreferences(user, dto);
  }
}
