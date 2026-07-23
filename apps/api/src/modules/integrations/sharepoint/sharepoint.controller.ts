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
import { UpdateSharePointPreferencesDto } from './dto/update-sharepoint-preferences.dto';
import { SharePointService } from './sharepoint.service';

@Controller('integrations/sharepoint')
export class SharePointController {
  private readonly logger = new Logger(SharePointController.name);

  constructor(
    private sharePointService: SharePointService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.sharePointService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.sharePointService.getAuthUrl(user);
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
      `SharePoint OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/sharepoint?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/sharepoint`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/sharepoint?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.sharePointService.handleCallback(code, state);
      return res.redirect(
        `${frontendUrl}/integrations/sharepoint?connected=true`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'SharePoint connection failed';
      this.logger.error(`SharePoint OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/sharepoint?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.sharePointService.disconnect(user);
  }

  @Get('sites')
  @UseGuards(JwtAuthGuard)
  getSites(@CurrentUser() user: AuthenticatedUser) {
    return this.sharePointService.getSites(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSharePointPreferencesDto,
  ) {
    return this.sharePointService.updatePreferences(user, dto);
  }
}
