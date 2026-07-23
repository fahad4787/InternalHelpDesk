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
import { UpdateOneDrivePreferencesDto } from './dto/update-onedrive-preferences.dto';
import { OneDriveService } from './onedrive.service';

@Controller('integrations/onedrive')
export class OneDriveController {
  private readonly logger = new Logger(OneDriveController.name);

  constructor(
    private oneDriveService: OneDriveService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.oneDriveService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.oneDriveService.getAuthUrl(user);
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
      `OneDrive OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/onedrive?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/onedrive`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/onedrive?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.oneDriveService.handleCallback(code, state);
      return res.redirect(
        `${frontendUrl}/integrations/onedrive?connected=true`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'OneDrive connection failed';
      this.logger.error(`OneDrive OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/onedrive?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.oneDriveService.disconnect(user);
  }

  @Get('files')
  @UseGuards(JwtAuthGuard)
  getFiles(@CurrentUser() user: AuthenticatedUser) {
    return this.oneDriveService.getFiles(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOneDrivePreferencesDto,
  ) {
    return this.oneDriveService.updatePreferences(user, dto);
  }
}
