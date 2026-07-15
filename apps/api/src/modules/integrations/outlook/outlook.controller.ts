import {
  Body,
  Controller,
  Get,
  Logger,
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
import { UpdateOutlookPreferencesDto } from './dto/update-outlook-preferences.dto';
import { OutlookService } from './outlook.service';

@Controller('integrations/outlook')
export class OutlookController {
  private readonly logger = new Logger(OutlookController.name);

  constructor(
    private outlookService: OutlookService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.outlookService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.outlookService.getAuthUrl(user);
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
      `Outlook OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/outlook?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/outlook`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/outlook?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.outlookService.handleCallback(code, state);
      return res.redirect(`${frontendUrl}/integrations/outlook?connected=true`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Outlook connection failed';
      this.logger.error(`Outlook OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/outlook?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.outlookService.disconnect(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.outlookService.getProfile(user);
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  getMessages(@CurrentUser() user: AuthenticatedUser) {
    return this.outlookService.getMessages(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOutlookPreferencesDto,
  ) {
    return this.outlookService.updatePreferences(user, dto);
  }
}
