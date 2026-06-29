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
import { UpdateTeamsPreferencesDto } from './dto/update-teams-preferences.dto';
import { TeamsService } from './teams.service';

@Controller('integrations/teams')
export class TeamsController {
  private readonly logger = new Logger(TeamsController.name);

  constructor(
    private teamsService: TeamsService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.getAuthUrl(user);
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
      `Teams OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/teams?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/teams`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/teams?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.teamsService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations/teams?connected=true`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Microsoft Teams connection failed';
      this.logger.error(`Teams OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/teams?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('connect-mock')
  @UseGuards(JwtAuthGuard)
  connectMock(@CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.connectMock(user);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.disconnect(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.getProfile(user);
  }

  @Get('channels')
  @UseGuards(JwtAuthGuard)
  getChannels(@CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.getChannels(user);
  }

  @Get('teams/:teamId/channels/:channelId/messages')
  @UseGuards(JwtAuthGuard)
  getChannelMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teamId') teamId: string,
    @Param('channelId') channelId: string,
  ) {
    return this.teamsService.getChannelMessages(user, teamId, channelId);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTeamsPreferencesDto,
  ) {
    return this.teamsService.updatePreferences(user, dto);
  }
}
