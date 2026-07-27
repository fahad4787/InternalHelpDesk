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
import { UpdateZohoCrmPreferencesDto } from './dto/update-zoho-crm-preferences.dto';
import { ZohoCrmService } from './zoho-crm.service';

@Controller('integrations/zoho-crm')
export class ZohoCrmController {
  private readonly logger = new Logger(ZohoCrmController.name);

  constructor(
    private zohoCrmService: ZohoCrmService,
    private configService: ConfigService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoCrmService.getStatus(user);
  }

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoCrmService.getAuthUrl(user);
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
    const accountsServer =
      typeof req.query['accounts-server'] === 'string'
        ? req.query['accounts-server']
        : undefined;

    this.logger.log(
      `Zoho CRM OAuth callback received (error=${error ?? 'none'}, hasCode=${!!code}, hasState=${!!state})`,
    );

    if (error) {
      return res.redirect(
        `${frontendUrl}/integrations/zoho-crm?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code && !state) {
      return res.redirect(`${frontendUrl}/integrations/zoho-crm`);
    }

    if (!code || !state) {
      const reason = !code ? 'missing_code' : 'missing_state';
      return res.redirect(
        `${frontendUrl}/integrations/zoho-crm?error=${encodeURIComponent(reason)}`,
      );
    }

    try {
      await this.zohoCrmService.handleCallback(code, state, accountsServer);
      return res.redirect(
        `${frontendUrl}/integrations/zoho-crm?connected=true`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Zoho CRM connection failed';
      this.logger.error(`Zoho CRM OAuth callback failed: ${message}`);
      return res.redirect(
        `${frontendUrl}/integrations/zoho-crm?error=${encodeURIComponent(message)}`,
      );
    }
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoCrmService.disconnect(user);
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard)
  getContacts(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoCrmService.getContacts(user);
  }

  @Get('deals')
  @UseGuards(JwtAuthGuard)
  getDeals(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoCrmService.getDeals(user);
  }

  @Get('leads')
  @UseGuards(JwtAuthGuard)
  getLeads(@CurrentUser() user: AuthenticatedUser) {
    return this.zohoCrmService.getLeads(user);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateZohoCrmPreferencesDto,
  ) {
    return this.zohoCrmService.updatePreferences(user, dto);
  }
}
