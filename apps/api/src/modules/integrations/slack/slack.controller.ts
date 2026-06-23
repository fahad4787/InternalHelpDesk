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
import { UpdateSlackPreferencesDto } from './dto/update-slack-preferences.dto';
import { SlackService } from './slack.service';

@Controller('integrations/slack')
export class SlackController {
  private readonly logger = new Logger(SlackController.name);

  constructor(
    private slackService: SlackService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.slackService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.slackService.getAuthUrl(user);
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
      `Slack OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/slack?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/slack`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/slack?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.slackService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations/slack?connected=true`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Slack connection failed';
      this.logger.error(`Slack OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/slack?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('connect-mock')
  @UseGuards(JwtAuthGuard)
  connectMock(@CurrentUser() user: AuthenticatedUser) {
    return this.slackService.connectMock(user);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.slackService.disconnect(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.slackService.getProfile(user);
  }

  @Get('channels')
  @UseGuards(JwtAuthGuard)
  getChannels(@CurrentUser() user: AuthenticatedUser) {
    return this.slackService.getChannels(user);
  }

  @Get('channels/:channelId/messages')
  @UseGuards(JwtAuthGuard)
  getChannelMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('channelId') channelId: string,
  ) {
    return this.slackService.getChannelMessages(user, channelId);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSlackPreferencesDto,
  ) {
    return this.slackService.updatePreferences(user, dto);
  }
}
