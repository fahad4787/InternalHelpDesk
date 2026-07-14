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
import { UpdateDropboxPreferencesDto } from './dto/update-dropbox-preferences.dto';
import { DropboxService } from './dropbox.service';

@Controller('integrations/dropbox')
export class DropboxController {
  private readonly logger = new Logger(DropboxController.name);

  constructor(
    private dropboxService: DropboxService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.dropboxService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.dropboxService.getAuthUrl(user);
  }

  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    // Dropbox webhook verification (if this URI was pasted under Webhooks by mistake)
    const challenge =
      typeof req.query.challenge === 'string' ? req.query.challenge : undefined;
    if (challenge) {
      return res.status(200).type('text/plain').send(challenge);
    }

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
      `Dropbox OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/dropbox?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/dropbox`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/dropbox?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.dropboxService.handleCallback(code, state);
      return res.redirect(
        `${frontendUrl}/integrations/dropbox?connected=true`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Dropbox connection failed';
      this.logger.error(`Dropbox OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/dropbox?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.dropboxService.disconnect(user);
  }

  @Get('files')
  @UseGuards(JwtAuthGuard)
  getFiles(@CurrentUser() user: AuthenticatedUser) {
    return this.dropboxService.getFiles(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDropboxPreferencesDto,
  ) {
    return this.dropboxService.updatePreferences(user, dto);
  }
}
