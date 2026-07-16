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
import { UpdateHubSpotPreferencesDto } from './dto/update-hubspot-preferences.dto';
import { HubSpotService } from './hubspot.service';

@Controller('integrations/hubspot')
export class HubSpotController {
  private readonly logger = new Logger(HubSpotController.name);

  constructor(
    private hubspotService: HubSpotService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.hubspotService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.hubspotService.getAuthUrl(user);
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
      `HubSpot OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/hubspot?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/hubspot`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/hubspot?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.hubspotService.handleCallback(code, state);
      return res.redirect(
        `${frontendUrl}/integrations/hubspot?connected=true`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'HubSpot connection failed';
      this.logger.error(`HubSpot OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/hubspot?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.hubspotService.disconnect(user);
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard)
  getContacts(@CurrentUser() user: AuthenticatedUser) {
    return this.hubspotService.getContacts(user);
  }

  @Get('deals')
  @UseGuards(JwtAuthGuard)
  getDeals(@CurrentUser() user: AuthenticatedUser) {
    return this.hubspotService.getDeals(user);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  getTickets(@CurrentUser() user: AuthenticatedUser) {
    return this.hubspotService.getTickets(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateHubSpotPreferencesDto,
  ) {
    return this.hubspotService.updatePreferences(user, dto);
  }
}
